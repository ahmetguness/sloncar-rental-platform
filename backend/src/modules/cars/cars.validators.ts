import { z } from 'zod';
import { Transmission, FuelType, CarCategory, CarStatus } from '@prisma/client';

// Enums as Zod schemas
const transmissionEnum = z.nativeEnum(Transmission);
const fuelTypeEnum = z.nativeEnum(FuelType);
const carCategoryEnum = z.nativeEnum(CarCategory);
const carStatusEnum = z.nativeEnum(CarStatus);

export const createCarSchema = z.object({
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    transmission: transmissionEnum,
    fuel: fuelTypeEnum,
    category: carCategoryEnum,
    seats: z.number().int().min(1).max(50),
    doors: z.number().int().min(1).max(10),
    color: z.string().min(1, 'Color is required'),
    plateNumber: z.string().min(1, 'Plate number is required'),
    dailyPrice: z.number().positive('Daily price must be positive'),
    weeklyPrice: z.number().positive().optional(),
    deposit: z.number().nonnegative().optional(),
    mileage: z.number().int().nonnegative(),
    images: z.array(z.string().url()).default([]),
    status: carStatusEnum.default('ACTIVE'),
    description: z.string().optional(),
    branchId: z.string().uuid('Invalid branch ID'),
});

export const updateCarSchema = createCarSchema.partial();

export const carQuerySchema = z.object({
    // Filters
    brand: z.string().optional(),
    category: carCategoryEnum.optional(),
    transmission: transmissionEnum.optional(),
    fuel: fuelTypeEnum.optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    branch: z.string().uuid().optional(),
    minYear: z.coerce.number().int().optional(),
    maxYear: z.coerce.number().int().optional(),
    seats: z.coerce.number().int().optional(),
    status: carStatusEnum.optional(),
    pickupDate: z.coerce.date().optional(),
    dropoffDate: z.coerce.date().optional(),

    // Search
    q: z.string().optional(),

    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),

    // Sorting
    sortBy: z.enum(['dailyPrice', 'year', 'brand', 'model', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const carIdParamSchema = z.object({
    id: z.string().uuid('Invalid car ID'),
});

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type CarQueryInput = z.infer<typeof carQuerySchema>;
