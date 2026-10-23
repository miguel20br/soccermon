import { describe, expect, it } from 'vitest';
import { lossColor } from './long-cup';

describe('lossColor (barrinha da copa na Home)', () => {
    const rota = (status: string, stages: number[]) => ({
        mode: 'longa' as const,
        status,
        results: stages.map((stage) => ({ stage })),
    });
    it('derrota perdoada no mapa é amarela, não vermelha', () => {
        expect(lossColor(rota('map', [0]), 0)).toBe('yellow');
    });
    it('só a última derrota de quem foi eliminado é vermelha', () => {
        const run = rota('eliminated', [0, 1, 2]);
        expect(lossColor(run, 0)).toBe('yellow');
        expect(lossColor(run, 2)).toBe('red');
    });
    it('derrota no grupo não dá cartão: neutra', () => {
        expect(lossColor(rota('group', [5]), 5)).toBe('plain');
    });
    it('Copa rápida: derrota é sempre vermelha', () => {
        expect(lossColor({ status: 'eliminated', results: [{ stage: 1 }] }, 1)).toBe('red');
    });
});
