import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Logger } from '../lib/logger.js';
import { ApiResponse } from '../lib/api-response.js';

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
        const details = err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        Logger.warn(`Validation Error: ${JSON.stringify(details)}`);

        ApiResponse.error(res, 'Invalid request data', 'VALIDATION_ERROR', 400, details);
        return;
    }

    // Handle known API errors
    if (err instanceof ApiError) {
        Logger.warn(`API Error [${err.code}]: ${err.message}`);
        ApiResponse.error(res, err.message, err.code, err.statusCode, err.details);
        return;
    }

    // Log unknown errors
    Logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });

    // Handle unknown errors
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    ApiResponse.error(res, message, 'INTERNAL_ERROR', 500);
}
