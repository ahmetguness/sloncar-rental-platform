import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { signToken } from '../src/lib/jwt.js';

// Mock Backup Service
vi.mock('../src/modules/backup/backup.service.js', () => ({
    getBackupHistory: vi.fn().mockReturnValue([
        { id: '1', timestamp: Date.now() - 100000, type: 'MANUAL', status: 'SUCCESS' }
    ]),
    runBackup: vi.fn(),
}));

// Mock Audit Service
vi.mock('../src/modules/audit/audit.service.js', () => ({
    auditService: {
        logAction: vi.fn(),
    }
}));

describe('Backup Module', () => {
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    const staffToken = signToken({ userId: 'staff-1', email: 'staff@test.com', role: 'STAFF' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/admin/backup/run', () => {
        it('should trigger a manual backup for super admin', async () => {
            const backupService = await import('../src/modules/backup/backup.service.js');
            (backupService.runBackup as any).mockResolvedValue({
                success: true,
                status: 'SUCCESS',
                message: 'Backup completed'
            });

            const res = await request(app)
                .post('/api/admin/backup/run')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.status).toBe('SUCCESS');
        });

        it('should block staff users (only super admins allowed)', async () => {
            const res = await request(app)
                .post('/api/admin/backup/run')
                .set('Authorization', `Bearer ${staffToken}`);

            expect(res.status).toBe(403);
        });

        it('should enforce rate limit for manual backups', async () => {
             const backupService = await import('../src/modules/backup/backup.service.js');
             // Mock history with a VERY recent manual backup
             (backupService.getBackupHistory as any).mockReturnValue([
                { id: '1', timestamp: Date.now() - 1000, type: 'MANUAL', status: 'SUCCESS' }
             ]);

             const res = await request(app)
                .post('/api/admin/backup/run')
                .set('Authorization', `Bearer ${adminToken}`);

             expect(res.status).toBe(429);
             expect(res.body.message).toContain('bekleyin');
        });
    });

    describe('GET /api/admin/backup/history', () => {
        it('should retrieve backup history for admin', async () => {
            const res = await request(app)
                .get('/api/admin/backup/history')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});
