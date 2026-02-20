import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from './errorHandler.js';

export function adminGuard(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        next(ApiError.unauthorized('Authentication required'));
        return;
    }

    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.STAFF) {
        next(ApiError.forbidden('Admin or Staff access required'));
        return;
    }

    next();
}

/**
 * Super Admin Guard - Only allows users with ADMIN role
 * Used for sensitive operations like user management and role updates
 */
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
        next(ApiError.forbidden('Admin access required (Super Admin)'));
        return;
    }

    next();
}

