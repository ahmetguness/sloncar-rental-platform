import { Prisma, BookingStatus } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { CreateBookingInput, BookingQueryInput, AvailabilityQueryInput, ExtendBookingInput } from './bookings.validators.js';
import { BookingWithRelations, AvailabilityResponse, DayAvailability, DateRange } from './bookings.types.js';
import { PaginatedResponse } from '../cars/cars.types.js';

// Generate unique booking code like RNT-ABC123
function generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0,O,1,I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RNT-${code}`;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
}

// Generate array of dates between two dates
function getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// Calculate total price based on car daily rate and days
function calculateTotalPrice(dailyPrice: number, pickupDate: Date, dropoffDate: Date): number {
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    return days * dailyPrice;
}

// Calculate days between two dates
function calculateDays(start: Date, end: Date): number {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// PUBLIC - Create booking and return booking code
export async function createBooking(
    input: CreateBookingInput
): Promise<BookingWithRelations> {
    return prisma.$transaction(async (tx) => {
        // Verify car exists and is active
        const car = await tx.car.findUnique({
            where: { id: input.carId },
        });

        if (!car) {
            throw ApiError.notFound('Araç bulunamadı');
        }

        if (car.status !== 'ACTIVE') {
            throw ApiError.badRequest('Bu araç şu anda kiralamaya uygun değil');
        }

        // Verify branches exist
        const [pickupBranch, dropoffBranch] = await Promise.all([
            tx.branch.findUnique({ where: { id: input.pickupBranchId } }),
            tx.branch.findUnique({ where: { id: input.dropoffBranchId } }),
        ]);

        if (!pickupBranch || !dropoffBranch) {
            throw ApiError.badRequest('Geçersiz şube seçimi');
        }

        // Check for overlapping bookings
        const hasOverlap = await tx.booking.findFirst({
            where: {
                carId: input.carId,
                status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
                AND: [
                    { pickupDate: { lt: input.dropoffDate } },
                    { dropoffDate: { gt: input.pickupDate } },
                ],
            },
        });

        if (hasOverlap) {
            throw ApiError.conflict('Bu araç seçilen tarihlerde müsait değil');
        }

        // Generate unique booking code
        let bookingCode = generateBookingCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await tx.booking.findUnique({ where: { bookingCode } });
            if (!existing) break;
            bookingCode = generateBookingCode();
            attempts++;
        }

        // Calculate total price
        const totalPrice = calculateTotalPrice(Number(car.dailyPrice), input.pickupDate, input.dropoffDate);

        // Create booking
        const booking = await tx.booking.create({
            data: {
                bookingCode,
                carId: input.carId,
                customerName: input.customerName,
                customerSurname: input.customerSurname,
                customerPhone: input.customerPhone,
                customerEmail: input.customerEmail,
                customerTC: input.customerTC,
                customerDriverLicense: input.customerDriverLicense,
                notes: input.notes,
                pickupDate: input.pickupDate,
                dropoffDate: input.dropoffDate,
                pickupBranchId: input.pickupBranchId,
                dropoffBranchId: input.dropoffBranchId,
                totalPrice,
            },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        return booking as BookingWithRelations;
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
}

// PUBLIC - Lookup booking by code (for customers)
export async function getBookingByCode(
    bookingCode: string
): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
        where: { bookingCode: bookingCode.toUpperCase() },
        include: {
            car: { include: { branch: true } },
            pickupBranch: true,
            dropoffBranch: true,
        },
    });

    if (!booking) {
        throw ApiError.notFound('Rezervasyon bulunamadı. Kodu kontrol edin.');
    }

    return booking as BookingWithRelations;
}

// PUBLIC - Extend booking (customer self-service)
export async function extendBooking(
    bookingCode: string,
    input: ExtendBookingInput
): Promise<BookingWithRelations & { additionalPrice: number }> {
    return prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { bookingCode: bookingCode.toUpperCase() },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        if (!booking) {
            throw ApiError.notFound('Rezervasyon bulunamadı');
        }

        // Can only extend active or reserved bookings
        if (booking.status !== BookingStatus.RESERVED && booking.status !== BookingStatus.ACTIVE) {
            throw ApiError.badRequest('Bu rezervasyon uzatılamaz');
        }

        // New dropoff must be after current dropoff
        if (input.newDropoffDate <= booking.dropoffDate) {
            throw ApiError.badRequest('Yeni teslim tarihi mevcut tarihten sonra olmalı');
        }

        // Check for overlapping bookings in the extended period
        const hasOverlap = await tx.booking.findFirst({
            where: {
                carId: booking.carId,
                id: { not: booking.id },
                status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
                AND: [
                    { pickupDate: { lt: input.newDropoffDate } },
                    { dropoffDate: { gt: booking.dropoffDate } },
                ],
            },
        });

        if (hasOverlap) {
            throw ApiError.conflict('Araç uzatmak istediğiniz tarihlerde başka bir rezervasyona sahip');
        }

        // Calculate additional price
        const additionalDays = calculateDays(booking.dropoffDate, input.newDropoffDate);
        const additionalPrice = additionalDays * Number(booking.car.dailyPrice);
        const newTotalPrice = Number(booking.totalPrice || 0) + additionalPrice;

        // Update booking
        const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
                dropoffDate: input.newDropoffDate,
                originalDropoffDate: booking.originalDropoffDate || booking.dropoffDate,
                totalPrice: newTotalPrice,
                notes: booking.notes
                    ? `${booking.notes}\n[Uzatıldı: ${formatDate(booking.dropoffDate)} -> ${formatDate(input.newDropoffDate)}]`
                    : `[Uzatıldı: ${formatDate(booking.dropoffDate)} -> ${formatDate(input.newDropoffDate)}]`,
            },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        return {
            ...updatedBooking,
            additionalPrice,
        } as BookingWithRelations & { additionalPrice: number };
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
}

// PUBLIC - Get car availability calendar
export async function getAvailability(
    carId: string,
    query: AvailabilityQueryInput
): Promise<AvailabilityResponse> {
    const car = await prisma.car.findUnique({
        where: { id: carId },
    });

    if (!car) {
        throw ApiError.notFound('Araç bulunamadı');
    }

    const bookings = await prisma.booking.findMany({
        where: {
            carId,
            status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
            OR: [
                {
                    AND: [
                        { pickupDate: { lte: query.to } },
                        { dropoffDate: { gte: query.from } },
                    ],
                },
            ],
        },
        orderBy: { pickupDate: 'asc' },
    });

    const allDates = getDateRange(query.from, query.to);
    const calendar: DayAvailability[] = allDates.map((date) => {
        const dateStr = formatDate(date);
        const booking = bookings.find((b) => {
            const pickupStr = formatDate(b.pickupDate);
            const dropoffStr = formatDate(b.dropoffDate);
            return dateStr >= pickupStr && dateStr < dropoffStr;
        });

        return {
            date: dateStr,
            status: booking ? 'booked' : 'available',
            bookingId: booking?.id,
        };
    });

    const ranges: DateRange[] = [];
    let currentRange: DateRange | null = null;

    for (const day of calendar) {
        if (!currentRange) {
            currentRange = { from: day.date, to: day.date, status: day.status, bookingId: day.bookingId };
        } else if (currentRange.status === day.status && currentRange.bookingId === day.bookingId) {
            currentRange.to = day.date;
        } else {
            ranges.push(currentRange);
            currentRange = { from: day.date, to: day.date, status: day.status, bookingId: day.bookingId };
        }
    }

    if (currentRange) {
        ranges.push(currentRange);
    }

    return {
        carId,
        from: formatDate(query.from),
        to: formatDate(query.to),
        calendar,
        ranges,
    };
}

// PUBLIC - Lookup bookings by phone (for customers)
export async function lookupBookingsByPhone(
    phone: string
): Promise<BookingWithRelations[]> {
    const bookings = await prisma.booking.findMany({
        where: {
            customerPhone: { contains: phone },
        },
        include: {
            car: { include: { branch: true } },
            pickupBranch: true,
            dropoffBranch: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return bookings as BookingWithRelations[];
}

// ADMIN - Cancel booking
export async function cancelBooking(
    bookingId: string
): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            car: true,
            pickupBranch: true,
            dropoffBranch: true,
        },
    });

    if (!booking) {
        throw ApiError.notFound('Rezervasyon bulunamadı');
    }

    if (booking.status === BookingStatus.CANCELLED) {
        throw ApiError.badRequest('Rezervasyon zaten iptal edilmiş');
    }

    if (booking.status === BookingStatus.COMPLETED) {
        throw ApiError.badRequest('Tamamlanmış rezervasyon iptal edilemez');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
        include: {
            car: true,
            pickupBranch: true,
            dropoffBranch: true,
        },
    });

    return updatedBooking as BookingWithRelations;
}

// ADMIN - Get all bookings with filters
export async function getAdminBookings(
    query: BookingQueryInput
): Promise<PaginatedResponse<BookingWithRelations>> {
    const { carId, status, fromDate, toDate, customerPhone, page, limit } = query;

    const where: Prisma.BookingWhereInput = {};

    if (carId) where.carId = carId;
    if (status) where.status = status;
    if (customerPhone) where.customerPhone = { contains: customerPhone };
    if (fromDate) where.pickupDate = { gte: fromDate };
    if (toDate) where.dropoffDate = { lte: toDate };

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
        where,
        include: {
            car: true,
            pickupBranch: true,
            dropoffBranch: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        data: bookings as BookingWithRelations[],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
