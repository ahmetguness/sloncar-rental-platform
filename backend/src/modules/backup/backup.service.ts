import { Dropbox } from 'dropbox';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma.js';
import { Logger } from '../../lib/logger.js';
import { sendMail } from '../../lib/mail.js';

const execAsync = promisify(exec);

const BACKUP_ALERT_EMAIL = 'ahmetgunes.ceng@gmail.com';

async function sendBackupFailureAlert(message: string): Promise<void> {
    try {
        const html = `
            <div style="font-family:Arial,sans-serif;padding:20px;background:#fff3f3;border:1px solid #e53e3e;border-radius:8px;">
                <h2 style="color:#e53e3e;margin:0 0 12px;">⚠️ Yedekleme Başarısız</h2>
                <p style="color:#333;margin:0 0 8px;"><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                <p style="color:#333;margin:0 0 8px;"><strong>Hata:</strong></p>
                <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:13px;overflow-x:auto;">${message}</pre>
                <p style="color:#777;margin:12px 0 0;font-size:12px;">Bu mail otomatik olarak gönderilmiştir.</p>
            </div>
        `;
        await sendMail(BACKUP_ALERT_EMAIL, '⚠️ Yedekleme Başarısız - Yaman Filo', html);
    } catch (err) {
        Logger.error(`[Backup] Failed to send alert email: ${err}`);
    }
}

// ────────────────────────────────────────────
// Dropbox helpers
// ────────────────────────────────────────────

function getDropboxClient(): Dropbox {
    const accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    const clientId = process.env.DROPBOX_APP_KEY;
    const clientSecret = process.env.DROPBOX_APP_SECRET;

    // Prefer refresh token (long-lived)
    if (refreshToken && clientId && clientSecret) {
        return new Dropbox({ clientId, clientSecret, refreshToken });
    }

    // Fallback to access token (short-lived, for testing)
    if (accessToken) {
        return new Dropbox({ accessToken });
    }

    throw new Error(
        'Dropbox not configured. Set DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET in .env'
    );
}

async function ensureDropboxFolder(dbx: Dropbox, folderPath: string): Promise<void> {
    try {
        await dbx.filesGetMetadata({ path: folderPath });
    } catch {
        await dbx.filesCreateFolderV2({ path: folderPath, autorename: false });
    }
}

async function uploadFileToDropbox(dbx: Dropbox, localPath: string, dropboxPath: string): Promise<void> {
    const fileContent = fs.readFileSync(localPath);
    const fileName = path.basename(localPath);

    // Dropbox upload limit is 150MB for simple upload
    if (fileContent.length > 150 * 1024 * 1024) {
        throw new Error(`File too large for simple upload: ${fileName} (${fileContent.length} bytes)`);
    }

    await dbx.filesUpload({
        path: `${dropboxPath}/${fileName}`,
        contents: fileContent,
        mode: { '.tag': 'overwrite' },
    });
    Logger.info(`[Backup] Uploaded to Dropbox: ${fileName}`);
}

async function cleanOldBackups(dbx: Dropbox, basePath: string, keepCount: number, type: 'AUTO' | 'MANUAL'): Promise<void> {
    try {
        const res = await dbx.filesListFolder({ path: basePath });
        const folders = res.result.entries
            .filter(e => e['.tag'] === 'folder')
            .filter(e => {
                const isManual = e.name.includes('_manual_');
                return type === 'MANUAL' ? isManual : !isManual;
            })
            .sort((a, b) => b.name.localeCompare(a.name)); // newest first

        if (folders.length <= keepCount) return;

        const toDelete = folders.slice(keepCount);
        for (const folder of toDelete) {
            try {
                await dbx.filesDeleteV2({ path: folder.path_lower! });
                Logger.info(`[Backup] Deleted old ${type} backup: ${folder.name}`);
            } catch (err: any) {
                Logger.warn(`[Backup] Failed to delete ${folder.name}: ${err.message}`);
            }
        }
    } catch (err: any) {
        Logger.warn(`[Backup] Retention cleanup failed: ${err.message}`);
    }
}

// ────────────────────────────────────────────
// CSV Export
// ────────────────────────────────────────────

function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const firstRow = rows[0];
    if (!firstRow) return '';
    const headers = Object.keys(firstRow);
    const lines = [
        headers.join(','),
        ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))
    ];
    return lines.join('\n');
}

