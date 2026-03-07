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
    const mockCar = {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue({ id: '1', brand: 'BMW', model: 'M3', plateNumber: '06AAA06' }),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn((data) => Promise.resolve({ id: '1', ...data.data })),
        update: vi.fn((data) => Promise.resolve({ id: '1', ...data.data })),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue({ id: '1', brand: 'BMW', model: 'M3', plateNumber: '06AAA06' }),
    };

    const mockBranch = {
        findUnique: vi.fn(),
    };

    const mockBooking = {
        count: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
    };

    return {
        default: {
            car: mockCar,
            branch: mockBranch,
            booking: mockBooking,
            $transaction: vi.fn((cb) => cb({
                car: mockCar,
                branch: mockBranch,
                booking: mockBooking,
            })),
        },
        prisma: {
            car: mockCar,
            branch: mockBranch,
            booking: mockBooking,
        }
    };
});

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

// Mock Cloudinary
vi.mock('../src/lib/cloudinary.js', () => ({
    default: {
        uploader: {
            destroy: vi.fn(),
        }
    }
}));

describe('Cars Module', () => {
    let adminToken: string;

    beforeEach(() => {
        vi.clearAllMocks();
        adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    });

    describe('GET /api/cars', () => {
        it('should list cars with pagination', async () => {
            const mockCars = [
                { id: 'car-1', brand: 'BMW', model: 'M3' },
                { id: 'car-2', brand: 'Audi', model: 'A4' },
            ];

            (prisma.car.count as any).mockResolvedValue(2);
            (prisma.car.findMany as any).mockResolvedValue(mockCars);

            const res = await request(app).get('/api/cars');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });

        it('should filter cars by brand', async () => {
            (prisma.car.count as any).mockResolvedValue(1);
            (prisma.car.findMany as any).mockResolvedValue([{ id: 'car-1', brand: 'BMW' }]);

            const res = await request(app).get('/api/cars?brand=BMW');

            expect(res.status).toBe(200);
            expect(prisma.car.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    brand: { contains: 'BMW', mode: 'insensitive' }
                })
            }));
        });

        it('should get unique brands', async () => {
            (prisma.car.findMany as any).mockResolvedValue([{ brand: 'BMW' }, { brand: 'Audi' }]);
            const res = await request(app).get('/api/cars/brands');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should get unique categories', async () => {
            (prisma.car.findMany as any).mockResolvedValue([{ category: 'SUV' }]);
            const res = await request(app).get('/api/cars/categories');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/cars', () => {
        it('should create a new car when authenticated as admin', async () => {
            const carData = {
                brand: 'Mercedes',
                model: 'C200',
                year: 2023,
                type: 'RENTAL',
                transmission: 'AUTO',
                fuel: 'PETROL',
                category: 'LUXURY',
                seats: 5,
                doors: 4,
                color: 'Black',
                plateNumber: '34ABC123',
                dailyPrice: 2000,
                mileage: 1000,
                branchId: '550e8400-e29b-41d4-a716-446655440000',
            };

            (prisma.branch.findUnique as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000' });
            (prisma.car.findUnique as any).mockResolvedValue(null);
            (prisma.car.create as any).mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001', ...carData });

            const res = await request(app)
                .post('/api/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(carData);

            expect(res.status).toBe(201);
            expect(res.body.data.brand).toBe('Mercedes');
        });

        it('should block non-admin from creating a car', async () => {
            const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

            const res = await request(app)
                .post('/api/cars')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.status).toBe(403);
        });

        it('should fail with invalid transmission type', async () => {
            const res = await request(app)
                .post('/api/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ transmission: 'INVALID' });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/cars/:id', () => {
        it('should delete a car with no bookings', async () => {
            const validId = '550e8400-e29b-41d4-a716-446655440001';
            (prisma.booking.count as any).mockResolvedValue(0);
            (prisma.car.findUnique as any).mockResolvedValue({ id: validId });

            const res = await request(app)
                .delete(`/api/cars/${validId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(204);
        });

        it('should block deletion if car has bookings', async () => {
            const validId = '550e8400-e29b-41d4-a716-446655440001';
            (prisma.booking.count as any).mockResolvedValue(1);

            const res = await request(app)
                .delete(`/api/cars/${validId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(409);
        });
    });

    describe('GET /api/cars/:id', () => {
        it('should return car details', async () => {
            const validId = '550e8400-e29b-41d4-a716-446655440001';
            (prisma.car.findUnique as any).mockResolvedValue({ id: validId, brand: 'BMW' });

            const res = await request(app).get(`/api/cars/${validId}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(validId);
        });

        it('should return 400 for invalid UUID', async () => {
            const res = await request(app).get('/api/cars/invalid-id');
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/cars/:id/availability', () => {
        it('should return availability for a car', async () => {
            const validId = '550e8400-e29b-41d4-a716-446655440001';
            (prisma.booking.findMany as any).mockResolvedValue([]);

            const res = await request(app)
                .get(`/api/cars/${validId}/availability?from=2026-12-01&to=2026-12-05`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
