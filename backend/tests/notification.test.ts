import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../src/lib/notification.js';
import { whatsAppService } from '../src/lib/whatsapp.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';

// Mock WhatsApp Service
vi.mock('../src/lib/whatsapp.js', () => ({
    whatsAppService: {
        sendTemplateMessage: vi.fn().mockResolvedValue(true),
        sendTextMessage: vi.fn().mockResolvedValue(true),
    }
}));

// Mock Prisma
vi.mock('../src/lib/prisma.js', () => ({
    default: {
        user: {
            findMany: vi.fn(),
        }
    }
}));

// Mock fs
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        default: {
            ...actual.default,
            existsSync: vi.fn().mockReturnValue(true),
            mkdirSync: vi.fn(),
            promises: {
                appendFile: vi.fn().mockResolvedValue(undefined),
            }
        },
        promises: {
            appendFile: vi.fn().mockResolvedValue(undefined),
        }
    };
});

// Explicitly mock fs/promises as well
vi.mock('fs/promises', () => ({
    appendFile: vi.fn().mockResolvedValue(undefined),
}));

describe('Notification Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockBooking = {
        bookingCode: 'RNT-TEST',
        customerName: 'John',
        customerSurname: 'Doe',
        customerEmail: 'john@test.com',
        customerPhone: '905554443322',
        pickupDate: new Date(),
        dropoffDate: new Date(),
        totalPrice: 1000,
        car: { brand: 'BMW', model: 'M3' }
    };

    describe('sendBookingConfirmation', () => {
        it('should log notifications and send WhatsApp messages', async () => {
            (prisma.user.findMany as any).mockResolvedValue([
                { phone: '905551112233', role: 'ADMIN', whatsappEnabled: true }
            ]);

            await notificationService.sendBookingConfirmation(mockBooking);

            // Verify WhatsApp to customer
            expect(whatsAppService.sendTemplateMessage).toHaveBeenCalledWith(
                mockBooking.customerPhone,
                'booking_confirmation',
                'tr',
                expect.any(Array)
            );

            // Verify WhatsApp to admin
            expect(whatsAppService.sendTemplateMessage).toHaveBeenCalledWith(
                '905551112233',
                'new_booking_alert',
                'tr',
                expect.any(Array)
            );

            // Verify file logging was attempted
            expect(fs.promises.appendFile).toHaveBeenCalled();
        });

        it('should fallback to text message if WhatsApp template fails for admin', async () => {
             (prisma.user.findMany as any).mockResolvedValue([
                { phone: '905551112233', role: 'ADMIN', whatsappEnabled: true }
            ]);
            
            // First call fails, second (fallback) succeeds
            (whatsAppService.sendTemplateMessage as any)
                .mockResolvedValueOnce(true) // Customer success
                .mockResolvedValueOnce(false); // Admin template failure

            await notificationService.sendBookingConfirmation(mockBooking);

            expect(whatsAppService.sendTextMessage).toHaveBeenCalledWith(
                '905551112233',
                expect.stringContaining('Yeni Rezervasyon')
            );
        });
    });

    describe('sendPaymentReceipt', () => {
        it('should log payment receipt notification', async () => {
            await notificationService.sendPaymentReceipt(mockBooking, 500);
            expect(fs.promises.appendFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('Ödeme Alındı')
            );
        });
    });

    describe('sendExtensionConfirmation', () => {
        it('should log extension notification', async () => {
            await notificationService.sendExtensionConfirmation(mockBooking, 200);
            expect(fs.promises.appendFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('Süre Uzatma Onayı')
            );
        });
    });
});
