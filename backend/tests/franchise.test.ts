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
    const mockUser = {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', email: 'user@test.com', role: 'USER' }),
    };
    const mockAuditLog = {
        create: vi.fn().mockResolvedValue({}),
    };
    const mockFranchise = {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    };
    return {
        default: {
            user: mockUser,
            franchiseApplication: mockFranchise,
            franchiseAuditLog: mockAuditLog,
            $transaction: vi.fn((cb) => cb({
                user: mockUser,
                franchiseApplication: mockFranchise,
                franchiseAuditLog: mockAuditLog,
            })),
        },
        prisma: {
            user: mockUser,
            franchiseApplication: mockFranchise,
            franchiseAuditLog: mockAuditLog,
        }
    };
});

describe('Franchise Module', () => {
    const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/franchise-applications/public', () => {
        it('should submit a public application successfully', async () => {
            const data = {
                contactName: 'John Doe',
                contactEmail: 'john@example.com',
                contactPhone: '905554443322',
                city: 'Istanbul'
            };

            (prisma.franchiseApplication.create as any).mockResolvedValue({ id: 'app-1', ...data, status: 'SUBMITTED' });

            const res = await request(app)
                .post('/api/franchise-applications/public')
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.applicationNumber).toBeDefined();
        });

        it('should fail validation with invalid email', async () => {
            const res = await request(app)
                .post('/api/franchise-applications/public')
                .send({
                    contactName: 'John Doe',
                    contactEmail: 'invalid-email',
                    contactPhone: '905554443322',
                    city: 'Istanbul'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('USER Endpoints', () => {
        it('should create a draft application with auth', async () => {
            const data = {
                contactName: 'John Doe',
                contactEmail: 'john@example.com',
                contactPhone: '905554443322'
            };

            (prisma.franchiseApplication.create as any).mockResolvedValue({ id: 'app-2', ...data, status: 'DRAFT' });

            const res = await request(app)
                .post('/api/franchise-applications')
                .set('Authorization', `Bearer ${userToken}`)
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.data.status).toBe('DRAFT');
        });

        it('should return 401 for unauthorized user', async () => {
            const res = await request(app).post('/api/franchise-applications').send({});
            expect(res.status).toBe(401);
        });
    });

    describe('ADMIN Endpoints', () => {
        it('should list all applications for admin', async () => {
            (prisma.franchiseApplication.findMany as any).mockResolvedValue([{ id: '1' }]);
            (prisma.franchiseApplication.count as any).mockResolvedValue(1);

            const res = await request(app)
                .get('/api/admin/franchise-applications')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should block non-admin from admin route', async () => {
            const res = await request(app)
                .get('/api/admin/franchise-applications')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });
    });
});
