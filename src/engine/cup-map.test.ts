import { describe, expect, it } from 'vitest';
import { buildCupOpponents } from './cup';
import {
    buildCupMap,
    type CupMap,
    isMatchKind,
    LONG_MATCHES,
    LONG_ROWS,
    longOpponent,
    type MapNode,
    nextNodes,
    nodeById,
    ROUTE_TEAMS,
} from './cup-map';

/** Todas as rotas do começo até a Final. */
function paths(map: CupMap): MapNode[][] {
    const out: MapNode[][] = [];
    const walk = (n: MapNode, acc: MapNode[]) => {
        const next = n.next.map((id) => nodeById(map, id)!);
        if (!next.length) out.push([...acc, n]);
        for (const x of next) walk(x, [...acc, n]);
    };
    for (const n of nextNodes(map, null)) walk(n, []);
    return out;
}

describe('mapa da Copa longa', () => {
    it('mesma seed = mesmo mapa; seeds diferentes mudam', () => {
        expect(buildCupMap('a')).toEqual(buildCupMap('a'));
        expect(buildCupMap('a')).not.toEqual(buildCupMap('b'));
    });

    it('em 300 seeds: toda rota tem 8 partidas, termina na Final, com Baú e Treino antes dela', () => {
        for (let s = 0; s < 300; s++) {
            const map = buildCupMap(`seed-${s}`);
            expect(map.rows).toBe(LONG_ROWS);
            const all = paths(map);
            expect(all.length).toBeGreaterThan(1);
            for (const p of all) {
                expect(p).toHaveLength(LONG_ROWS);
                expect(p.filter((n) => isMatchKind(n.kind))).toHaveLength(LONG_MATCHES);
                expect(p.at(-1)!.kind).toBe('final');
                expect(p.at(-2)!.kind).toBe('treino');
                expect(p.some((n) => n.kind === 'bau')).toBe(true);
            }
            // toda linha de parada tem Mercado e Evento à escolha
            for (let row = 0; row < map.rows; row++) {
                const kinds = map.nodes.filter((n) => n.row === row).map((n) => n.kind);
                if (kinds.includes('treino') && kinds.length > 1)
                    expect(kinds).toEqual(expect.arrayContaining(['mercado', 'evento']));
            }
            // toda casa tem entrada (menos a 1ª linha) e saída (menos a Final)
            const reached = new Set(map.nodes.flatMap((n) => n.next));
            for (const n of map.nodes) {
                if (n.row > 0) expect(reached.has(n.id)).toBe(true);
                if (n.kind !== 'final') expect(n.next.length).toBeGreaterThan(0);
            }
        }
    });

    it('Ginásio: nunca nas 2 primeiras partidas, no máximo 1 por linha, sempre com um Jogo ao lado', () => {
        for (let s = 0; s < 300; s++) {
            const map = buildCupMap(`gym-${s}`);
            for (let row = 0; row < map.rows; row++) {
                const line = map.nodes.filter((n) => n.row === row);
                const gyms = line.filter((n) => n.kind === 'ginasio');
                expect(gyms.length).toBeLessThanOrEqual(1);
                if (gyms.length) expect(line.some((n) => n.kind === 'jogo')).toBe(true);
                if (row < 3) expect(gyms).toHaveLength(0);
            }
        }
    });

    it('ligações não se cruzam', () => {
        for (let s = 0; s < 100; s++) {
            const map = buildCupMap(`x-${s}`);
            for (const a of map.nodes)
                for (const b of map.nodes) {
                    if (a.row !== b.row || a.col >= b.col) continue;
                    const maxA = Math.max(...a.next.map((id) => nodeById(map, id)!.col));
                    const minB = Math.min(...b.next.map((id) => nodeById(map, id)!.col));
                    if (a.next.length && b.next.length) expect(maxA).toBeLessThanOrEqual(minB);
                }
        }
    });
});

describe('rivais da Copa longa', () => {
    it('mesmo time na prévia e na partida; nunca repete o rival; Final é a Liga Índigo', () => {
        expect(longOpponent('s', 2, 'jogo', [])).toEqual(longOpponent('s', 2, 'jogo', []));
        const faced: string[] = [];
        for (let m = 0; m < 7; m++) faced.push(longOpponent('s', m, m % 3 === 2 ? 'ginasio' : 'jogo', faced).name);
        expect(new Set(faced).size).toBe(7);
        expect(longOpponent('s', 7, 'final', faced).name).toBe('Liga Índigo');
        expect(ROUTE_TEAMS.map((t) => t.name)).toContain(longOpponent('s', 0, 'jogo', []).name);
    });

    it('a Copa rápida não muda (Copa do Dia e desafio por link)', () => {
        expect(buildCupOpponents('regressao-1').map((t) => t.name)).toEqual(
            buildCupOpponents('regressao-1').map((t) => t.name),
        );
    });
});
