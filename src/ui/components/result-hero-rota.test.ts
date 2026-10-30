import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));

import type { MatchResult } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import type { RunState } from '../../store/game-store';
import { ResultHero } from './ResultHero';

const opponent = { name: 'Ginásio de Pewter', color: 0x888888, lineup: [], bench: [] } as unknown as TeamSetup;
const match = { winner: 1, score: [1, 2], shootout: null, finalRoster: [], events: [] } as unknown as MatchResult;
const res = (stage: number, won: boolean) => ({ stage, opponent: opponent.name, score: won ? [2, 0] : [1, 2], won });
const html = (run: Partial<RunState> & { match?: MatchResult }) =>
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
            match: run.match ?? match,
            opponent,
            names: ['Pallet FC', 'Ginásio de Pewter'],
            mvpUid: null,
            actions: null,
        }),
    );

/** Na Rota Índigo perder nem sempre é o fim: cartão amarelo no mapa e derrota no grupo seguem a copa. */
describe('resultado da Rota Índigo', () => {
    it('cartão amarelo: DERROTA (a regra vai no cartão), não "Fim da linha"', () => {
        const out = html({ status: 'map', stage: 0, results: [res(0, false)] as never });
        expect(out).toContain('DERROTA');
        // a copa segue: "Partida 1 de 8" fica só na barra da copa, sem etiqueta nem linha repetindo no resultado
        expect(out).not.toContain('Partida 1 de 8');
        expect(out).not.toContain('rh-sub');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha/);
    });
    it('derrota no grupo: DERROTA e a tabela decide, não "Fim da linha"', () => {
        const results = [0, 1, 2, 3, 4].map((s) => res(s, true)).concat(res(5, false));
        const out = html({ status: 'group', stage: 5, results: results as never });
        expect(out).toContain('Vale a tabela do grupo');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha|Oitavas|Semifinal/);
    });
    it('eliminado de verdade (vermelho): DERROTA no título, o cartão vermelho fica no cartão de baixo', () => {
        const out = html({
            status: 'eliminated',
            stage: 2,
            results: [res(0, false), res(1, true), res(2, false)] as never,
        });
        // "CARTÃO VERMELHO" no título repetia o cartão "Cartão vermelho. Segundo amarelo" logo embaixo
        expect(out).toContain('aria-label="DERROTA"');
        expect(out).not.toContain('CARTÃO VERMELHO');
        expect(out).toContain('Fora na partida 3 de 8');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha/);
    });
    it('vice: a linha é "Vice da Rota Índigo", não a Copa de Kanto', () => {
        const results = [0, 1, 2, 3, 4, 5, 6].map((s) => res(s, true)).concat(res(7, false));
        const out = html({ status: 'eliminated', stage: 7, results: results as never });
        expect(out).toContain('aria-label="VICE"');
        expect(out).toContain('Perdeu a Final da Rota Índigo');
        expect(out).not.toMatch(/Copa de Kanto|FIM DA LINHA|Fim da linha/);
    });
    it('ganhou a última rodada mas ficou fora do grupo: FORA DA FINAL, sem "VITÓRIA!" nem Final como próxima', () => {
        const results = [0, 1, 2, 3, 4].map((s) => res(s, true)).concat(res(5, true));
        const group = { rivals: [opponent, opponent, opponent] };
        const out = html({
            match: { ...match, winner: 0, score: [2, 0] } as unknown as MatchResult,
            status: 'eliminated',
            stage: 5,
            results: results as never,
            group: group as never,
            opponents: [opponent, opponent, opponent, opponent, opponent, opponent, opponent, opponent],
        });
        expect(out).toContain('FORA DA FINAL');
        expect(out).not.toContain('VITÓRIA');
        expect(out).not.toContain('rh-next');
        expect(out).not.toContain('class="next"');
    });
    it('perdeu a última rodada e ficou fora do grupo: FORA DA FINAL e a posição, não "Fim da linha na partida 7"', () => {
        const results = [0, 1, 2, 3, 4].map((s) => res(s, true)).concat(res(5, false));
        const out = html({
            status: 'eliminated',
            stage: 5,
            results: results as never,
            group: { rivals: [opponent, opponent, opponent] } as never,
            opponents: [opponent, opponent, opponent, opponent, opponent, opponent, opponent, opponent],
        });
        expect(out).toContain('FORA DA FINAL');
        expect(out).toContain('no grupo');
        expect(out).not.toMatch(/FIM DA LINHA|Fim da linha/);
    });
    it('Rota: o ₽ da vitória aparece no resultado', () => {
        const wonMatch = { ...match, winner: 0, score: [2, 0] } as unknown as MatchResult;
        const out = renderToStaticMarkup(
            createElement(ResultHero, {
                run: {
                    teamName: 'P',
                    mode: 'longa',
                    seed: 'r',
                    picks: [],
                    status: 'reward',
                    stage: 0,
                    results: [],
                    opponents: [opponent],
                } as unknown as RunState,
                match: wonMatch,
                opponent,
                names: ['P', 'R'],
                mvpUid: null,
                actions: null,
            }),
        );
        expect(out).toContain('rh-gain');
    });
});
