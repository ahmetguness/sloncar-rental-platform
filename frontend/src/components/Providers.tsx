"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ToastProvider } from './ui/Toast';
import { useState, useEffect } from 'react';
import { fetchSettings } from '../features/settings/settingsSlice';

function SettingsLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(fetchSettings());
  }, []);
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SettingsLoader>
            {children}
          </SettingsLoader>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}
