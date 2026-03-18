import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { RegisterInput, LoginInput } from './auth.validators.js';
import { AuthResponse } from './auth.types.js';
import { sendWelcomeToMember, sendNewMemberAlertToAdmin } from '../../lib/mail.js';
import { Logger } from '../../lib/logger.js';

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 12;

export async function register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw ApiError.conflict('Bu e-posta adresi ile kayıtlı kullanıcı var');
    }

    // Kurumsal ise taxNumber benzersizlik kontrolü
    if (input.membershipType === 'CORPORATE') {
        const existingTax = await prisma.user.findUnique({
            where: { taxNumber: input.taxNumber },
        });
        if (existingTax) {
            throw ApiError.conflict('Bu vergi numarası ile kayıtlı bir kurumsal üyelik var');
        }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Ortak ve tipe özgü alanları birleştir
    const userData: Parameters<typeof prisma.user.create>[0]['data'] = {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        membershipType: input.membershipType,
        emailCampaignEnabled: input.emailCampaignEnabled ?? true,
    };

    if (input.membershipType === 'INDIVIDUAL') {
        userData.tcNo = input.tcNo ?? null;
    } else {
        userData.companyName = input.companyName;
        userData.taxNumber = input.taxNumber;
        userData.taxOffice = input.taxOffice ?? null;
        userData.companyAddress = input.companyAddress ?? null;
    }

    // Create user
    const user = await prisma.user.create({ data: userData });

    // Generate token
    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    // Send welcome email to new member (async, non-blocking)
    sendWelcomeToMember({
        email: user.email,
        name: user.name,
        membershipType: user.membershipType,
        companyName: user.companyName,
    }).catch(err => Logger.error('[Auth] Welcome email failed:', err));

    // Notify admins about new member (async, non-blocking)
    prisma.user.findMany({
        where: { role: 'ADMIN', emailEnabled: true },
        select: { email: true },
    }).then(admins => {
        for (const admin of admins) {
            if (admin.email) {
                sendNewMemberAlertToAdmin(admin.email, {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    membershipType: user.membershipType,
                    companyName: user.companyName,
                    taxNumber: user.taxNumber,
                }).catch(err => Logger.error('[Auth] Admin notification email failed:', err));
            }
        }
    }).catch(err => Logger.error('[Auth] Failed to fetch admins for new member notification:', err));

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            membershipType: user.membershipType,
        },
        token,
    };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });


    if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
        throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate token
    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    }, input.rememberMe ? { expiresIn: '30d' } : undefined);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            membershipType: user.membershipType,
        },
        token,
    };
}

export async function getProfile(userId: string): Promise<AuthResponse['user']> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    const base = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        membershipType: user.membershipType,
        whatsappEnabled: user.whatsappEnabled,
        emailEnabled: user.emailEnabled,
        emailBookingEnabled: user.emailBookingEnabled,
        emailInsuranceEnabled: user.emailInsuranceEnabled,
        emailCampaignEnabled: user.emailCampaignEnabled,
    };

    if (user.membershipType === 'CORPORATE') {
        return {
            ...base,
            companyName: user.companyName,
            taxNumber: user.taxNumber,
            taxOffice: user.taxOffice,
            companyAddress: user.companyAddress,
        };
    }

    return { ...base, tcNo: user.tcNo };
}

export async function updateProfile(userId: string, data: {
    name?: string;
    phone?: string;
    tcNo?: string;
    companyName?: string;
    taxOffice?: string;
    companyAddress?: string;
    whatsappEnabled?: boolean;
    emailEnabled?: boolean;
    emailBookingEnabled?: boolean;
    emailInsuranceEnabled?: boolean;
    emailCampaignEnabled?: boolean;
    membershipType?: string;
    taxNumber?: string;
}): Promise<AuthResponse['user']> {
    // Fetch current user to determine membership type
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Build update data — start with notification preferences and common fields
    const updateData: Parameters<typeof prisma.user.update>[0]['data'] = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.whatsappEnabled !== undefined) updateData.whatsappEnabled = data.whatsappEnabled;
    if (data.emailEnabled !== undefined) updateData.emailEnabled = data.emailEnabled;
    if (data.emailBookingEnabled !== undefined) updateData.emailBookingEnabled = data.emailBookingEnabled;
    if (data.emailInsuranceEnabled !== undefined) updateData.emailInsuranceEnabled = data.emailInsuranceEnabled;
    if (data.emailCampaignEnabled !== undefined) updateData.emailCampaignEnabled = data.emailCampaignEnabled;

    // Membership-type-specific fields
    if (currentUser.membershipType === 'INDIVIDUAL') {
        if (data.tcNo !== undefined) updateData.tcNo = data.tcNo;
    } else if (currentUser.membershipType === 'CORPORATE') {
        if (data.companyName !== undefined) updateData.companyName = data.companyName;
        if (data.taxOffice !== undefined) updateData.taxOffice = data.taxOffice;
        if (data.companyAddress !== undefined) updateData.companyAddress = data.companyAddress;
        // taxNumber is read-only — intentionally not included
    }

    // membershipType is immutable — intentionally not included

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    // Return full profile based on membership type
    const base = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        membershipType: user.membershipType,
        whatsappEnabled: user.whatsappEnabled,
        emailEnabled: user.emailEnabled,
        emailBookingEnabled: user.emailBookingEnabled,
        emailInsuranceEnabled: user.emailInsuranceEnabled,
        emailCampaignEnabled: user.emailCampaignEnabled,
    };

    if (user.membershipType === 'CORPORATE') {
        return {
            ...base,
            companyName: user.companyName,
            taxNumber: user.taxNumber,
            taxOffice: user.taxOffice,
            companyAddress: user.companyAddress,
        };
    }

    return { ...base, tcNo: user.tcNo };
}
