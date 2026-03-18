import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authMiddleware, adminGuard, superAdminGuard, deleteGuard } from '../../middlewares/index.js';

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
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Sayfa numarası
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Sayfa başına kayıt sayısı
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Arama terimi (ad, email, telefon, şirket adı, vergi numarası)
 *       - name: membershipType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, CORPORATE]
 *         description: Üyelik tipine göre filtreleme
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
    superAdminGuard, // Restricted to ADMIN only
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
    superAdminGuard, // Restricted to ADMIN only
    deleteGuard, // Further restriction if needed (can be combined or simplified)
    adminController.deleteUser
);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Kullanıcı bilgilerini güncelle (Sadece Süper Admin)
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
 *               membershipType:
 *                 type: string
 *                 enum: [INDIVIDUAL, CORPORATE]
 *               companyName:
 *                 type: string
 *               taxNumber:
 *                 type: string
 *               taxOffice:
 *                 type: string
 *               companyAddress:
 *                 type: string
 *               tcNo:
 *                 type: string
 *               version:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Kullanıcı güncellendi
 */
router.patch(
    '/users/:id',
    authMiddleware,
    superAdminGuard, // Restricted to ADMIN only
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

router.post(
    '/bulk-email',
    authMiddleware,
    superAdminGuard,
    adminController.sendBulkEmail
);

export default router;

