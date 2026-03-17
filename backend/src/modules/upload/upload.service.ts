
import cloudinary from '../../lib/cloudinary.js';
import fs from 'fs';
import { ApiError } from '../../middlewares/errorHandler.js';
import { Logger } from '../../lib/logger.js';

export const uploadImage = async (filePath: string): Promise<string> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'rent-a-car/cars',
            resource_type: 'image',
            transformation: [
                { width: 1920, crop: "limit" },
                { quality: "auto", fetch_format: "auto" }
            ],
            // Pre-generate common sizes to avoid on-the-fly transformations
            eager: [
                { width: 640, height: 400, crop: "fill", quality: "auto", fetch_format: "auto" },
                { width: 200, height: 150, crop: "fill", quality: "auto", fetch_format: "auto" },
            ],
            eager_async: true,
        });

        // Delete local temp file
        fs.unlinkSync(filePath);

        return result.secure_url;
    } catch (error) {
        // Ensure temp file is deleted even on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        Logger.error('Cloudinary Upload Error:', error);
        throw ApiError.internal(`Image upload failed: ${(error as any).message || error}`);
    }
};
