import { z } from 'zod';
import { Transmission, FuelType, CarCategory, CarStatus, CarType } from '@prisma/client';

// Enums as Zod schemas
const transmissionEnum = z.nativeEnum(Transmission);
const fuelTypeEnum = z.nativeEnum(FuelType);
const carCategoryEnum = z.nativeEnum(CarCategory);
const carStatusEnum = z.nativeEnum(CarStatus);
const carTypeEnum = z.nativeEnum(CarType);

const baseCarSchema = z.object({
    brand: z.string().min(1, 'Brand is required'),
    brandLogo: z.string().optional().or(z.literal('')),
    model: z.string().min(1, 'Model is required'),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    type: carTypeEnum.default('RENTAL'),
    transmission: transmissionEnum,
    fuel: fuelTypeEnum,
    category: carCategoryEnum,
    seats: z.number().int().min(1).max(50),
    doors: z.number().int().min(1).max(10),
    color: z.string().min(1, 'Color is required'),
    plateNumber: z.string().min(1, 'Plate number is required'),
    dailyPrice: z.number().positive('Daily price must be positive').max(99999999.99, 'Price exceeds maximum limit').optional(), // Optional if SALE
    weeklyPrice: z.number().positive().max(99999999.99).optional(),
    salePrice: z.number().positive().max(999999999.99).optional(), // Max ~1 billion
    deposit: z.number().nonnegative().max(99999999.99).optional(),
    mileage: z.number().int().nonnegative(),
    images: z.array(z.string().url()).default([]),
    status: carStatusEnum.default('ACTIVE'),
    isFeatured: z.boolean().default(false),
    description: z.string().optional(),
    branchId: z.string().uuid('Invalid branch ID'),
    // New Detailed Fields
    accidentDescription: z.string().optional(),
    changedParts: z.array(z.string()).default([]),
    paintedParts: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
});

export const createCarSchema = baseCarSchema.refine(data => {
    if (data.type === 'RENTAL' && !data.dailyPrice) {
        return false;
    }
    if (data.type === 'SALE' && !data.salePrice) {
        return false;
    }
    return true;
}, {
    message: "Rental cars require dailyPrice, Sale cars require salePrice",
    path: ["dailyPrice", "salePrice"]
});

export const updateCarSchema = baseCarSchema.partial();

export const carQuerySchema = z.object({
    // Filters
    type: carTypeEnum.optional(),
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
    isFeatured: z.coerce.boolean().optional(),

    // Search
    q: z.string().optional(),

    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),

    // Sorting
    sortBy: z.enum(['dailyPrice', 'salePrice', 'year', 'brand', 'model', 'createdAt', 'isFeatured']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const carIdParamSchema = z.object({
    id: z.string().uuid('Invalid car ID'),
});

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type CarQueryInput = z.infer<typeof carQuerySchema>;
