import {
    BRANCHES,
    type CupMap,
    LONG_ROWS,
    type MapNode,
    mapPrizes,
    matchIndexOfRow,
    type NodeKind,
    REGION_STONES,
    ROTA_RULES,
    regionOfRow,
} from '../engine/cup-map';
import { Rng } from '../engine/rng';

/**
 * Mapa largo da Rota Índigo (opção B, docs/planos/rota-indigo.md, Miguel em 09/11): 4 casas por linha, cada uma liga
 * em 2 ou 3 da linha de cima (os caminhos se cruzam em X, se juntam e se separam) e casas vizinhas nunca são do mesmo
 * tipo, então todo passo é uma escolha entre tipos diferentes. A última parada vira escolha (Treino, Mercado do
 * Planalto ou Centro). Continuam as mesmas 9 linhas e as 8 partidas (4 no mapa). Rota guardada antes continua com o
 * mapa estreito (`mapV` ausente no save).
 *
 * As casas novas vivem em cima dos tipos de sempre (`casa`): o Ás é um Jogo, a Zona Safari e o Cassino são paradas de
 * evento e o Mercado do Planalto é um Mercado. Uma versão antiga do jogo que abrir esse save cai no tipo de base.
 */
export const MAP_V = 2;

export type Casa = 'as' | 'safari' | 'cassino' | 'planalto';
export type RotaNode = MapNode & { casa?: Casa };
/** A casa nova (sem = a de sempre). */
export const casaOf = (n: MapNode | undefined): Casa | undefined => (n as RotaNode | undefined)?.casa;
/** O que a casa é pra tela, pro robô e pra telemetria: a casa nova ou o tipo. */
export type House = NodeKind | Casa;
export const houseOf = (n: MapNode): House => casaOf(n) ?? n.kind;

/**
 * Treinador Ás (elite leve): o rival vem +1 e o prêmio é 1 de 3 cartas raras, duas raridades acima da partida (até a
 * mais alta). Com a mais alta desde a 1ª partida, quem pegava todo Ás ganhava 5 pp de título (robô, 09/11).
 */
export const ACE_SHIFT = 1;
export const ACE_ROUND_UP = 2;

/** O papel de cada linha (as mesmas 9 do mapa estreito): partida, parada, Baú/Centro e a última parada. */
const ROLE = ['M', 'S', 'M', 'S', 'B', 'M', 'S', 'M', 'T'] as const;
export const ROW_ROLES: readonly (typeof ROLE)[number][] = ROLE;
/** Casas por linha (a última tem as 3 paradas finais). */
const WIDTH = 4;

const BASE: Record<House, NodeKind> = {
    jogo: 'jogo',
    ginasio: 'ginasio',
    mercado: 'mercado',
    evento: 'evento',
    treino: 'treino',
    bau: 'bau',
    centro: 'centro',
    final: 'final',
    as: 'jogo',
    safari: 'evento',
    cassino: 'evento',
    planalto: 'mercado',
};

/** Embaralha até nenhuma casa ficar ao lado de outra do mesmo tipo (Baú, Baú: escolha de mentira). */
function spread(rng: Rng, kinds: House[]): House[] {
    for (let i = 0; i < 50; i++) {
        const out = rng.shuffle([...kinds]);
        if (out.every((k, j) => j === 0 || k !== out[j - 1])) return out;
    }
    return kinds;
}

/** Linha de partida: 2 Jogos alternados com o Ginásio e o Ás (a 1ª linha: 3 Jogos e o Ás). */
function matchRow(rng: Rng, row: number): House[] {
    if (row === 0) return rng.shuffle<House>(['jogo', 'jogo', 'jogo', 'as']);
    const elites = rng.shuffle<House>(['ginasio', 'as']);
    return rng.chance(0.5) ? ['jogo', elites[0], 'jogo', elites[1]] : [elites[0], 'jogo', elites[1], 'jogo'];
}

/** Ligações de uma linha pra de cima: a casa de cima mais perto e uma vizinha (às vezes as duas). */
function links(rng: Rng, a: number, b: number): number[][] {
    return Array.from({ length: a }, (_, i) => {
        // a coluna dela na linha de cima (4 → 3: as duas do meio dividem a casa do meio)
        const at = a === b ? i : Math.round((i * (b - 1)) / (a - 1));
        const left = at - 1 >= 0;
        const right = at + 1 < b;
        const both = left && right && rng.chance(0.35);
        const side = !left ? at + 1 : !right ? at - 1 : rng.chance(0.5) ? at - 1 : at + 1;
        return both ? [at - 1, at, at + 1] : [Math.min(at, side), Math.max(at, side)];
    });
}

