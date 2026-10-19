import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { buildCupOpponents } from '../engine/cup';
import { type DailyEntry, dailyDay, dailySeed, dailyShareText, dailyStreak, mergeDaily, weekOf } from './daily';
import { dailyAfter, migrateSave, type RunState, SAVE_VERSION, savePart, seedFromUrl, useGame } from './game-store';

const entry = (day: string, patch: Partial<DailyEntry> = {}): DailyEntry => ({
    day,
    results: [],
    done: false,
    champion: false,
    ...patch,
});

describe('Copa do Dia: o dia', () => {
    it('vira à meia-noite de Brasília (03:00 UTC), não à meia-noite UTC nem a do aparelho', () => {
        expect(dailyDay(new Date('2026-10-19T02:59:59Z'))).toBe('2026-10-18');
        expect(dailyDay(new Date('2026-10-19T03:00:00Z'))).toBe('2026-10-19');
        expect(dailyDay(new Date('2026-10-20T02:30:00Z'))).toBe('2026-10-19');
        // janeiro (era horário de verão até 2019): continua UTC−3
        expect(dailyDay(new Date('2027-01-01T02:00:00Z'))).toBe('2026-12-31');
    });

    it('a seed é a mesma pra todo mundo no dia, muda no dia seguinte, e a copa (rivais) vem dela', () => {
        expect(dailySeed('2026-10-19')).toBe('dia-20261019');
        expect(dailySeed('2026-10-20')).not.toBe(dailySeed('2026-10-19'));
        const a = buildCupOpponents(dailySeed('2026-10-19'));
        const b = buildCupOpponents(dailySeed('2026-10-19'));
        expect(a.map((t) => t.lineup.map((p) => p.speciesId))).toEqual(b.map((t) => t.lineup.map((p) => p.speciesId)));
    });

    it('a seed do dia não abre pelo ?seed= (seria treino antes da tentativa)', () => {
        vi.stubGlobal('window', { location: { search: '?seed=dia-20261019' } });
        expect(seedFromUrl()).toBeNull();
        vi.stubGlobal('window', { location: { search: '?seed=abc123' } });
        expect(seedFromUrl()).toBe('abc123');
        vi.unstubAllGlobals();
    });
});

describe('Copa do Dia: 1 tentativa', () => {
    it('começar de novo (ou recarregar a página) não dá outra copa', () => {
        useGame.setState({ run: null, daily: [], parkedRuns: [] });
        useGame.getState().startDaily(false);
        const run = useGame.getState().run as RunState;
        expect(run.seed).toBe(dailySeed(dailyDay()));
        expect(run.daily).toBe(dailyDay());
        useGame.getState().startDaily(false);
        expect(useGame.getState().run).toBe(run);
        // "recarregar": o save sai e volta pelo mesmo caminho do IndexedDB/nuvem
        const reloaded = migrateSave(JSON.parse(JSON.stringify(savePart(useGame.getState()))), SAVE_VERSION);
        useGame.setState({ ...reloaded });
        useGame.getState().startDaily(false);
        expect(useGame.getState().run?.seed).toBe(run.seed);
        expect(useGame.getState().daily).toHaveLength(1);
    });

    it('abandonar ou trocar por outra copa fecha a tentativa do dia', () => {
        useGame.setState({ run: null, daily: [], parkedRuns: [] });
        useGame.getState().startDaily(true);
        useGame.getState().newRun('Pallet FC', 'outra');
        expect(useGame.getState().daily[0]).toMatchObject({ day: dailyDay(), done: true, ranked: true });
        useGame.getState().startDaily(true);
        expect(useGame.getState().run?.seed).toBe('outra');
    });

    it('a copa em andamento fica guardada (não some)', () => {
        useGame.setState({ run: null, daily: [], parkedRuns: [] });
        useGame.getState().newRun('Pallet FC', 'minha-copa');
        useGame.getState().startDaily(false);
        expect(useGame.getState().parkedRuns.map((r) => r.seed)).toEqual(['minha-copa']);
        expect(useGame.getState().run?.daily).toBe(dailyDay());
    });

    it('placar de cada partida vai pro histórico do dia; eliminação fecha', () => {
        const run = {
            status: 'eliminated',
            results: [
                { stage: 0, opponent: 'Pewter Rochedo', score: [3, 1], shootout: null, won: true },
                { stage: 1, opponent: 'Cerulean Cascata', score: [2, 2], shootout: [3, 4], won: false },
            ],
        } as unknown as RunState;
        const out = dailyAfter([entry('2026-10-19', { ranked: true })], run, '2026-10-19')[0];
        expect(out).toMatchObject({ done: true, champion: false, ranked: true });
        expect(out.results.map((r) => r.won)).toEqual([true, false]);
    });
});

describe('Copa do Dia: sequência e compartilhar', () => {
    it('semana de segunda a domingo; faltar um dia não zera o total', () => {
        expect(weekOf('2026-10-19')[0]).toBe('2026-10-19'); // segunda
        expect(weekOf('2026-10-25')).toEqual(weekOf('2026-10-19'));
        const list = [entry('2026-10-21'), entry('2026-10-19'), entry('2026-10-15')];
        const s = dailyStreak(list, '2026-10-22');
        expect(s.week).toEqual([true, false, true, false, false, false, false]);
        expect(s.weekCount).toBe(2);
        expect(s.total).toBe(3);
        // semana nova: os quadradinhos zeram, o total não
        expect(dailyStreak(list, '2026-10-26')).toMatchObject({ weekCount: 0, total: 3 });
    });

    it('nuvem + aparelho: por dia, fica a tentativa que andou mais', () => {
        const a = [entry('2026-10-19', { results: [{ score: [1, 0], shootout: null, won: true, opponent: 'x' }] })];
        const b = [entry('2026-10-19', { done: true }), entry('2026-10-18')];
        expect(mergeDaily(a, b).map((e) => [e.day, e.done])).toEqual([
            ['2026-10-19', true],
            ['2026-10-18', false],
        ]);
    });

    it('texto estilo Wordle', () => {
        const e = entry('2026-10-19', {
            done: true,
            results: [
                { score: [3, 1], shootout: null, won: true, opponent: 'Pewter Rochedo' },
                { score: [2, 2], shootout: [3, 4], won: false, opponent: 'Cerulean Cascata' },
            ],
        });
        const text = dailyShareText(
            e,
            { weekCount: 4 },
            {
                title: 'Soccermon · Copa do Dia {d}/{m}',
                champion: 'Campeão!',
                out: '{n}/4',
                week: '{n}/7 dias na semana',
                pens: ' (pên. {a}x{b})',
            },
            (n) => n,
            'soccermon.com',
        );
        expect(text.split('\n')).toEqual([
            'Soccermon · Copa do Dia 19/10',
            '🟩🟥 1/4',
            '3x1 Pewter Rochedo',
            '2x2 (pên. 3x4) Cerulean Cascata',
            '4/7 dias na semana',
            'soccermon.com',
        ]);
    });
});
