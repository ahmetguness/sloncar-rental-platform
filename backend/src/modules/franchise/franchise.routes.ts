import { Router } from 'express';
import * as franchiseController from './franchise.controller.js';
import { validate, authMiddleware, adminGuard } from '../../middlewares/index.js';
import {
    createFranchiseSchema,
    updateFranchiseSchema,
    updateStatusSchema,
    franchiseQuerySchema,
    franchiseIdParamSchema,
    publicFranchiseSchema,
} from './franchise.validators.js';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================================================

/**
 * @swagger
 * /franchise-applications/public:
 *   post:
 *     tags: [Franchise]
 *     summary: Submit a public franchise application (no login required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactName, contactEmail, contactPhone, city]
 *             properties:
 *               contactName:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               city:
 *                 type: string
 *               investmentBudget:
 *                 type: string
 *               experience:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 */
router.post(
    '/public',
    validate(publicFranchiseSchema),
    franchiseController.createPublicApplication
);

// ============================================================================
// USER ENDPOINTS (Authentication required)
// ============================================================================

/**
 * @swagger
 * /franchise-applications:
 *   post:
 *     tags: [Franchise]
 *     summary: Create a new franchise application (draft)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactName, contactEmail, contactPhone]
 *             properties:
 *               contactName:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               city:
 *                 type: string
 *               details:
 *                 type: object
 *                 description: Detailed form sections (personalInfo, companyInfo, etc.)
 *     responses:
 *       201:
 *         description: Application created as draft
 */
router.post(
    '/',
    authMiddleware,
    validate(createFranchiseSchema),
    franchiseController.createApplication
);

/**
 * @swagger
 * /franchise-applications/{id}:
 *   patch:
 *     tags: [Franchise]
 *     summary: Update a draft franchise application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactName:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               city:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Application updated
 *       400:
 *         description: Can only update DRAFT applications
 */
router.patch(
    '/:id',
    authMiddleware,
    validate(franchiseIdParamSchema, 'params'),
    validate(updateFranchiseSchema),
    franchiseController.updateApplication
);

/**
 * @swagger
 * /franchise-applications/{id}/submit:
 *   post:
 *     tags: [Franchise]
 *     summary: Submit a draft application for review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Application already submitted or missing required fields
 */
router.post(
    '/:id/submit',
    authMiddleware,
    validate(franchiseIdParamSchema, 'params'),
    franchiseController.submitApplication
);

/**
 * @swagger
 * /franchise-applications/me:
 *   get:
 *     tags: [Franchise]
 *     summary: Get current user's franchise applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of user's applications
 */
router.get(
    '/me',
    authMiddleware,
    validate(franchiseQuerySchema, 'query'),
    franchiseController.getUserApplications
);

export default router;

// ============================================================================
// ADMIN ENDPOINTS (mounted separately at /api/admin/franchise-applications)
// ============================================================================

export const adminFranchiseRouter = Router();

/**
 * @swagger
 * /admin/franchise-applications:
 *   get:
 *     tags: [Admin, Franchise]
 *     summary: Get all franchise applications (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of all applications
 */
adminFranchiseRouter.get(
    '/',
    authMiddleware,
    adminGuard,
    validate(franchiseQuerySchema, 'query'),
    franchiseController.getAdminApplications
);

/**
 * @swagger
 * /admin/franchise-applications/{id}:
 *   get:
 *     tags: [Admin, Franchise]
 *     summary: Get franchise application by ID with audit logs (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application details with audit history
 */
adminFranchiseRouter.get(
    '/:id',
    authMiddleware,
    adminGuard,
    validate(franchiseIdParamSchema, 'params'),
    franchiseController.getAdminApplicationById
);

/**
 * @swagger
 * /admin/franchise-applications/{id}/status:
 *   patch:
 *     tags: [Admin, Franchise]
 *     summary: Update application status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [IN_REVIEW, APPROVED, REJECTED]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
adminFranchiseRouter.patch(
    '/:id/status',
    authMiddleware,
    adminGuard,
    validate(franchiseIdParamSchema, 'params'),
    validate(updateStatusSchema),
    franchiseController.updateApplicationStatus
);

/**
 * @swagger
 * /admin/franchise-applications/{id}/audit:
 *   get:
 *     tags: [Admin, Franchise]
 *     summary: Get application audit log (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit log entries
 */
adminFranchiseRouter.get(
    '/:id/audit',
    authMiddleware,
    adminGuard,
    validate(franchiseIdParamSchema, 'params'),
    franchiseController.getApplicationAuditLog
);
