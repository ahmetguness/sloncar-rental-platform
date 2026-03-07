import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { signToken } from '../src/lib/jwt.js';
import * as bookingsService from '../src/modules/bookings/bookings.service.js';
import { ApiError } from '../src/middlewares/errorHandler.js';

// Mock Services
vi.mock('../src/modules/bookings/bookings.service.js', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        extendBooking: vi.fn(),
        payBooking: vi.fn(),
        getBookingByCode: vi.fn(),
    };
});

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
    const mockBooking = {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn((data) => Promise.resolve({ id: 'mock-id', ...data.data })),
        update: vi.fn((data) => Promise.resolve({ id: 'mock-id', ...data.data })),
        count: vi.fn(),
    };
    const mockCar = {
        findUnique: vi.fn(),
    };
    const mockBranch = {
        findUnique: vi.fn(),
    };

    return {
        default: {
            booking: mockBooking,
            car: mockCar,
            branch: mockBranch,
            $transaction: vi.fn((cb) => cb({
                booking: mockBooking,
                car: mockCar,
                branch: mockBranch,
            })),
        },
        prisma: {
            booking: mockBooking,
            car: mockCar,
            branch: mockBranch,
        }
    };
});

// Mock Notification Service
vi.mock('../src/lib/notification.js', () => ({
    notificationService: {
        sendBookingConfirmation: vi.fn().mockResolvedValue({}),
        sendExtensionConfirmation: vi.fn().mockResolvedValue({}),
        sendPaymentReceipt: vi.fn().mockResolvedValue({}),
    }
}));

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

// Mock Validation Service
vi.mock('../src/modules/bookings/booking.validation.service.js', () => ({
    checkBookingOverlap: vi.fn().mockResolvedValue(true),
}));

describe('Bookings Module', () => {
    const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/bookings', () => {
        it('should create a booking successfully', async () => {
            const bookingData = {
                carId: '550e8400-e29b-41d4-a716-446655440001',
                pickupBranchId: '550e8400-e29b-41d4-a716-446655440000',
                dropoffBranchId: '550e8400-e29b-41d4-a716-446655440000',
                pickupDate: new Date(Date.now() + 86400000).toISOString(),
                dropoffDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                customerName: 'Test',
                customerSurname: 'User',
                customerPhone: '905554443322',
                customerEmail: 'test@example.com',
                customerTC: '12345678901',
                customerDriverLicense: '123456',
            };

            (prisma.car.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001', status: 'ACTIVE', branchId: '550e8400-e29b-41d4-a716-446655440000', dailyPrice: 1000 });
            (prisma.branch.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });
            (prisma.booking.findUnique as any).mockResolvedValue(null);
            (prisma.booking.create as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440002', bookingCode: 'RNT-ABC123', ...bookingData });

            const res = await request(app)
                .post('/api/bookings')
                .send(bookingData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.bookingCode).toBeDefined();
        });

        it('should fail validation with invalid dates', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({
                    pickupDate: 'invalid',
                    dropoffDate: 'invalid',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/bookings/:code', () => {
        it('should return booking details by code with masked PII', async () => {
            const mockBooking = {
                id: 'booking-1',
                bookingCode: 'RNT-ABC123',
                customerName: 'J***',
                customerSurname: 'D***',
                customerEmail: 'j***@example.com',
                customerPhone: '***3322',
                pickupDate: new Date(),
                dropoffDate: new Date(),
                status: 'RESERVED',
                paymentStatus: 'UNPAID',
                car: { brand: 'BMW', model: 'M3', branch: { name: 'Main' } },
                pickupBranch: { name: 'Main' },
                dropoffBranch: { name: 'Main' }
            };

            (bookingsService.getBookingByCode as any).mockResolvedValue(mockBooking);

            const res = await request(app).get('/api/bookings/RNT-ABC123');

            expect(res.status).toBe(200);
            expect(res.body.data.booking.customerName).toBe('J***');
        });

        it('should return 404 for non-existent code', async () => {
            (bookingsService.getBookingByCode as any).mockRejectedValue(ApiError.notFound('Not found'));
            const res = await request(app).get('/api/bookings/NONEXISTENT');
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/bookings/:code/extend', () => {
        it('should extend booking successfully', async () => {
            (bookingsService.extendBooking as any).mockResolvedValue({
                id: '1',
                status: 'ACTIVE',
                additionalPrice: 1000
            });

            const res = await request(app)
                .patch('/api/bookings/RNT-ABC123/extend')
                .send({ newDropoffDate: new Date(Date.now() + 86400000 * 5).toISOString() });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/bookings/:code/pay', () => {
        it('should process payment', async () => {
            (bookingsService.payBooking as any).mockResolvedValue({
                id: '1',
                paymentRef: 'PAY-123'
            });
            (bookingsService.getBookingByCode as any).mockResolvedValue({ totalPrice: 2000 });

            const res = await request(app)
                .post('/api/bookings/RNT-ABC123/pay')
                .send({ cardNumber: '1234123412341234', expiryDate: '12/25', cvv: '123' });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/bookings/lookup/phone', () => {
        it('should find bookings by phone', async () => {
            (prisma.booking.findMany as any).mockResolvedValue([{ id: '1' }]);
            const res = await request(app).get('/api/bookings/lookup/phone?phone=905554443322');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('ADMIN Endpoints', () => {
        it('should list all bookings for admin', async () => {
            (prisma.booking.count as any).mockResolvedValue(10);
            (prisma.booking.findMany as any).mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);

            const res = await request(app)
                .get('/api/admin/bookings')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });

        it('should block non-admin from admin bookings list', async () => {
            const res = await request(app)
                .get('/api/admin/bookings')
                .set('Authorization', `Bearer={userToken}`); // Token issue here in string, fixed in next line

            const res2 = await request(app)
                .get('/api/admin/bookings')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res2.status).toBe(403);
        });
    });
});
