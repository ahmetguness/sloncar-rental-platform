import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { signToken } from '../src/lib/jwt.js';

// Mock Prisma
vi.mock('@prisma/client', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        PrismaClient: vi.fn().mockImplementation(() => ({
            $connect: vi.fn(),
            $disconnect: vi.fn(),
            actionLog: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
            }
        })),
    };
});

// Mock Prisma instance used by services
vi.mock('../src/lib/prisma.js', () => {
    const mockActionLog = {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    };
    return {
        default: {
            actionLog: mockActionLog,
        },
        prisma: {
            actionLog: mockActionLog,
        }
    };
});

describe('Audit Module', () => {
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/admin/audit-logs', () => {
        it('should list audit logs for super admin', async () => {
            (prisma.actionLog.findMany as any).mockResolvedValue([
                { id: '1', action: 'LOGIN', userId: 'user-1', createdAt: new Date() }
            ]);
            (prisma.actionLog.count as any).mockResolvedValue(1);

            const res = await request(app)
                .get('/api/admin/audit-logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
        });

        it('should block non-admin users', async () => {
            const res = await request(app)
                .get('/api/admin/audit-logs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it('should filter logs by action', async () => {
            (prisma.actionLog.findMany as any).mockResolvedValue([]);
            (prisma.actionLog.count as any).mockResolvedValue(0);

            const res = await request(app)
                .get('/api/admin/audit-logs?action=LOGIN')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(prisma.actionLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    action: expect.objectContaining({ contains: 'LOGIN' })
                })
            }));
        });
    });
});
