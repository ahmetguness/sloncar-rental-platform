import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { auditService } from '../audit/audit.service.js';
import { RegisterInput, LoginInput } from './auth.validators.js';
import { ApiError } from '../../middlewares/errorHandler.js';

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
        await auditService.logAction(
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
