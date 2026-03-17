import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit tests for HTML meta tags
 * Validates: Requirements 19.1, 19.2
 */

function readIndexHtml(): string {
    const htmlPath = path.resolve(__dirname, '../../index.html');
    return fs.readFileSync(htmlPath, 'utf-8');
}

describe('HTML meta tags corporate palette', () => {
    const html = readIndexHtml();

    it('19.1 - theme-color meta tag is #E30613', () => {
        const match = html.match(/<meta\s+name="theme-color"\s+content="([^"]+)"/);
        expect(match).toBeTruthy();
        expect(match![1]).toBe('#E30613');
    });

    it('19.2 - msapplication-TileColor meta tag is #E30613', () => {
        const match = html.match(/<meta\s+name="msapplication-TileColor"\s+content="([^"]+)"/);
        expect(match).toBeTruthy();
        expect(match![1]).toBe('#E30613');
    });
});
