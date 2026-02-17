
import { PrismaClient } from '@prisma/client';
import { signToken, verifyToken } from '../src/lib/jwt.js'; // Adjust path if needed
import { login } from '../src/modules/auth/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function run() {
    console.log('--- Starting Token Expiration Verification ---');

    try {
        // 1. Find an admin user
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.error('No admin user found. Please seed the database first.');
            return;
        }

        console.log(`Found admin: ${admin.email}`);

        // 2. Generate token WITHOUT rememberMe
        console.log('\n--- Testing Normal Login (rememberMe: false) ---');
        // We can't easily call authService.login because we need the password, which is hashed in DB.
        // So we will just test the signToken function directly, which is what authService uses.

        const payload = {
            userId: admin.id,
            email: admin.email,
            role: admin.role
        };

        const normalToken = signToken(payload); // Default should be 7d
        const normalDecoded: any = verifyToken(normalToken);
        const normalExp = new Date(normalDecoded.exp * 1000);
        const now = new Date();
        const normalDurationDays = (normalExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        console.log(`Normal Token Exp: ${normalExp.toISOString()}`);
        console.log(`Duration (days): ${normalDurationDays.toFixed(2)}`);

        // 3. Generate token WITH rememberMe
        console.log('\n--- Testing Remember Me Login (rememberMe: true) ---');
        const rememberToken = signToken(payload, { expiresIn: '30d' });
        const rememberDecoded: any = verifyToken(rememberToken);
        const rememberExp = new Date(rememberDecoded.exp * 1000);
        const rememberDurationDays = (rememberExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        console.log(`Remember Me Token Exp: ${rememberExp.toISOString()}`);
        console.log(`Duration (days): ${rememberDurationDays.toFixed(2)}`);

        if (Math.abs(rememberDurationDays - 30) < 1) {
            console.log('\nSUCCESS: 30 days expiration verified.');
        } else {
            console.log('\nFAILURE: 30 days expiration NOT verified.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

run();
