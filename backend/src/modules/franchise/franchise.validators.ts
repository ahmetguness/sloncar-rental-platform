import { z } from 'zod';
import { FranchiseApplicationStatus } from '@prisma/client';

const statusEnum = z.nativeEnum(FranchiseApplicationStatus);

// Detailed form sections schema
const personalInfoSchema = z.object({
    fullName: z.string().optional(),
    tcNumber: z.string().optional(), // Turkish ID
    birthDate: z.string().optional(),
    birthPlace: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    education: z.string().optional(),
    maritalStatus: z.string().optional(),
}).optional();

const companyInfoSchema = z.object({
    legalName: z.string().optional(),
    tradeRegistryNo: z.string().optional(),
    taxNumber: z.string().optional(),
    taxOffice: z.string().optional(),
    foundedYear: z.number().optional(),
    companyType: z.string().optional(),
    registeredAddress: z.string().optional(),
    website: z.string().optional(),
    currentBusiness: z.string().optional(),
}).optional();

const locationDetailsSchema = z.object({
    proposedAddress: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    squareMeters: z.number().optional(),
    parkingSpaces: z.number().optional(),
    officeSpaces: z.number().optional(),
    nearbyLandmarks: z.string().optional(),
    propertyType: z.enum(['OWNED', 'RENTED', 'PLANNED']).optional(),
    monthlyCost: z.number().optional(),
}).optional();

const financialsSchema = z.object({
    initialCapital: z.number().optional(),
    fundingSource: z.string().optional(),
    currentAnnualRevenue: z.number().optional(),
    bankName: z.string().optional(),
    bankBranch: z.string().optional(),
    bankReferences: z.string().optional(),
    creditScore: z.string().optional(),
    existingDebts: z.string().optional(),
}).optional();

const experienceSchema = z.object({
    yearsInBusiness: z.number().optional(),
    industryExperience: z.string().optional(),
    previousFranchises: z.string().optional(),
    managementExperience: z.string().optional(),
    relevantCertifications: z.string().optional(),
    keyAchievements: z.string().optional(),
}).optional();

const staffPlanSchema = z.object({
    totalStaff: z.number().optional(),
    managers: z.number().optional(),
    salesStaff: z.number().optional(),
    mechanics: z.number().optional(),
    cleaningStaff: z.number().optional(),
    adminStaff: z.number().optional(),
    hiringTimeline: z.string().optional(),
    trainingPlan: z.string().optional(),
}).optional();

const fleetPlanSchema = z.object({
    initialFleetSize: z.number().optional(),
    economyCars: z.number().optional(),
    midrangeCars: z.number().optional(),
    premiumCars: z.number().optional(),
    suvs: z.number().optional(),
    vans: z.number().optional(),
    expansionPlan: z.string().optional(),
    maintenancePartner: z.string().optional(),
}).optional();

const marketingPlanSchema = z.object({
    localStrategy: z.string().optional(),
    initialBudget: z.number().optional(),
    onlinePresence: z.string().optional(),
    partnershipPlans: z.string().optional(),
    targetCustomers: z.string().optional(),
    competitorAnalysis: z.string().optional(),
}).optional();

const referencesSchema = z.array(z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    relationship: z.string().optional(),
})).optional();

const declarationsSchema = z.object({
    acceptsTerms: z.boolean().optional(),
    acceptsPrivacyPolicy: z.boolean().optional(),
    noCriminalRecord: z.boolean().optional(),
    noBankruptcy: z.boolean().optional(),
    informationAccurate: z.boolean().optional(),
    agreedDate: z.string().optional(),
}).optional();

// Details JSONB schema
export const franchiseDetailsSchema = z.object({
    personalInfo: personalInfoSchema,
    companyInfo: companyInfoSchema,
    locationDetails: locationDetailsSchema,
    financials: financialsSchema,
    experience: experienceSchema,
    staffPlan: staffPlanSchema,
    fleetPlan: fleetPlanSchema,
    marketingPlan: marketingPlanSchema,
    references: referencesSchema,
    declarations: declarationsSchema,
    documentUrls: z.array(z.string()).optional(),
    additionalNotes: z.string().optional(),
});

// Create application (draft)
export const createFranchiseSchema = z.object({
    contactName: z.string().min(2, 'Contact name is required'),
    contactEmail: z.string().email('Valid email is required'),
    contactPhone: z.string().min(5, 'Phone number is required'),
    companyName: z.string().optional(),
    city: z.string().optional(),
    details: franchiseDetailsSchema.default({}),
});

// Update application
export const updateFranchiseSchema = z.object({
    contactName: z.string().min(2).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(5).optional(),
    companyName: z.string().optional(),
    city: z.string().optional(),
    details: franchiseDetailsSchema.optional(),
});

// Admin status update
export const updateStatusSchema = z.object({
    status: z.enum(['IN_REVIEW', 'APPROVED', 'REJECTED']),
    adminNote: z.string().optional(),
});

// Query parameters
export const franchiseQuerySchema = z.object({
    status: statusEnum.optional(),
    search: z.string().optional(),
    city: z.string().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

export const franchiseIdParamSchema = z.object({
    id: z.string().uuid('Invalid application ID'),
});

export type CreateFranchiseInput = z.infer<typeof createFranchiseSchema>;
export type UpdateFranchiseInput = z.infer<typeof updateFranchiseSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type FranchiseQueryInput = z.infer<typeof franchiseQuerySchema>;
export type FranchiseDetails = z.infer<typeof franchiseDetailsSchema>;

// Public (no auth) application schema
export const publicFranchiseSchema = z.object({
    contactName: z.string().min(2, 'İsim gereklidir'),
    contactEmail: z.string().email('Geçerli bir e-posta adresi giriniz'),
    contactPhone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
    companyName: z.string().optional(),
    city: z.string().min(2, 'Şehir gereklidir'),
    investmentBudget: z.string().optional(),
    experience: z.string().optional(),
    message: z.string().optional(),
});

export type PublicFranchiseInput = z.infer<typeof publicFranchiseSchema>;
