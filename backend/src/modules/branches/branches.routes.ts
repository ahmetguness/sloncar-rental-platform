import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

/**
 * @openapi
 * /api/branches:
 *   get:
 *     tags: [Branches]
 *     summary: Tüm aktif şubeleri listele
 *     responses:
 *       200:
 *         description: Şube listesi
 */
router.get('/', async (_req, res, next) => {
    try {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: branches });
    } catch (error) {
        next(error);
    }
});

export default router;
