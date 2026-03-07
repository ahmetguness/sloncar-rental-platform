import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { signToken } from '../src/lib/jwt.js';
 
// Mock Prisma client for modules that instantiate it directly (like auditService)
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

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

vi.mock('../src/lib/prisma.js', () => {
    const mockUser = {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    };
    const mockBooking = {
        count: vi.fn(),
        aggregate: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    };
    const mockCar = {
        count: vi.fn(),
    };
    const mockFranchise = {
        count: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    };
    const mockInsurance = {
        count: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
    };

    return {
        default: {
            user: mockUser,
            booking: mockBooking,
            car: mockCar,
            franchiseApplication: mockFranchise,
            insurance: mockInsurance,
        },
        prisma: {
            user: mockUser,
            booking: mockBooking,
            car: mockCar,
            franchiseApplication: mockFranchise,
            insurance: mockInsurance,
        }
    };
});

describe('Admin Module', () => {
    const adminToken = signToken({ userId: 'admin-123', email: 'admin@test.com', role: 'ADMIN' });
    const userTokens = signToken({ userId: 'user-123', email: 'user@test.com', role: 'USER' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/admin/dashboard', () => {
        it('should return dashboard stats for admin', async () => {
            (prisma.booking.count as any).mockResolvedValue(10);
            (prisma.booking.aggregate as any).mockResolvedValue({ _sum: { totalPrice: 50000 } });
            (prisma.car.count as any).mockResolvedValue(20);
            (prisma.user.count as any).mockResolvedValue(15);
            (prisma.booking.findMany as any).mockResolvedValue([]);
            (prisma.franchiseApplication.count as any).mockResolvedValue(2);
            (prisma.franchiseApplication.findMany as any).mockResolvedValue([]);
            (prisma.insurance.count as any).mockResolvedValue(5);
            (prisma.insurance.findMany as any).mockResolvedValue([]);

            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalRevenue).toBe(50000);
            expect(res.body.data.totalBookings).toBe(10);
        });

        it('should block regular users', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${userTokens}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/admin/users', () => {
        it('should list users for admin', async () => {
            (prisma.user.findMany as any).mockResolvedValue([
                { id: '1', name: 'User 1', email: 'u1@test.com', role: 'USER' },
                { id: '2', name: 'Admin 1', email: 'a1@test.com', role: 'ADMIN' },
            ]);
            (prisma.user.count as any).mockResolvedValue(2);

            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });
    });

    describe('POST /api/admin/users', () => {
        it('should create a new user by admin', async () => {
            const newUser = {
                name: 'New Admin',
                email: 'newadmin@test.com',
                password: 'Password123!',
                phone: '905554443322',
                role: 'ADMIN'
            };

            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue({
                id: 'new-id',
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            });

            const res = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser);

            expect(res.status).toBe(201);
            expect(res.body.data.email).toBe(newUser.email);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete a user as admin', async () => {
            (prisma.user.delete as any).mockResolvedValue({ id: '1', name: 'Deleted User', email: 'deleted@test.com' });

            const res = await request(app)
                .delete('/api/admin/users/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PATCH /api/admin/users/:id', () => {
        it('should update user role as admin', async () => {
            (prisma.user.update as any).mockResolvedValue({ id: '1', role: 'ADMIN' });

            const res = await request(app)
                .patch('/api/admin/users/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'ADMIN' });

            expect(res.status).toBe(200);
            expect(res.body.data.role).toBe('ADMIN');
        });
    });

    describe('GET /api/admin/revenue', () => {
        it('should return revenue analytics', async () => {
            (prisma.booking.groupBy as any).mockResolvedValue([]);
            (prisma.booking.findFirst as any).mockResolvedValue({ pickupDate: new Date() });
            (prisma.booking.findMany as any).mockResolvedValue([]);

            const res = await request(app)
                .get('/api/admin/revenue')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.summary).toBeDefined();
        });
    });

    describe('POST /api/admin/notifications/mark-read', () => {
        it('should mark a notification as read', async () => {
            (prisma.booking.update as any).mockResolvedValue({});

            const res = await request(app)
                .post('/api/admin/notifications/mark-read')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ id: '1', type: 'booking' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/admin/notifications/mark-all-read', () => {
        it('should mark all notifications as read', async () => {
            (prisma.booking.updateMany as any).mockResolvedValue({ count: 5 });
            (prisma.franchiseApplication.updateMany as any).mockResolvedValue({ count: 2 });
            (prisma.insurance.updateMany as any).mockResolvedValue({ count: 1 });

            const res = await request(app)
                .post('/api/admin/notifications/mark-all-read')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
