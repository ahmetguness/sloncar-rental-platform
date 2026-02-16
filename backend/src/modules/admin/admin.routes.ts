import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authMiddleware, adminGuard, superAdminGuard } from '../../middlewares/index.js';

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
 * /api/admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Kullanıcı listesi (Select için)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 */
// User Management Routes
router.get(
    '/users',
    authMiddleware,
    adminGuard, // Both Admin and Staff can view users? Or maybe just Admin? Let's say both for listing.
    adminController.getUsers
);

/**
 * @openapi
 * /api/admin/users:
 *   post:
 *     tags: [Admin - Users]
 *     summary: Yeni kullanıcı oluştur (Sadece Süper Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, STAFF]
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
 */
router.post(
    '/users',
    authMiddleware,
    superAdminGuard, // Only Super Admin can create
    adminController.createUser
);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Kullanıcı sil (Sadece Süper Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı silindi
 */
router.delete(
    '/users/:id',
    authMiddleware,
    superAdminGuard, // Only Super Admin can delete
    adminController.deleteUser
);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Kullanıcı rolünü güncelle (Sadece Süper Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, STAFF]
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
 */
router.patch(
    '/users/:id',
    authMiddleware,
    superAdminGuard, // Only Super Admin can update role
    adminController.updateUser
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

