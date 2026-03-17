import { Request } from 'express';
import prisma from '../../lib/prisma.js';
import { Logger } from '../../lib/logger.js';

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
        // Safe details serialization
        let detailsString: string | null = null;
        if (details) {
            try {
                detailsString = typeof details === 'string' ? details : JSON.stringify(details);
            } catch (e) {
                detailsString = String(details);
            }
        }

        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string : undefined;
        const userAgent = req ? req.headers['user-agent'] : undefined;

        try {
            if (!userId) {
                Logger.warn('Audit: No userId provided for action:', { action });
                return;
            }

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
            // If foreign key fails (user deleted), retry with first available user
            if (String(error).includes('Foreign key constraint')) {
                try {
                    const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
                    if (fallbackUser) {
                        await prisma.actionLog.create({
                            data: {
                                userId: fallbackUser.id,
                                action,
                                details: `[orphaned userId: ${userId}] ${detailsString || ''}`,
                                ipAddress,
                                userAgent
                            }
                        });
                    }
                } catch (innerErr) {
                    Logger.error('Failed to create fallback audit log:', innerErr);
                }
                return;
            }
            Logger.error('Failed to create audit log:', error);
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
