import { describe, expect, it } from 'vitest';
import { CUT_IN_MS, CUT_OUT_MS, cutGeometry } from './tv';

describe('corte de TV', () => {
    it('dura 200–300 ms (ADR 0004) e a faixa cobre a tela inteira no meio, começando e acabando fora dela', () => {
        expect(CUT_IN_MS + CUT_OUT_MS).toBeGreaterThanOrEqual(200);
        expect(CUT_IN_MS + CUT_OUT_MS).toBeLessThanOrEqual(300);
        for (const [w, h] of [
            [390, 844],
            [1440, 900],
            [320, 568],
            [844, 390],
            [1920, 1080],
        ]) {
            const g = cutGeometry(w, h);
            // borda da esquerda (no topo, x + s) e da direita (embaixo, x + width - s) em cada ponto
            expect(g.start).toBeGreaterThanOrEqual(w);
            expect(g.cover + g.s).toBeLessThanOrEqual(0);
            expect(g.cover + g.width - g.s).toBeGreaterThanOrEqual(w);
            expect(g.end + g.width).toBeLessThanOrEqual(0);
        }
    });
});
