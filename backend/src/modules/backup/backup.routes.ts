import { Router } from 'express';
import * as backupController from './backup.controller.js';
import { authMiddleware, superAdminGuard } from '../../middlewares/index.js';

const router = Router();

/**
 * @swagger
 * /backup/run:
 *   post:
 *     tags: [Backup]
 *     summary: Trigger a manual backup (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup triggered successfully
 */
router.post('/run', authMiddleware, superAdminGuard, backupController.triggerManualBackup);

/**
 * @swagger
 * /backup/history:
 *   get:
 *     tags: [Backup]
 *     summary: Get backup history (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup history retrieved successfully
 */
router.get('/history', authMiddleware, superAdminGuard, backupController.getBackupHistory);


export default router;
