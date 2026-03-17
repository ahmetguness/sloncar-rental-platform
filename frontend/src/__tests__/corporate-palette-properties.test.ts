import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Feature: corporate-color-palette
 * Property-based tests for the corporate color palette migration.
 */

// Helper: convert hex to relative luminance (sRGB)
function hexToLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Parse primary shade hex values from index.css
function parsePrimaryShades(): { shade: number; hex: string }[] {
    const cssPath = path.resolve(__dirname, '../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    const shadeNumbers = [500, 600, 700, 800, 900, 950];
    const shades: { shade: number; hex: string }[] = [];

    for (const shade of shadeNumbers) {
        const regex = new RegExp(`--color-primary-${shade}:\\s*(#[0-9A-Fa-f]{6})`);
        const match = css.match(regex);
        if (match) {
            shades.push({ shade, hex: match[1] });
        }
    }

    return shades;
}

describe('Feature: corporate-color-palette, Property 1: Primary color shades are monotonically darker', () => {
    /**
     * Validates: Requirements 1.2
     *
     * For any two adjacent primary color shades (500→600→700→800→900→950),
     * the higher-numbered shade SHALL have equal or lower luminance than the lower-numbered shade.
     */
    it('primary shades have monotonically decreasing luminance from 500 to 950', () => {
        const shades = parsePrimaryShades();
        expect(shades.length).toBe(6);

        // Build adjacent pairs
        const adjacentPairs = shades.slice(0, -1).map((s, i) => ({
            lower: s,
            higher: shades[i + 1],
        }));

        // Property: for any adjacent pair chosen, higher shade has <= luminance
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: adjacentPairs.length - 1 }),
                (pairIndex) => {
                    const pair = adjacentPairs[pairIndex];
                    const lowerLum = hexToLuminance(pair.lower.hex);
                    const higherLum = hexToLuminance(pair.higher.hex);

                    expect(higherLum).toBeLessThanOrEqual(lowerLum);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('all 6 primary shades are defined in index.css', () => {
        const shades = parsePrimaryShades();
        expect(shades.map(s => s.shade)).toEqual([500, 600, 700, 800, 900, 950]);
    });
});
