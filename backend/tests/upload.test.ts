import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { signToken } from '../src/lib/jwt.js';

// Mock Upload Service
vi.mock('../src/modules/upload/upload.service.js', () => ({
    uploadImage: vi.fn(),
}));

describe('Upload Module', () => {
    const adminToken = signToken({ userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' });
    const userToken = signToken({ userId: 'user-1', email: 'user@test.com', role: 'USER' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/upload', () => {
        it('should upload an image successfully for admin', async () => {
            const uploadService = await import('../src/modules/upload/upload.service.js');
            (uploadService.uploadImage as any).mockResolvedValue('https://cloudinary.com/test.jpg');

            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from('fake-image-content'), 'test.jpg');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.url).toBe('https://cloudinary.com/test.jpg');
        });

        it('should fail if no file is uploaded', async () => {
            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('No file uploaded');
        });

        it('should block non-admin users', async () => {
            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('file', Buffer.from('fake-image-content'), 'test.jpg');

            expect(res.status).toBe(403);
        });

        it('should fail with non-image files (via multer filter)', async () => {
            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from('fake-text-content'), 'test.txt');

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Only image files');
        });
    });
});
