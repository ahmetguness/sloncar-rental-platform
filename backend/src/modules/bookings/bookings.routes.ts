import { Router } from 'express';
import * as bookingsController from './bookings.controller.js';
import { authMiddleware, adminGuard, validate } from '../../middlewares/index.js';
import {
    createBookingSchema,
    bookingQuerySchema,
    availabilityQuerySchema,
    bookingIdParamSchema,
    carIdParamSchema,
    lookupBookingSchema,
    bookingCodeParamSchema,
    extendBookingSchema,
    payBookingSchema,
    createManualBookingSchema,
    updateBookingDatesSchema,
} from './bookings.validators.js';

const router = Router();

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Araç kirala (Herkese açık)
 *     description: Yeni rezervasyon oluşturur ve benzersiz rezervasyon kodu döner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [carId, customerName, customerSurname, customerPhone, customerEmail, customerDriverLicense, pickupDate, dropoffDate, pickupBranchId, dropoffBranchId]
 *     responses:
 *       201:
 *         description: Rezervasyon oluşturuldu, kod döner
 */
router.post('/', validate(createBookingSchema, 'body'), bookingsController.createBooking);

/**
 * @openapi
 * /api/bookings/{code}:
 *   get:
 *     tags: [Bookings]
 *     summary: Rezervasyon sorgula (Kod ile)
 *     description: Rezervasyon kodu ile detayları görüntüle
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: RNT-ABC123
 *     responses:
 *       200:
 *         description: Rezervasyon detayları
 */
router.get('/:code', validate(bookingCodeParamSchema, 'params'), bookingsController.getBookingByCode);

/**
 * @openapi
 * /api/bookings/{code}/extend:
 *   patch:
 *     tags: [Bookings]
 *     summary: Kiralama süresini uzat
 *     description: Mevcut rezervasyonun teslim tarihini ileriye al
 *     parameters:
 *       - name: code
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
 *             required: [newDropoffDate]
 *             properties:
 *               newDropoffDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Rezervasyon uzatıldı
 */
router.patch(
    '/:code/extend',
    validate(bookingCodeParamSchema, 'params'),
    validate(extendBookingSchema, 'body'),
    bookingsController.extendBooking
);

/**
 * @openapi
 * /api/bookings/{code}/pay:
 *   post:
 *     tags: [Bookings]
 *     summary: Ödeme Taklidi
 *     description: Rezervasyon için ödeme simülasyonu
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *               cvv:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ödeme başarılı
 */
router.post(
    '/:code/pay',
    validate(bookingCodeParamSchema, 'params'),
    validate(payBookingSchema, 'body'),
    bookingsController.payBooking
);

/**
 * @openapi
 * /api/bookings/lookup:
 *   get:
 *     tags: [Bookings]
 *     summary: Telefon ile rezervasyon ara
 *     parameters:
 *       - name: phone
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulunan rezervasyonlar
 */
router.get('/lookup/phone', validate(lookupBookingSchema, 'query'), bookingsController.lookupBooking);

// Car availability router (mounted at /api/cars/:id/availability)
export const carAvailabilityRouter = Router({ mergeParams: true });

carAvailabilityRouter.get(
    '/',
    validate(carIdParamSchema, 'params'),
    validate(availabilityQuerySchema, 'query'),
    bookingsController.getAvailability
);

// Admin bookings router (mounted at /api/admin/bookings)
export const adminBookingsRouter = Router();

adminBookingsRouter.get(
    '/',
    authMiddleware,
    adminGuard,
    validate(bookingQuerySchema, 'query'),
    bookingsController.getAdminBookings
);

adminBookingsRouter.patch(
    '/:id/cancel',
    authMiddleware,
    adminGuard,
    validate(bookingIdParamSchema, 'params'),
    bookingsController.cancelBooking
);

// Admin: Create Manual Booking
adminBookingsRouter.post(
    '/',
    authMiddleware,
    adminGuard,
    validate(createManualBookingSchema),
    bookingsController.createManualBooking
);

adminBookingsRouter.patch(
    '/:id/complete',
    authMiddleware,
    adminGuard,
    validate(bookingIdParamSchema, 'params'),
    bookingsController.completeBooking
);

adminBookingsRouter.patch(
    '/:id/dates',
    authMiddleware,
    adminGuard,
    validate(bookingIdParamSchema, 'params'),
    validate(updateBookingDatesSchema, 'body'),
    bookingsController.updateBookingDates
);

adminBookingsRouter.patch(
    '/:id/start',
    authMiddleware,
    adminGuard,
    validate(bookingIdParamSchema, 'params'),
    bookingsController.startBooking
);

export default router;
