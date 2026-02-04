import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt.js';
import { ApiError } from './errorHandler.js';
import { UserRole } from '@prisma/client';

export function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw ApiError.unauthorized('Invalid token format');
        }

        const payload = verifyToken(token);

        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role as UserRole,
        };

        next();
    } catch (error) {
        if (error instanceof ApiError) {
            next(error);
            return;
        }
        next(ApiError.unauthorized('Invalid or expired token'));
    }
}

// Optional auth - attaches user if token present, but doesn't fail if missing
export function optionalAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (token) {
                const payload = verifyToken(token);
                req.user = {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role as UserRole,
                };
            }
        }

        next();
    } catch {
        // Silently continue without user
        next();
    }
}
