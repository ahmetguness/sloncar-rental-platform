import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../components/ui/Input';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
    it('renders correctly with label', () => {
        render(<Input label="Username" id="username" />);
        expect(screen.getByLabelText('Username')).toBeDefined();
    });

    it('displays error message when error prop is provided', () => {
        render(<Input error="Required field" />);
        expect(screen.getByText('Required field')).toBeDefined();
        const input = screen.getByRole('textbox');
        expect(input.className).toContain('border-red-500');
    });

    it('passes extra props to the input element', () => {
        render(<Input placeholder="Enter your name" />);
        expect(screen.getByPlaceholderText('Enter your name')).toBeDefined();
    });

    it('handles value changes', async () => {
        const onChange = vi.fn();
        render(<Input onChange={onChange} />);
        const input = screen.getByRole('textbox');
        await userEvent.type(input, 'test');
        expect(onChange).toHaveBeenCalled();
    });

    it('is disabled when disabled prop is true', () => {
        render(<Input disabled />);
        const input = screen.getByRole('textbox');
        expect(input).toBeDisabled();
    });
});
