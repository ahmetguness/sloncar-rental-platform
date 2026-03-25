import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { auditService } from '../audit/audit.service.js';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, VerifyEmailInput, ResendVerificationInput } from './auth.validators.js';


export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.register(req.body as RegisterInput);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.login(req.body as LoginInput);

        // Log login action
        auditService.logAction(
            result.user.id,
            'LOGIN',
            { email: result.user.email, role: result.user.role },
            req
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await authService.getProfile(req.user!.userId);
        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await authService.updateProfile(req.user!.userId, req.body);
        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
}

export async function forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.forgotPassword(req.body as ForgotPasswordInput);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.resetPassword(req.body as ResetPasswordInput);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.verifyEmail((req.body as VerifyEmailInput).token);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function resendVerification(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.resendVerification((req.body as ResendVerificationInput).email);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

