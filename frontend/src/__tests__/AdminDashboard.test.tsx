import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminDashboard } from '../pages/AdminDashboard';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the services
vi.mock('../services/api', () => ({
    adminService: {
        getFranchiseApplications: vi.fn(),
        getInsurances: vi.fn(),
        getInsuranceStats: vi.fn()
    }
}));

// Mock useToast
vi.mock('../components/ui/Toast', () => ({
    useToast: () => ({
        addToast: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }),
    ToastProvider: ({ children }: any) => <>{children}</>
}));

// Mock the store hooks
vi.mock('../store/hooks', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: any) => selector({
        dashboard: {
            stats: {
                totalRevenue: 0,
                totalBookings: 0,
                activeBookings: 0,
                pendingFranchiseApplications: 0,
                latestNewBookings: [],
                latestPendingFranchiseApplications: [],
                latestPaidBookings: [],
                latestExpiringInsurances: []
            },
            revenueData: null,
            loading: false,
            error: null
        },
        bookings: {
            ids: [],
            entities: {},
            loading: false,
            total: 0,
            totalPages: 0
        }
    })
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('AdminDashboard Page', () => {
    const store = configureStore({
        reducer: {
            dashboard: dashboardReducer,
            bookings: bookingsReducer,
        },
    });

    it('renders dashboard with sidebar tabs', () => {
        render(
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <AdminDashboard />
                    </BrowserRouter>
                </QueryClientProvider>
            </Provider>
        );
        expect(screen.queryAllByText(/Genel/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/Bakis/i).length + screen.queryAllByText(/Bakış/i).length).toBeGreaterThan(0);
        // Check for some tabs or sections
        expect(screen.queryAllByText(/Rezervasyonlar/i).length + screen.queryAllByText(/Rezervasyon/i).length).toBeGreaterThan(0);
    });
});
