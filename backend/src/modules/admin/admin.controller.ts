import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';
import { auditService } from '../audit/audit.service.js';
import { Logger } from '../../lib/logger.js';

export async function getDashboardStats(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const stats = await adminService.getDashboardStats();
        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}

export async function getRevenueAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const analytics = await adminService.getRevenueAnalytics(year);
        res.json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        next(error);
    }
}

export async function markNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id, type } = req.body;
        if (!id || !type) {
            res.status(400).json({ success: false, message: 'ID and type required' });
            return;
        }
        await adminService.markNotificationRead(id, type);
        res.json({ success: true });
    } catch (error) {
        Logger.error('Error marking notification read:', error);
        next(error);
    }
}

export async function markAllNotificationsRead(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        await adminService.markAllNotificationsRead();

        auditService.logAction(req.user?.userId, 'MARK_ALL_NOTIFICATIONS_READ', {}, req);

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error marking all notifications read:', error);
        next(error);
    }
}

export async function getUsers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const search = req.query.search as string | undefined;
        const membershipType = req.query.membershipType as 'INDIVIDUAL' | 'CORPORATE' | undefined;
        const role = req.query.role as string | undefined;

        const result = await adminService.getUsers({ page, limit, search, membershipType, role });
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
}

export async function createUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await adminService.createUser(req.body);

        auditService.logAction(req.user?.userId, 'CREATE_USER', { targetUserId: user.id, email: user.email, role: user.role }, req);

        res.status(201).json({
            success: true,
            data: user,
            message: 'Kullanıcı başarıyla oluşturuldu'
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        if (!id) {
            throw new Error('Kullanıcı ID gereklidir');
        }
        const user = await adminService.deleteUser(id);

        auditService.logAction(req.user?.userId, 'DELETE_USER', { targetUserId: id, targetName: user.name, targetEmail: user.email }, req);

        res.json({
            success: true,
            message: 'Kullanıcı başarıyla silindi'
        });
    } catch (error) {
        next(error);
    }
}

export async function updateUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { id } = req.params;
        const { role, version, membershipType, companyName, taxNumber, taxOffice, companyAddress, tcNo } = req.body;

        if (!id) {
            throw new Error('Kullanıcı ID gereklidir');
        }

        const user = await adminService.updateUser(id, {
            role,
            version,
            membershipType,
            companyName,
            taxNumber,
            taxOffice,
            companyAddress,
            tcNo
        });

        if (user) {
            const auditDetails: any = { targetUserId: id, targetName: user.name, targetEmail: user.email };
            if (role) auditDetails.newRole = role;
            if (membershipType) auditDetails.newMembershipType = membershipType;
            auditService.logAction(req.user?.userId, 'UPDATE_USER', auditDetails, req);
        }

        res.json({
            success: true,
            data: user,
            message: 'Kullanıcı güncellendi'
        });
    } catch (error) {
        next(error);
    }
}

export async function sendBulkEmail(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { subject, body, targets } = req.body;

        if (!subject || !body || !targets || !Array.isArray(targets) || targets.length === 0) {
            res.status(400).json({ success: false, message: 'Konu, içerik ve en az bir hedef kitle gereklidir' });
            return;
        }

        const validTargets = ['ADMIN', 'STAFF', 'INDIVIDUAL', 'CORPORATE'];
        const filtered = targets.filter((t: string) => validTargets.includes(t));
        if (filtered.length === 0) {
            res.status(400).json({ success: false, message: 'Geçersiz hedef kitle' });
            return;
        }

        const recipients = await adminService.getRecipientsByTarget(filtered);
        if (recipients.length === 0) {
            res.status(404).json({ success: false, message: 'Seçilen hedef kitlede kullanıcı bulunamadı' });
            return;
        }

        const { sendBulkMail } = await import('../../lib/mail.js');
        const result = await sendBulkMail(subject, body, recipients);

        auditService.logAction(req.user?.userId, 'SEND_BULK_EMAIL', {
            targets: filtered,
            recipientCount: recipients.length,
            sent: result.sent,
            failed: result.failed,
            subject,
        }, req);

        res.json({
            success: true,
            data: { ...result, totalRecipients: recipients.length },
            message: `${result.sent} kişiye mail gönderildi`,
        });
    } catch (error) {
        next(error);
    }
}
