import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { ENGINE_VERSION } from '../engine/config';
import { buildCupOpponents } from '../engine/cup';
import { ESPECIAL_EVENT, EVENT_TYPES, weeklyEventType } from '../engine/specials';
import {
    bestDailyStreak,
    type DailyEntry,
    dailyDay,
    dailyEventType,
    dailySeed,
    dailyShareText,
    dailySticker,
    dailyStickerCard,
    dailyStreak,
    daysInARow,
    mergeDaily,
    putDaily,
    weekEvent,
    weekOf,
} from './daily';
import {
    dailyAfter,
    migrateSave,
    type PersistedSave,
    type RunState,
    SAVE_VERSION,
    savePart,
    seedFromUrl,
    useGame,
} from './game-store';

const entry = (day: string, patch: Partial<DailyEntry> = {}): DailyEntry => ({
    day,
    results: [],
    done: false,
    champion: false,
    ...patch,
});

describe('Semana Fora da Lei (16 a 22/11/2026, Brasília)', () => {
    it('começa à 00:00 de segunda e acaba à 23:59 de domingo em Brasília (já é segunda em UTC)', () => {
        expect(weekEvent(new Date('2026-11-16T02:59:00Z'))).not.toBe(ESPECIAL_EVENT); // domingo 15, 23:59
        expect(weekEvent(new Date('2026-11-16T03:00:00Z'))).toBe(ESPECIAL_EVENT);
        expect(weekEvent(new Date('2026-11-23T02:59:00Z'))).toBe(ESPECIAL_EVENT); // domingo 22, 23:59 (segunda UTC)
        expect(weekEvent(new Date('2026-11-23T03:00:00Z'))).not.toBe(ESPECIAL_EVENT);
    });

    it('fora do período volta a Semana do tipo; a Copa do Dia usa o mesmo evento', () => {
        const antes = new Date('2026-11-12T15:00:00Z');
        const depois = new Date('2026-11-25T15:00:00Z');
        expect(weekEvent(antes)).toBe(weeklyEventType(antes));
        expect(weekEvent(depois)).toBe(weeklyEventType(depois));
        expect(EVENT_TYPES).toContain(weekEvent(depois));
        expect(dailyEventType('2026-11-15')).not.toBe(ESPECIAL_EVENT);
        expect(dailyEventType('2026-11-16')).toBe(ESPECIAL_EVENT);
        expect(dailyEventType('2026-11-22')).toBe(ESPECIAL_EVENT);
        expect(dailyEventType('2026-11-23')).toBe(weeklyEventType(new Date('2026-11-23T12:00:00')));
    });

    it('a oeste de Brasília (Los Angeles): segunda em Brasília já é a semana nova, não volta o tipo da semana passada', () => {
        const tz = process.env.TZ;
        process.env.TZ = 'America/Los_Angeles';
        try {
            const now = new Date('2026-11-23T03:00:00Z'); // domingo 22, 19h em LA; segunda 23, 00h em Brasília
            expect(weekEvent(now)).toBe(weeklyEventType(new Date('2026-11-23T12:00:00')));
            expect(weekEvent(now)).not.toBe(weeklyEventType(new Date('2026-11-09T12:00:00')));
        } finally {
            process.env.TZ = tz;
        }
    });
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

describe('dias seguidos e figurinha do dia', () => {
    const e = (day: string, done = true) => ({
        day,
        results: [{ score: [1, 0] as [number, number], shootout: null, won: true, opponent: 'x' }],
        done,
        champion: false,
    });

    it('conta até hoje, ou até ontem se hoje ainda não jogou; um dia sem jogar zera', () => {
        const list = [e('2026-10-18'), e('2026-10-19'), e('2026-10-20')];
        expect(daysInARow(list, '2026-10-20')).toBe(3);
        expect(daysInARow(list, '2026-10-21')).toBe(3);
        expect(daysInARow(list, '2026-10-22')).toBe(0);
        expect(daysInARow([...list, e('2026-10-21', false)], '2026-10-21')).toBe(3);
    });

    it('melhor sequência e a figurinha (a mesma pra todo mundo no dia)', () => {
        const list = [e('2026-10-01'), e('2026-10-02'), e('2026-10-05'), e('2026-10-06'), e('2026-10-07')];
        expect(bestDailyStreak(list)).toBe(3);
        expect(dailySticker('2026-10-21')).toBe(dailySticker('2026-10-21'));
        expect(dailyStickerCard('2026-10-21').special?.kind).toBe('evento');
    });
});

describe('Copa do Dia anulada: 17/11/2026 jogada antes do motor 31 (Semana Fora da Lei)', () => {
    const jogo = { score: [2, 1] as [number, number], shootout: null, won: true, opponent: 'Pewter Rochedo' };
    const velha = entry('2026-11-17', { done: true, ranked: true, reported: 1, results: [jogo] });
    const outra = entry('2026-11-16', { done: true, ranked: true, results: [jogo] });
    afterEach(() => vi.useRealTimers());

    it('sem `engine` sai do save (backup antigo carrega) e o dia fica jogável', () => {
        const backup = JSON.parse(readFileSync('scripts/fixtures/backup-v6-pt.json', 'utf8'));
        const save = migrateSave({ ...backup.save, daily: [velha, outra] }, backup.version);
        expect(save.daily).toEqual([outra]);
        expect(save.hall.length).toBeGreaterThan(0);
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-11-17T15:00:00Z'));
        useGame.setState({ ...save, run: null });
        useGame.getState().startDaily(true);
        expect(useGame.getState().run?.seed).toBe('dia-20261117');
        expect(useGame.getState().daily[0]).toMatchObject({ day: '2026-11-17', done: false, engine: ENGINE_VERSION });
    });

    it('com `engine: 31` fica; outros dias (com ou sem motor) não mudam', () => {
        const nova = { ...velha, engine: 31 };
        const antiga = entry('2026-11-10', { done: true, engine: 30 });
        expect(mergeDaily([nova, outra, antiga])).toEqual([nova, outra, antiga]);
        expect(migrateSave({ daily: [nova, outra] }, SAVE_VERSION).daily).toEqual([nova, outra]);
    });

    it('a nuvem trazendo a entrada velha não ressuscita (nem sozinha, nem contra a nova)', () => {
        expect(mergeDaily([outra], [velha])).toEqual([outra]);
        const nova = entry('2026-11-17', { engine: ENGINE_VERSION });
        expect(mergeDaily([nova], [velha])).toEqual([nova]);
        // a nuvem passa pelo migrateSave antes de juntar (src/cloud/cloud.ts)
        expect(migrateSave({ daily: [velha] }, SAVE_VERSION).daily).toEqual([]);
    });

    it('ao abrir o jogo (save do aparelho na versão atual, sem `migrate`) sai a entrada e a copa velha em andamento', () => {
        const run = { seed: 'dia-20261117', daily: '2026-11-17', status: 'lineup', results: [] } as unknown as RunState;
        const saved = { ...migrateSave({}, SAVE_VERSION), daily: [velha, outra], run } as PersistedSave;
        const merge = useGame.persist.getOptions().merge;
        const out = merge?.(saved, useGame.getState()) as PersistedSave;
        expect(out.daily).toEqual([outra]);
        expect(out.run).toBeNull();
        // e o que sobe pra nuvem já vai sem ela
        useGame.setState(out);
        expect(savePart(useGame.getState()).daily).toEqual([outra]);
    });

    it('a copa de 17/11 do motor novo em andamento continua', () => {
        const run = { seed: 'dia-20261117', daily: '2026-11-17', status: 'lineup', results: [] } as unknown as RunState;
        const nova = entry('2026-11-17', { engine: 31 });
        const save = migrateSave({ daily: [nova], run }, SAVE_VERSION);
        expect(save.run?.seed).toBe('dia-20261117');
    });

    it('entrada nova sai com o motor de agora', () => {
        expect(putDaily([], entry('2026-11-18'))[0].engine).toBe(ENGINE_VERSION);
    });
});
