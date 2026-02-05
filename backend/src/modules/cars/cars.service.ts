import { Prisma, BookingStatus } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { CreateCarInput, UpdateCarInput, CarQueryInput } from './cars.validators.js';
import { CarWithBranch, PaginatedResponse } from './cars.types.js';

export async function listCars(query: CarQueryInput): Promise<PaginatedResponse<CarWithBranch>> {
    const {
        brand, category, transmission, fuel,
        minPrice, maxPrice, branch, minYear, maxYear, seats, status,
        q, page, limit, sortBy, sortOrder
    } = query;

    // Build where clause
    const where: Prisma.CarWhereInput = {};

    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (category) where.category = category;
    if (transmission) where.transmission = transmission;
    if (fuel) where.fuel = fuel;
    if (status) where.status = status;
    if (branch) where.branchId = branch;
    if (seats) where.seats = { gte: seats };

    if (minPrice || maxPrice) {
        where.dailyPrice = {};
        if (minPrice) where.dailyPrice.gte = minPrice;
        if (maxPrice) where.dailyPrice.lte = maxPrice;
    }

    if (minYear || maxYear) {
        where.year = {};
        if (minYear) where.year.gte = minYear;
        if (maxYear) where.year.lte = maxYear;
    }

    // Search query (brand or model)
    // Search query (brand or model)
    if (q) {
        where.OR = [
            { brand: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
        ];
    }

    // Availability Filter
    if (query.pickupDate && query.dropoffDate) {
        where.bookings = {
            none: {
                OR: [
                    {
                        pickupDate: { lte: query.dropoffDate },
                        dropoffDate: { gte: query.pickupDate },
                        status: { in: ['RESERVED', 'ACTIVE'] }
                    }
                ]
            }
        };
    }

    // Count total
    const total = await prisma.car.count({ where });

    // Fetch paginated results
    const cars = await prisma.car.findMany({
        where,
        include: { branch: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
    });

    return {
        data: cars,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getCarById(id: string): Promise<CarWithBranch> {
    const car = await prisma.car.findUnique({
        where: { id },
        include: { branch: true },
    });

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    return car;
}

export async function createCar(input: CreateCarInput): Promise<CarWithBranch> {
    // Verify branch exists
    const branch = await prisma.branch.findUnique({
        where: { id: input.branchId },
    });

    if (!branch) {
        throw ApiError.badRequest('Branch not found');
    }

    // Check for duplicate plate number
    const existingCar = await prisma.car.findUnique({
        where: { plateNumber: input.plateNumber },
    });

    if (existingCar) {
        throw ApiError.conflict('Car with this plate number already exists');
    }

    const car = await prisma.car.create({
        data: input,
        include: { branch: true },
    });

    return car;
}

export async function updateCar(id: string, input: UpdateCarInput): Promise<CarWithBranch> {
    // Verify car exists
    const existingCar = await prisma.car.findUnique({
        where: { id },
    });

    if (!existingCar) {
        throw ApiError.notFound('Car not found');
    }

    // If updating branch, verify it exists
    if (input.branchId) {
        const branch = await prisma.branch.findUnique({
            where: { id: input.branchId },
        });

        if (!branch) {
            throw ApiError.badRequest('Branch not found');
        }
    }

    // If updating plate number, check for duplicates
    if (input.plateNumber && input.plateNumber !== existingCar.plateNumber) {
        const duplicateCar = await prisma.car.findUnique({
            where: { plateNumber: input.plateNumber },
        });

        if (duplicateCar) {
            throw ApiError.conflict('Car with this plate number already exists');
        }
    }

    // Maintenance Safety Check
    if (input.status === 'MAINTENANCE' || input.status === 'INACTIVE') {
        const activeOrFutureBookings = await prisma.booking.findFirst({
            where: {
                carId: id,
                status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
                dropoffDate: { gt: new Date() } // Booking ends in future
            }
        });

        if (activeOrFutureBookings) {
            throw ApiError.conflict('Araçta aktif veya gelecek rezervasyonlar var. Önce bunları iptal etmelisiniz.');
        }
    }

    const car = await prisma.car.update({
        where: { id },
        data: input,
        include: { branch: true },
    });

    return car;
}

export async function deleteCar(id: string): Promise<void> {
    const car = await prisma.car.findUnique({
        where: { id },
    });

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    // Check for ANY history to prevent FK constraint errors
    const hasHistory = await prisma.booking.count({
        where: { carId: id }
    });

    if (hasHistory > 0) {
        // If it has history, we cannot hard delete.
        // Check if there are ACTIVE bookings
        const activeBookings = await prisma.booking.count({
            where: {
                carId: id,
                status: { in: [BookingStatus.RESERVED, BookingStatus.ACTIVE] },
            },
        });

        if (activeBookings > 0) {
            throw ApiError.conflict('Aktif rezervasyonu olan araç silinemez/pasife alınamaz.');
        }

        // Soft Delete
        await prisma.car.update({
            where: { id },
            data: { status: 'INACTIVE' }
        });

        // We implicitly return/succeed, equating "Delete" request to "Archive" action
        return;
    }

    // Only hard delete if NO history exists
    await prisma.car.delete({ where: { id } });
}
