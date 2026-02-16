import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
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
