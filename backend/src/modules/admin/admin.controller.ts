import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';

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

