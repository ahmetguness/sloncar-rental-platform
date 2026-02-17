import { Request, Response, NextFunction } from 'express';
import * as backupService from './backup.service.js';
import { auditService } from '../audit/audit.service.js';

export async function triggerManualBackup(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Enforce 1-minute rate limit for manual backups
        const history = backupService.getBackupHistory();
        const lastManual = history.find(entry => entry.type === 'MANUAL');

        if (lastManual) {
            const now = Date.now();
            const diffMs = now - lastManual.timestamp;
            const cooldownMs = 60 * 1000; // 1 minute

            if (diffMs < cooldownMs) {
                const remainingSec = Math.ceil((cooldownMs - diffMs) / 1000);
                res.status(429).json({
                    success: false,
                    status: 'SKIPPED',
                    message: `Lütfen tekrar denemeden önce ${remainingSec} saniye bekleyin. Manuel yedeklemeler dakikada bir kez yapılabilir.`
                });
                return;
            }
        }

        const result = await backupService.runBackup(true); // true = manual

        await auditService.logAction(
            req.user?.userId,
            'TRIGGER_BACKUP',
            { status: result.status, message: result.message },
            req
        );

        res.json({
            success: result.success,
            status: result.status,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
}

export async function getBackupHistory(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const history = backupService.getBackupHistory();
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
}