export function buildRotaMap(seed: string): CupMap {
    const rng = new Rng(seed, 'rota-map');
    const stopRows = ROLE.flatMap((r, i) => (r === 'S' ? [i] : []));
    // escassez sem conserto depois: só `maxShops` das 3 linhas de parada têm Mercado (o do Planalto é à parte)
    const shopRows = new Set(rng.shuffle(stopRows).slice(0, ROTA_RULES.maxShops));
    const houses: House[][] = ROLE.map((role, row) => {
        if (role === 'M') return matchRow(rng, row);
        if (role === 'T') return rng.shuffle<House>(['treino', 'planalto', 'centro']);
        if (role === 'B') return spread(rng, ['bau', 'bau', 'centro', rng.pick<House>(['safari', 'cassino'])]);
        // parada: na Rota 1 ainda não tem ₽ pro Cassino. Linha de Mercado: 2 Mercados, um sim, um não (o caminho
        // passa por um só por linha); com 1 só, quem não ia atrás dele quase não achava Mercado e o título caía 5 pp
        const extra = rng.shuffle<House>(
            row === 1 ? ['evento', 'treino', 'safari', 'bau'] : ['evento', 'treino', 'safari', 'cassino'],
        );
        if (!shopRows.has(row)) return extra;
        // um Evento "?" garantido por linha de parada (Miguel, 10/11; rota-indigo-2.md): com os 2 Mercados ele saía em
        // metade das linhas. Fica numa das 2 casas que sobram, no lugar que o embaralho já deu (sem sorteio a mais)
        const two = extra.slice(0, 2);
        two[extra.indexOf('evento') % 2] = 'evento';
        return rng.chance(0.5) ? ['mercado', two[0], 'mercado', two[1]] : [two[0], 'mercado', two[1], 'mercado'];
    });
    const rows: RotaNode[][] = houses.map((line, row) =>
        line.map((h, col) => ({
            id: `r${row}c${col}`,
            row,
            col,
            kind: BASE[h],
            ...(h !== BASE[h] && { casa: h as Casa }),
            next: [],
        })),
    );
    const lk = new Rng(seed, 'rota-map-links');
    for (let row = 0; row < rows.length - 1; row++) {
        const up = rows[row + 1];
        links(lk, rows[row].length, up.length).forEach((cols, i) => {
            rows[row][i].next = cols.map((c) => up[c].id);
        });
    }
    // ramos (4, um por coluna) e prêmios: o Ás dá 1 de 3 cartas raras; os Jogos, prêmios diferentes na mesma linha
    const lanes = new Rng(seed, 'rota-map-branch').shuffle([...BRANCHES]).slice(0, WIDTH);
    const pz = new Rng(seed, 'rota-map-prize');
    for (const line of rows) {
        const prizes = pz.shuffle([...mapPrizes()]);
        let k = 0;
        for (const n of line) {
            n.types = [...lanes[line.length === WIDTH ? n.col : Math.round((n.col * (WIDTH - 1)) / (line.length - 1))]];
            if (n.casa === 'as') n.prize = 'pokemon';
            else if (n.kind === 'jogo') n.prize = prizes[k++ % prizes.length];
        }
    }
    // pedras: um Jogo (não o Ás) por pedra da região, junto do prêmio dele
    const st = new Rng(seed, 'rota-map-stone');
    for (const line of ROTA_RULES.stones ? rows : []) {
        const stones = REGION_STONES[regionOfRow(line[0].row).id] ?? [];
        const jogos = st.shuffle(line.filter((n) => n.kind === 'jogo' && !n.casa));
        stones.slice(0, jogos.length).forEach((stone, i) => {
            jogos[i].stone = stone;
        });
    }
    return { nodes: rows.flat(), rows: LONG_ROWS };
}

/** O papel da linha bate com o mapa de sempre (partidas nas mesmas linhas): conferido no teste. */
export const roleMatchesLayout = () =>
    ROLE.length === LONG_ROWS &&
    ROLE.every((r, row) => (r === 'M') === matchIndexOfRow(row + 1) > matchIndexOfRow(row));
