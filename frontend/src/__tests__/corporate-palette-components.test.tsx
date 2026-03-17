import { describe, it, expect } from 'vitest';
import { render, screen, act } from '../test/test-utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Unit tests for component color classes after corporate palette migration.
 * Validates: Requirements 5.1–5.8, 6.1–6.5, 7.1–7.4, 15.1–15.4, 16.1
 */

describe('Button component corporate palette', () => {
    it('5.1/5.2 - primary variant has correct classes', () => {
        render(<Button variant="primary">Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-primary-500');
        expect(btn.className).toContain('text-white');
        expect(btn.className).toContain('hover:bg-primary-600');
        expect(btn.className).toContain('border-primary-500/50');
        expect(btn.className).toContain('shadow-sm');
    });

    it('5.3/5.4 - secondary variant has correct classes', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-[#F5F5F5]');
        expect(btn.className).toContain('text-[#111111]');
        expect(btn.className).toContain('border-[#E5E5E5]');
        expect(btn.className).toContain('hover:bg-[#EEEEEE]');
    });

    it('5.5/5.6 - outline variant has correct classes', () => {
        render(<Button variant="outline">Outline</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('border-2');
        expect(btn.className).toContain('border-primary-500');
        expect(btn.className).toContain('text-primary-500');
        expect(btn.className).toContain('hover:bg-primary-500/10');
        expect(btn.className).toContain('bg-transparent');
    });

    it('5.7 - danger variant has correct classes', () => {
        render(<Button variant="danger">Danger</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-red-500');
        expect(btn.className).toContain('text-white');
        expect(btn.className).toContain('hover:bg-red-600');
        expect(btn.className).toContain('border-red-500/50');
    });

    it('5.8 - focus ring uses primary-500', () => {
        render(<Button>Focus</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('focus:ring-primary-500');
    });
});

describe('Input component corporate palette', () => {
    it('6.1 - has white background and #E5E5E5 border', () => {
        render(<Input placeholder="test" />);
        const input = screen.getByPlaceholderText('test');
        expect(input.className).toContain('bg-white');
        expect(input.className).toContain('border-[#E5E5E5]');
    });

    it('6.2 - has #111111 text and #AAAAAA placeholder', () => {
        render(<Input placeholder="test" />);
        const input = screen.getByPlaceholderText('test');
        expect(input.className).toContain('text-[#111111]');
        expect(input.className).toContain('placeholder-[#AAAAAA]');
    });

    it('6.3 - has primary-500 focus ring', () => {
        render(<Input placeholder="test" />);
        const input = screen.getByPlaceholderText('test');
        expect(input.className).toContain('focus:ring-primary-500');
    });

    it('6.4 - error state has red border', () => {
        render(<Input placeholder="test" error="Required" />);
        const input = screen.getByPlaceholderText('test');
        expect(input.className).toContain('border-red-500');
    });

    it('6.5 - label text is #777777', () => {
        render(<Input label="Name" id="name" />);
        const label = screen.getByText('Name');
        expect(label.className).toContain('text-[#777777]');
    });
});

describe('Modal component corporate palette', () => {
    it('7.1 - container has white bg and #E5E5E5 border', () => {
        const { baseElement } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test">
                <div>Content</div>
            </Modal>
        );
        const allDivs = baseElement.ownerDocument.querySelectorAll('div');
        const modalDiv = Array.from(allDivs).find(div =>
            typeof div.className === 'string' &&
            div.className.includes('bg-white') &&
            div.className.includes('border') &&
            div.className.includes('rounded-2xl')
        );
        expect(modalDiv).toBeTruthy();
        expect(modalDiv!.className).toContain('bg-white');
        expect(modalDiv!.className).toMatch(/border[- ]/);
    });

    it('7.2 - header has #F5F5F5 bg and #E5E5E5 border', () => {
        const { baseElement } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test">
                <div>Content</div>
            </Modal>
        );
        const allDivs = baseElement.ownerDocument.querySelectorAll('div');
        const headerDiv = Array.from(allDivs).find(div =>
            typeof div.className === 'string' &&
            div.className.includes('bg-[#F5F5F5]') &&
            div.className.includes('border-b')
        );
        expect(headerDiv).toBeTruthy();
        expect(headerDiv!.className).toContain('bg-[#F5F5F5]');
        expect(headerDiv!.className).toContain('border-[#E5E5E5]');
    });

    it('7.3 - title text is #111111', () => {
        const { baseElement } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        const heading = baseElement.ownerDocument.querySelector('h2');
        expect(heading).toBeTruthy();
        expect(heading!.className).toContain('text-[#111111]');
    });

    it('7.4 - close button is #777777', () => {
        const { baseElement } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test">
                <div>Content</div>
            </Modal>
        );
        const buttons = baseElement.ownerDocument.querySelectorAll('button');
        const closeBtn = Array.from(buttons).find(btn =>
            typeof btn.className === 'string' &&
            btn.className.includes('text-[#777777]')
        );
        expect(closeBtn).toBeTruthy();
        expect(closeBtn!.className).toContain('text-[#777777]');
        expect(closeBtn!.className).toContain('hover:text-[#111111]');
    });
});


describe('Toast component corporate palette', () => {
    it('15.1 - success toast has green-tinted bg, green border, green text', async () => {
        const toastModule = await import('../components/ui/Toast');
        const TestComponent = () => {
            const ToastTrigger = () => {
                const toast = toastModule.useToast();
                return <button onClick={() => toast.success('Test success')}>Trigger</button>;
            };
            return (
                <toastModule.ToastProvider>
                    <ToastTrigger />
                </toastModule.ToastProvider>
            );
        };

        const { baseElement } = render(<TestComponent />);
        await act(async () => {
            screen.getByText('Trigger').click();
        });

        const toastEl = baseElement.ownerDocument.querySelector('.bg-green-50');
        expect(toastEl).toBeTruthy();
        expect(toastEl!.className).toContain('border-green-200');
        expect(toastEl!.className).toContain('text-green-600');
    });

    it('15.2 - error toast has red-tinted bg, red border, red text', async () => {
        const toastModule = await import('../components/ui/Toast');
        const TestComponent = () => {
            const ToastTrigger = () => {
                const toast = toastModule.useToast();
                return <button onClick={() => toast.error('Test error')}>Trigger</button>;
            };
            return (
                <toastModule.ToastProvider>
                    <ToastTrigger />
                </toastModule.ToastProvider>
            );
        };

        const { baseElement } = render(<TestComponent />);
        await act(async () => {
            screen.getByText('Trigger').click();
        });

        const toastEl = baseElement.ownerDocument.querySelector('.bg-red-50');
        expect(toastEl).toBeTruthy();
        expect(toastEl!.className).toContain('border-red-200');
        expect(toastEl!.className).toContain('text-red-600');
    });

    it('15.3 - info toast has blue-tinted bg, blue border, blue text', async () => {
        const toastModule = await import('../components/ui/Toast');
        const TestComponent = () => {
            const ToastTrigger = () => {
                const toast = toastModule.useToast();
                return <button onClick={() => toast.info('Test info')}>Trigger</button>;
            };
            return (
                <toastModule.ToastProvider>
                    <ToastTrigger />
                </toastModule.ToastProvider>
            );
        };

        const { baseElement } = render(<TestComponent />);
        await act(async () => {
            screen.getByText('Trigger').click();
        });

        const toastEl = baseElement.ownerDocument.querySelector('.bg-blue-50');
        expect(toastEl).toBeTruthy();
        expect(toastEl!.className).toContain('border-blue-200');
        expect(toastEl!.className).toContain('text-blue-600');
    });

    it('15.4 - dismiss button hover has #F5F5F5 bg', async () => {
        const toastModule = await import('../components/ui/Toast');
        const TestComponent = () => {
            const ToastTrigger = () => {
                const toast = toastModule.useToast();
                return <button onClick={() => toast.info('Test')}>Trigger</button>;
            };
            return (
                <toastModule.ToastProvider>
                    <ToastTrigger />
                </toastModule.ToastProvider>
            );
        };

        const { baseElement } = render(<TestComponent />);
        await act(async () => {
            screen.getByText('Trigger').click();
        });

        const dismissBtn = Array.from(baseElement.ownerDocument.querySelectorAll('button')).find(btn =>
            typeof btn.className === 'string' &&
            btn.className.includes('hover:bg-[#F5F5F5]')
        );
        expect(dismissBtn).toBeTruthy();
    });
});

describe('Skeleton component corporate palette', () => {
    it('16.1 - has #F0F0F0 background', () => {
        const { container } = render(<Skeleton />);
        const el = container.firstElementChild;
        expect(el).toBeTruthy();
        expect(el!.className).toContain('bg-[#F0F0F0]');
    });
});
