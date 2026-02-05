
import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from './upload.controller.js';
import { authMiddleware, adminGuard } from '../../middlewares/index.js';

const router = Router();
const fs = await import('fs');
if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}
const upload = multer({ dest: 'temp/' });

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload an image file (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
    '/',
    authMiddleware,
    adminGuard,
    upload.single('file'),
    uploadFile
);

export default router;
