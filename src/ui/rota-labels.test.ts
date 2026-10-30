import { describe, expect, it } from 'vitest';
import { buildCupMap } from '../engine/cup-map';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { type RunState, resumeScreenOf } from '../store/game-store';
import { cupMatchNow, foulOf, nextCupMode } from '../store/long-cup';
import { cupStep } from './components/AccountLink';
import { cupBarStage } from './components/CupBar';
import { buildShareText } from './share';
import { shareCardData } from './share-card';

/**
 * Rota Índigo (8 partidas) nas telas feitas pra Relâmpago (4 fases): nenhum rótulo pode virar "Oitavas"/"Semifinal",
 * e os rivais só existem até a casa de agora (`opponents` esparso, que vira `null` no save).
 */
const rng = new Rng('rota-labels', 'test');
const picks = [143, 68, 151, 142, 150, 25].map((id) => createInstance(id, rng));
const result = (stage: number, won: boolean) => ({
    stage,
    opponent: 'Ginásio de Pewter',
    score: won ? [2, 0] : [0, 1],
    shootout: null,
    won,
});
const rota = (patch: Partial<RunState>) =>
    ({
        teamName: 'Pallet FC',
        seed: 'rota',
        mode: 'longa',
        status: 'map',
        stage: 0,
        draftRound: 7,
        picks,
        lineup: picks.slice(0, 5).map((p) => p.uid),
        bench: [picks[5].uid],
        captainUid: picks[0].uid,
        // como volta do save: só a casa de agora tem rival
        opponents: [null, null, { name: 'Ginásio de Pewter', color: 0x888888, lineup: [], bench: [] }],
        results: [],
        ...patch,
    }) as unknown as RunState;

describe('Rota Índigo: rótulos da copa salva', () => {
    it('na escalação mostra a partida da Rota, nunca a fase da Relâmpago', () => {
        const step = cupStep({ ...rota({ status: 'lineup', stage: 0 }), played: 0 });
        expect(step).toBe('Rota Índigo · Partida 1 de 8');
        expect(cupStep({ ...rota({ status: 'lineup', stage: 3 }), played: 3 })).toBe('Rota Índigo · Partida 4 de 8');
        expect(cupStep({ ...rota({ status: 'lineup', stage: 7 }), played: 7 })).toBe('Rota Índigo · Final');
    });
    it('no mapa, num evento ou no grupo mostra a próxima partida (a de depois das jogadas)', () => {
        for (const status of ['map', 'event', 'treino', 'group'] as const)
            expect(cupStep({ ...rota({ status, stage: 1 }), played: 2 })).toBe('Rota Índigo · Partida 3 de 8');
    });
    it('a Relâmpago continua com as fases', () => {
        expect(cupStep({ status: 'lineup', stage: 2, draftRound: 7 })).toBe('Semifinal');
    });
});

describe('Rota Índigo: continuar pela Home', () => {
    it('cada parada da Rota volta pra própria tela (o evento abria a escalação e deixava jogar de novo)', () => {
        expect(resumeScreenOf('event')).toBe('event');
        expect(resumeScreenOf('map')).toBe('map');
        expect(resumeScreenOf('treino')).toBe('treino');
        expect(resumeScreenOf('group')).toBe('group');
        expect(resumeScreenOf('shop')).toBe('shop');
        expect(resumeScreenOf('reward')).toBe('reward');
        expect(resumeScreenOf('drafting')).toBe('draft');
        expect(resumeScreenOf('lineup')).toBe('lineup');
    });
});

describe('Rota Índigo: compartilhar', () => {
    it('eliminado: o texto diz em que partida da Rota caiu (não "nas quartas")', () => {
        const run = rota({
            status: 'eliminated',
            results: [result(0, false), result(1, true), result(2, false)] as never,
        });
        const text = buildShareText(run, 'pt');
        expect(text).toContain('Rota Índigo · Fim da linha na partida 3');
        expect(text).not.toMatch(/oitavas|quartas|semifinal/i);
    });
    it('card do título com as 8 partidas: "1/8"…"7/8" e a Final, em 2 fileiras', () => {
        const results = [0, 1, 2, 3, 4, 5, 6, 7].map((s) => result(s, true));
        const d = shareCardData(rota({ status: 'champion', results: results as never }), 0xf2c230, 'pt');
        expect(d.games.map((g) => g.stage)).toEqual(['1/8', '2/8', '3/8', '4/8', '5/8', '6/8', '7/8', 'Final']);
    });
});

