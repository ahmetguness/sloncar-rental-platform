import { z } from 'zod';

// Üyelik tipi enum
export const MembershipTypeEnum = z.enum(['INDIVIDUAL', 'CORPORATE']);

// Ortak alanlar
const baseRegisterFields = {
    email: z.string().email('Geçersiz e-posta formatı'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    phone: z.string().min(1, 'Telefon numarası zorunludur'),
    emailCampaignEnabled: z.boolean().optional(),
};

// Bireysel kayıt şeması
const individualRegisterSchema = z.object({
    ...baseRegisterFields,
    membershipType: z.literal('INDIVIDUAL'),
    tcNo: z.string()
        .regex(/^\d{11}$/, 'TC kimlik numarası 11 haneli olmalıdır')
        .optional(),
});

// Kurumsal kayıt şeması
const corporateRegisterSchema = z.object({
    ...baseRegisterFields,
    membershipType: z.literal('CORPORATE'),
    companyName: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır'),
    taxNumber: z.string()
        .regex(/^\d{10}$/, 'Vergi numarası 10 haneli olmalıdır'),
    taxOffice: z.string().optional(),
    companyAddress: z.string().optional(),
});

// Birleşik kayıt şeması (discriminated union)
export const registerSchema = z.discriminatedUnion('membershipType', [
    individualRegisterSchema,
    corporateRegisterSchema,
]);

export const loginSchema = z.object({
    email: z.string().email('Invalid email format').min(3, 'Email too short'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Geçersiz e-posta formatı'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token zorunludur'),
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
