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
    const mockCampaign = {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn((data) => Promise.resolve({ id: '1', ...data.data })),
        update: vi.fn((data) => Promise.resolve({ id: '1', ...data.data })),
        delete: vi.fn().mockResolvedValue({ id: '1' }),
        findUnique: vi.fn().mockResolvedValue({ id: '1' }),
    };
    return {
        default: {
            campaign: mockCampaign,
        },
        prisma: {
            campaign: mockCampaign,
        }
    };
});

describe('Campaigns Module', () => {
    let adminToken: string;

    beforeEach(() => {
        vi.resetAllMocks();
        adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    });

    describe('GET /api/campaigns', () => {
        it('should list active public campaigns', async () => {
            const mockCampaigns = [{ id: '1', title: 'Summer Sale', isActive: true }];
            (prisma.campaign.findMany as any).mockResolvedValue(mockCampaigns);

            const res = await request(app).get('/api/campaigns');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('ADMIN Endpoints', () => {
        it('should create a campaign as admin', async () => {
            const data = { title: 'New Promo', description: 'Save money', isActive: true };
            (prisma.campaign.create as any).mockResolvedValue({ id: '2', ...data });

            const res = await request(app)
                .post('/api/admin/campaigns')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(data);

            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe('New Promo');
        });

        it('should block unauthorized access', async () => {
            const res = await request(app).post('/api/admin/campaigns').send({});
            expect(res.status).toBe(401);
        });
    });
});