async function exportBookingsCSV(dir: string): Promise<string> {
    const filePath = path.join(dir, `reservations_${getDateString()}.csv`);
    const stream = fs.createWriteStream(filePath, { encoding: 'utf-8' });

    stream.write('\uFEFF');

    const headers = [
        'ID', 'REZERVASYON KODU', 'MÜŞTERİ ADI', 'MÜŞTERİ SOYADI', 'TELEFON',
        'E-POSTA', 'ARAÇ MARKA', 'ARAÇ MODEL', 'PLAKA', 'ALIŞ OFİSİ',
        'İADE OFİSİ', 'ALIŞ TARİHİ', 'İADE TARİHİ', 'TOPLAM TUTAR', 'DURUM',
        'ÖDEME DURUMU', 'KAYIT TARİHİ', 'GÜNCELLEME TARİHİ'
    ];
    stream.write(headers.join(',') + '\n');

    const BATCH_SIZE = 500;
    let cursor: string | undefined;

    while (true) {
        const bookings = await prisma.booking.findMany({
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            include: {
                car: { select: { brand: true, model: true, plateNumber: true } },
                pickupBranch: { select: { name: true } },
                dropoffBranch: { select: { name: true } },
            },
            orderBy: { id: 'asc' },
        });

        if (bookings.length === 0) break;

        for (const b of bookings) {
            const row = [
                b.id, b.bookingCode, b.customerName, b.customerSurname || '',
                b.customerPhone, b.customerEmail || '', b.car?.brand, b.car?.model,
                b.car?.plateNumber, b.pickupBranch?.name, b.dropoffBranch?.name,
                b.pickupDate?.toISOString(), b.dropoffDate?.toISOString(),
                b.totalPrice?.toString() || '0', b.status, b.paymentStatus,
                b.createdAt?.toISOString(), b.updatedAt?.toISOString(),
            ];
            const csvRow = row.map(val => escapeCSV(val)).join(',');
            if (!stream.write(csvRow + '\n')) {
                await new Promise<void>(resolve => stream.once('drain', () => resolve()));
            }
        }

        cursor = bookings[bookings.length - 1]?.id;
        if (bookings.length < BATCH_SIZE) break;
    }

    stream.end();
    await new Promise<void>(resolve => stream.on('finish', () => resolve()));
    Logger.info(`[Backup] Bookings CSV exported to ${filePath} (Streamed)`);
    return filePath;
}

async function exportInsurancesCSV(dir: string): Promise<string> {
    const filePath = path.join(dir, `insurances_${getDateString()}.csv`);
    const stream = fs.createWriteStream(filePath, { encoding: 'utf-8' });

    stream.write('\uFEFF');

    const headers = [
        'ID', 'AY', 'BAŞLANGIÇ TARİHİ', 'TC', 'İSİM / SOYİSİM',
        'MESLEK', 'CEP', 'PLAKA', 'SERİ NO / SIRA NO',
        'TL', 'BRANŞ', 'ŞİRKET', 'POLİÇE NO', 'AÇIKLAMA', 'KAYIT TARİHİ', 'GÜNCELLEME TARİHİ'
    ];
    stream.write(headers.join(',') + '\n');

    const BATCH_SIZE = 500;
    let cursor: string | undefined;

    while (true) {
        const insurances = await prisma.insurance.findMany({
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
        });

        if (insurances.length === 0) break;

        for (const i of insurances) {
            const row = [
                i.id, i.month, i.startDate?.toISOString(), i.tcNo, i.fullName,
                i.profession || '', i.phone || '', i.plate || '',
                i.serialOrOrderNo || '', i.amount?.toString() || '0',
                i.branch, i.company, i.policyNo, i.description || '',
                i.createdAt?.toISOString(), i.updatedAt?.toISOString(),
            ];
            const csvRow = row.map(val => escapeCSV(val)).join(',');
            if (!stream.write(csvRow + '\n')) {
                await new Promise<void>(resolve => stream.once('drain', () => resolve()));
            }
        }

        cursor = insurances[insurances.length - 1]?.id;
        if (insurances.length < BATCH_SIZE) break;
    }

    stream.end();
    await new Promise<void>(resolve => stream.on('finish', () => resolve()));
    Logger.info(`[Backup] Insurances CSV exported to ${filePath} (Streamed)`);
    return filePath;
}

// ────────────────────────────────────────────
// PostgreSQL Dump
// ────────────────────────────────────────────

