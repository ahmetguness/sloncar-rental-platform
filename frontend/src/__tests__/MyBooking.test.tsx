import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyBooking } from '../pages/MyBooking';
import { BrowserRouter } from 'react-router-dom';
import { bookingService } from '../services/api';
import userEvent from '@testing-library/user-event';

// Mock the API service
vi.mock('../services/api', () => ({
    bookingService: {
        getByCode: vi.fn(),
        pay: vi.fn()
    }
}));

const mockBooking = {
    bookingCode: 'ABC123',
    customerName: 'Ahmet',
    customerSurname: 'Güneş',
    customerPhone: '5551234567',
    customerTC: '12345678901',
    status: 'RESERVED',
    paymentStatus: 'PENDING',
    totalPrice: 1500,
    pickupDate: '2026-04-01T10:00:00Z',
    dropoffDate: '2026-04-03T10:00:00Z',
    createdAt: '2026-03-01T10:00:00Z',
    expiresAt: '2026-03-01T10:10:00Z',
    car: {
        brand: 'Renault',
        model: 'Clio',
        brandLogo: 'logo.png',
        images: ['clio.jpg'],
        year: 2022,
        fuel: 'DIESEL',
        transmission: 'MANUAL',
        color: 'White',
        plateNumber: '34ABC123'
    }
};

describe('MyBooking Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders search input initially', () => {
        render(
            <BrowserRouter>
                <MyBooking />
            </BrowserRouter>
        );
        expect(screen.getByPlaceholderText(/Rezervasyon Kodu/i)).toBeDefined();
    });

    it('fetches and displays booking on search', async () => {
        (bookingService.getByCode as any).mockResolvedValue({ booking: mockBooking });
        render(
            <BrowserRouter>
                <MyBooking />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Rezervasyon Kodu/i);
        const button = screen.getByText('SORGULA');

        await userEvent.type(input, 'ABC123');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('ABC123')).toBeDefined();
            expect(screen.getByText(/Renault/i)).toBeDefined();
            expect(screen.getByText(/Clio/i)).toBeDefined();
        });
    });

    it('shows error message if booking not found', async () => {
        (bookingService.getByCode as any).mockRejectedValue({
            response: { data: { error: { message: 'Rezervasyon bulunamadı' } } }
        });

        render(
            <BrowserRouter>
                <MyBooking />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Rezervasyon Kodu/i);
        const button = screen.getByText('SORGULA');

        await userEvent.type(input, 'INVALID');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/Rezervasyon bulunamadı/i)).toBeDefined();
        });
    });
});
