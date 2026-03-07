import React, { type ReactElement } from 'react';
import { vi } from 'vitest';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../features/auth/authSlice';

vi.mock('../utils/storage', () => ({
    storage: {
        getToken: vi.fn(() => null),
        getUser: vi.fn(() => null),
        setUser: vi.fn(),
        removeAuth: vi.fn(),
    },
}));

// Create a custom render function that includes Redux, Router and React Query
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: any;
    store?: any;
    initialEntries?: string[];
    queryClient?: QueryClient;
}

function renderWithProviders(
    ui: ReactElement,
    {
        preloadedState = {},
        store = configureStore({
            reducer: { auth: authReducer },
            preloadedState,
        } as any),
        initialEntries = ['/'],
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        }),
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
        return (
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <MemoryRouter initialEntries={initialEntries}>
                        {children}
                    </MemoryRouter>
                </QueryClientProvider>
            </Provider>
        );
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';
export { renderWithProviders as render };