async function createPgDump(dir: string): Promise<string> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');

    const cleanDbUrl = dbUrl.split('?')[0];
    const filePath = path.join(dir, `backup_${getDateString()}.sql`);

    await execAsync(`pg_dump "${cleanDbUrl}" --no-owner --no-privileges -f "${filePath}"`);
    Logger.info(`[Backup] PostgreSQL dump successful.`);
    return filePath;
}

// ────────────────────────────────────────────
// Change Detection & State Management
// ────────────────────────────────────────────

const STATE_FILE = path.join(process.cwd(), 'backups', 'last_backup_state.json');
const HISTORY_FILE = path.join(process.cwd(), 'backups', 'backup_history.json');

export interface BackupHistoryEntry {
    timestamp: number;
    date: string;
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
    type: 'AUTO' | 'MANUAL';
    message?: string;
    files?: string[];
}

async function getLastChangeTimestamp(): Promise<number> {
    const tables = [
        'branch', 'car', 'user', 'booking',
        'franchiseApplication', 'franchiseAuditLog', 'insurance', 'actionLog',
        'campaign', 'globalSetting'
    ];
    let maxTs = 0;
    for (const table of tables) {
        if (table === 'franchiseAuditLog' || table === 'actionLog') {
            const foundCreate = await (prisma as any)[table].findFirst({
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true },
            });
            if (foundCreate?.createdAt) {
                maxTs = Math.max(maxTs, foundCreate.createdAt.getTime());
            }
            continue;
        }
        try {
            const foundUpdate = await (prisma as any)[table].findFirst({
                orderBy: { updatedAt: 'desc' },
                select: { updatedAt: true },
            });
            if (foundUpdate?.updatedAt) {
                maxTs = Math.max(maxTs, foundUpdate.updatedAt.getTime());
            }
        } catch {
            try {
                const foundCreate = await (prisma as any)[table].findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                });
                if (foundCreate?.createdAt) {
                    maxTs = Math.max(maxTs, foundCreate.createdAt.getTime());
                }
            } catch {
                // Ignore
            }
        }
    }
    return maxTs;
}

async function getDatabaseRecordCount(): Promise<number> {
    const tables = ['car', 'user', 'booking', 'insurance', 'campaign'];
    let totalCount = 0;
    for (const table of tables) {
        const count = await (prisma as any)[table].count();
        totalCount += count;
    }
    return totalCount;
}

function getLastBackupState(): { timestamp: number; recordCount: number } {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        }
    } catch (e) {
        Logger.error(`[Backup] Failed to read state file: ${e}`);
    }
    return { timestamp: 0, recordCount: 0 };
}

function updateLastBackupState(timestamp: number, recordCount: number) {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify({
            timestamp, recordCount, date: new Date(timestamp).toISOString()
        }));
    } catch (e) {
        Logger.error(`[Backup] Failed to write state file: ${e}`);
    }
}

function getLastBackupTimestamp(): number {
    return getLastBackupState().timestamp;
}

function addToHistory(entry: BackupHistoryEntry) {
    try {
        const dir = path.dirname(HISTORY_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let history: BackupHistoryEntry[] = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        }

        history.unshift(entry);
        if (history.length > 50) history = history.slice(0, 50);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        Logger.error(`[Backup] Failed to write history file: ${e}`);
    }
}

export function getBackupHistory(): BackupHistoryEntry[] {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        }
    } catch (e) {
        Logger.error(`[Backup] Failed to read history file: ${e}`);
    }
    return [];
}

// ────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────

function getDateString(): string {
    return new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10);
}

