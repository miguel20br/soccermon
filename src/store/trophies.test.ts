import { describe, expect, it } from 'vitest';
import { cupCounts, cupMetal, dailyCounts, dailyMetal, fullWeeks, roomLevel } from './trophies';

const win = (a: number, b: number) => ({
    score: [a, b] as [number, number],
    shootout: null,
    won: a > b,
    opponent: 'x',
});

describe('sala de troféus', () => {
    it('metal da taça pela campanha: sem sofrer gol = ouro, sem pênaltis = prata, campeão = bronze', () => {
        expect(
            cupMetal({
                perfect: true,
                scores: [
                    [1, 0],
                    [2, 2],
                    [1, 0],
                    [3, 0],
                ],
            }),
        ).toBe('ouro');
        expect(
            cupMetal({
                perfect: false,
                scores: [
                    [3, 1],
                    [2, 1],
                    [1, 0],
                    [4, 2],
                ],
            }),
        ).toBe('prata');
        expect(
            cupMetal({
                perfect: false,
                scores: [
                    [3, 1],
                    [2, 2],
                    [1, 0],
                    [4, 2],
                ],
            }),
        ).toBe('bronze');
        expect(
            cupCounts([
                { perfect: true, scores: [] },
                { perfect: false, scores: [[1, 0]] },
                { perfect: false, scores: [[1, 1]] },
                { perfect: false, scores: [[0, 0]] },
            ]),
        ).toEqual({ bronze: 2, prata: 1, ouro: 1 });
    });

    it('medalhão da Copa do Dia: campeão ouro, 3 vitórias prata, 2 bronze, menos que isso nada', () => {
        expect(dailyMetal({ champion: true, results: [] })).toBe('ouro');
        expect(dailyMetal({ champion: false, results: [win(1, 0), win(2, 0), win(1, 0), win(0, 1)] })).toBe('prata');
        expect(dailyMetal({ champion: false, results: [win(1, 0), win(2, 0), win(0, 1)] })).toBe('bronze');
        expect(dailyMetal({ champion: false, results: [win(1, 0), win(0, 1)] })).toBeNull();
        expect(
            dailyCounts([
                { champion: true, results: [] },
                { champion: false, results: [] },
            ]),
        ).toEqual({
            bronze: 0,
            prata: 0,
            ouro: 1,
        });
    });

    it('semana inteira = segunda a domingo jogados', () => {
        // 19/10/2026 é segunda
        const week = ['19', '20', '21', '22', '23', '24', '25'].map((d) => ({ day: `2026-10-${d}` }));
        expect(fullWeeks(week)).toBe(1);
        expect(fullWeeks(week.slice(1))).toBe(0);
        // de terça a segunda não fecha semana nenhuma
        expect(fullWeeks([...week.slice(1), { day: '2026-10-26' }])).toBe(0);
    });

    it('nível da sala pelos títulos', () => {
        expect(roomLevel(0)).toEqual({ level: 'quarto', n: 1, next: 5 });
        expect(roomLevel(5)).toEqual({ level: 'clube', n: 2, next: 25 });
        expect(roomLevel(80)).toEqual({ level: 'estadio', n: 3, next: null });
    });
});
