
import { Request, Response, NextFunction } from 'express';
import { uploadImage } from './upload.service.js';
import { ApiError } from '../../middlewares/errorHandler.js';

export async function uploadFile(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.file) {
            throw ApiError.badRequest('No file uploaded');
        }

        const imageUrl = await uploadImage(req.file.path);

        res.json({
            success: true,
            data: {
                url: imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
}
