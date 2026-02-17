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
        supportsAllDrives: true, // Support for Shared Drives
    });
    return res.data.id!;
}

async function verifyDriveAccess(drive: ReturnType<typeof google.drive>, fileId: string) {
    try {
        await drive.files.get({
            fileId,
            fields: 'id, name, capabilities',
            supportsAllDrives: true,
        });
    } catch (err: any) {
        throw new Error(`Cannot access Drive ID ${fileId}: ${err.message}`);
    }
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
            supportsAllDrives: true, // Support for Shared Drives
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

async function cleanOldBackups(drive: ReturnType<typeof google.drive>, parentFolderId: string, keepCount: number, type: 'AUTO' | 'MANUAL') {
    // List subfolders and filter by type (Auto folders use YYYY-MM-DD, Manual use ..._manual_...)
    const res = await drive.files.list({
        q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,createdTime)',
        orderBy: 'name desc',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    const allFolders = res.data.files || [];

    // Filter folders based on type
    const folders = allFolders.filter(f => {
        const isManual = f.name?.includes('_manual_');
        return type === 'MANUAL' ? isManual : !isManual;
    });

    if (folders.length <= keepCount) {
        return;
    }

    // Keep the first 'keepCount' and trash the rest
    const toDelete = folders.slice(keepCount);

    let deleted = 0;
    for (const folder of toDelete) {
        try {
            // Move to Trash instead of permanent delete (trashed: true)
            await drive.files.update({
                fileId: folder.id!,
                requestBody: { trashed: true },
                supportsAllDrives: true,
            });
            Logger.info(`[Backup] Moved old ${type} backup folder to Trash: ${folder.name}`);
            deleted++;
        } catch (err: any) {
            Logger.warn(`[Backup] Failed to trash folder ${folder.name}: ${err.message}`);
        }
    }

    if (deleted > 0) {
        Logger.info(`[Backup] ${type} Retention policy: Moved ${deleted} old backup(s) to Trash.`);
    }
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
        'carBrand', 'branch', 'car', 'user', 'booking',
        'franchiseApplication', 'franchiseAuditLog', 'userInsurance', 'actionLog'
    ];
    let maxTs = 0;
    for (const table of tables) {
        try {
            // Try updatedAt first
            const foundUpdate = await (prisma as any)[table].findFirst({
                orderBy: { updatedAt: 'desc' },
                select: { updatedAt: true },
            });
            if (foundUpdate && foundUpdate.updatedAt) {
                maxTs = Math.max(maxTs, foundUpdate.updatedAt.getTime());
            }
        } catch (e) {
            // Fallback to createdAt if updatedAt doesn't exist (common in log tables)
            try {
                const foundCreate = await (prisma as any)[table].findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                });
                if (foundCreate && foundCreate.createdAt) {
                    maxTs = Math.max(maxTs, foundCreate.createdAt.getTime());
                }
            } catch (innerE) {
                // Ignore if neither field exists
            }
        }
    }
    return maxTs;
}

