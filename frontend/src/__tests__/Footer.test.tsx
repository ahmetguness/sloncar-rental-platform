import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '../components/layout/Footer';
import { BrowserRouter } from 'react-router-dom';

describe('Footer Component', () => {
    it('renders company information', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        expect(screen.getAllByText(/YAMAN/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/FİLO/i).length).toBeGreaterThan(0);
    });

    it('renders contact information', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        // Using regex to find phone or address clues
        expect(screen.getAllByText(/İLETİŞİM/i).length).toBeGreaterThan(0);
    });

    it('renders social media links', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        // Footer usually has links to social or other pages
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
    });
});
