import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: unknown;
}

export class ApiError extends Error implements AppError {
    statusCode: number;
    code: string;
    details?: unknown;

    constructor(statusCode: number, code: string, message: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }

    static badRequest(message: string, details?: unknown): ApiError {
        return new ApiError(400, 'BAD_REQUEST', message, details);
    }

    static unauthorized(message = 'Unauthorized'): ApiError {
        return new ApiError(401, 'UNAUTHORIZED', message);
    }

    static forbidden(message = 'Forbidden'): ApiError {
        return new ApiError(403, 'FORBIDDEN', message);
    }

    static notFound(message = 'Resource not found'): ApiError {
        return new ApiError(404, 'NOT_FOUND', message);
    }

    static conflict(message: string, details?: unknown): ApiError {
        return new ApiError(409, 'CONFLICT', message, details);
    }

    static internal(message = 'Internal server error'): ApiError {
        return new ApiError(500, 'INTERNAL_ERROR', message);
    }
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
        return;
    }

    // Handle known API errors
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
        return;
    }

    // Log unknown errors
    console.error('Unhandled error:', err);

    // Handle unknown errors
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
        },
    });
}