async function getDatabaseRecordCount(): Promise<number> {
    const tables = ['car', 'user', 'booking', 'userInsurance'];
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
            timestamp,
            recordCount,
            date: new Date(timestamp).toISOString()
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

        history.unshift(entry); // Newest first
        // Keep last 50 entries
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
        addToHistory({
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'SKIPPED',
            type,
            message: 'No changes detected in database.'
        });
        return { success: true, status: 'SKIPPED', message: 'No changes detected.' };
    }

    const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID;
    if (!folderId) {
        const msg = 'GDRIVE_BACKUP_FOLDER_ID not set, skipping backup.';
        Logger.warn(`[Backup] ${msg}`);
        return { success: false, status: 'FAILED', message: msg };
    }

    const tmpDir = path.resolve('backups', `${dateStr}_${Date.now()}`); // Added timestamp to avoid collision

    Logger.info('════════════════════════════════════════════════════════════');
    Logger.info(`[Backup] Starting ${type} backup: ${dateStr}`);

    // Create local temp directory
    fs.mkdirSync(tmpDir, { recursive: true });

    const files: string[] = [];
    let allSuccess = true;
    let errorMessage = '';

    // 1. CSV exports
    try {
        const bookingsCsv = await exportBookingsCSV(tmpDir);
        files.push(bookingsCsv);
    } catch (err) {
        Logger.error(`[Backup] Bookings CSV failed: ${err}`);
        allSuccess = false;
        errorMessage += `Bookings CSV failed; `;
    }

    try {
        const insurancesCsv = await exportInsurancesCSV(tmpDir);
        files.push(insurancesCsv);
    } catch (err) {
        Logger.error(`[Backup] Insurances CSV failed: ${err}`);
        allSuccess = false;
        errorMessage += `Insurances CSV failed; `;
    }

    // 2. PostgreSQL dump
    try {
        const dumpFile = await createPgDump(tmpDir);
        files.push(dumpFile);
    } catch (err) {
        Logger.error(`[Backup] pg_dump failed: ${err}`);
        allSuccess = false;
        errorMessage += `pg_dump failed; `;
    }

    // 3. Upload to Google Drive (only if all steps succeeded)
    if (!allSuccess) {
        const msg = `Backup steps failed: ${errorMessage}`;
        Logger.error(`[Backup] ❌ ${msg}. Skipping upload & retention cleanup.`);
        addToHistory({
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'FAILED',
            type,
            message: msg
        });
        cleanup(tmpDir);
        return { success: false, status: 'FAILED', message: msg };
    }

    try {
        const drive = getDriveClient();

        // 0. Verify parent folder access first to catch permission issues early
        Logger.info(`[Backup] Verifying Drive access for folder: ${folderId}`);
        await verifyDriveAccess(drive, folderId);

        Logger.info(`[Backup] Folder found. Starting upload process...`);

        // Create daily folder (append timestamp if manual to avoid duplicate folder name errors or overwrites)
        const finalFolderName = isManual ? `${dateStr}_manual_${Date.now()}` : dateStr;
        const dailyFolderId = await createDriveFolder(drive, finalFolderName, folderId);
        Logger.info(`[Backup] Successfully created Drive folder: ${finalFolderName} (${dailyFolderId})`);

        // Upload all files
        for (const file of files) {
            Logger.info(`[Backup] Uploading ${path.basename(file)}...`);
            await uploadFileToDrive(drive, file, dailyFolderId);
        }

        const successMsg = `All ${files.length} files uploaded successfully to Drive.`;
        Logger.info(`[Backup] ✅ ${successMsg}`);

        // 4. Record current state and perform sanity check before cleanup
        const currentCount = await getDatabaseRecordCount();
        const prevState = getLastBackupState();

        // Sanity Check: If record count drops by more than 50% since last successful backup, don't rotate
        let skipCleanup = false;
        if (prevState.recordCount > 0 && currentCount < (prevState.recordCount * 0.5)) {
            Logger.warn(`[Backup] ⚠️ SANITY CHECK FAILED: Current record count (${currentCount}) is < 50% of previous (${prevState.recordCount}). Skipping retention cleanup to protect old backups.`);
            skipCleanup = true;
        }

        // 5. Clean old backups (Keep last 3 of this pool)
        if (!skipCleanup) {
            try {
                await cleanOldBackups(drive, folderId, 3, type);
            } catch (cleanupErr: any) {
                Logger.warn(`[Backup] ${type} Retention cleanup failed, but backup upload was successful. Error: ${cleanupErr.message}`);
            }
        }

        // 6. Update state
        updateLastBackupState(Date.now(), currentCount);

        addToHistory({
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'SUCCESS',
            type,
            message: successMsg,
            files: files.map(f => path.basename(f))
        });

        cleanup(tmpDir);
        Logger.info('════════════════════════════════════════════════════════════');
        return { success: true, status: 'SUCCESS', message: successMsg };

    } catch (err: any) {
        const errorDetail = err.message || String(err);
        let errorMsg = `Drive error: ${errorDetail}`;

        // Provide more context if it's a permission error
        if (errorDetail.includes('insufficient permissions')) {
            errorMsg = `Drive Permission Error: Please check if the account has Editor/Manager access to folder ${folderId}`;
        }

        Logger.error(`[Backup] ❌ Drive operation failed. Reason: ${errorDetail}`);
        const type = isManual ? 'MANUAL' : 'AUTO';
        addToHistory({
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'FAILED',
            type,
            message: errorMsg
        });
        cleanup(tmpDir);
        return { success: false, status: 'FAILED', message: errorMsg };
    }
}

function cleanup(dir: string) {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            Logger.info(`[Backup] Cleaned up temp dir: ${dir}`);
        }
    } catch {
        // ignore cleanup errors
    }
}
