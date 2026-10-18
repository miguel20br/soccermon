import { describe, expect, it } from 'vitest';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent } from '../engine/state';
import { setLang } from '../i18n';
import { type Clock, clockParts, pickTab } from './components/MatchHud';
import { PRESSURE_BINS, pressureUntil } from './match-view';

const ev = (e: Partial<MatchEvent> & { type: MatchEvent['type'] }) => ({ half: 1, ...e }) as MatchEvent;

/** Partida mínima: jogador 0 do time da esquerda, 1 do da direita. */
const fake = (events: MatchEvent[]) =>
    ({
        events,
        roster: [
            { idx: 0, team: 0 },
            { idx: 1, team: 1 },
        ],
    }) as unknown as MatchResult;

describe('barra de pressão', () => {
    const m = fake([
        ev({ type: 'shot', tick: 100, minute: 1, by: 0, xg: 0.3, moveId: null }),
        ev({ type: 'goal', tick: 101, minute: 1, by: 0, assist: null, team: 0, score: [1, 0], ownGoal: false }),
        ev({ type: 'shot', tick: 3000, minute: 25, by: 1, xg: 0.5, moveId: null }),
        ev({ type: 'fulltime', tick: 4800, minute: 40, score: [1, 0] }),
        // disputa de pênaltis depois do apito: não conta
        ev({ type: 'shot', tick: 4900, minute: 40, by: 1, xg: 0.8, moveId: null }),
    ]);

    it('nunca conta o que ainda não passou na tela (a partida da copa vem calculada inteira)', () => {
        const early = pressureUntil(m, 500);
        expect(early).toHaveLength(PRESSURE_BINS);
        expect(early[0].xg).toEqual([0.3, 0]);
        expect(early[0].goals).toEqual([1, 0]);
        // o chute do minuto 25 é futuro: nenhuma coluna tem nada do time da direita
        expect(early.every((b) => b.xg[1] === 0)).toBe(true);
        expect(pressureUntil(m, 100)[0].goals).toEqual([0, 0]);
    });

    it('coluna de 2 em 2 minutos; pênaltis depois do apito ficam de fora', () => {
        const all = pressureUntil(m, Number.POSITIVE_INFINITY);
        expect(all[12].xg).toEqual([0, 0.5]);
        expect(all.at(-1)?.xg).toEqual([0, 0]);
    });
});

describe('aba do painel do técnico', () => {
    it('volta a aba guardada se ela existe neste layout, senão a padrão', () => {
        const mobile = ['tactic', 'board', 'team', 'feed'] as const;
        const desk = ['board', 'team', 'feed'] as const;
        expect(pickTab('team', mobile, 'tactic')).toBe('team');
        expect(pickTab(null, mobile, 'tactic')).toBe('tactic');
        expect(pickTab('lixo', mobile, 'tactic')).toBe('tactic');
        // no desktop a Tática fica embaixo da quadra: abre na Prancheta
        expect(pickTab('tactic', desk, 'board')).toBe('board');
    });
});

describe('relógio do placar em duas linhas', () => {
    it('minuto e tempo no jogo; intervalo, fim e pênaltis como texto', () => {
        setLang('pt');
        const clock: Clock = { tick: 2400, minute: 19.9, half: 1, score: [1, 0], phase: 'play' };
        expect(clockParts(clock, false, null)).toMatchObject({ main: "19'", sub: '1º tempo', text: false });
        expect(clockParts(clock, false, null, true)).toMatchObject({ main: 'Intervalo', text: true, progress: 0.5 });
        expect(clockParts(clock, true, [3, 2])).toMatchObject({ main: 'Pênaltis 3 x 2', progress: 1 });
    });
});
