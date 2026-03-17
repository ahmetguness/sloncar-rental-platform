import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '../test/test-utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Feature: corporate-color-palette
 * Property 2 & 3: No colored glow shadows and no decorative backdrop-blur
 */

// Regex to detect colored glow shadow patterns: shadow-[...rgba(R,G,B,...)] where R,G,B are not all equal (non-gray)
const COLORED_SHADOW_REGEX = /shadow-\[[^\]]*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;

function hasColoredGlowShadow(className: string): boolean {
    const matches = className.matchAll(COLORED_SHADOW_REGEX);
    for (const match of matches) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        // If r, g, b are not all equal, it's a colored (non-gray) shadow
        if (!(r === g && g === b)) {
            return true;
        }
    }
    return false;
}

// Check for backdrop-blur classes
function hasBackdropBlur(className: string): boolean {
    return /backdrop-blur/.test(className);
}

describe('Feature: corporate-color-palette, Property 2: No colored glow shadows in any interactive component', () => {
    /**
     * Validates: Requirements 18.4, 18.5
     *
     * For any Button variant and card/panel component, the rendered CSS classes
     * SHALL NOT contain shadow-[...] patterns with non-gray rgba colors.
     */
    const buttonVariants = ['primary', 'secondary', 'outline', 'danger'] as const;

    it('no Button variant has colored glow shadows', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buttonVariants),
                (variant) => {
                    const { container } = render(
                        <Button variant={variant}>Test</Button>
                    );
                    const button = container.querySelector('button');
                    expect(button).toBeTruthy();
                    const className = button!.className;
                    expect(hasColoredGlowShadow(className)).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Modal does not have colored glow shadows', () => {
        const { container } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test">
                <div>Content</div>
            </Modal>
        );
        // Check all elements in the modal for colored glow shadows
        const allElements = container.querySelectorAll('*');
        allElements.forEach((el) => {
            if (el.className && typeof el.className === 'string') {
                expect(hasColoredGlowShadow(el.className)).toBe(false);
            }
        });
    });

    it('Skeleton does not have colored glow shadows', () => {
        const { container } = render(<Skeleton className="w-full h-4" />);
        const el = container.firstElementChild;
        expect(el).toBeTruthy();
        if (el && typeof el.className === 'string') {
            expect(hasColoredGlowShadow(el.className)).toBe(false);
        }
    });
});

describe('Feature: corporate-color-palette, Property 3: No decorative backdrop-blur on non-functional overlays', () => {
    /**
     * Validates: Requirements 18.6
     *
     * For each surface component (excluding functional overlays like lightbox and mobile menu),
     * the rendered CSS classes SHALL NOT contain backdrop-blur utilities.
     */
    const variants = ['primary', 'secondary', 'outline', 'danger'] as const;

    it('no Button variant uses decorative backdrop-blur', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...variants),
                (variant) => {
                    const { container } = render(
                        <Button variant={variant}>Test</Button>
                    );
                    const button = container.querySelector('button');
                    expect(button).toBeTruthy();
                    const className = button!.className;
                    expect(hasBackdropBlur(className)).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Skeleton does not use decorative backdrop-blur', () => {
        const { container } = render(<Skeleton className="w-full h-4" />);
        const el = container.firstElementChild;
        expect(el).toBeTruthy();
        if (el && typeof el.className === 'string') {
            expect(hasBackdropBlur(el.className)).toBe(false);
        }
    });

    it('Toast container does not use decorative backdrop-blur', async () => {
        // Import Toast dynamically to test its rendered output
        const { ToastProvider } = await import('../components/ui/Toast');
        const { container } = render(
            <ToastProvider>
                <div>App content</div>
            </ToastProvider>
        );
        // The toast container itself should not have backdrop-blur
        const allElements = container.querySelectorAll('*');
        allElements.forEach((el) => {
            if (el.className && typeof el.className === 'string') {
                expect(hasBackdropBlur(el.className)).toBe(false);
            }
        });
    });
});
