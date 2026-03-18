import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import { Register } from '../pages/Register';

// Mock assets
vi.mock('../assets/logo/logo.jpg', () => ({ default: 'test-logo' }));

// Mock formatters
vi.mock('../utils/formatters', () => ({
    normalizeEmail: (v: string) => v.toLowerCase(),
    formatPhoneNumber: (v: string) => v,
    cleanPhoneNumber: (v: string) => v.replace(/\D/g, '').slice(0, 10),
}));

// Mock authService
const mockRegister = vi.fn();
vi.mock('../services/api', () => ({
    authService: {
        register: (...args: unknown[]) => mockRegister(...args),
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

describe('Register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('defaults to Individual membership type', () => {
        render(<Register />);

        // The "Bireysel" button should have the active style (bg-white)
        const bireyselBtn = screen.getByRole('button', { name: /bireysel/i });
        expect(bireyselBtn.className).toContain('bg-white');

        // TC Kimlik No field should be visible (individual-specific)
        expect(screen.getByText(/tc kimlik no/i)).toBeInTheDocument();

        // Corporate fields should NOT be visible
        expect(screen.queryByText(/şirket adı/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/vergi numarası/i)).not.toBeInTheDocument();
    });

    it('shows correct fields when Individual is selected', () => {
        render(<Register />);

        // Common fields
        expect(screen.getByPlaceholderText('Adınız Soyadınız')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ornek@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('(5XX) XXX XX XX')).toBeInTheDocument();

        // Individual-specific field
        expect(screen.getByPlaceholderText('11 haneli TC kimlik numarası')).toBeInTheDocument();

        // Corporate fields should NOT be present
        expect(screen.queryByPlaceholderText('Şirket adını girin')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('10 haneli vergi numarası')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/vergi dairesi/i)).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/şirket adresi/i)).not.toBeInTheDocument();
    });

    it('shows correct fields when Corporate is selected', () => {
        render(<Register />);

        // Switch to Corporate
        fireEvent.click(screen.getByRole('button', { name: /kurumsal/i }));

        // Common fields still present
        expect(screen.getByPlaceholderText('Adınız Soyadınız')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ornek@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('(5XX) XXX XX XX')).toBeInTheDocument();

        // Corporate-specific fields
        expect(screen.getByPlaceholderText('Şirket adını girin')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('10 haneli vergi numarası')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Vergi dairesi (opsiyonel)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Şirket adresi (opsiyonel)')).toBeInTheDocument();

        // Individual-specific field should NOT be present
        expect(screen.queryByPlaceholderText('11 haneli TC kimlik numarası')).not.toBeInTheDocument();
    });

    it('shows validation errors for empty required fields (Individual)', async () => {
        render(<Register />);

        // Submit empty form
        fireEvent.click(screen.getByRole('button', { name: /kayit ol/i }));

        expect(await screen.findByText('Ad soyad zorunludur')).toBeInTheDocument();
        expect(screen.getByText('E-posta zorunludur')).toBeInTheDocument();
        expect(screen.getByText('Şifre zorunludur')).toBeInTheDocument();

        // authService.register should NOT have been called
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows validation errors for empty required fields (Corporate)', async () => {
        render(<Register />);

        // Switch to Corporate
        fireEvent.click(screen.getByRole('button', { name: /kurumsal/i }));

        // Submit empty form
        fireEvent.click(screen.getByRole('button', { name: /kayit ol/i }));

        expect(await screen.findByText('Ad soyad zorunludur')).toBeInTheDocument();
        expect(screen.getByText('E-posta zorunludur')).toBeInTheDocument();
        expect(screen.getByText('Şifre zorunludur')).toBeInTheDocument();
        expect(screen.getByText('Şirket adı zorunludur')).toBeInTheDocument();
        expect(screen.getByText('Vergi numarası zorunludur')).toBeInTheDocument();

        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows password length validation error', async () => {
        render(<Register />);

        fireEvent.change(screen.getByPlaceholderText('Adınız Soyadınız'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('ornek@email.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'short' } });

        fireEvent.click(screen.getByRole('button', { name: /kayit ol/i }));

        expect(await screen.findByText('Şifre en az 8 karakter olmalıdır')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows TC kimlik format validation error', async () => {
        render(<Register />);

        fireEvent.change(screen.getByPlaceholderText('Adınız Soyadınız'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('ornek@email.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('11 haneli TC kimlik numarası'), { target: { value: '123' } });

        fireEvent.click(screen.getByRole('button', { name: /kayit ol/i }));

        expect(await screen.findByText('TC kimlik numarası 11 haneli olmalıdır')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows vergi numarası format validation error', async () => {
        render(<Register />);

        // Switch to Corporate
        fireEvent.click(screen.getByRole('button', { name: /kurumsal/i }));

        fireEvent.change(screen.getByPlaceholderText('Adınız Soyadınız'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('ornek@email.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Şirket adını girin'), { target: { value: 'Test Corp' } });
        fireEvent.change(screen.getByPlaceholderText('10 haneli vergi numarası'), { target: { value: '123' } });

        fireEvent.click(screen.getByRole('button', { name: /kayit ol/i }));

        expect(await screen.findByText('Vergi numarası 10 haneli olmalıdır')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });
});
