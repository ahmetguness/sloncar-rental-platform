import { Prisma, BookingStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../../middlewares/errorHandler.js';

type TransactionClient = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Check for overlapping bookings
 */
export async function checkBookingOverlap(
    tx: TransactionClient,
    carId: string,
    pickupDate: Date,
    dropoffDate: Date,
    excludeBookingId?: string
): Promise<void> {
    const where: Prisma.BookingWhereInput = {
        carId: carId,
        status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
        AND: [
            { pickupDate: { lt: dropoffDate } },
            { dropoffDate: { gt: pickupDate } },
        ],
    };

    if (excludeBookingId) {
        where.id = { not: excludeBookingId };
    }

    const conflictingBookings = await tx.booking.findMany({
        where,
    });

    const now = new Date();
    const hasActiveOverlap = conflictingBookings.some(b => {
        // Active bookings always block
        if (b.status === BookingStatus.ACTIVE) return true;

        // Paid bookings always block
        if (b.paymentStatus === PaymentStatus.PAID) return true;

        // Unpaid Reserved bookings block ONLY if NOT expired
        if (b.status === BookingStatus.RESERVED && b.paymentStatus === PaymentStatus.UNPAID) {
            if (b.expiresAt && b.expiresAt < now) {
                return false; // Expired, does not block
            }
        }

        return true; // Default to blocking
    });

    if (hasActiveOverlap) {
        throw ApiError.conflict('Araç seçilen tarihlerde müsait değil');
    }
}
