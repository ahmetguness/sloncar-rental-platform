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
    return value.replace(/\D/g, '').slice(0, 10);
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
