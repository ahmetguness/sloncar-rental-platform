import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../components/ui/Toast';
import userEvent from '@testing-library/user-event';

const TestComponent = () => {
    const { success, error, info } = useToast();
    return (
        <div>
            <button onClick={() => success('Success Message')}>Success</button>
            <button onClick={() => error('Error Message')}>Error</button>
            <button onClick={() => info('Info Message')}>Info</button>
        </div>
    );
};

describe('Toast Component', () => {
    it('shows success toast when success is called', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Success');
        await userEvent.click(button);

        expect(screen.getByText('Success Message')).toBeDefined();
    });

    it('shows error toast when error is called', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Error');
        await userEvent.click(button);

        expect(screen.getByText('Error Message')).toBeDefined();
    });

    it('removes toast when close button is clicked', async () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await userEvent.click(screen.getByText('Success'));
        const toast = screen.getByText('Success Message');
        expect(toast).toBeDefined();

        const closeButton = screen.getByRole('button', { name: '' }); // The X icon button
        await userEvent.click(closeButton);

        expect(screen.queryByText('Success Message')).toBeNull();
    });

    it('automatically removes toast after timeout', async () => {
        vi.useFakeTimers();
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const button = screen.getByText('Success');
        fireEvent.click(button);

        expect(screen.getByText('Success Message')).toBeDefined();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByText('Success Message')).toBeNull();
        vi.useRealTimers();
    });
});
