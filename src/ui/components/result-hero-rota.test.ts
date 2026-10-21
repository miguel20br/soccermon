import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));

import type { MatchResult } from '../../engine/match';
import type { TeamSetup } from '../../engine/state';
import type { RunState } from '../../store/game-store';
import { ResultHero } from './ResultHero';

const opponent = { name: 'Ginásio de Pewter', color: 0x888888, lineup: [], bench: [] } as unknown as TeamSetup;
const match = { winner: 1, score: [1, 2], shootout: null, finalRoster: [], events: [] } as unknown as MatchResult;
const res = (stage: number, won: boolean) => ({ stage, opponent: opponent.name, score: won ? [2, 0] : [1, 2], won });
const html = (run: Partial<RunState>) =>
    renderToStaticMarkup(
        createElement(ResultHero, {
            run: {
                teamName: 'Pallet FC',
                mode: 'longa',
                seed: 'rota',
                picks: [],
                // rivais esparsos (como no save da Rota): só os já enfrentados
                opponents: [opponent, null, null, null, null, opponent],
                ...run,
            } as unknown as RunState,
            match,
            opponent,
            names: ['Pallet FC', 'Ginásio de Pewter'],
            mvpUid: null,
            actions: null,
        }),
    );

/** Na Rota Índigo perder nem sempre é o fim: cartão amarelo no mapa e derrota no grupo seguem a copa. */
describe('resultado da Rota Índigo', () => {
    it('cartão amarelo: DERROTA e a linha do amarelo, não "Fim da linha"', () => {
        const out = html({ status: 'map', stage: 0, results: [res(0, false)] as never });
        expect(out).toContain('DERROTA');
        expect(out).toContain('A derrota não eliminou');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha/);
    });
    it('derrota no grupo: DERROTA e a tabela decide, não "Fim da linha"', () => {
        const results = [0, 1, 2, 3, 4].map((s) => res(s, true)).concat(res(5, false));
        const out = html({ status: 'group', stage: 5, results: results as never });
        expect(out).toContain('Derrota no grupo');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha|Oitavas|Semifinal/);
    });
    it('eliminado de verdade (vermelho): Fim da linha', () => {
        const out = html({
            status: 'eliminated',
            stage: 2,
            results: [res(0, false), res(1, true), res(2, false)] as never,
        });
        expect(out).toContain('Fim da linha na partida 3');
    });
});
