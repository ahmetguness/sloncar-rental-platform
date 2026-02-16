import { Router } from 'express';
import { insuranceController } from './insurance.controller.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { adminGuard } from '../../middlewares/adminGuard.js';

const router = Router();

// Admin routes for insurances
router.get(
    '/',
    authMiddleware,
    adminGuard,
    insuranceController.getInsurances
);

// Create insurance
router.post(
    '/',
    authMiddleware,
    adminGuard,
    insuranceController.createInsurance
);

// Export insurances
router.get(
    '/export',
    authMiddleware,
    adminGuard,
    insuranceController.exportInsurances
);

export const adminInsuranceRouter = router;
