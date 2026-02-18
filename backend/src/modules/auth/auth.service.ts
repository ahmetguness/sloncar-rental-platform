import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { ApiError } from '../../middlewares/errorHandler.js';
import { RegisterInput, LoginInput } from './auth.validators.js';
import { AuthResponse } from './auth.types.js';

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
            phone: input.phone,
        },
    });

    // Generate token
    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
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

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        whatsappEnabled: user.whatsappEnabled
    };
}

export async function updateProfile(userId: string, data: { whatsappEnabled?: boolean }): Promise<AuthResponse['user']> {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            whatsappEnabled: data.whatsappEnabled
        }
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        whatsappEnabled: user.whatsappEnabled
    };
}
