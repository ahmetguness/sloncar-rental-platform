import { google } from 'googleapis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma.js';
import { Logger } from '../../lib/logger.js';

const execAsync = promisify(exec);

// ────────────────────────────────────────────
// Google Drive helpers
// ────────────────────────────────────────────

function getDriveClient() {
    const clientId = process.env.GDRIVE_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret) {
        throw new Error('GDRIVE_CLIENT_ID or GDRIVE_CLIENT_SECRET is not set');
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost'
    );

    if (refreshToken) {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    // Fallback or initialization mode
    return google.drive({ version: 'v3', auth: oauth2Client });
}

async function createDriveFolder(drive: ReturnType<typeof google.drive>, name: string, parentId: string): Promise<string> {
    const res = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        },
        fields: 'id',
    });
    return res.data.id!;
}

async function uploadFileToDrive(drive: ReturnType<typeof google.drive>, filePath: string, folderId: string) {
    const fileName = path.basename(filePath);
    try {
        await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fs.createReadStream(filePath),
            },
            fields: 'id,name',
        });
        Logger.info(`[Backup] Uploaded to Drive: ${fileName}`);
    } catch (err: any) {
        Logger.error(`[Backup] ❌ Upload FAILED for ${fileName}: ${err.message || err}`);
        console.error(`[Backup] ❌ Google Drive Upload FAILED for ${fileName}:`, err.message || err);
        throw err; // Re-throw to be caught by the main orchestrator
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
    const bookings = await prisma.booking.findMany({
        include: {
            car: { select: { brand: true, model: true, plateNumber: true } },
            pickupBranch: { select: { name: true } },
            dropoffBranch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const rows = bookings.map((b: any) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        customerName: b.customerName,
        customerSurname: b.customerSurname || '',
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail || '',
        carBrand: b.car?.brand,
        carModel: b.car?.model,
        carPlate: b.car?.plateNumber,
        pickupBranch: b.pickupBranch?.name,
        dropoffBranch: b.dropoffBranch?.name,
        pickupDate: b.pickupDate?.toISOString(),
        dropoffDate: b.dropoffDate?.toISOString(),
        totalPrice: b.totalPrice?.toString() || '0',
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt?.toISOString(),
        updatedAt: b.updatedAt?.toISOString(),
    }));

    const filePath = path.join(dir, `reservations_${getDateString()}.csv`);
    fs.writeFileSync(filePath, '\uFEFF' + toCSV(rows), 'utf-8'); // BOM for Excel Turkish chars
    Logger.info(`[Backup] Bookings CSV: ${rows.length} records → ${filePath}`);
    return filePath;
}

async function exportInsurancesCSV(dir: string): Promise<string> {
    const insurances = await prisma.userInsurance.findMany({
        include: {
            user: { select: { name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const rows = insurances.map((i: any) => ({
        id: i.id,
        userName: i.user?.name,
        userEmail: i.user?.email,
        userPhone: i.user?.phone,
        companyName: i.companyName,
        policyNumber: i.policyNumber,
        policyType: i.policyType || '',
        premiumAmount: i.premiumAmount?.toString() || '0',
        coverageLimit: i.coverageLimit?.toString() || '0',
        startDate: i.startDate?.toISOString(),
        endDate: i.endDate?.toISOString(),
        agentName: i.agentName || '',
        status: i.isActive ? 'Active' : 'Passive',
        createdAt: i.createdAt?.toISOString(),
        updatedAt: i.updatedAt?.toISOString(),
    }));

    const filePath = path.join(dir, `insurances_${getDateString()}.csv`);
    fs.writeFileSync(filePath, '\uFEFF' + toCSV(rows), 'utf-8');
    Logger.info(`[Backup] Insurances CSV: ${rows.length} records → ${filePath}`);
    return filePath;
}

// ────────────────────────────────────────────
// PostgreSQL Dump
// ────────────────────────────────────────────

async function createPgDump(dir: string): Promise<string> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');

    // Strip ?schema=... from URL because pg_dump doesn't support it
    const cleanDbUrl = dbUrl.split('?')[0];

    const filePath = path.join(dir, `backup_${getDateString()}.sql`);

    // Use absolute path for pg_dump on Windows if found
    const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';

    // Proper quoting for Windows cmd.exe: wrap paths in quotes
    const command = `"${pgDumpPath}" "${cleanDbUrl}" --no-owner --no-privileges -f "${filePath}"`;

    try {
        Logger.info(`[Backup] Attempting pg_dump with absolute path: ${pgDumpPath}`);
        await execAsync(command, { windowsHide: true });
        Logger.info(`[Backup] PostgreSQL dump successful.`);
    } catch (err: any) {
        Logger.warn(`[Backup] Absolute path pg_dump failed: ${err.message}`);
        Logger.info(`[Backup] Attempting pg_dump with global command...`);
        try {
            await execAsync(`pg_dump "${cleanDbUrl}" --no-owner --no-privileges -f "${filePath}"`, { windowsHide: true });
            Logger.info(`[Backup] PostgreSQL dump successful with global command.`);
        } catch (globalErr: any) {
            Logger.error(`[Backup] pg_dump failed completely. Error: ${globalErr.message}`);
            throw globalErr;
        }
    }

    return filePath;
}

// ────────────────────────────────────────────
// Retention Policy
// ────────────────────────────────────────────

async function cleanOldBackups(drive: ReturnType<typeof google.drive>, parentFolderId: string, keepCount: number) {
    // List all subfolders in the backup parent folder
    const res = await drive.files.list({
        q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,createdTime)',
        // Sort by name (which is the date YYYY-MM-DD) descending to get newest first
        orderBy: 'name desc',
    });

    const folders = res.data.files || [];

    if (folders.length <= keepCount) {
        return;
    }

    // Keep the first 'keepCount' and delete the rest
    const toDelete = folders.slice(keepCount);

    let deleted = 0;
    for (const folder of toDelete) {
        await drive.files.delete({ fileId: folder.id! });
        Logger.info(`[Backup] Deleted old backup folder: ${folder.name}`);
        deleted++;
    }

    if (deleted > 0) {
        Logger.info(`[Backup] Retention policy: Cleaned up ${deleted} old backup(s).`);
    }
}

// ────────────────────────────────────────────
// Change Detection & State Management
// ────────────────────────────────────────────

const STATE_FILE = path.join(process.cwd(), 'backups', 'last_backup_state.json');

async function getLastChangeTimestamp(): Promise<number> {
    const tables = [
        'carBrand', 'branch', 'car', 'user', 'booking',
        'franchiseApplication', 'franchiseAuditLog', 'userInsurance', 'actionLog'
    ];

    let maxTs = 0;

    for (const table of tables) {
        try {
            // @ts-ignore - dynamic access to prisma models
            const latest = await prisma[table].findFirst({
                orderBy: { updatedAt: 'desc' },
                select: { updatedAt: true }
            });
            if (latest?.updatedAt) {
                maxTs = Math.max(maxTs, latest.updatedAt.getTime());
            }
        } catch (e) {
            // Fallback for tables without updatedAt (like ActionLog which only has createdAt)
            try {
                // @ts-ignore
                const latest = await prisma[table].findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                });
                if (latest?.createdAt) {
                    maxTs = Math.max(maxTs, latest.createdAt.getTime());
                }
            } catch (innerE) {
                // Ignore tables that might not have either (though our schema has at least one for all models)
            }
        }
    }
    return maxTs;
}

function getLastBackupTimestamp(): number {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            return state.timestamp || 0;
        }
    } catch (e) {
        Logger.error(`[Backup] Failed to read state file: ${e}`);
    }
    return 0;
}