describe('Rota Índigo: cartão da derrota', () => {
    const lost = (n: number) => Array.from({ length: n }, (_, s) => result(s, s !== n - 1));
    it('amarelo no mapa, vermelho na 2ª derrota do mapa', () => {
        expect(foulOf(rota({ status: 'map', stage: 0, results: lost(1) as never }))).toBe('yellow');
        expect(foulOf(rota({ status: 'eliminated', stage: 2, results: lost(3) as never }))).toBe('red');
    });
    it('cair no grupo ou perder a Final não é cartão vermelho (o cartão aparecia na saída do grupo)', () => {
        expect(foulOf(rota({ status: 'eliminated', stage: 6, results: lost(7) as never }))).toBeNull();
        expect(foulOf(rota({ status: 'group', stage: 5, results: lost(6) as never }))).toBeNull();
        expect(foulOf(rota({ status: 'eliminated', stage: 7, results: lost(8) as never }))).toBeNull();
    });
});

describe('Rota Índigo: fim da copa', () => {
    it('Nova copa no fim de uma Rota começa outra Rota; Relâmpago e Copa do Dia seguem Relâmpago', () => {
        expect(nextCupMode(rota({ status: 'champion' }))).toBe('longa');
        expect(nextCupMode({})).toBeUndefined();
        expect(nextCupMode({ daily: '2026-10-21' })).toBeUndefined();
    });
    it('vice: "Vice da Rota Índigo" (não "Fim da linha na partida 8"), em PT e EN', () => {
        const results = [0, 1, 2, 3, 4, 5, 6].map((s) => result(s, true)).concat(result(7, false));
        const run = rota({ status: 'eliminated', stage: 7, results: results as never });
        expect(buildShareText(run, 'pt')).toContain('Vice da Rota Índigo');
        expect(buildShareText(run, 'en')).toContain('Indigo Road runner-up');
        expect(buildShareText(run, 'pt')).not.toContain('Fim da linha');
    });
});

describe('a fase só na barra da copa', () => {
    // a placa do mapa contava `results.length` e a barra `run.stage`: depois de uma derrota de cartão amarelo uma dizia
    // "Partida 3 de 8" e a outra "Partida 4 de 8". O brand guide manda a fase só na barra (CupBar)
    it('as telas da Rota (mapa, treino, evento, grupo) não põem etiqueta no cabeçalho', async () => {
        const { readFileSync } = await import('node:fs');
        const src = readFileSync('src/ui/screens/CupMap.tsx', 'utf8');
        const heads = src.match(/<MenuHead[^>]*\/>/gs) ?? [];
        expect(heads.length).toBeGreaterThanOrEqual(4);
        expect(heads.filter((h) => h.includes('tag='))).toEqual([]);
    });
});

describe('a partida da Rota é a mesma na barra da copa e no Continuar', () => {
    // a barra contava `run.stage` (a última partida em que você entrou) e o Continuar `results.length` (a próxima):
    // no mapa depois da 3ª partida, de amarelo ou não, uma dizia "Partida 3 de 8" e a outra "Partida 4 de 8"
    const three = [result(0, true), result(1, true), result(2, false)];
    const between = rota({ status: 'map', stage: 2, results: three as never });
    it('fora de uma partida (mapa, evento, treino, Mercado, grupo) é a próxima a jogar', () => {
        for (const status of ['map', 'event', 'treino', 'shop', 'group'] as const) {
            const run = rota({ status, stage: 2, results: three as never });
            expect(cupMatchNow({ ...run, played: 3 })).toBe(3);
            expect(cupBarStage(run, status === 'shop' ? 'shop' : 'map', 'pt').full).toBe('Partida 4 de 8');
        }
        expect(cupStep({ ...between, played: 3 })).toBe('Rota Índigo · Partida 4 de 8');
    });
    it('no resultado e na recompensa da vitória é a que acabou; na escalação, a de agora', () => {
        expect(cupBarStage(between, 'result', 'pt').full).toBe('Partida 3 de 8');
        const lineup = rota({ status: 'lineup', stage: 3, results: three as never });
        expect(cupBarStage(lineup, 'lineup', 'pt')).toEqual({ full: 'Partida 4 de 8', short: '4/8' });
        expect(cupMatchNow({ ...lineup, played: 3 })).toBe(3);
        // recompensa: a da vitória (casa de partida) é da que acabou; a do Baú já é do caminho, a próxima
        const map = buildCupMap('rota');
        const at = (kind: string) => map.nodes.find((n) => n.kind === kind)!.id;
        const two = [result(0, true), result(1, true)] as never;
        expect(
            cupBarStage(rota({ status: 'reward', stage: 1, results: two, map, at: at('jogo') }), 'reward', 'pt').short,
        ).toBe('2/8');
        expect(
            cupBarStage(rota({ status: 'reward', stage: 1, results: two, map, at: at('bau') }), 'reward', 'pt').short,
        ).toBe('3/8');
    });
    it('a Final continua "Final" e a Relâmpago continua com a fase', () => {
        const all = [0, 1, 2, 3, 4, 5, 6].map((s) => result(s, true));
        expect(cupBarStage(rota({ status: 'group', stage: 6, results: all as never }), 'group', 'pt').full).toBe(
            'Final',
        );
        expect(cupMatchNow({ status: 'map', stage: 2, played: 3 })).toBe(2);
    });
});
