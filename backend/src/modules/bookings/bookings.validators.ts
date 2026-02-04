import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

const bookingStatusEnum = z.nativeEnum(BookingStatus);

// Customer booking schema - no auth required
export const createBookingSchema = z.object({
    carId: z.string().uuid('Geçersiz araç ID'),
    // Customer Information
    customerName: z.string().min(2, 'Müşteri adı gerekli'),
    customerSurname: z.string().min(2, 'Müşteri soyadı gerekli'),
    customerPhone: z.string().min(10, 'Telefon numarası gerekli'),
    customerEmail: z.string().email('Geçerli e-posta adresi giriniz'),
    customerTC: z.string().length(11, 'TC kimlik numarası 11 haneli olmalı').optional(),
    customerDriverLicense: z.string().min(5, 'Ehliyet numarası gerekli'),
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

// Lookup by phone
export const lookupBookingSchema = z.object({
    phone: z.string().min(10, 'Telefon numarası gerekli'),
});

// Admin query schema
export const bookingQuerySchema = z.object({
    carId: z.string().uuid().optional(),
    status: bookingStatusEnum.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    customerPhone: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
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
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;
export type LookupBookingInput = z.infer<typeof lookupBookingSchema>;
