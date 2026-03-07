import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../test/test-utils';
import { Home } from '../pages/Home';
import { carService, brandService } from '../services/api';
import { campaignService } from '../services/campaign.service';

// Set global timeout for this file
vi.setConfig({ testTimeout: 60000 });

vi.mock('react-datepicker', () => ({
    default: ({ onChange, placeholderText, name }: any) => (
        <input
            data-testid="datepicker"
            name={name}
            placeholder={placeholderText}
            onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                onChange(date);
            }}
        />
    ),
    registerLocale: vi.fn(),
}));

vi.mock('../services/api', () => ({
    carService: {
        getAll: vi.fn(),
        getUsedBrands: vi.fn(),
        getUsedCategories: vi.fn(),
    },
    brandService: {
        getAllAdmin: vi.fn(),
    },
}));

vi.mock('../services/campaign.service', () => ({
    campaignService: {
        getPublic: vi.fn(),
    },
}));

// Mock CampaignCarousel
vi.mock('../components/CampaignCarousel', () => ({
    CampaignCarousel: () => <div data-testid="campaign-carousel">Campaign Carousel Mock</div>
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Home Page', () => {
    const mockCars = [
        {
            id: '1',
            brand: 'BMW',
            model: 'X5',
            dailyPrice: 1000,
            images: [],
            transmission: 'AUTO',
            fuel: 'DIESEL',
            seats: 5,
            status: 'ACTIVE',
            type: 'RENTAL',
            year: 2023,
            category: 'SUV',
            doors: 4,
            color: 'Black',
            branchId: '1',
            plate: '34ABC123',
            branch: { id: '1', name: 'Manisa' }
        } as any
    ];

    const mockBrands = [
        { id: '1', name: 'BMW', logoUrl: 'bmw.png' }
    ];

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(carService.getAll).mockResolvedValue({
            data: mockCars,
            pagination: { total: 1, totalPages: 1, page: 1, limit: 10 }
        } as any);
        vi.mocked(brandService.getAllAdmin).mockResolvedValue(mockBrands);
        vi.mocked(carService.getUsedBrands).mockResolvedValue([{ name: 'BMW', logoUrl: 'bmw.png' }]);
        vi.mocked(carService.getUsedCategories).mockResolvedValue(['SUV']);
        vi.mocked(campaignService.getPublic).mockResolvedValue([]);
    });

    const waitForConfig = { timeout: 15000 };

    it('renders hero section and car grid', async () => {
        render(<Home />);

        // Wait for cars to load first (confirming component rendered and API resolved)
        await waitFor(() => {
            expect(screen.queryAllByText(/BMW/i).length).toBeGreaterThan(0);
        }, waitForConfig);

        // Then verify some hero elements are present
        const buttons = screen.queryAllByRole('button');
        const hasHeroBtn = buttons.some(btn => /İNCELE/i.test(btn.textContent || ''));
        expect(hasHeroBtn).toBe(true);
    }, 45000);

    it('handles brand filtering', async () => {
        render(<Home />);

        await waitFor(() => {
            expect(screen.queryAllByText(/BMW/i).length).toBeGreaterThan(0);
        }, waitForConfig);

        const brandButtons = await screen.findAllByRole('button', { name: /BMW/i });
        fireEvent.click(brandButtons[0]);

        await waitFor(() => {
            expect(carService.getAll).toHaveBeenCalledWith(expect.objectContaining({
                q: 'BMW'
            }));
        }, waitForConfig);
    }, 45000);

    it('handles category filtering', async () => {
        render(<Home />);

        const select = await screen.findByRole('combobox', {}, waitForConfig);

        await waitFor(() => {
            expect(screen.queryAllByText(/SUV/i).length).toBeGreaterThan(0);
        }, waitForConfig);

        fireEvent.change(select, { target: { name: 'category', value: 'SUV' } });

        const filterButton = screen.getByRole('button', { name: /FİLTRELE/i });
        fireEvent.click(filterButton);

        await waitFor(() => {
            expect(carService.getAll).toHaveBeenCalledWith(expect.objectContaining({
                category: 'SUV'
            }));
        }, waitForConfig);
    }, 45000);

    it('shows empty state when no cars found', async () => {
        vi.mocked(carService.getAll).mockResolvedValueOnce({
            data: [],
            pagination: { total: 0, totalPages: 1, page: 1, limit: 10 }
        } as any);

        render(<Home />);

        await waitFor(() => {
            expect(screen.queryByText(/Sonuç Bulunamadı/i) || screen.queryByText(/bulunamadı/i)).toBeInTheDocument();
        }, waitForConfig);
    }, 45000);
});
