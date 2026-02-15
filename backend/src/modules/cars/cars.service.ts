import { Prisma, BookingStatus } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import cloudinary from '../../lib/cloudinary.js';
import { CreateCarInput, UpdateCarInput, CarQueryInput } from './cars.validators.js';
import { CarWithBranch, PaginatedResponse } from './cars.types.js';

export async function listCars(query: CarQueryInput): Promise<PaginatedResponse<CarWithBranch>> {
    const {
        brand, category, transmission, fuel, type,
        minPrice, maxPrice, branch, minYear, maxYear, seats, status,
        q, page, limit, sortBy, sortOrder
    } = query;

    // Build where clause
    const where: Prisma.CarWhereInput = {};

    if (type) where.type = type;
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (category) where.category = category;
    if (transmission) where.transmission = transmission;
    if (fuel) where.fuel = fuel;

    // Status Filter:
    // If status is explicitly provided, use it.
    // If not provided, DEFAULT to excluding 'INACTIVE' (Soft Deleted) cars.
    // This ensures deleted cars don't show up in public lists or default admin views.
    if (status) {
        where.status = status;
    } else {
        where.status = { not: 'INACTIVE' };
    }

    if (branch) where.branchId = branch;
    if (seats) where.seats = { gte: seats };

    if (minPrice || maxPrice) {
        if (type === 'SALE') {
            where.salePrice = {};
            if (minPrice) where.salePrice.gte = minPrice;
            if (maxPrice) where.salePrice.lte = maxPrice;
        } else {
            // Default to dailyPrice for RENTAL or if type is mixed/undefined
            where.dailyPrice = {};
            if (minPrice) where.dailyPrice.gte = minPrice;
            if (maxPrice) where.dailyPrice.lte = maxPrice;
        }
    }

    if (minYear || maxYear) {
        where.year = {};
        if (minYear) where.year.gte = minYear;
        if (maxYear) where.year.lte = maxYear;
    }

    // Search query (brand or model)
    if (q) {
        where.OR = [
            { brand: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
        ];
    }

    // Availability Filter (Only for RENTALS)
    // If type is explicitly SALE, we skip this availability check (sale cars don't have date-based availability in the same way)
    // If type is RENTAL or undefined (default), we check availability.
    if ((type === 'RENTAL' || !type) && query.pickupDate && query.dropoffDate) {
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
        orderBy: [
            { isFeatured: 'desc' },
            { [sortBy]: sortOrder }
        ],
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

    // Delete images from Cloudinary
    if (car.images && car.images.length > 0) {
        for (const imageUrl of car.images) {
            try {
                // Extract public_id from URL
                // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/image.jpg
                // We need 'folder/image' (without extension)
                const parts = imageUrl.split('/');
                const filenameWithExt = parts[parts.length - 1];
                const folder = parts[parts.length - 2];

                // If the folder is 'upload' or a version number (v1234), it might be in root. 
                // But typically our uploads might be in a specific folder. 
                // A safer regex approach:
                const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
                const match = imageUrl.match(regex);

                if (match && match[1]) {
                    const publicId = match[1];
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`[Cloudinary] Deleted image: ${publicId}`);
                }
            } catch (error) {
                console.error(`[Cloudinary] Failed to delete image ${imageUrl}:`, error);
                // Continue deleting other images and the record even if one image fails
            }
        }
    }

    await prisma.car.delete({ where: { id } });
}
