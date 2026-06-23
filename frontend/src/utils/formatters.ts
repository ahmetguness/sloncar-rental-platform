/**
 * Formats a raw 10-digit numeric string into (5XX) XXX XX XX format.
 * @param value The raw digits (up to 10)
 * @returns Formatted phone string
 */
export const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    if (phoneNumberLength < 9) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8, 10)}`;
};

/**
 * Cleans a phone number by removing non-digits and limiting to 10 characters.
 * Useful for onChange handlers before passing to formatPhoneNumber.
 */
export const cleanPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    return cleaned.slice(0, 10);
};

/**
 * Normalizes email by converting Turkish characters to their Latin equivalents 
 * and converting to lowercase.
 */
export const normalizeEmail = (email: string): string => {
    const turkishChars: { [key: string]: string } = {
        'ı': 'i', 'İ': 'i',
        'ş': 's', 'Ş': 's',
        'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u',
        'ö': 'o', 'Ö': 'o',
        'ç': 'c', 'Ç': 'c'
    };

    return email.replace(/[ıİşŞğĞüÜöÖçÇ]/g, match => turkishChars[match]).toLowerCase();
};

/**
 * Formats a date string or Date object to DD/MM/YYYY (Turkish date format).
 * Returns '-' if the value is falsy or invalid.
 */
export const formatDateTR = (value: string | Date | null | undefined): string => {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Formats a YYYY-MM-DD string to DD/MM/YYYY for display in text inputs.
 * Also handles partial input (raw digits) during typing.
 * Returns empty string if no value.
 */
export const isoToDisplayDate = (iso: string): string => {
    if (!iso) return '';
    // Full ISO date (YYYY-MM-DD)
    const parts = iso.split('-');
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // Partial input during typing - apply mask to show DD/MM/YYYY format
    return maskDateInput(iso);
};

/**
 * Parses a DD/MM/YYYY user input string into YYYY-MM-DD for API storage.
 * Handles partial input during typing. Returns the raw input if not fully parseable.
 */
export const displayDateToISO = (display: string): string => {
    const cleaned = display.replace(/[^0-9/]/g, '');
    const parts = cleaned.split('/');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return cleaned;
};

/**
 * Applies DD/MM/YYYY mask to raw date input during typing.
 * Auto-inserts slashes after day and month.
 */
export const maskDateInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};
