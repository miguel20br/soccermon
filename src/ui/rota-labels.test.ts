import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { type RunState, resumeScreenOf } from '../store/game-store';
import { cupStep } from './components/AccountLink';
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
