import { Router } from 'express';
import multer from 'multer';
import { insuranceController } from './insurance.controller.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { adminGuard } from '../../middlewares/adminGuard.js';
import { deleteGuard } from '../../middlewares/deleteGuard.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// Delete insurance
router.delete(
    '/:id',
    authMiddleware,
    adminGuard,
    deleteGuard,
    insuranceController.deleteInsurance
);

// Export insurances
router.get(
    '/export',
    authMiddleware,
    adminGuard,
    insuranceController.exportInsurances
);

// Import insurances
router.post(
    '/import',
    authMiddleware,
    adminGuard,
    upload.single('file'),
    insuranceController.importInsurances
);

export const adminInsuranceRouter = router;
