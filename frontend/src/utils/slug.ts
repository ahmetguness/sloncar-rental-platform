/**
 * Turkish-aware slug generation and car name utilities for SEO URLs.
 * Generates URL-friendly slugs from car brand + model.
 */

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

/** Convert a string to a URL-friendly slug with Turkish character support */
export function toSlug(text: string): string {
  return text
    .split('')
    .map((ch) => TURKISH_CHAR_MAP[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Generate a car slug from brand and model: "mercedes-e-class" */
export function carSlug(brand: string, model: string): string {
  return toSlug(`${brand} ${model}`);
}

/** Generate a full display name: "Mercedes E-Class" */
export function carDisplayName(brand: string, model: string): string {
  return `${brand} ${model}`;
}
