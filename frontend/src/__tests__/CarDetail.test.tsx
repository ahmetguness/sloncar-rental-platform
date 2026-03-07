import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CarDetail } from '../pages/CarDetail';
import { BrowserRouter } from 'react-router-dom';
import { carService } from '../services/api';

// Mock the API service
vi.mock('../services/api', () => ({
    carService: {
        getById: vi.fn()
    }
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '1' })
    };
});

const mockCar = {
    id: '1',
    brand: 'BMW',
    model: 'M4',
    year: 2023,
    salePrice: 5000000,
    mileage: 15000,
    fuel: 'GASOLINE',
    transmission: 'AUTO',
    seats: 4,
    images: ['image1.jpg'],
    category: 'LUXURY',
    description: 'Perfect condition',
    accidentDescription: 'No accidents',
    changedParts: [],
    paintedParts: [],
    features: ['Leather Seats', 'Sunroof']
};

describe('CarDetail Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loader initially', () => {
        (carService.getById as any).mockReturnValue(new Promise(() => { })); // Never resolves
        render(
            <BrowserRouter>
                <CarDetail />
            </BrowserRouter>
        );
        expect(screen.getByText(/Araç detayları yükleniyor/i)).toBeDefined();
    });

    it('renders car details after loading', async () => {
        (carService.getById as any).mockResolvedValue(mockCar);
        render(
            <BrowserRouter>
                <CarDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/BMW/i)).toBeDefined();
            expect(screen.getByText(/M4/i)).toBeDefined();
            expect(screen.getByText(/5.000.000/)).toBeDefined();
        });
    });

    it('renders "not found" when car doesn\'t exist', async () => {
        (carService.getById as any).mockResolvedValue(null);
        render(
            <BrowserRouter>
                <CarDetail />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Araç bulunamadı/i)).toBeDefined();
        });
    });
});
