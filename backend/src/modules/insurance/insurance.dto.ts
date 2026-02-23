import { z } from 'zod';
import { InsuranceBranch } from '@prisma/client';

export const createInsuranceSchema = z.object({
    month: z.string().min(1, 'Ay girilmesi zorunludur'),
    startDate: z.string().datetime().or(z.date()),
    tcNo: z.string().min(11).max(11, 'TC 11 haneli olmalıdır'),
    fullName: z.string().min(1, 'İsim Soyisim zorunludur'),
    profession: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    plate: z.string().optional().nullable(),
    serialOrOrderNo: z.string().optional().nullable(),
    amount: z.number().or(z.string().transform(Number)),
    branch: z.nativeEnum(InsuranceBranch),
    company: z.string().min(1, 'Şirket adı zorunludur'),
    policyNo: z.string().min(1, 'Poliçe No zorunludur'),
    description: z.string().optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
});

export const updateInsuranceSchema = createInsuranceSchema.partial();
