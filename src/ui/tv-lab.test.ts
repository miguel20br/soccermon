import { describe, expect, it } from 'vitest';
import { CUT_IN_MS, CUT_OUT_MS, cutGeometry, tvFlag } from './tv-lab';

describe('?lab=tv', () => {
    it('sem a bandeira (e sempre em produção) fica desligado', () => {
        expect(tvFlag('', null, true)).toBe(false);
        expect(tvFlag('?lab=hud', null, true)).toBe(false);
        expect(tvFlag('?lab=tv', '1', false)).toBe(false);
        expect(tvFlag('', '1', false)).toBe(false);
    });
    it('liga pela URL, fica na aba e tv-off desliga', () => {
        expect(tvFlag('?lab=tv', null, true)).toBe(true);
        expect(tvFlag('?demo=mercado', '1', true)).toBe(true);
        expect(tvFlag('?lab=tv-off', '1', true)).toBe(false);
    });
    it('o corte dura 280–350 ms e a faixa cobre a tela inteira no meio, começando e acabando fora dela', () => {
        expect(CUT_IN_MS + CUT_OUT_MS).toBeGreaterThanOrEqual(280);
        expect(CUT_IN_MS + CUT_OUT_MS).toBeLessThanOrEqual(350);
        for (const [w, h] of [
            [390, 844],
            [1440, 900],
            [320, 568],
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
