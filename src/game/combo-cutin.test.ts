import { describe, expect, it } from 'vitest';
import { COMBO_BAND_H, COMBO_DRAMA_MS, comboBandsY, comboCutIn } from './combo-cutin';

describe('cut-in de dupla do combo', () => {
    it('os dois entram de lados opostos, quem passou do lado do próprio time', () => {
        for (const team of [0, 1] as const) {
            const p = comboCutIn(team, false);
            expect(p.passerFromRight).toBe(team === 1);
            expect(p.finisherFromRight).not.toBe(p.passerFromRight);
        }
    });

    it('cabe dentro do tempo que o letreiro do combo já fica na tela (não segura a partida)', () => {
        const long = comboCutIn(0, false).ms;
        const short = comboCutIn(0, true).ms;
        expect(long).toBeLessThanOrEqual(COMBO_DRAMA_MS - 330);
        expect(short).toBeLessThan(long);
    });

    it('uma faixa em cima e outra embaixo do nome, sem passar do alto da tela', () => {
        const half = COMBO_BAND_H / 2 + 8;
        const box = { top: 64, bottom: 140 };
        const y = comboBandsY(box, half);
        expect(y.top + half).toBeLessThanOrEqual(box.top + 8);
        expect(y.bottom - half).toBeGreaterThanOrEqual(box.bottom - 8);
        // o nome bem no alto: a faixa de cima desce pra caber e a de baixo não encosta nela
        const high = comboBandsY({ top: 10, bottom: 60 }, half);
        expect(high.top - half).toBeGreaterThanOrEqual(0);
        expect(high.bottom - high.top).toBeGreaterThanOrEqual(2 * half);
    });
});
