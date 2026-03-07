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
            user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        })),
    };
});

vi.mock('../src/lib/prisma.js', () => {
    const mockUser = {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    };
    return {
        default: {
            user: mockUser,
        },
        prisma: {
            user: mockUser,
        }
    };
});

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

describe('Auth Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test User',
            };

            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue({
                id: 'user-123',
                ...userData,
                role: 'USER',
                passwordHash: 'hashed_password',
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.body.data.token).toBeDefined();
        });

        it('should return 409 if user already exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'Password123!',
                    name: 'Existing User',
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Password123!',
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should fail with too short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123',
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash(loginData.password, 1);

            (prisma.user.findUnique as any).mockResolvedValue({
                id: 'user-123',
                email: loginData.email,
                name: 'Test User',
                role: 'USER',
                passwordHash: hashedPassword,
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(loginData.email);
            expect(res.body.data.token).toBeDefined();
        });

        it('should return 401 with incorrect password', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                passwordHash: 'different_hash',
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrong_password',
                });

            expect(res.status).toBe(401);
        });

        it('should return 401 if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123!',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return 401 if not authenticated', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.status).toBe(401);
        });

        it('should return user profile if authenticated', async () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
            };

            const token = signToken({ userId: user.id, email: user.email, role: 'USER' });

            (prisma.user.findUnique as any).mockResolvedValue(user);

            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.user.email).toBe(user.email);
        });
    });
});
