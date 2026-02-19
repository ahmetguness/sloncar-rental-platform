import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

const bookingStatusEnum = z.nativeEnum(BookingStatus);

// Base schema object to allow extension
const baseBookingSchemaObject = z.object({
    carId: z.string().uuid('Geçersiz araç ID'),
    // Customer Information
    customerName: z.string().min(2, 'Müşteri adı gerekli'),
    customerSurname: z.string().min(2, 'Müşteri soyadı gerekli'),
    customerPhone: z.string().min(7, 'Telefon numarası gerekli'),
    customerEmail: z.string().min(3, 'Geçerli e-posta adresi giriniz'),
    customerTC: z.string().length(11, 'TC kimlik numarası 11 haneli olmalı').optional(),
    customerDriverLicense: z.string().min(5, 'Ehliyet numarası gerekli').optional(),
    // Booking Details
    pickupDate: z.coerce.date().refine(
        (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
        'Alış tarihi bugün veya ilerisi olmalı'
    ),
    dropoffDate: z.coerce.date(),
    pickupBranchId: z.string().uuid('Geçersiz alış şubesi'),
    dropoffBranchId: z.string().uuid('Geçersiz teslim şubesi'),
    // Optional
    notes: z.string().max(500).optional(),
});

// Customer booking schema - no auth required
export const createBookingSchema = baseBookingSchemaObject.refine(
    (data) => data.dropoffDate > data.pickupDate,
    { message: 'Teslim tarihi alış tarihinden sonra olmalı', path: ['dropoffDate'] }
);

// Admin manual booking schema
export const createManualBookingSchema = baseBookingSchemaObject.extend({
    // Add payment info
    paymentMethod: z.enum(['CASH', 'POS']),
    paymentRef: z.string().optional(),
    isActive: z.boolean().default(true), // Direct to ACTIVE or RESERVED status
}).refine(
    (data) => data.dropoffDate > data.pickupDate,
    { message: 'Teslim tarihi alış tarihinden sonra olmalı', path: ['dropoffDate'] }
);

// Lookup booking by code
export const bookingCodeSchema = z.object({
    code: z.string().min(8, 'Geçersiz rezervasyon kodu').max(12),
});

// Extend booking
export const extendBookingSchema = z.object({
    newDropoffDate: z.coerce.date(),
}).refine(
    (data) => data.newDropoffDate > new Date(),
    { message: 'Yeni teslim tarihi gelecekte olmalı', path: ['newDropoffDate'] }
);

// Payment schema
export const payBookingSchema = z.object({
    // In a real app we'd need card info, for now we just simulate it
    cardNumber: z.string().min(16, 'Geçersiz kart numarası').optional(),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'AA/YY formatında olmalı').optional(),
    cvv: z.string().min(3).max(4).optional(),
});

// Update booking dates
export const updateBookingDatesSchema = z.object({
    pickupDate: z.coerce.date(),
    dropoffDate: z.coerce.date(),
}).refine(
    (data) => data.dropoffDate > data.pickupDate,
    { message: 'Teslim tarihi alış tarihinden sonra olmalı', path: ['dropoffDate'] }
);

// Lookup by phone
export const lookupBookingSchema = z.object({
    phone: z.string().min(7, 'Telefon numarası gerekli'),
});

// Admin query schema
export const bookingQuerySchema = z.object({
    carId: z.string().uuid().optional(),
    status: bookingStatusEnum.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    customerPhone: z.string().optional(),
    search: z.string().optional(), // Search by customer name
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    offset: z.coerce.number().int().min(0).optional(), // Alternative to page
});

// Car availability
export const availabilityQuerySchema = z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
}).refine(
    (data) => data.to > data.from,
    { message: 'Bitiş tarihi başlangıç tarihinden sonra olmalı', path: ['to'] }
);

// Param schemas
export const bookingIdParamSchema = z.object({
    id: z.string().uuid('Geçersiz rezervasyon ID'),
});

export const carIdParamSchema = z.object({
    id: z.string().uuid('Geçersiz araç ID'),
});

export const bookingCodeParamSchema = z.object({
    code: z.string().min(8).max(12),
});

// Types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateManualBookingInput = z.infer<typeof createManualBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;
export type PayBookingInput = z.infer<typeof payBookingSchema>;
export type LookupBookingInput = z.infer<typeof lookupBookingSchema>;
export type UpdateBookingDatesInput = z.infer<typeof updateBookingDatesSchema>;
