import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validators.js';
import { AuthResponse } from './auth.types.js';
import { sendEmailVerificationEmail, sendAccountActivatedToMember, sendAccountActivatedAlertToAdmin, sendPasswordResetEmail } from '../../lib/mail.js';
import crypto from 'crypto';
import { Logger } from '../../lib/logger.js';

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : 12;

export async function register(input: RegisterInput): Promise<{ message: string }> {
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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Ortak ve tipe özgü alanları birleştir
    const userData: Parameters<typeof prisma.user.create>[0]['data'] = {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        membershipType: input.membershipType,
        emailCampaignEnabled: input.emailCampaignEnabled ?? true,
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: verificationExpires,
    };

    if (input.membershipType === 'INDIVIDUAL') {
        userData.tcNo = input.tcNo ?? null;
    } else {
        userData.companyName = input.companyName;
        userData.taxNumber = input.taxNumber;
        userData.taxOffice = input.taxOffice ?? null;
        userData.companyAddress = input.companyAddress ?? null;
    }

    // Create user (unverified)
    const user = await prisma.user.create({ data: userData });

    // Send verification email (async, non-blocking)
    const frontendUrl = process.env.SITE_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/eposta-dogrula?token=${verificationToken}`;

    sendEmailVerificationEmail(user.email, verificationLink, user.name).catch(err =>
        Logger.error('[Auth] Verification email failed:', err)
    );

    return {
        message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktifleştirin.',
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

    // Check if email is verified (only for regular users, not admin/staff)
    if (!user.isEmailVerified && user.role === 'USER') {
        throw ApiError.forbidden('E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanıza gönderilen doğrulama bağlantısına tıklayın.');
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

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user) {
        throw ApiError.notFound('Bu e-posta adresi sistemimizde kayıtlı değil.');
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Set expiry 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed token and expiry to DB
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expiresAt,
        },
    });

    // Send email with unhashed token
    const frontendUrl = process.env.SITE_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/sifre-sifirla?token=${token}`;

    const userName = user.membershipType === 'CORPORATE' ? user.companyName ?? user.name : user.name;
    
    await sendPasswordResetEmail(user.email, resetLink, userName).catch(err => 
        Logger.error('[Auth] Failed to send password reset email:', err)
    );

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string; user: { role: string; membershipType: string } }> {
    // Hash the incoming token
    const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');

    // Find user with this token and ensure it's not expired
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(input.newPassword, process.env.NODE_ENV === 'test' ? 1 : 12);

    // Update user and clear token fields
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        },
    });

    return { 
        message: 'Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.',
        user: { role: user.role, membershipType: user.membershipType }
    };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { gt: new Date() },
        },
    });

    if (!user) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş doğrulama bağlantısı.');
    }

    if (user.isEmailVerified) {
        return { message: 'E-posta adresiniz zaten doğrulanmış.' };
    }

    // Activate user
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
        },
    });

    // Send account activated email to member (async, non-blocking)
    sendAccountActivatedToMember({
        email: user.email,
        name: user.name,
        membershipType: user.membershipType,
        companyName: user.companyName,
    }).catch(err => Logger.error('[Auth] Account activated email failed:', err));

    // Notify admins about verified member (async, non-blocking)
    prisma.user.findMany({
        where: { role: 'ADMIN', emailEnabled: true },
        select: { email: true },
    }).then(admins => {
        for (const admin of admins) {
            if (admin.email) {
                sendAccountActivatedAlertToAdmin(admin.email, {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    membershipType: user.membershipType,
                    companyName: user.companyName,
                    taxNumber: user.taxNumber,
                }).catch(err => Logger.error('[Auth] Admin verification notification failed:', err));
            }
        }
    }).catch(err => Logger.error('[Auth] Failed to fetch admins for verification notification:', err));

    return { message: 'E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz.' };
}

export async function resendVerification(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Don't reveal if user exists
        return { message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, doğrulama bağlantısı gönderilecektir.' };
    }

    if (user.isEmailVerified) {
        throw ApiError.badRequest('Bu e-posta adresi zaten doğrulanmış.');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: verificationExpires,
        },
    });

    const frontendUrl = process.env.SITE_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/eposta-dogrula?token=${verificationToken}`;

    await sendEmailVerificationEmail(user.email, verificationLink, user.name).catch(err =>
        Logger.error('[Auth] Resend verification email failed:', err)
    );

    return { message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, doğrulama bağlantısı gönderilecektir.' };
}

