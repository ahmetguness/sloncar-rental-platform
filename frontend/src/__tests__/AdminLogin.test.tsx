import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import { AdminLogin } from '../pages/AdminLogin';
import * as authSlice from '../features/auth/authSlice';

// Mock assets
vi.mock('../assets/logo/logo.jpg', () => ({ default: 'test-logo' }));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AdminLogin', () => {
    it('renders login form correctly', () => {
        render(<AdminLogin />);
        expect(screen.getByText('Yönetici Paneli')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
    });

    it('handles email normalization', () => {
        render(<AdminLogin />);
        const emailInput = screen.getByPlaceholderText('admin@example.com') as HTMLInputElement;
        fireEvent.change(emailInput, { target: { value: 'AHMET.GÜNEŞ@örnek.com' } });
        expect(emailInput.value).toBe('ahmet.gunes@ornek.com');
    });

    it('shows error message from state', () => {
        render(<AdminLogin />, {
            preloadedState: {
                auth: { error: 'Invalid credentials', status: 'failed' }
            }
        });
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('shows loading state during submission', () => {
        render(<AdminLogin />, {
            preloadedState: {
                auth: { status: 'loading' }
            }
        });
        expect(screen.getByText('Giriş Yapılıyor...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /giriş yapılıyor/i })).toBeDisabled();
    });

    it('redirects when authenticated', async () => {
        render(<AdminLogin />, {
            preloadedState: {
                auth: { 
                    isAuthenticated: true, 
                    user: { role: 'ADMIN' },
                    status: 'succeeded'
                }
            }
        });

        // Effect for redirect should trigger
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
        });
    });

    it('dispatches loginUser on submit', () => {
        const spy = vi.spyOn(authSlice, 'loginUser');
        render(<AdminLogin />);
        
        fireEvent.change(screen.getByPlaceholderText('admin@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
        
        fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));
        
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({
            email: 'test@test.com',
            password: 'password123',
            rememberMe: false
        }));
    });
});
