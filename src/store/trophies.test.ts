import { describe, expect, it } from 'vitest';
import { capHall, type HallEntry, MAX_HALL } from './profile';
import {
    cupCounts,
    cupMetal,
    dailyCounts,
    dailyMetal,
    fullWeeks,
    hallModeOf,
    hallNo,
    hallOf,
    nextHallNo,
    roomLevel,
} from './trophies';

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

describe('Hall da Fama separado (Relâmpago e Rota Índigo)', () => {
    const entry = (id: string, date: number, titleNo: number, mode?: 'longa', no?: number) =>
        ({ id, date, titleNo, ...(mode && { mode }), ...(no && { no }) }) as unknown as HallEntry;
    // save de antes da separação: 5 títulos na carreira, o 2º e o 4º na Rota (mais recentes primeiro)
    const old = [
        entry('e', 50, 5),
        entry('d', 40, 4, 'longa'),
        entry('c', 30, 3),
        entry('b', 20, 2, 'longa'),
        entry('a', 10, 1),
    ];

    it('os campeões antigos da Copa longa vão pro Hall da Rota e o resto pro da Relâmpago, com o nº de cada Hall', () => {
        expect(hallOf(old, 'rota').map((h) => [h.id, h.titleNo])).toEqual([
            ['d', 2],
            ['b', 1],
        ]);
        expect(hallOf(old, 'relampago').map((h) => [h.id, h.titleNo])).toEqual([
            ['e', 3],
            ['c', 2],
            ['a', 1],
        ]);
        expect(hallModeOf(old[1])).toBe('rota');
    });

    it('o próximo título continua a conta do Hall do modo', () => {
        expect(nextHallNo({ titles: 5, longTitles: 2 }, old, true)).toBe(3);
        expect(nextHallNo({ titles: 5, longTitles: 2 }, old, false)).toBe(4);
        // título novo já guarda o nº do Hall dele
        const now = [entry('f', 60, 6, 'longa', 3), ...old];
        expect(hallNo(now, now[0])).toBe(3);
        expect(hallOf(now, 'relampago')[0].titleNo).toBe(3);
    });

    it('cada Hall guarda os seus 50: a Rota não sai por causa da Relâmpago', () => {
        const many = [
            ...Array.from({ length: 60 }, (_, i) => entry(`r${i}`, 1000 + i, i + 2)),
            entry('rota', 1, 1, 'longa'),
        ];
        const kept = capHall(many);
        expect(kept.filter((h) => h.mode === 'longa')).toHaveLength(1);
        expect(kept.filter((h) => !h.mode)).toHaveLength(MAX_HALL);
        expect(kept[0].id).toBe('r59');
    });
});
