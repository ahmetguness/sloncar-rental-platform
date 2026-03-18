import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { Profile } from '../pages/Profile';

// Mock assets
vi.mock('../assets/logo/logo.jpg', () => ({ default: 'test-logo' }));

// Mock formatters
vi.mock('../utils/formatters', () => ({
    formatPhoneNumber: (v: string) => v,
    cleanPhoneNumber: (v: string) => v.replace(/\D/g, '').slice(0, 10),
}));

// Mock adminService
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
vi.mock('../services/api', () => ({
    adminService: {
        getProfile: (...args: unknown[]) => mockGetProfile(...args),
        updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const authenticatedState = {
    auth: {
        user: { id: '1', email: 'test@test.com', name: 'Test', role: 'ADMIN', membershipType: 'INDIVIDUAL' },
        token: 'fake-token',
        isAuthenticated: true,
        status: 'idle',
        error: null,
    },
};

const individualProfile = {
    id: '1',
    email: 'bireysel@test.com',
    name: 'Ahmet Yılmaz',
    role: 'USER',
    phone: '5321234567',
    membershipType: 'INDIVIDUAL' as const,
    tcNo: '12345678901',
    whatsappEnabled: false,
    emailEnabled: true,
    emailBookingEnabled: false,
    emailInsuranceEnabled: false,
};

const corporateProfile = {
    id: '2',
    email: 'kurumsal@test.com',
    name: 'Mehmet Demir',
    role: 'USER',
    phone: '5329876543',
    membershipType: 'CORPORATE' as const,
    companyName: 'ABC Lojistik A.Ş.',
    taxNumber: '1234567890',
    taxOffice: 'Kadıköy VD',
    companyAddress: 'İstanbul, Kadıköy',
    whatsappEnabled: true,
    emailEnabled: true,
    emailBookingEnabled: true,
    emailInsuranceEnabled: true,
};

describe('Profile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner initially', () => {
        mockGetProfile.mockReturnValue(new Promise(() => {})); // never resolves
        render(<Profile />, { preloadedState: authenticatedState });

        // The Loader2 spinner has animate-spin class
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeTruthy();
    });

    it('shows correct fields for individual user', async () => {
        mockGetProfile.mockResolvedValue(individualProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        // Common fields
        expect(screen.getByDisplayValue('Ahmet Yılmaz')).toBeInTheDocument();
        expect(screen.getByDisplayValue('bireysel@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5321234567')).toBeInTheDocument();

        // Individual-specific field
        expect(screen.getByDisplayValue('12345678901')).toBeInTheDocument();
        expect(screen.getByText(/tc kimlik no/i)).toBeInTheDocument();

        // Corporate fields should NOT be present
        expect(screen.queryByText(/şirket adı/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/vergi numarası/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/vergi dairesi/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/şirket adresi/i)).not.toBeInTheDocument();
    });

    it('shows correct fields for corporate user', async () => {
        mockGetProfile.mockResolvedValue(corporateProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        // Common fields
        expect(screen.getByDisplayValue('Mehmet Demir')).toBeInTheDocument();
        expect(screen.getByDisplayValue('kurumsal@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5329876543')).toBeInTheDocument();

        // Corporate-specific fields
        expect(screen.getByDisplayValue('ABC Lojistik A.Ş.')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Kadıköy VD')).toBeInTheDocument();
        expect(screen.getByDisplayValue('İstanbul, Kadıköy')).toBeInTheDocument();

        // Individual-specific field should NOT be present
        expect(screen.queryByText(/tc kimlik no/i)).not.toBeInTheDocument();
    });

    it('shows membership type as read-only badge for individual user', async () => {
        mockGetProfile.mockResolvedValue(individualProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        expect(screen.getByText('Bireysel Üyelik')).toBeInTheDocument();
    });

    it('shows membership type as read-only badge for corporate user', async () => {
        mockGetProfile.mockResolvedValue(corporateProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        expect(screen.getByText('Kurumsal Üyelik')).toBeInTheDocument();
    });

    it('email field is read-only', async () => {
        mockGetProfile.mockResolvedValue(individualProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        const emailInput = screen.getByDisplayValue('bireysel@test.com');
        expect(emailInput).toHaveAttribute('readOnly');
    });

    it('taxNumber field is read-only for corporate user', async () => {
        mockGetProfile.mockResolvedValue(corporateProfile);
        render(<Profile />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Profilim')).toBeInTheDocument();
        });

        const taxInput = screen.getByDisplayValue('1234567890');
        expect(taxInput).toHaveAttribute('readOnly');
    });
});