function updateLastBackupState(timestamp: number) {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify({ timestamp, date: new Date(timestamp).toISOString() }));
    } catch (e) {
        Logger.error(`[Backup] Failed to write state file: ${e}`);
    }
}

// ────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────

function getDateString(): string {
    return new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10);
}

export async function runBackup(): Promise<void> {
    const dateStr = getDateString();
    const lastBackupTs = getLastBackupTimestamp();
    const currentMaxTs = await getLastChangeTimestamp();

    if (currentMaxTs <= lastBackupTs && lastBackupTs !== 0) {
        Logger.info(`[Backup] No changes detected since last backup. Skipping.`);
        return;
    }

    const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID;
    if (!folderId) {
        Logger.warn('[Backup] GDRIVE_BACKUP_FOLDER_ID not set, skipping backup.');
        return;
    }

    const tmpDir = path.resolve('backups', dateStr);

    Logger.info('════════════════════════════════════════════════════════════');
    Logger.info(`[Backup] Starting daily backup: ${dateStr}`);

    // Create local temp directory
    fs.mkdirSync(tmpDir, { recursive: true });

    const files: string[] = [];
    let allSuccess = true;

    // 1. CSV exports
    try {
        const bookingsCsv = await exportBookingsCSV(tmpDir);
        files.push(bookingsCsv);
    } catch (err) {
        Logger.error(`[Backup] Bookings CSV failed: ${err}`);
        allSuccess = false;
    }

    try {
        const insurancesCsv = await exportInsurancesCSV(tmpDir);
        files.push(insurancesCsv);
    } catch (err) {
        Logger.error(`[Backup] Insurances CSV failed: ${err}`);
        allSuccess = false;
    }

    // 2. PostgreSQL dump
    try {
        const dumpFile = await createPgDump(tmpDir);
        files.push(dumpFile);
    } catch (err) {
        Logger.error(`[Backup] pg_dump failed: ${err}`);
        allSuccess = false;
    }

    // 3. Upload to Google Drive (only if all steps succeeded)
    if (!allSuccess) {
        Logger.error(`[Backup] ❌ One or more backup steps failed. Skipping upload & retention cleanup.`);
        cleanup(tmpDir);
        return;
    }

    try {
        const drive = getDriveClient();
        Logger.info(`[Backup] Folder ID: ${folderId}. Checking Drive access...`);

        // Create daily folder
        const dailyFolderId = await createDriveFolder(drive, dateStr, folderId);
        Logger.info(`[Backup] Successfully created Drive folder: ${dateStr} (${dailyFolderId})`);

        // Upload all files
        for (const file of files) {
            Logger.info(`[Backup] Uploading ${path.basename(file)}...`);
            await uploadFileToDrive(drive, file, dailyFolderId);
        }

        Logger.info(`[Backup] ✅ All ${files.length} files uploaded successfully to Drive.`);

        // 4. Clean old backups (Keep last 3)
        await cleanOldBackups(drive, folderId, 3);

        // 5. Update last backup state on success
        updateLastBackupState(Date.now());
    } catch (err: any) {
        Logger.error(`[Backup] ❌ Drive upload/cleanup failed. Reason: ${err.message || err}`);
        if (err.stack) Logger.debug(err.stack);
    }

    // Cleanup local temp files
    cleanup(tmpDir);
    Logger.info('════════════════════════════════════════════════════════════');
}

function cleanup(dir: string) {
    try {
        fs.rmSync(dir, { recursive: true, force: true });
        Logger.info(`[Backup] Cleaned up temp dir: ${dir}`);
    } catch {
        // ignore cleanup errors
    }
}
