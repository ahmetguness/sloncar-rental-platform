import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

// Mock Prisma
vi.mock('@prisma/client', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        PrismaClient: vi.fn().mockImplementation(() => ({
            $connect: vi.fn(),
            $disconnect: vi.fn(),
        })),
    };
});

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

// Mock Prisma instance used by services
vi.mock('../src/lib/prisma.js', () => {
    const mockBranch = {
        findMany: vi.fn(),
    };
    return {
        default: {
            branch: mockBranch,
        },
        prisma: {
            branch: mockBranch,
        }
    };
});

describe('Branches Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/branches', () => {
        it('should return list of active branches', async () => {
            const mockBranches = [
                { id: '1', name: 'Istanbul Branch', isActive: true },
                { id: '2', name: 'Ankara Branch', isActive: true },
            ];

            (prisma.branch.findMany as any).mockResolvedValue(mockBranches);

            const res = await request(app).get('/api/branches');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].name).toBe('Istanbul Branch');
            expect(prisma.branch.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });
        });

        it('should handle database errors', async () => {
            (prisma.branch.findMany as any).mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get('/api/branches');

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
        });
    });
});
