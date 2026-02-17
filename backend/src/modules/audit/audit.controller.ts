import { Request, Response } from 'express';
import { auditService } from './audit.service.js';


export const auditController = {
    getLogs: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const userId = req.query.userId as string;
            const action = req.query.action as string;

            const result = await auditService.getLogs(page, limit, userId, action);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Get logs error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch logs' });
        }
    }
};
