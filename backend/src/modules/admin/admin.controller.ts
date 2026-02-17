import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';
import { auditService } from '../audit/audit.service.js';

export async function getDashboardStats(
    req: Request,
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
        console.error('Error marking notification read:', error);
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
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        next(error);
    }
}

export async function getUsers(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const users = await adminService.getUsers();
        res.json({
            success: true,
            data: users,
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

        await auditService.logAction(req.user?.userId, 'CREATE_USER', { targetUserId: user.id, email: user.email, role: user.role }, req);

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
        await adminService.deleteUser(id);

        await auditService.logAction(req.user?.userId, 'DELETE_USER', { targetUserId: id }, req);

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
        const { role } = req.body;

        if (!id) {
            throw new Error('Kullanıcı ID gereklidir');
        }

        const user = await adminService.updateUser(id, { role });

        await auditService.logAction(req.user?.userId, 'UPDATE_USER_ROLE', { targetUserId: id, newRole: role }, req);

        res.json({
            success: true,
            data: user,
            message: 'Kullanıcı rolü güncellendi'
        });
    } catch (error) {
        next(error);
    }
}
