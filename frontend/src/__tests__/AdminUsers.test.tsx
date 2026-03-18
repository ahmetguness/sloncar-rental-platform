import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/test-utils';
import { AdminUsers } from '../pages/AdminUsers';
import { storage } from '../utils/storage';

// Mock assets
vi.mock('../assets/logo/logo.jpg', () => ({ default: 'test-logo' }));

// Mock formatters
vi.mock('../utils/formatters', () => ({
    formatPhoneNumber: (v: string) => v,
    cleanPhoneNumber: (v: string) => v.replace(/\D/g, '').slice(0, 10),
    normalizeEmail: (v: string) => v.toLowerCase(),
}));

// Mock Toast
const mockAddToast = vi.fn();
vi.mock('../components/ui/Toast', () => ({
    useToast: () => ({ addToast: mockAddToast }),
}));

// Mock adminService
const mockGetUsers = vi.fn();
const mockDeleteUser = vi.fn();
const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();
vi.mock('../services/api', () => ({
    adminService: {
        getUsers: (...args: unknown[]) => mockGetUsers(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        updateUser: (...args: unknown[]) => mockUpdateUser(...args),
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

const adminUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
    membershipType: 'INDIVIDUAL',
};

const individualUser = {
    id: 'user-1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@test.com',
    phone: '5321234567',
    role: 'STAFF',
    membershipType: 'INDIVIDUAL',
    createdAt: '2025-01-15T10:00:00Z',
};

const corporateUser = {
    id: 'user-2',
    name: 'Mehmet Demir',
    email: 'mehmet@sirket.com',
    phone: '5329876543',
    role: 'ADMIN',
    membershipType: 'CORPORATE',
    companyName: 'ABC Lojistik A.Ş.',
    taxNumber: '1234567890',
    taxOffice: 'Kadıköy VD',
    companyAddress: 'İstanbul, Kadıköy',
    createdAt: '2025-02-20T10:00:00Z',
};

const mockUsersResponse = {
    success: true,
    data: [individualUser, corporateUser],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

const authenticatedState = {
    auth: {
        user: adminUser,
        token: 'fake-token',
        isAuthenticated: true,
        status: 'idle',
        error: null,
    },
};

describe('AdminUsers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Override storage mock to return admin user (test-utils defaults to null)
        vi.mocked(storage.getUser).mockReturnValue(adminUser);
        vi.mocked(storage.getToken).mockReturnValue('fake-token');
        mockGetUsers.mockResolvedValue(mockUsersResponse);
    });

    it('displays membership type column with Bireysel/Kurumsal badges', async () => {
        render(<AdminUsers />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
        });

        // Column header
        expect(screen.getByText('Üyelik Tipi')).toBeInTheDocument();

        // Bireysel badge for individual user (also appears in filter dropdown, so use getAllByText)
        const bireyselElements = screen.getAllByText('Bireysel');
        // At least one should be the badge (span element with badge styling)
        const bireyselBadge = bireyselElements.find(el => el.tagName === 'SPAN');
        expect(bireyselBadge).toBeTruthy();

        // Kurumsal badge for corporate user
        const kurumsalElements = screen.getAllByText('Kurumsal');
        const kurumsalBadge = kurumsalElements.find(el => el.tagName === 'SPAN');
        expect(kurumsalBadge).toBeTruthy();
    });

    it('displays membership type filter dropdown with correct options', async () => {
        render(<AdminUsers />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
        });

        const filterSelect = screen.getByDisplayValue('Tüm Üyelik Tipleri');
        expect(filterSelect).toBeInTheDocument();

        const options = filterSelect.querySelectorAll('option');
        const optionValues = Array.from(options).map(o => o.getAttribute('value'));
        expect(optionValues).toContain('');
        expect(optionValues).toContain('INDIVIDUAL');
        expect(optionValues).toContain('CORPORATE');
    });

    it('calls getUsers with membershipType filter when filter is changed', async () => {
        render(<AdminUsers />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
        });

        mockGetUsers.mockClear();

        // Change filter to CORPORATE
        const filterSelect = screen.getByDisplayValue('Tüm Üyelik Tipleri');
        fireEvent.change(filterSelect, { target: { value: 'CORPORATE' } });

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalledWith(
                expect.objectContaining({ membershipType: 'CORPORATE' })
            );
        });
    });

    it('calls getUsers with INDIVIDUAL filter when Bireysel is selected', async () => {
        render(<AdminUsers />, { preloadedState: authenticatedState });

        await waitFor(() => {
            expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument();
        });

        mockGetUsers.mockClear();

        // Change filter to INDIVIDUAL
        const filterSelect = screen.getByDisplayValue('Tüm Üyelik Tipleri');
        fireEvent.change(filterSelect, { target: { value: 'INDIVIDUAL' } });

        await waitFor(() => {
            expect(mockGetUsers).toHaveBeenCalledWith(
                expect.objectContaining({ membershipType: 'INDIVIDUAL' })
            );
        });
    });
});
