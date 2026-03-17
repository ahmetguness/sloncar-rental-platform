import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit tests for theme variables in index.css
 * Validates: Requirements 1.1–1.10
 */

function readIndexCss(): string {
    const cssPath = path.resolve(__dirname, '../index.css');
    return fs.readFileSync(cssPath, 'utf-8');
}

function getThemeVariable(css: string, varName: string): string | null {
    const regex = new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([^;\\n]+)`);
    const match = css.match(regex);
    return match ? match[1].trim() : null;
}

describe('Theme variables in index.css', () => {
    const css = readIndexCss();

    it('1.1 - --color-primary-500 is #E30613', () => {
        expect(getThemeVariable(css, '--color-primary-500')).toBe('#E30613');
    });

    it('1.2 - primary 600-950 shades are progressively darker', () => {
        expect(getThemeVariable(css, '--color-primary-600')).toBe('#C80511');
        expect(getThemeVariable(css, '--color-primary-700')).toBe('#AD040F');
        expect(getThemeVariable(css, '--color-primary-800')).toBe('#92040C');
        expect(getThemeVariable(css, '--color-primary-900')).toBe('#77030A');
        expect(getThemeVariable(css, '--color-primary-950')).toBe('#5C0208');
    });

    it('1.3 - --color-dark-bg is #FFFFFF', () => {
        expect(getThemeVariable(css, '--color-dark-bg')).toBe('#FFFFFF');
    });

    it('1.4 - --color-dark-surface is #F5F5F5', () => {
        expect(getThemeVariable(css, '--color-dark-surface')).toBe('#F5F5F5');
    });

    it('1.5 - --color-dark-surface-lighter is #FFFFFF', () => {
        expect(getThemeVariable(css, '--color-dark-surface-lighter')).toBe('#FFFFFF');
    });

    it('1.6 - --color-anthracite is #FFFFFF', () => {
        expect(getThemeVariable(css, '--color-anthracite')).toBe('#FFFFFF');
    });

    it('1.7 - --color-charcoal is #F5F5F5', () => {
        expect(getThemeVariable(css, '--color-charcoal')).toBe('#F5F5F5');
    });

    it('1.8 - --color-brand-grey is #777777', () => {
        expect(getThemeVariable(css, '--color-brand-grey')).toBe('#777777');
    });

    it('1.9 - --color-neon-blue is #F5F5F5', () => {
        expect(getThemeVariable(css, '--color-neon-blue')).toBe('#F5F5F5');
    });

    it('1.10 - --color-neon-purple is #E30613', () => {
        expect(getThemeVariable(css, '--color-neon-purple')).toBe('#E30613');
    });
});
