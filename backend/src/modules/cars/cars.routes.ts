import { Router } from 'express';
import * as carsController from './cars.controller.js';
import { validate, authMiddleware, adminGuard, deleteGuard } from '../../middlewares/index.js';
import {
    createCarSchema,
    updateCarSchema,
    carQuerySchema,
    carIdParamSchema
} from './cars.validators.js';

const router = Router();


/**
 * @swagger
 * /cars/brands:
 *   get:
 *     tags: [Cars]
 *     summary: Get unique brands currently in the fleet
 *     responses:
 *       200:
 *         description: List of brand names
 */
router.get('/brands', carsController.getUsedBrands);

/**
 * @swagger
 * /cars:
 *   get:
 *     tags: [Cars]
 *     summary: List all cars with filters, pagination, and search
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand (partial match)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ECONOMY, COMPACT, MIDSIZE, FULLSIZE, SUV, VAN, LUXURY]
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [MANUAL, AUTO]
 *       - in: query
 *         name: fuel
 *         schema:
 *           type: string
 *           enum: [PETROL, DIESEL, ELECTRIC, HYBRID, LPG]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: seats
 *         schema:
 *           type: integer
 *         description: Minimum number of seats
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search in brand and model
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
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [dailyPrice, year, brand, model, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of cars with pagination info
 */
router.get('/', validate(carQuerySchema, 'query'), carsController.listCars);

/**
 * @swagger
 * /cars/{id}:
 *   get:
 *     tags: [Cars]
 *     summary: Get car by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get('/:id', validate(carIdParamSchema, 'params'), carsController.getCarById);

/**
 * @swagger
 * /cars:
 *   post:
 *     tags: [Cars, Admin]
 *     summary: Create a new car (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [brand, model, year, transmission, fuel, category, seats, doors, color, plateNumber, dailyPrice, mileage, branchId]
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               transmission:
 *                 type: string
 *                 enum: [MANUAL, AUTO]
 *               fuel:
 *                 type: string
 *                 enum: [PETROL, DIESEL, ELECTRIC, HYBRID, LPG]
 *               category:
 *                 type: string
 *                 enum: [ECONOMY, COMPACT, MIDSIZE, FULLSIZE, SUV, VAN, LUXURY]
 *               seats:
 *                 type: integer
 *               doors:
 *                 type: integer
 *               color:
 *                 type: string
 *               plateNumber:
 *                 type: string
 *               dailyPrice:
 *                 type: number
 *               weeklyPrice:
 *                 type: number
 *               deposit:
 *                 type: number
 *               mileage:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, MAINTENANCE]
 *               description:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Car created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
    '/',
    authMiddleware,
    adminGuard,
    validate(createCarSchema),
    carsController.createCar
);

/**
 * @swagger
 * /cars/{id}:
 *   patch:
 *     tags: [Cars, Admin]
 *     summary: Update a car (Admin only)
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
 *             description: Any car fields to update
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Car not found
 */
router.patch(
    '/:id',
    authMiddleware,
    adminGuard,
    validate(carIdParamSchema, 'params'),
    validate(updateCarSchema),
    carsController.updateCar
);

/**
 * @swagger
 * /cars/{id}:
 *   delete:
 *     tags: [Cars, Admin]
 *     summary: Delete a car (Admin only)
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
 *       204:
 *         description: Car deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Car not found
 *       409:
 *         description: Cannot delete car with active bookings
 */
router.delete(
    '/:id',
    authMiddleware,
    adminGuard,
    deleteGuard,
    validate(carIdParamSchema, 'params'),
    carsController.deleteCar
);

export default router;
