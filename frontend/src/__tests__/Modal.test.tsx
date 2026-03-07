import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modal } from '../components/ui/Modal';

describe('Modal Component', () => {
    const onClose = vi.fn();
    const title = 'Test Modal';
    const children = <div>Modal Content</div>;

    beforeEach(() => {
        onClose.mockClear();
        // Create a root div for portal if needed, but JSDOM usually handles document.body
    });

    it('does not render when isOpen is false', () => {
        render(
            <Modal isOpen={false} onClose={onClose}>
                {children}
            </Modal>
        );
        expect(screen.queryByText('Modal Content')).toBeNull();
    });

    it('renders title and content when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={onClose} title={title}>
                {children}
            </Modal>
        );
        expect(screen.getByText(title)).toBeDefined();
        expect(screen.getByText('Modal Content')).toBeDefined();
    });

    it('calls onClose when close button is clicked', () => {
        render(
            <Modal isOpen={true} onClose={onClose}>
                {children}
            </Modal>
        );
        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when escape key is pressed', () => {
        render(
            <Modal isOpen={true} onClose={onClose}>
                {children}
            </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
