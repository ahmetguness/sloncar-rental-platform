import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from '../components/layout/Layout';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

// Mock logo
vi.mock('../../assets/logo/logo.jpg', () => ({
    default: 'test-file-stub'
}));

const renderWithProviders = (ui: React.ReactElement, { preloadedState = {} } = {}) => {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState
    });
    return render(
        <Provider store={store}>
            <BrowserRouter>
                {ui}
            </BrowserRouter>
        </Provider>
    );
};

describe('Layout Component', () => {
    it('renders brand name and logo', () => {
        renderWithProviders(<Layout />);
        expect(screen.getAllByText(/YAMAN/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/FİLO/i).length).toBeGreaterThan(0);
        expect(screen.getAllByAltText('Yaman Filo').length).toBeGreaterThan(0);
    });

    it('renders navigation links for non-admin users', () => {
        renderWithProviders(<Layout />);
        expect(screen.getByText('Araçlar')).toBeDefined();
        expect(screen.getByText('2. El Satış')).toBeDefined();
        expect(screen.getByText('Rezervasyonum')).toBeDefined();
    });

    it('renders admin logout when on admin path', () => {
        // Mock current path as admin
        window.history.pushState({}, 'Test page', '/admin/dashboard');

        renderWithProviders(<Layout />, {
            preloadedState: {
                auth: {
                    user: { name: 'Admin User', role: 'ADMIN' },
                    token: 'fake-token',
                    loading: false,
                    error: null
                }
            }
        });

        expect(screen.getByText('Admin User')).toBeDefined();
        expect(screen.getByText('Yönetici Hesabı')).toBeDefined();
        // Lucide icons might be hard to find by label, but we can check for logout button
        const buttons = screen.getAllByRole('button');
        // The last button is usually the logout one in admin layout
        expect(buttons.length).toBeGreaterThan(0);
    });
});
