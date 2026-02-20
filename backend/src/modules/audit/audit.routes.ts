import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authMiddleware as authenticate, superAdminGuard as authorizeAdmin } from '../../middlewares/index.js';

const router = Router();

// Only Super Admins can view audit logs
router.get('/', authenticate, authorizeAdmin, auditController.getLogs);

export default router;
