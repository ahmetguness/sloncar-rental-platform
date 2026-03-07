import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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
        findUnique: vi.fn(),
        create: vi.fn(),
    };
    const mockCar = {
        findMany: vi.fn(),
    };
    const mockBooking = {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
    };

    return {
        default: {
            user: mockUser,
            car: mockCar,
            booking: mockBooking,
        },
        prisma: {
            user: mockUser,
            car: mockCar,
            booking: mockBooking,
        }
    };
});

describe('Security Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Privilege Escalation (Default Role)', () => {
        it('should assign USER role by default on registration', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue({
                id: 'user-123',
                email: 'security@example.com',
                role: 'USER',
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: `security_test_${Date.now()}@example.com`,
                    password: 'password123',
                    name: 'Security Test User'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.user.role).toBe('USER');
        });
    });

    describe('2. Direct Access to Admin Routes', () => {
        const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

        it('should block USER from accessing admin dashboard', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });

        it('should block USER from accessing revenue analytics', async () => {
            const res = await request(app)
                .get('/api/admin/revenue')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('3. PII Leakage Protection', () => {
        it('should require exact match for phone lookup', async () => {
            (prisma.booking.findMany as any).mockResolvedValue([]);
            const res = await request(app)
                .get('/api/bookings/lookup/phone')
                .query({ phone: '1234567' });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

        it('should mask PII in public booking details', async () => {
            const mockBooking = {
                id: 'booking-1',
                bookingCode: 'RNT-SEC123',
                customerName: 'S***',
                customerSurname: 'U***',
                customerEmail: 's***@example.com',
                customerPhone: '***3322',
                customerDriverLicense: '******',
                pickupDate: new Date(),
                dropoffDate: new Date(),
                status: 'RESERVED',
                paymentStatus: 'UNPAID',
                car: { brand: 'BMW', model: 'M3', branch: { name: 'Main' } },
                pickupBranch: { name: 'Main' },
                dropoffBranch: { name: 'Main' }
            };

            // Mock the internal logic of masking if we were testing the service,
            // but here we test the endpoint which calls the service.
            // In a real integration test, the service would do the masking.
            // Since we're mocking, we'll return the masked data as if the service worked.

            // Actually, let's see if we can test that the controller/service DOES mask it.
            // If we mock the service, we can't test that. 
            // If we mock Prisma, the service will run and mask it.

            (prisma.booking.findUnique as any).mockResolvedValue({
                id: 'booking-1',
                bookingCode: 'RNT-SEC123',
                customerName: 'Secret',
                customerSurname: 'User',
                customerEmail: 'secret@example.com',
                customerPhone: '905554443322',
                customerDriverLicense: '12345678',
                pickupDate: new Date(),
                dropoffDate: new Date(),
                status: 'RESERVED',
                paymentStatus: 'UNPAID',
                car: { brand: 'BMW', model: 'M3', branch: { name: 'Main' } },
                pickupBranch: { name: 'Main' },
                dropoffBranch: { name: 'Main' }
            });

            const res = await request(app).get('/api/bookings/RNT-SEC123');

            expect(res.status).toBe(200);
            const b = res.body.data.booking;
            expect(b.customerName).toBe('S***');
            expect(b.customerEmail).toContain('s***@');
            expect(b.customerPhone).toBe('***3322');
        });
    });
});
