
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import fs from 'fs';
import { ApiError } from '../../middlewares/errorHandler.js';

// Configuration
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (filePath: string): Promise<string> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'rent-a-car/cars',
            resource_type: 'image',
            transformation: [
                { width: 1200, crop: "limit" }, // Resize if too big
                { quality: "auto", fetch_format: "auto" } // Auto optimize
            ]
        });

        // Delete local temp file
        fs.unlinkSync(filePath);

        return result.secure_url;
    } catch (error) {
        // Ensure temp file is deleted even on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('Cloudinary Upload Error:', error);
        throw ApiError.internal(`Image upload failed: ${(error as any).message || error}`);
    }
};
