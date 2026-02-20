import { Prisma, BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { CreateBookingInput, BookingQueryInput, AvailabilityQueryInput, ExtendBookingInput, CreateManualBookingInput, UpdateBookingDatesInput } from './bookings.validators.js';
import { BookingWithRelations, AvailabilityResponse, DayAvailability, DateRange } from './bookings.types.js';
import { PaginatedResponse } from '../cars/cars.types.js';
import { notificationService } from '../../lib/notification.js';
import { formatDate, getDateRange, normalizeDate, calculateTotalPrice, calculateDays } from '../../utils/date.utils.js';
import { checkBookingOverlap } from './booking.validation.service.js';

// Generate unique booking code like RNT-ABC123
function generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0,O,1,I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RNT-${code}`;
}

// PUBLIC - Create booking and return booking code
export async function createBooking(
    input: CreateBookingInput
): Promise<BookingWithRelations> {
    const booking = await prisma.$transaction(async (tx) => {
        // Normalize dates to ensure daily granularity (Time is irrelevant for availability)
        // This prevents "10:00-12:00" booking allowing another booking at "14:00-16:00" on same day
        const pickupDate = normalizeDate(input.pickupDate);
        let dropoffDate = normalizeDate(input.dropoffDate);

        // If pickup and dropoff are the same day (or dropoff somehow before due to normalization),
        // Force minimum 1 day duration
        if (dropoffDate.getTime() <= pickupDate.getTime()) {
            const nextDay = new Date(pickupDate);
            nextDay.setDate(nextDay.getDate() + 1);
            dropoffDate = nextDay;
        }

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

        // Validate pickup branch matches car location
        // This prevents booking a car from a branch where it is not physically located
        if (car.branchId !== input.pickupBranchId) {
            throw ApiError.badRequest('Araç seçilen alış şubesinde bulunmamaktadır. Lütfen aracın bulunduğu şubeyi (veya aracı) kontrol ediniz.');
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
        await checkBookingOverlap(tx, input.carId, pickupDate, dropoffDate);

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
        // Use normalized dates for price calculation too
        const totalPrice = calculateTotalPrice(Number(car.dailyPrice), pickupDate, dropoffDate);

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
                pickupDate: pickupDate,
                dropoffDate: dropoffDate,
                pickupBranchId: input.pickupBranchId,
                dropoffBranchId: input.dropoffBranchId,
                totalPrice,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
            },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        return booking;
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Send async Notification
    notificationService.sendBookingConfirmation(booking).catch(err => console.error('Notification failed', err));

    return booking as BookingWithRelations;
}

// ADMIN - Create Manual Booking (Walk-in)
export async function createManualBooking(
    input: CreateManualBookingInput
): Promise<BookingWithRelations> {
    const booking = await prisma.$transaction(async (tx) => {
        const pickupDate = normalizeDate(input.pickupDate);
        let dropoffDate = normalizeDate(input.dropoffDate);

        if (dropoffDate.getTime() <= pickupDate.getTime()) {
            const nextDay = new Date(pickupDate);
            nextDay.setDate(nextDay.getDate() + 1);
            dropoffDate = nextDay;
        }

        const car = await tx.car.findUnique({ where: { id: input.carId } });
        if (!car) throw ApiError.notFound('Araç bulunamadı');
        if (car.status !== 'ACTIVE') throw ApiError.badRequest('Araç kiralamaya uygun değil');

        // Check overlaps
        await checkBookingOverlap(tx, input.carId, pickupDate, dropoffDate);

        let bookingCode = generateBookingCode();
        // Simple loop to ensure uniqueness
        for (let i = 0; i < 5; i++) {
            if (!await tx.booking.findUnique({ where: { bookingCode } })) break;
            bookingCode = generateBookingCode();
        }

        const totalPrice = calculateTotalPrice(Number(car.dailyPrice), pickupDate, dropoffDate);

        // Determine status: If pickup is today (or past) and isActive is true -> ACTIVE
        // Otherwise -> RESERVED (but PAID)
        const today = normalizeDate(new Date());
        let status: BookingStatus = BookingStatus.RESERVED;

        if (input.isActive && pickupDate.getTime() <= today.getTime()) {
            status = BookingStatus.ACTIVE;
        }

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
                notes: input.notes ? `[MANUAL - ${input.paymentMethod}] ${input.notes}` : `[MANUAL - ${input.paymentMethod}]`,
                pickupDate,
                dropoffDate,
                pickupBranchId: input.pickupBranchId,
                dropoffBranchId: input.dropoffBranchId,
                totalPrice,
                status: status,
                paymentStatus: PaymentStatus.PAID,
                paymentProvider: input.paymentMethod,
                paymentRef: input.paymentRef || `MANUAL-${Date.now()}`,
                paidAt: new Date(),
            },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        return booking;
    });

    return booking as BookingWithRelations;
}

// Helper to check and expire booking if needed
async function checkAndExpireBooking(booking: BookingWithRelations): Promise<BookingWithRelations> {
    if (
        booking.status === BookingStatus.RESERVED &&
        booking.paymentStatus === PaymentStatus.UNPAID &&
        booking.expiresAt &&
        new Date() > booking.expiresAt
    ) {
        return await prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CANCELLED },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        }) as BookingWithRelations;
    }
    return booking;
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

    const processedBooking = await checkAndExpireBooking(booking as BookingWithRelations);

    // AGGRESSIVE PII MASKING
    if (processedBooking.customerTC) {
        processedBooking.customerTC = processedBooking.customerTC.replace(/./g, (char, index, str) => index < str.length - 2 ? '*' : char);
    }
    if (processedBooking.customerDriverLicense) {
        processedBooking.customerDriverLicense = '******';
    }

    // Mask personal details
    if (processedBooking.customerName) {
        processedBooking.customerName = processedBooking.customerName.charAt(0) + '***';
    }
    if (processedBooking.customerSurname) {
        processedBooking.customerSurname = processedBooking.customerSurname.charAt(0) + '***';
    }
    if (processedBooking.customerEmail && processedBooking.customerEmail.includes('@')) {
        const parts = processedBooking.customerEmail.split('@');
        const user = parts[0];
        const domain = parts[1];
        if (user && domain) {
            processedBooking.customerEmail = user.charAt(0) + '***@' + domain;
        }
    }

    if (processedBooking.customerPhone) {
        processedBooking.customerPhone = '***' + processedBooking.customerPhone.slice(-4);
    }

    return processedBooking;
}


// PUBLIC - Extend booking (customer self-service)
export async function extendBooking(
    bookingCode: string,
    input: ExtendBookingInput
): Promise<BookingWithRelations & { additionalPrice: number }> {
    const result = await prisma.$transaction(async (tx) => {
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

        // Normalize new dropoff date
        const newDropoffDate = normalizeDate(input.newDropoffDate);

        // New dropoff must be after current dropoff
        // booking.dropoffDate should already be normalized if created with new logic, but safe to compare
        if (newDropoffDate <= booking.dropoffDate) {
            throw ApiError.badRequest('Yeni teslim tarihi mevcut tarihten sonra olmalı');
        }

        // Check for overlapping bookings in the extended period
        // We check from current dropoffDate to newDropoffDate
        await checkBookingOverlap(tx, booking.carId, booking.dropoffDate, newDropoffDate, booking.id);

        // Calculate additional price
        const additionalDays = calculateDays(booking.dropoffDate, newDropoffDate);
        const additionalPrice = additionalDays * Number(booking.car.dailyPrice);
        const newTotalPrice = Number(booking.totalPrice || 0) + additionalPrice;

        // Update booking
        const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
                dropoffDate: newDropoffDate,
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
            updatedBooking,
            additionalPrice,
        };
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Send async Notification
    notificationService.sendExtensionConfirmation(result.updatedBooking, result.additionalPrice).catch(err => console.error('Notification failed', err));

    return { ...result.updatedBooking, additionalPrice: result.additionalPrice } as BookingWithRelations & { additionalPrice: number };
}

// PUBLIC - Simulate Payment
export async function payBooking(
    bookingCode: string,
    amount: number
): Promise<BookingWithRelations> {
    let booking = await prisma.booking.findUnique({
        where: { bookingCode: bookingCode.toUpperCase() },
        include: {
            car: true, // Needed for notification name resolution if required
            pickupBranch: true,
            dropoffBranch: true,
        }
    });

    if (!booking) {
        throw ApiError.notFound('Rezervasyon bulunamadı.');
    }

    // CHECK EXPIRATION
    booking = await checkAndExpireBooking(booking as BookingWithRelations);

    if (booking.status === BookingStatus.CANCELLED) {
        throw ApiError.badRequest('Rezervasyon süresi dolduğu için iptal edilmiştir.');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
        throw ApiError.badRequest('Bu rezervasyon zaten ödenmiş.');
    }



    // Simulate payment processing
    const paymentRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
            paymentStatus: PaymentStatus.PAID,
            paymentProvider: 'SIMULATED_BANK',
            paymentRef: paymentRef,
            paidAt: new Date(),
            adminRead: false, // Reset read status so it shows up as a new notification
        },
        include: {
            car: { include: { branch: true } },
            pickupBranch: true,
            dropoffBranch: true,
        },
    });

    // Send async Notification
    notificationService.sendPaymentReceipt(updatedBooking, amount).catch(err => console.error('Notification failed', err));

    return updatedBooking as BookingWithRelations;
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

    // Pre-compute a Map of date -> booking for O(1) lookups instead of O(N) .find() per day
    const bookedDateMap = new Map<string, typeof bookings[0]>();
    for (const b of bookings) {
        // Skip expired unpaid reservations
        if (b.status === BookingStatus.RESERVED &&
            b.paymentStatus === PaymentStatus.UNPAID &&
            b.expiresAt &&
            new Date() > b.expiresAt) {
            continue;
        }
        // Optimize: Iterate dates without allocating array
        let current = new Date(b.pickupDate);
        const end = new Date(b.dropoffDate);

        while (current <= end) {
            const dateStr = formatDate(current);
            if (dateStr >= formatDate(query.from) && dateStr < formatDate(query.to)) {
                bookedDateMap.set(dateStr, b);
            }
            // Optimization: If current date exceeds query.to, we can stop for this booking
            if (dateStr >= formatDate(query.to)) break;

            current.setDate(current.getDate() + 1);
        }
    }

    const allDates: Date[] = [];
    let d = new Date(query.from);
    while (d <= query.to) {
        allDates.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }

    const calendar: DayAvailability[] = allDates.map((date) => {
        const dateStr = formatDate(date);
        const booking = bookedDateMap.get(dateStr);

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
// PUBLIC - Lookup bookings by phone (for customers) with PII protection
export async function lookupBookingsByPhone(
    phone: string
): Promise<Partial<BookingWithRelations>[]> {
    const bookings = await prisma.booking.findMany({
        where: {
            customerPhone: phone, // EXACT MATCH ONLY
        },
        select: {
            bookingCode: true,
            pickupDate: true,
            dropoffDate: true,
            status: true,
            totalPrice: true,
            paymentStatus: true,
            car: {
                include: { branch: true }
            },
            pickupBranch: true,
            dropoffBranch: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Limit to 5
    });

    return bookings as unknown as Partial<BookingWithRelations>[];
}


// ADMIN - Cancel booking
export async function cancelBooking(
    bookingId: string,
    expectedVersion?: number
): Promise<BookingWithRelations> {
    const updatedBooking = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
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

        // Optimistic Locking
        if (expectedVersion !== undefined) {
            const result = await tx.booking.updateMany({
                where: { id: bookingId, version: expectedVersion },
                data: { status: BookingStatus.CANCELLED, version: { increment: 1 } },
            });

            if (result.count === 0) {
                throw ApiError.conflict(
                    'Bu rezervasyon başka bir kullanıcı tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
                );
            }

            const updated = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    car: true,
                    pickupBranch: true,
                    dropoffBranch: true,
                },
            });
            return updated!;
        }

        // Fallback: no version (backward compatible)
        return await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CANCELLED },
            include: {
                car: true,
                pickupBranch: true,
                dropoffBranch: true,
            },
        });
    });

    return updatedBooking as BookingWithRelations;
}

// ADMIN - Start booking (Car picked up)
export async function startBooking(
    bookingId: string,
    expectedVersion?: number
): Promise<BookingWithRelations> {
    const updatedBooking = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { car: true }
        });

        if (!booking) {
            throw ApiError.notFound('Rezervasyon bulunamadı');
        }

        if (booking.status !== BookingStatus.RESERVED) {
            throw ApiError.badRequest('Sadece rezervasyon durumundaki işlemler başlatılabilir');
        }

        if (booking.paymentStatus !== PaymentStatus.PAID) {
            throw ApiError.badRequest('Ödemesi alınmamış rezervasyon başlatılamaz');
        }

        // Optimistic Locking
        if (expectedVersion !== undefined) {
            const result = await tx.booking.updateMany({
                where: { id: bookingId, version: expectedVersion },
                data: { status: BookingStatus.ACTIVE, version: { increment: 1 } },
            });

            if (result.count === 0) {
                throw ApiError.conflict(
                    'Bu rezervasyon başka bir kullanıcı tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
                );
            }

            const updated = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    car: { include: { branch: true } },
                    pickupBranch: true,
                    dropoffBranch: true,
                },
            });
            return updated!;
        }

        // Fallback: no version
        return await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.ACTIVE },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });
    });

    return updatedBooking as BookingWithRelations;
}

// ADMIN - Complete booking (Car returned)
export async function completeBooking(
    bookingId: string,
    expectedVersion?: number
): Promise<BookingWithRelations> {
    const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
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

        if (booking.status !== BookingStatus.ACTIVE) {
            throw ApiError.badRequest('Sadece aktif rezervasyonlar tamamlanabilir');
        }

        // Optimistic Locking
        if (expectedVersion !== undefined) {
            const result = await tx.booking.updateMany({
                where: { id: bookingId, version: expectedVersion },
                data: { status: BookingStatus.COMPLETED, version: { increment: 1 } },
            });

            if (result.count === 0) {
                throw ApiError.conflict(
                    'Bu rezervasyon başka bir kullanıcı tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
                );
            }

            // Update Car Location and Status
            await tx.car.update({
                where: { id: booking.carId },
                data: {
                    status: 'ACTIVE',
                    branchId: booking.dropoffBranchId,
                    version: { increment: 1 },
                },
            });

            const updated = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    car: { include: { branch: true } },
                    pickupBranch: true,
                    dropoffBranch: true,
                },
            });
            return updated!;
        }

        // Fallback: no version
        // 1. Mark booking as COMPLETED
        const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.COMPLETED },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        // 2. Update Car Location and Status
        await tx.car.update({
            where: { id: booking.carId },
            data: {
                status: 'ACTIVE',
                branchId: booking.dropoffBranchId,
            },
        });

        return updatedBooking;
    });

    return result as BookingWithRelations;
}

// ADMIN - Update booking dates
export async function updateBookingDates(
    bookingId: string,
    input: UpdateBookingDatesInput,
    expectedVersion?: number
): Promise<BookingWithRelations> {
    const booking = await prisma.$transaction(async (tx) => {
        const existingBooking = await tx.booking.findUnique({
            where: { id: bookingId },
            include: { car: true },
        });

        if (!existingBooking) {
            throw ApiError.notFound('Rezervasyon bulunamadı');
        }

        const pickupDate = normalizeDate(input.pickupDate);
        const dropoffDate = normalizeDate(input.dropoffDate);

        // Check availability (excluding current booking)
        await checkBookingOverlap(tx, existingBooking.carId, pickupDate, dropoffDate, bookingId);

        // Calculate new price
        const dailyPrice = Number(existingBooking.car.dailyPrice);
        const totalPrice = calculateTotalPrice(dailyPrice, pickupDate, dropoffDate);

        // Optimistic Locking
        if (expectedVersion !== undefined) {
            const result = await tx.booking.updateMany({
                where: { id: bookingId, version: expectedVersion },
                data: {
                    pickupDate,
                    dropoffDate,
                    totalPrice,
                    notes: existingBooking.notes
                        ? `${existingBooking.notes}\\n[ADMIN UPDATE: Tarihler güncellendi]`
                        : `[ADMIN UPDATE: Tarihler güncellendi]`,
                    version: { increment: 1 },
                },
            });

            if (result.count === 0) {
                throw ApiError.conflict(
                    'Bu rezervasyon başka bir kullanıcı tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
                );
            }

            const updated = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    car: { include: { branch: true } },
                    pickupBranch: true,
                    dropoffBranch: true,
                },
            });
            return updated!;
        }

        // Fallback: no version
        const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
                pickupDate,
                dropoffDate,
                totalPrice,
                notes: existingBooking.notes
                    ? `${existingBooking.notes}\\n[ADMIN UPDATE: Tarihler güncellendi]`
                    : `[ADMIN UPDATE: Tarihler güncellendi]`,
            },
            include: {
                car: { include: { branch: true } },
                pickupBranch: true,
                dropoffBranch: true,
            },
        });

        return updatedBooking;
    });

    return booking as BookingWithRelations;
}

// ADMIN - Get all bookings with filters
export async function getAdminBookings(
    query: BookingQueryInput
): Promise<PaginatedResponse<BookingWithRelations>> {
    const { carId, status, fromDate, toDate, customerPhone, search, page, limit, offset } = query;

    const where: Prisma.BookingWhereInput = {};

    if (carId) where.carId = carId;
    if (status) where.status = status;
    if (customerPhone) where.customerPhone = { contains: customerPhone };
    if (fromDate) where.pickupDate = { gte: fromDate };
    if (toDate) where.dropoffDate = { lte: toDate };

    // Search by customer name (first or last name)
    if (search) {
        // Check if search term is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);

        if (isUUID) {
            where.id = search;
        } else {
            where.OR = [
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerSurname: { contains: search, mode: 'insensitive' } },
                { bookingCode: { contains: search, mode: 'insensitive' } },
            ];
        }
    }

    // Run count and findMany in parallel since they use the same where clause
    const skip = offset !== undefined ? offset : (page - 1) * limit;

    const [total, bookings] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.findMany({
            where,
            include: {
                car: {
                    select: {
                        id: true,
                        brand: true,
                        brandLogo: true,
                        model: true,
                        plateNumber: true,
                        dailyPrice: true,
                        category: true,
                        images: true,
                    },
                },
                pickupBranch: true,
                dropoffBranch: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
    ]);

    return {
        data: bookings as BookingWithRelations[],
        pagination: {
            page: offset !== undefined ? Math.floor(offset / limit) + 1 : page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// SYSTEM - Cancel expired unpaid bookings
export async function cancelExpiredBookings() {
    const expiredBookings = await prisma.booking.updateMany({
        where: {
            status: BookingStatus.RESERVED,
            paymentStatus: PaymentStatus.UNPAID,
            expiresAt: {
                lt: new Date()
            }
        },
        data: {
            status: BookingStatus.CANCELLED
        }
    });

    if (expiredBookings.count > 0) {
        console.log(`[CRON] Cancelled ${expiredBookings.count} expired unpaid bookings.`);
    }

    return expiredBookings.count;
}
