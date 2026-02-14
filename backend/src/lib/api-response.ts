import { Response } from 'express';

/**
 * Standard API Response Structure
 */
export class ApiResponse<T = any> {
    public success: boolean;
    public message: string;
    public data?: T;
    public meta?: any;
    public error?: {
        code: string;
        details?: any;
    };

    private constructor(success: boolean, message: string, data?: T, meta?: any, error?: any) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.meta = meta;
        this.error = error;
    }

    /**
     * Send a success response
     */
    public static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200, meta?: any): Response {
        return res.status(statusCode).json(new ApiResponse(true, message, data, meta));
    }

    /**
     * Send a created response
     */
    public static created<T>(res: Response, data: T, message: string = 'Created', meta?: any): Response {
        return res.status(201).json(new ApiResponse(true, message, data, meta));
    }

    /**
     * Send an error response
     */
    public static error(res: Response, message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, details?: any): Response {
        return res.status(statusCode).json(new ApiResponse(false, message, undefined, undefined, { code, details }));
    }
}
