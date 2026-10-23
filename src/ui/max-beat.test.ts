import { describe, expect, it } from 'vitest';
import { gradeAt } from './max-beat';

describe('nota do toque na batida (golpe máximo em 3 níveis)', () => {
    it('perfeito até 70 ms da batida (antes ou depois), bom até 150 ms, senão fora', () => {
        // 120 BPM: batida de 500 ms; fase 1 = na batida
        const at = (msBefore: number) => gradeAt(1 - msBefore / 500, 120, 0);
        expect([at(0), at(60), at(-60), at(500 - 60)]).toEqual([2, 2, 2, 2]);
        expect([at(100), at(-140)]).toEqual([1, 1]);
        expect([at(200), at(250), at(-200)]).toEqual([0, 0, 0]);
        // o ajuste do fone desloca a janela
        expect(gradeAt(1 - 100 / 500, 120, -100)).toBe(2);
    });
});
