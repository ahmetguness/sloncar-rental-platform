import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export const auditService = {
    /**
     * Log an action performed by a user/admin
     */
    logAction: async (
        userId: string | undefined,
        action: string,
        details?: any,
        req?: Request
    ) => {
        try {
            if (!userId) {
                console.warn('Audit: No userId provided for action:', action);
                return;
            }

            // Safe details serialization
            let detailsString: string | null = null;
            if (details) {
                try {
                    detailsString = typeof details === 'string' ? details : JSON.stringify(details);
                } catch (e) {
                    detailsString = String(details);
                }
            }

            // Extract IP and User Agent
            const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string : undefined;
            const userAgent = req ? req.headers['user-agent'] : undefined;

            await prisma.actionLog.create({
                data: {
                    userId,
                    action,
                    details: detailsString,
                    ipAddress,
                    userAgent
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw, we don't want to break the main flow if logging fails
        }
    },

    /**
     * Get paginated logs (For Super Admin)
     */
    getLogs: async (page = 1, limit = 20, userId?: string, action?: string) => {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = { contains: action, mode: 'insensitive' };

        const [logs, total] = await Promise.all([
            prisma.actionLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            }),
            prisma.actionLog.count({ where })
        ]);

        return {
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
};
