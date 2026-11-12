import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { migrateSave } from './game-store';
import { favoriteSpecies } from './profile';
import {
    BELT_STEPS,
    bestTitle,
    cupCounts,
    cupMetal,
    dailyCounts,
    dailyMetal,
    dailyTitlesOf,
    fullWeeks,
    roomLevel,
    TITLE_STEPS,
    tierMetal,
    titlesByMode,
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

describe('seus números (Perfil, 11/11)', () => {
    const day = (champion: boolean) => ({ day: '2026-11-10', results: [], done: true, champion });
    it('Copa do Dia: o contador ou os dias guardados, o maior (save de antes do contador não perde nada)', () => {
        expect(dailyTitlesOf({}, [day(true), day(false), day(true)])).toBe(2);
        // o dia saiu da lista (60 dias), o contador lembra
        expect(dailyTitlesOf({ dailyTitles: 5 }, [day(true)])).toBe(5);
    });
    it('títulos por modo: Relâmpago é o que sobra da Rota e do Dia', () => {
        expect(titlesByMode({ titles: 7, longTitles: 2 }, [day(true)])).toEqual({ relampago: 4, dia: 1, rota: 2 });
        expect(titlesByMode({ titles: 0 }, [])).toEqual({ relampago: 0, dia: 0, rota: 0 });
    });
    it('metal pelos degraus da sala (1, 5, 25 títulos) e dos cinturões (10, 50, 100 vitórias)', () => {
        expect(tierMetal(0, TITLE_STEPS)).toBeNull();
        expect(tierMetal(1, TITLE_STEPS)).toBe('bronze');
        expect(tierMetal(5, TITLE_STEPS)).toBe('prata');
        expect(tierMetal(25, TITLE_STEPS)).toBe('ouro');
        expect(tierMetal(9, BELT_STEPS)).toBeNull();
        expect(tierMetal(50, BELT_STEPS)).toBe('prata');
    });
    it('save v6 de verdade: carta favorita, melhor campanha e títulos saem do que o save já tem', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            const fav = favoriteSpecies(save.dex);
            expect(fav).not.toBeNull();
            const most = Math.max(...Object.values(save.dex).map((e) => e.matches));
            expect(save.dex[fav as number].matches).toBe(most);
            const best = bestTitle(save.hall);
            expect(best && save.hall).toContain(best);
            const modes = titlesByMode(save.records, save.daily);
            expect(modes.relampago + modes.dia + modes.rota).toBe(save.records.titles);
            expect(save.records.dailyTitles).toBeUndefined();
        }
    });
});
