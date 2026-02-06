import { Request, Response, NextFunction } from 'express';
import * as bookingsService from './bookings.service.js';
import {
    CreateBookingInput,
    BookingQueryInput,
    AvailabilityQueryInput,
    ExtendBookingInput,
} from './bookings.validators.js';

// PUBLIC - Create booking and get booking code
export async function createBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const booking = await bookingsService.createBooking(req.body as CreateBookingInput);
        res.status(201).json({
            success: true,
            message: 'Rezervasyonunuz başarıyla oluşturuldu!',
            data: {
                bookingCode: booking.bookingCode,
                message: `Rezervasyon kodunuz: ${booking.bookingCode}. Bu kodu saklayın!`,
                booking,
            },
        });
    } catch (error) {
        next(error);
    }
}

// PUBLIC - Get booking by code (for customers)
export async function getBookingByCode(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const code = (req.params.code || req.query.code) as string;
        const booking = await bookingsService.getBookingByCode(code);

        // Calculate days remaining
        const now = new Date();
        const daysUntilPickup = Math.ceil((booking.pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilDropoff = Math.ceil((booking.dropoffDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.ceil((booking.dropoffDate.getTime() - booking.pickupDate.getTime()) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            data: {
                booking,
                summary: {
                    totalDays,
                    daysUntilPickup: daysUntilPickup > 0 ? daysUntilPickup : 0,
                    daysUntilDropoff: daysUntilDropoff > 0 ? daysUntilDropoff : 0,
                    canExtend: booking.status === 'RESERVED' || booking.status === 'ACTIVE',
                    isExtended: !!booking.originalDropoffDate,
                    isPaid: booking.paymentStatus === 'PAID',
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

// PUBLIC - Extend booking
export async function extendBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const code = req.params.code as string;
        const result = await bookingsService.extendBooking(code, req.body as ExtendBookingInput);

        res.json({
            success: true,
            message: 'Rezervasyonunuz uzatıldı!',
            data: {
                booking: result,
                additionalPrice: result.additionalPrice,
                message: `Ek ödeme tutarı: ${result.additionalPrice} TL`,
            },
        });
    } catch (error) {
        next(error);
    }
}

// PUBLIC - Simulate Payment
export async function payBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const code = req.params.code as string;
        // In real world, we'd process amount from booking details 
        // For simulation, we just mark it as paid
        const booking = await bookingsService.getBookingByCode(code);
        const result = await bookingsService.payBooking(code, Number(booking.totalPrice));

        res.json({
            success: true,
            message: 'Ödeme başarıyla alındı!',
            data: {
                paymentRef: result.paymentRef,
                paidAt: result.paidAt,
                booking: result,
            }
        });
    } catch (error) {
        next(error);
    }
}

// PUBLIC - Check car availability
export async function getAvailability(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const availability = await bookingsService.getAvailability(
            req.params.id!,
            req.query as unknown as AvailabilityQueryInput
        );
        res.json({
            success: true,
            data: availability,
        });
    } catch (error) {
        next(error);
    }
}

// PUBLIC - Lookup booking by phone
export async function lookupBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const phone = req.query.phone as string;
        const result = await bookingsService.lookupBookingsByPhone(phone);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

// ADMIN - Cancel booking
export async function cancelBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const booking = await bookingsService.cancelBooking(req.params.id!);
        res.json({
            success: true,
            message: 'Rezervasyon iptal edildi',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
}

// ADMIN - Start booking
export async function startBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const booking = await bookingsService.startBooking(req.params.id!);
        res.json({
            success: true,
            message: 'Rezervasyon başlatıldı. Araç teslim edildi.',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
}

// ADMIN - Create Manual Booking
export async function createManualBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const booking = await bookingsService.createManualBooking(req.body);
        res.status(201).json({
            success: true,
            message: 'Manual rezervasyon oluşturuldu.',
            data: booking,
        });
    } catch (error) {
        console.error('Manual Booking Error:', error);
        next(error);
    }
}

// ADMIN - Complete booking
export async function completeBooking(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const booking = await bookingsService.completeBooking(req.params.id!);
        res.json({
            success: true,
            message: 'Rezervasyon tamamlandı. Araç teslim alındı ve lokasyonu güncellendi.',
            data: booking,
        });
    } catch (error) {
        next(error);
    }
}

// ADMIN - List all bookings
export async function getAdminBookings(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await bookingsService.getAdminBookings(req.query as unknown as BookingQueryInput);
        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
}
