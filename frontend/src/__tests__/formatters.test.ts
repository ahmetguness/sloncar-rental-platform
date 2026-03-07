import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, cleanPhoneNumber, normalizeEmail } from '../utils/formatters';

describe('formatters', () => {
    describe('formatPhoneNumber', () => {
        it('should format a 10-digit number correctly', () => {
            expect(formatPhoneNumber('5321234567')).toBe('(532) 123 45 67');
        });

        it('should format shorter numbers partialy', () => {
            expect(formatPhoneNumber('532')).toBe('532');
            expect(formatPhoneNumber('5321')).toBe('(532) 1');
            expect(formatPhoneNumber('5321234')).toBe('(532) 123 4');
        });

        it('should ignore non-digit characters', () => {
            expect(formatPhoneNumber('532-123-45-67')).toBe('(532) 123 45 67');
        });
    });

    describe('cleanPhoneNumber', () => {
        it('should remove non-digit characters', () => {
            expect(cleanPhoneNumber('(532) 123-4567')).toBe('5321234567');
        });

        it('should limit to 10 digits', () => {
            expect(cleanPhoneNumber('532123456789')).toBe('5321234567');
        });
    });

    describe('normalizeEmail', () => {
        it('should convert Turkish characters to Latin equivalents', () => {
            expect(normalizeEmail('çığşüöİ@domain.com')).toBe('cigsuoi@domain.com');
        });

        it('should convert to lowercase', () => {
            expect(normalizeEmail('USER@DOMAIN.COM')).toBe('user@domain.com');
        });

        it('should handle mixed cases and Turkish characters', () => {
            expect(normalizeEmail('Ahmet.Güneş@Örnek.com')).toBe('ahmet.gunes@ornek.com');
        });
    });
});
