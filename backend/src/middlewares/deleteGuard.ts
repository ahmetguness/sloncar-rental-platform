import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from './errorHandler.js';

/**
 * Middleware that prevents STAFF users from performing deletions.
 * Only ADMIN users (previously SUPER_ADMIN and ADMIN) are allowed to delete.
 */
export function deleteGuard(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        next(ApiError.unauthorized('Authentication required'));
        return;
    }

    if (req.user.role === UserRole.STAFF) {
        next(ApiError.forbidden('Deletion is restricted to Administrators only'));
        return;
    }

    next();
}
