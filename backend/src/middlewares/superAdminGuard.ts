import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from './errorHandler.js';

export function superAdminGuard(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        next(ApiError.unauthorized('Authentication required'));
        return;
    }

    if (req.user.role !== UserRole.ADMIN) {
        next(ApiError.forbidden('Super Admin access required'));
        return;
    }

    next();
}
