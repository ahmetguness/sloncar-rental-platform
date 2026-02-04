import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Cars Module', () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        // Create and login as admin (assuming seeded)
        // In a real test, you'd create test users
        try {
            const adminLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@rentacar.com', password: 'password123' });
            adminToken = adminLogin.body.data?.token || '';
        } catch {
            adminToken = '';
        }

        try {
            const userLogin = await request(app)
                .post('/api/auth/login')
                .send({ email: 'user@example.com', password: 'password123' });
            userToken = userLogin.body.data?.token || '';
        } catch {
            userToken = '';
        }
    });

    describe('GET /api/cars', () => {
        it('should list cars with pagination', async () => {
            const response = await request(app)
                .get('/api/cars')
                .query({ page: 1, limit: 5 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should filter cars by category', async () => {
            const response = await request(app)
                .get('/api/cars')
                .query({ category: 'SUV' })
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach((car: any) => {
                expect(car.category).toBe('SUV');
            });
        });

        it('should filter cars by price range', async () => {
            const response = await request(app)
                .get('/api/cars')
                .query({ minPrice: 500, maxPrice: 1000 })
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach((car: any) => {
                const price = parseFloat(car.dailyPrice);
                expect(price).toBeGreaterThanOrEqual(500);
                expect(price).toBeLessThanOrEqual(1000);
            });
        });

        it('should search cars by brand/model', async () => {
            const response = await request(app)
                .get('/api/cars')
                .query({ q: 'Toyota' })
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.length > 0) {
                const allMatch = response.body.data.every((car: any) =>
                    car.brand.toLowerCase().includes('toyota') ||
                    car.model.toLowerCase().includes('toyota')
                );
                expect(allMatch).toBe(true);
            }
        });

        it('should sort cars by price', async () => {
            const response = await request(app)
                .get('/api/cars')
                .query({ sortBy: 'dailyPrice', sortOrder: 'asc' })
                .expect(200);

            expect(response.body.success).toBe(true);
            const prices = response.body.data.map((car: any) => parseFloat(car.dailyPrice));
            for (let i = 1; i < prices.length; i++) {
                expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
            }
        });
    });

    describe('GET /api/cars/:id', () => {
        it('should return 404 for non-existent car', async () => {
            const response = await request(app)
                .get('/api/cars/00000000-0000-0000-0000-000000000000')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });

        it('should validate UUID format', async () => {
            const response = await request(app)
                .get('/api/cars/invalid-uuid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /api/cars (Admin only)', () => {
        const newCar = {
            brand: 'Test Brand',
            model: 'Test Model',
            year: 2024,
            transmission: 'AUTO',
            fuel: 'PETROL',
            category: 'COMPACT',
            seats: 5,
            doors: 4,
            color: 'Blue',
            plateNumber: `TEST-${Date.now()}`,
            dailyPrice: 500,
            mileage: 0,
            branchId: '00000000-0000-0000-0000-000000000000', // Will need valid ID
        };

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .post('/api/cars')
                .send(newCar)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });

        it('should reject non-admin user', async () => {
            if (!userToken) return; // Skip if no user token

            const response = await request(app)
                .post('/api/cars')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newCar)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FORBIDDEN');
        });

        it('should validate required fields', async () => {
            if (!adminToken) return; // Skip if no admin token

            const response = await request(app)
                .post('/api/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ brand: 'Test' }) // Missing required fields
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
});
