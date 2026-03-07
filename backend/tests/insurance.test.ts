import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { signToken } from '../src/lib/jwt.js';
import { InsuranceBranch } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        PrismaClient: vi.fn().mockImplementation(() => ({
            $connect: vi.fn(),
            $disconnect: vi.fn(),
            insurance: {
                create: vi.fn(),
                findUnique: vi.fn(),
                findMany: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                groupBy: vi.fn(),
                count: vi.fn(),
                updateMany: vi.fn(),
            }
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
    const mockInsurance = {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
    };
    return {
        default: {
            insurance: mockInsurance,
            $transaction: vi.fn((cb) => cb({
                insurance: mockInsurance,
            })),
        },
        prisma: {
            insurance: mockInsurance,
        }
    };
});

describe('Insurance Module', () => {
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/admin/insurances', () => {
        it('should list insurances for admin', async () => {
            (prisma.insurance.groupBy as any).mockResolvedValue([{ tcNo: '12345678901', _min: { startDate: new Date() } }]);
            (prisma.insurance.findMany as any).mockResolvedValue([{
                id: '1',
                tcNo: '12345678901',
                fullName: 'John Doe',
                startDate: new Date(),
                branch: InsuranceBranch.TRAFIK
            }]);

            const res = await request(app)
                .get('/api/admin/insurances')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].tcNo).toBe('12345678901');
        });

        it('should block non-admin users', async () => {
            const res = await request(app)
                .get('/api/admin/insurances')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/admin/insurances', () => {
        it('should create insurance entry successfully', async () => {
            const data = {
                month: 'OCAK',
                startDate: new Date().toISOString(),
                tcNo: '12345678901',
                fullName: 'John Doe',
                company: 'Allianz',
                policyNo: 'POL-123456',
                amount: 1500,
                branch: 'TRAFIK'
            };

            (prisma.insurance.create as any).mockResolvedValue({ id: 'ins-1', ...data });

            const res = await request(app)
                .post('/api/admin/insurances')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.data.policyNo).toBe(data.policyNo);
        });

        it('should fail with invalid TC number', async () => {
            const data = {
                tcNo: '123', // Too short
                fullName: 'John Doe'
            };

            const res = await request(app)
                .post('/api/admin/insurances')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(data);

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/admin/insurances/:id/renew', () => {
        it('should renew an existing insurance', async () => {
            const source = {
                id: 'ins-old',
                tcNo: '12345678901',
                fullName: 'John Doe',
                policyNo: 'POL-OLD',
                amount: 1000,
                branch: 'TRAFIK',
                company: 'Allianz'
            };

            (prisma.insurance.findUnique as any).mockResolvedValue(source);
            (prisma.insurance.create as any).mockResolvedValue({
                ...source,
                id: 'ins-new',
                policyNo: 'POL-OLD-YENI'
            });

            const res = await request(app)
                .post('/api/admin/insurances/ins-old/renew')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ startDate: new Date().toISOString() });

            expect(res.status).toBe(200);
            expect(res.body.policyNo).toContain('YENI');
        });
    });

    describe('GET /api/admin/insurances/stats', () => {
        it('should retrieve insurance stats', async () => {
            (prisma.insurance.groupBy as any).mockResolvedValue([
                { branch: 'TRAFIK', _count: { id: 5 }, _sum: { amount: 5000 } }
            ]);

            const res = await request(app)
                .get('/api/admin/insurances/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0].branch).toBe('TRAFIK');
            expect(res.body.data[0].revenue).toBe(5000);
        });
    });
});
