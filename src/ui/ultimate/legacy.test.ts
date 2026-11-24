import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { bestLegend, legacyStats } from './Legacy';

describe('legado do Time Ultimate no Álbum', () => {
    it('1 partida e 1 vitória no singular (antes saía "1 partidas · 1 vitórias")', () => {
        expect(legacyStats({ played: 1, wins: 1, marks: 0 }, 'pt')).toBe('1 partida · 1 vitória · marco 0');
        expect(legacyStats({ played: 3, wins: 2, marks: 4 }, 'pt')).toBe('3 partidas · 2 vitórias · marco 4');
        expect(legacyStats({ played: 1, wins: 0, marks: 1 }, 'en')).toBe('1 match · 0 wins · milestone 1');
    });
});

describe('melhor carta do legado', () => {
    const rng = new Rng('legado', 'test');
    const rec = (season: number, id: number) => ({
        season,
        played: 1,
        wins: 1,
        marks: 0,
        champion: false,
        legend: createInstance(id, rng),
    });
    it('sem Lenda nenhuma: nada', () => {
        expect(bestLegend([{ ...rec(1, 25), legend: null }])).toBeNull();
        expect(bestLegend([])).toBeNull();
    });
    it('pega a de maior nota', () => {
        const a = rec(1, 10);
        const b = rec(2, 150);
        expect(bestLegend([a, b])?.uid).toBe(b.legend.uid);
        expect(bestLegend([b, a])?.uid).toBe(b.legend.uid);
    });
});
