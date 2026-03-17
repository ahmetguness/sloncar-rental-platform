/**
 * Cloudinary URL optimization utility.
 * Transforms Cloudinary URLs to serve optimized images with:
 * - Responsive sizing (thumbnail, card, detail, full)
 * - Auto format (WebP/AVIF based on browser)
 * - Auto quality compression
 * - Aggressive caching via immutable URLs
 */

type ImageSize = 'thumbnail' | 'card' | 'detail' | 'full';

const SIZE_CONFIG: Record<ImageSize, { width: number; height?: number; crop?: string }> = {
    thumbnail: { width: 200, height: 150, crop: 'fill' },
    card: { width: 640, height: 400, crop: 'fill' },
    detail: { width: 1280 },
    full: { width: 1920 },
};

/**
 * Transforms a Cloudinary URL to serve an optimized version.
 * If the URL is not a Cloudinary URL, returns it unchanged.
 */
export function optimizeCloudinaryUrl(url: string, size: ImageSize = 'card'): string {
    if (!url || !url.includes('res.cloudinary.com')) return url;

    const config = SIZE_CONFIG[size];

    // Build transformation string
    const parts: string[] = [
        `w_${config.width}`,
        config.height ? `h_${config.height}` : '',
        config.crop ? `c_${config.crop}` : 'c_limit',
        'f_auto',
        'q_auto',
    ].filter(Boolean);

    const transformation = parts.join(',');

    // Cloudinary URL pattern: .../upload/v1234/folder/image.jpg
    // Insert transformation after /upload/
    return url.replace(
        /\/upload\/(v\d+\/)/,
        `/upload/${transformation}/$1`
    );
}
