import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));
// com a Semana Fora da Lei ligada (nos testes o tema fica desligado)
vi.mock('../tema', async (orig) => ({ ...(await orig<typeof import('../tema')>()), tema: 'neon', neonOn: true }));

import type { MatchResult } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import type { RunState } from '../../store/game-store';
import { ResultHero } from './ResultHero';

const opponent = { name: 'Ginásio de Pewter', color: 0x888888, lineup: [], bench: [] } as unknown as TeamSetup;
const result = (winner: 0 | 1 | null, score: [number, number]) =>
    ({ winner, score, shootout: null, finalRoster: [], events: [] }) as unknown as MatchResult;
const res = (stage: number, won: boolean) => ({ stage, opponent: opponent.name, score: won ? [2, 0] : [1, 2], won });
const hero = (match: MatchResult, extra: { run?: Partial<RunState>; duel?: boolean } = {}) =>
    renderToStaticMarkup(
        createElement(ResultHero, {
            run: extra.run
                ? ({
                      teamName: 'Pallet FC',
                      mode: 'longa',
                      seed: 'rota',
                      picks: [],
                      opponents: [opponent, opponent, opponent, opponent, opponent, opponent, opponent, opponent],
                      ...extra.run,
                  } as unknown as RunState)
                : undefined,
            duel: extra.duel
                ? { side: 0, stage: 'Duelo', title: 'EMPATE', sub: '', colors: [0xff0000, 0x0000ff] }
                : undefined,
            match,
            opponent,
            names: ['Pallet FC', 'Ginásio de Pewter'],
            mvpUid: null,
            actions: null,
        }),
    );

describe('fim de jogo da Semana Fora da Lei', () => {
    it('empate no Duelo: EMPATE, não PERDEU', () => {
        const out = hero(result(null, [2, 2]), { duel: true });
        expect(out).toContain('EMPATE');
        expect(out).not.toContain('PERDEU');
        expect(out).not.toContain('rh-gta');
    });

    it('Rota, fora no grupo ganhando a última: o título de sempre, sem PERDEU em cima da vitória', () => {
        const results = [0, 1, 2, 3, 4].map((s) => res(s, true)).concat(res(5, true));
        const out = hero(result(0, [2, 0]), {
            run: {
                status: 'eliminated',
                stage: 5,
                results: results as never,
                group: { rivals: [opponent, opponent, opponent] } as never,
            },
        });
        expect(out).not.toContain('PERDEU');
        expect(out).toContain('FORA DA FINAL');
    });

    it('Final da Rota perdida continua PERDEU', () => {
        const results = [0, 1, 2, 3, 4, 5, 6].map((s) => res(s, true)).concat(res(7, false));
        const out = hero(result(1, [1, 2]), { run: { status: 'eliminated', stage: 7, results: results as never } });
        expect(out).toContain('PERDEU');
        expect(out).toContain('rh-loss rh-gta');
    });

    it('as estrelas acendem com 1 gol de vantagem, uma por gol, até 5', () => {
        const stars = (score: [number, number]) => (hero(result(0, score)).match(/class="on"/g) ?? []).length;
        expect(stars([2, 1])).toBe(1);
        expect(hero(result(0, [2, 1]))).toContain('aria-label="Vantagem: 1 gol"');
        expect(stars([3, 1])).toBe(2);
        expect(stars([9, 0])).toBe(5);
        expect(hero(result(null, [1, 1]))).not.toContain('rh-wanted');
    });
});
