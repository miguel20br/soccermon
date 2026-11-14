import { describe, expect, it } from 'vitest';
import { pixelArt } from './EventSet';

describe('pixelArt (cenário dos eventos)', () => {
    it('mede a arte, junta os pixels iguais da linha e pula o vazio', () => {
        const a = pixelArt(
            `
            kk.r
            .rrr
            `,
            { k: '#000', r: '#f00' },
        );
        expect([a.w, a.h]).toEqual([4, 2]);
        const svg = decodeURIComponent(a.url);
        expect(svg).toContain('<rect x="0" y="0" width="2" height="1" fill="#000"/>');
        expect(svg).toContain('<rect x="1" y="1" width="3" height="1" fill="#f00"/>');
        expect(svg.match(/<rect/g)).toHaveLength(3);
    });
});
