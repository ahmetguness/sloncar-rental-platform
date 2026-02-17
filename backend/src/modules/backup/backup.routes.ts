import { Router } from 'express';
import * as backupController from './backup.controller.js';
import { authMiddleware, adminGuard } from '../../middlewares/index.js';

const router = Router();

/**
 * @swagger
 * /backup/run:
 *   post:
 *     tags: [Backup]
 *     summary: Trigger a manual backup (Admin/Staff only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup triggered successfully
 */
router.post('/run', authMiddleware, adminGuard, backupController.triggerManualBackup);

/**
 * @swagger
 * /backup/history:
 *   get:
 *     tags: [Backup]
 *     summary: Get backup history (Admin/Staff only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup history retrieved successfully
 */
router.get('/history', authMiddleware, adminGuard, backupController.getBackupHistory);

export default router;