export async function runBackup(isManual: boolean = false): Promise<{ success: boolean; status: 'SUCCESS' | 'SKIPPED' | 'FAILED'; message: string }> {
    const dateStr = getDateString();
    const lastBackupTs = getLastBackupTimestamp();
    const currentMaxTs = await getLastChangeTimestamp();
    const type = isManual ? 'MANUAL' : 'AUTO';

    if (!isManual && currentMaxTs <= lastBackupTs && lastBackupTs !== 0) {
        Logger.info(`[Backup] No changes detected since last backup. Skipping.`);
        addToHistory({ timestamp: Date.now(), date: new Date().toISOString(), status: 'SKIPPED', type, message: 'No changes detected in database.' });
        return { success: true, status: 'SKIPPED', message: 'No changes detected.' };
    }

    const backupBasePath = process.env.DROPBOX_BACKUP_PATH || '/yamanfilo_backups';
    const tmpDir = path.resolve('backups', `${dateStr}_${Date.now()}`);

    Logger.info('════════════════════════════════════════════════════════════');
    Logger.info(`[Backup] Starting ${type} backup: ${dateStr}`);

    fs.mkdirSync(tmpDir, { recursive: true });

    const files: string[] = [];
    let allSuccess = true;
    let errorMessage = '';

    // 1. CSV exports
    try {
        files.push(await exportBookingsCSV(tmpDir));
    } catch (err) {
        Logger.error(`[Backup] Bookings CSV failed: ${err}`);
        allSuccess = false;
        errorMessage += `Bookings CSV failed; `;
    }

    try {
        files.push(await exportInsurancesCSV(tmpDir));
    } catch (err) {
        Logger.error(`[Backup] Insurances CSV failed: ${err}`);
        allSuccess = false;
        errorMessage += `Insurances CSV failed; `;
    }

    // 2. PostgreSQL dump
    try {
        files.push(await createPgDump(tmpDir));
    } catch (err) {
        Logger.error(`[Backup] pg_dump failed: ${err}`);
        allSuccess = false;
        errorMessage += `pg_dump failed; `;
    }

    // 3. Upload to Dropbox
    if (!allSuccess) {
        const msg = `Backup steps failed: ${errorMessage}`;
        Logger.error(`[Backup] ❌ ${msg}. Skipping upload.`);
        addToHistory({ timestamp: Date.now(), date: new Date().toISOString(), status: 'FAILED', type, message: msg });
        cleanup(tmpDir);
        await sendBackupFailureAlert(msg);
        return { success: false, status: 'FAILED', message: msg };
    }

    try {
        const dbx = getDropboxClient();

        // Create daily folder
        const finalFolderName = isManual ? `${dateStr}_manual_${Date.now()}` : dateStr;
        const dailyPath = `${backupBasePath}/${finalFolderName}`;

        await ensureDropboxFolder(dbx, backupBasePath);
        await ensureDropboxFolder(dbx, dailyPath);
        Logger.info(`[Backup] Dropbox folder ready: ${dailyPath}`);

        // Upload all files
        for (const file of files) {
            Logger.info(`[Backup] Uploading ${path.basename(file)}...`);
            await uploadFileToDropbox(dbx, file, dailyPath);
        }

        const successMsg = `All ${files.length} files uploaded to Dropbox.`;
        Logger.info(`[Backup] ✅ ${successMsg}`);

        // 4. Sanity check
        const currentCount = await getDatabaseRecordCount();
        const prevState = getLastBackupState();

        let skipCleanup = false;
        if (prevState.recordCount > 0 && currentCount < (prevState.recordCount * 0.5)) {
            Logger.warn(`[Backup] ⚠️ SANITY CHECK FAILED: Record count (${currentCount}) < 50% of previous (${prevState.recordCount}). Skipping retention cleanup.`);
            skipCleanup = true;
        }

        // 5. Clean old backups (keep last 3)
        if (!skipCleanup) {
            try {
                await cleanOldBackups(dbx, backupBasePath, 3, type);
            } catch (cleanupErr: any) {
                Logger.warn(`[Backup] Retention cleanup failed: ${cleanupErr.message}`);
            }
        }

        // 6. Update state
        updateLastBackupState(Date.now(), currentCount);

        addToHistory({
            timestamp: Date.now(), date: new Date().toISOString(), status: 'SUCCESS', type,
            message: successMsg, files: files.map(f => path.basename(f))
        });

        cleanup(tmpDir);
        Logger.info('════════════════════════════════════════════════════════════');
        return { success: true, status: 'SUCCESS', message: successMsg };

    } catch (err: any) {
        const errorDetail = err.message || String(err);
        Logger.error(`[Backup] ❌ Dropbox operation failed: ${errorDetail}`);
        addToHistory({ timestamp: Date.now(), date: new Date().toISOString(), status: 'FAILED', type, message: `Dropbox error: ${errorDetail}` });
        cleanup(tmpDir);
        await sendBackupFailureAlert(`Dropbox error: ${errorDetail}`);
        return { success: false, status: 'FAILED', message: `Dropbox error: ${errorDetail}` };
    }
}

function cleanup(dir: string) {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            Logger.info(`[Backup] Cleaned up temp dir: ${dir}`);
        }
    } catch {
        // ignore
    }
}
