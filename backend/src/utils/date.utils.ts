/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
}

/**
 * Generate array of dates between two dates
 */
export function getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

/**
 * Helper to normalize date to UTC midnight (00:00:00)
 */
export function normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
}

/**
 * Calculate total price based on car daily rate and days
 */
export function calculateTotalPrice(dailyPrice: number, pickupDate: Date, dropoffDate: Date): number {
    // Ensure we calculate based on normalized days (24h chunks)
    const days = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    return days * dailyPrice;
}

/**
 * Calculate days between two dates
 */
export function calculateDays(start: Date, end: Date): number {
    const s = normalizeDate(start);
    const e = normalizeDate(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}
