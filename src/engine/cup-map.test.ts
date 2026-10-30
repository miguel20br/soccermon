import { describe, expect, it } from 'vitest';
import { buildCupOpponents } from './cup';
import {
    BRANCHES,
    buildCupMap,
    type CupMap,
    isMatchKind,
    LEGENDARY_BIRD,
    LONG_ROWS,
    longGroup,
    longOpponent,
    MAP_MATCHES,
    type MapNode,
    mapPrizes,
    nextNodes,
    nodeById,
    PRIZES,
    ROTA_RULES,
    ROUTE_TEAMS,
    ROUTE_THEME_MIN,
    rivalTypes,
} from './cup-map';
import { species } from './data';
import { Rng } from './rng';

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

    it('em 300 seeds: toda rota das eliminatórias tem 4 partidas, passa no Baú ou no Centro e termina no Treino', () => {
        for (let s = 0; s < 300; s++) {
            const map = buildCupMap(`seed-${s}`);
            expect(map.rows).toBe(LONG_ROWS);
            const all = paths(map);
            expect(all.length).toBeGreaterThan(1);
            for (const p of all) {
                expect(p).toHaveLength(LONG_ROWS);
                expect(p.filter((n) => isMatchKind(n.kind))).toHaveLength(MAP_MATCHES);
                expect(p.at(-1)!.kind).toBe('treino');
                expect(p.some((n) => n.kind === 'bau' || n.kind === 'centro')).toBe(true);
                // escassez: no máximo `maxShops` Mercados por caminho (e, sem `shopWithTreino`, nunca com Treino de parada)
                const shops = p.filter((n) => n.kind === 'mercado').length;
                expect(shops).toBeLessThanOrEqual(ROTA_RULES.maxShops);
                if (shops && !ROTA_RULES.shopWithTreino)
                    expect(p.slice(0, -1).some((n) => n.kind === 'treino')).toBe(false);
            }
            // toda casa tem entrada (menos a 1ª linha) e saída (menos a Final)
            const reached = new Set(map.nodes.flatMap((n) => n.next));
            for (const n of map.nodes) {
                if (n.row > 0) expect(reached.has(n.id)).toBe(true);
                if (n.kind !== 'treino') expect(n.next.length).toBeGreaterThan(0);
            }
        }
    });

    it('Ginásio: nunca na 1ª partida, no máximo 1 por linha, sempre com um Jogo ao lado', () => {
        for (let s = 0; s < 300; s++) {
            const map = buildCupMap(`gym-${s}`);
            for (let row = 0; row < map.rows; row++) {
                const line = map.nodes.filter((n) => n.row === row);
                const gyms = line.filter((n) => n.kind === 'ginasio');
                expect(gyms.length).toBeLessThanOrEqual(1);
                if (gyms.length) expect(line.some((n) => n.kind === 'jogo')).toBe(true);
                if (row < 2) expect(gyms).toHaveLength(0);
            }
        }
    });

    it('escassez ajustável: 1 ou 2 Mercados por caminho, com ou sem Treino junto', () => {
        const rules = { ...ROTA_RULES };
        try {
            for (const [maxShops, shopWithTreino] of [
                [1, false],
                [2, false],
                [2, true],
            ] as const) {
                Object.assign(ROTA_RULES, { maxShops, shopWithTreino });
                let most = 0;
                let together = false;
                for (let s = 0; s < 200; s++)
                    for (const p of paths(buildCupMap(`escassez-${s}`))) {
                        const shops = p.filter((n) => n.kind === 'mercado').length;
                        most = Math.max(most, shops);
                        together ||= shops > 0 && p.slice(0, -1).some((n) => n.kind === 'treino');
                    }
                expect(most).toBe(maxShops);
                expect(together).toBe(shopWithTreino);
            }
            // a casa que sobra pode virar Baú (fora da linha do Baú)
            Object.assign(ROTA_RULES, { maxShops: 1, shopWithTreino: false, spare: 'bau' });
            const bauRows = new Set<number>();
            for (let s = 0; s < 50; s++)
                for (const n of buildCupMap(`escassez-${s}`).nodes) if (n.kind === 'bau') bauRows.add(n.row);
            expect(bauRows.size).toBeGreaterThan(1);
        } finally {
            Object.assign(ROTA_RULES, rules);
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

describe('ramos e prêmios (revisão da Rota)', () => {
    it('cada coluna tem os tipos do ramo; todo Jogo mostra um prêmio, diferente dos outros Jogos da linha', () => {
        for (let s = 0; s < 200; s++) {
            const map = buildCupMap(`ramo-${s}`);
            for (const n of map.nodes) expect(BRANCHES.map((b) => b.join())).toContain(n.types!.join());
            const row0 = map.nodes.filter((n) => n.row === 0);
            expect(new Set(row0.map((n) => n.types!.join())).size).toBe(3);
            for (let row = 0; row < map.rows; row++) {
                const jogos = map.nodes.filter((n) => n.row === row && n.kind === 'jogo');
                for (const j of jogos) expect(mapPrizes()).toContain(j.prize);
                expect(new Set(jogos.map((j) => j.prize)).size).toBe(jogos.length);
            }
            for (const n of map.nodes.filter((x) => x.kind !== 'jogo')) expect(n.prize).toBeUndefined();
        }
    });

    it('com o Pokémon do rival em todo Jogo, o prêmio do mapa é MT, item ou ₽ em dobro (nunca o Pokémon de novo)', () => {
        const before = ROTA_RULES.rivalEveryJogo;
        try {
            ROTA_RULES.rivalEveryJogo = true;
            expect([...mapPrizes()].sort()).toEqual(['item', 'money', 'tm']);
            for (let s = 0; s < 100; s++)
                for (const n of buildCupMap(`rival-${s}`).nodes) expect(n.prize).not.toBe('pokemon');
            ROTA_RULES.rivalEveryJogo = false;
            expect(mapPrizes()).toEqual(PRIZES);
        } finally {
            ROTA_RULES.rivalEveryJogo = before;
        }
    });

    it('o rival puxa os tipos do ramo; o Ginásio vem +2; o pássaro lendário entra de titular', () => {
        for (let s = 0; s < 40; s++) {
            const opp = longOpponent(`tipo-${s}`, 1, 'jogo', [], { types: ['Water', 'Grass'] });
            expect(rivalTypes(opp.name).some((t) => t === 'Water' || t === 'Grass')).toBe(true);
        }
        let gym = 0;
        let jogo = 0;
        for (let s = 0; s < 40; s++) {
            const avg = (t: { lineup: { speciesId: number }[] }) =>
                t.lineup.reduce((a, p) => a + species(p.speciesId).bst, 0) / t.lineup.length;
            gym += avg(longOpponent(`g-${s}`, 1, 'ginasio', []));
            jogo += avg(longOpponent(`g-${s}`, 1, 'jogo', []));
        }
        expect(gym / 40).toBeGreaterThan(jogo / 40 + 20);
        const boss = longOpponent('boss', 3, 'jogo', [], { boss: LEGENDARY_BIRD });
        expect(boss.lineup.some((p) => p.speciesId === LEGENDARY_BIRD)).toBe(true);
        expect(boss.lineup.find((p) => p.uid === boss.captainUid)).toBeDefined();
        expect(longOpponent('r', 2, 'jogo', [], { club: 'Equipe Rocket' }).name).toBe('Equipe Rocket');
    });
});

describe('escolhas no mapa', () => {
    it('em 400 seeds, 95%+ das rotas ao acaso passam por uma bifurcação entre casas diferentes (tipo ou prêmio)', () => {
        let withChoice = 0;
        let total = 0;
        for (let s = 0; s < 400; s++) {
            const map = buildCupMap(`seed-${s}`);
            for (const start of nextNodes(map, null)) {
                let n = start;
                let real = false;
                const rng = new Rng(`w${s}${start.id}`, 'x');
                while (n.next.length) {
                    const key = (id: string) => `${nodeById(map, id)!.kind}:${nodeById(map, id)!.prize ?? ''}`;
                    if (new Set(n.next.map(key)).size > 1) real = true;
                    n = nodeById(map, rng.pick(n.next))!;
                }
                total++;
                if (real) withChoice++;
            }
        }
        expect(withChoice / total).toBeGreaterThanOrEqual(0.95);
    });

    it('save antigo: mapa salvo sem diagonais continua andando (o mapa vive no RunState, não é refeito da seed)', () => {
        const old: CupMap = {
            rows: 2,
            nodes: [
                { id: 'r0c0', row: 0, col: 0, kind: 'jogo', next: ['r1c0'] },
                { id: 'r0c1', row: 0, col: 1, kind: 'jogo', next: ['r1c1'] },
                { id: 'r1c0', row: 1, col: 0, kind: 'evento', next: [] },
                { id: 'r1c1', row: 1, col: 1, kind: 'mercado', next: [] },
            ],
        };
        expect(nextNodes(old, 'r0c0').map((n) => n.id)).toEqual(['r1c0']);
        expect(nextNodes(old, null)).toHaveLength(2);
    });
});

describe('rivais da Copa longa', () => {
    it('mesmo time na prévia e na partida; nunca repete o rival; Final é a Liga Índigo', () => {
        expect(longOpponent('s', 2, 'jogo', [])).toEqual(longOpponent('s', 2, 'jogo', []));
        const faced: string[] = [];
        for (let m = 0; m < 4; m++) faced.push(longOpponent('s', m, m % 3 === 2 ? 'ginasio' : 'jogo', faced).name);
        faced.push(...longGroup('s', faced).map((o) => o.name));
        expect(new Set(faced).size).toBe(7);
        expect(longOpponent('s', 7, 'final', faced).name).toBe('Liga Índigo');
        expect(ROUTE_TEAMS.map((t) => t.name)).toContain(longOpponent('s', 0, 'jogo', []).name);
    });

    it('todo treinador da Rota joga com o tipo dele: 3+ dos 5 titulares (Ornitólogo com pássaros)', () => {
        const names = ROUTE_TEAMS.map((t) => t.name);
        for (const team of ROUTE_TEAMS)
            for (let s = 0; s < 30; s++)
                for (let m = 0; m < MAP_MATCHES + 3; m++) {
                    const opp = longOpponent(
                        `tema-${s}`,
                        m,
                        'jogo',
                        names.filter((n) => n !== team.name),
                        { shift: (s % 3) - 1 },
                    );
                    expect(opp.name).toBe(team.name);
                    const themed = opp.lineup.filter((p) =>
                        species(p.speciesId).types.some((t) => team.types.includes(t)),
                    );
                    expect(themed.length, `${team.name} seed ${s} partida ${m}`).toBeGreaterThanOrEqual(
                        ROUTE_THEME_MIN,
                    );
                }
    });

    it('a Copa rápida não muda (Copa do Dia e desafio por link)', () => {
        expect(buildCupOpponents('regressao-1').map((t) => t.name)).toEqual(
            buildCupOpponents('regressao-1').map((t) => t.name),
        );
    });
});
