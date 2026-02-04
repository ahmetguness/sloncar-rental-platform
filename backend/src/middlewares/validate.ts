import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = req[target];
            const parsed = schema.parse(data);

            // Replace with parsed (and transformed) data
            req[target] = parsed;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
                return;
            }
            next(error);
        }
    };
}

// Helper for validating multiple targets at once
export function validateMultiple(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}
