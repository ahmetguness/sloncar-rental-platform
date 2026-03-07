import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Franchise } from '../pages/Franchise';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

describe('Franchise Page', () => {
    it('renders franchise application form', () => {
        render(
            <BrowserRouter>
                <Franchise />
            </BrowserRouter>
        );
        expect(screen.getByText(/Yaman/i)).toBeDefined();
        expect(screen.getByText(/Filo/i)).toBeDefined();
        expect(screen.getByText(/Franchise/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/Adınız ve Soyadınız/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/ornek@email\.com/i)).toBeDefined();
    });

    it('shows validation error when proceeding with empty fields', async () => {
        render(
            <BrowserRouter>
                <Franchise />
            </BrowserRouter>
        );

        const nextButton = screen.getByText(/Devam Et/i);
        fireEvent.click(nextButton);

        expect(screen.getByText(/Lütfen zorunlu alanları doldurun/i)).toBeDefined();
    });

    it('handles input changes', async () => {
        render(
            <BrowserRouter>
                <Franchise />
            </BrowserRouter>
        );

        const nameInput = screen.getByPlaceholderText(/Adınız ve Soyadınız/i);
        await userEvent.type(nameInput, 'John Doe');
        expect((nameInput as HTMLInputElement).value).toBe('John Doe');
    });
});
