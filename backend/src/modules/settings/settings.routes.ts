import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { authMiddleware, adminGuard } from '../../middlewares/index.js';

const router = Router();

// Public route to get site settings
router.get('/', settingsController.getSettings);

// Admin route to update settings
router.post(
    '/',
    authMiddleware,
    adminGuard,
    settingsController.updateSettings
);

export default router;
