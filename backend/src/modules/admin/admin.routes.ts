import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authMiddleware, adminGuard } from '../../middlewares/index.js';

const router = Router();

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Dashboard istatistikleri
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard verileri
 */
router.get(
    '/dashboard',
    authMiddleware,
    adminGuard,
    adminController.getDashboardStats
);

/**
 * @openapi
 * /api/admin/revenue:
 *   get:
 *     tags: [Admin - Revenue]
 *     summary: Gelir analitikleri
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: year
 *         in: query
 *         schema:
 *           type: integer
 *         description: Yıl filtresi (opsiyonel)
 *     responses:
 *       200:
 *         description: Gelir verileri
 */
router.get(
    '/revenue',
    authMiddleware,
    adminGuard,
    adminController.getRevenueAnalytics
);

/**
 * @openapi
 * /api/admin/notifications/mark-read:
 *   post:
 *     tags: [Admin - Notifications]
 *     summary: Bildirimi okundu olarak işaretle
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: İşlem başarılı
 */
router.post(
    '/notifications/mark-read',
    authMiddleware,
    adminGuard,
    adminController.markNotificationRead
);

/**
 * @openapi
 * /api/admin/notifications/mark-all-read:
 *   post:
 *     tags: [Admin - Notifications]
 *     summary: Tüm bildirimleri okundu olarak işaretle
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: İşlem başarılı
 */
router.post(
    '/notifications/mark-all-read',
    authMiddleware,
    adminGuard,
    adminController.markAllNotificationsRead
);

export default router;

