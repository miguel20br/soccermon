import { CLUBS, type ClubTemplate } from './cup';
import { species } from './data';
import { aiDraftTeam } from './draft';
import { createInstance, viewInstance } from './instance';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import { Rng } from './rng';
import type { TeamSetup } from './state';
import { equipRivalTms, RIVAL_GYM_TM_MAX } from './tm';

/**
 * Copa longa (docs/planos/copa-longa.md): mapa curto estilo Slay the Spire, sorteado pela seed da copa. Cada linha é
 * só de partida (Jogo ou Ginásio) ou só de parada (Mercado, Evento, Treino, Baú), então **toda rota tem as mesmas 8
 * partidas** (7 na Rota + a Final contra a Liga Índigo) e o tempo da copa é previsível (~35 min).
 */
export type NodeKind = 'jogo' | 'ginasio' | 'mercado' | 'evento' | 'treino' | 'bau' | 'centro' | 'final';

/**
 * Prêmio do Jogo, à vista no mapa (revisão da Rota, Hades): 1 de 3 Pokémon do rival, 1 de 3 MTs, 1 de 3 itens (os de
 * tipo do ramo primeiro) ou o ₽ da vitória em dobro, sem recompensa.
 */
export type Prize = 'pokemon' | 'tm' | 'item' | 'money';
export const PRIZES: readonly Prize[] = ['pokemon', 'tm', 'item', 'money'];

/**
 * Regras da Rota que o robô de caminhos (scripts/balance/rota-caminhos.sim.test.ts) liga e desliga pra medir. Mexer
 * aqui muda o mapa e a recompensa das Rotas novas (o save guarda o mapa); não muda partida nenhuma.
 */
export const ROTA_RULES = {
    /** Escassez: no máximo tantos Mercados por caminho. */
    maxShops: 2,
    /** Mercado e Treino de parada podem cair no mesmo caminho. */
    shopWithTreino: true,
    /** O que vira a casa que a escassez tira (Mercado a mais, ou o Treino junto do Mercado). */
    spare: 'evento' as 'evento' | 'bau',
    /** Todo Jogo vencido dá 1 de 3 do time rival e depois o prêmio da casa (que deixa de ser "Pokémon do rival"). */
    rivalEveryJogo: true,
};
/** Prêmios que o mapa sorteia agora. */
export const mapPrizes = (): readonly Prize[] =>
    ROTA_RULES.rivalEveryJogo ? PRIZES.filter((p) => p !== 'pokemon') : PRIZES;

export interface MapNode {
    /** `r<linha>c<coluna>`. */
    id: string;
    row: number;
    col: number;
    kind: NodeKind;
    /** Casas da linha de cima em que dá pra ir daqui. */
    next: string[];
    /** Tipos do ramo (a coluna): rival, Baú, Mercado e prêmio puxam eles. Mapa de antes da revisão não tem. */
    types?: string[];
    /** Prêmio do Jogo. Mapa de antes da revisão não tem (a recompensa de sempre). */
    prize?: Prize;
}

export interface CupMap {
    nodes: MapNode[];
    rows: number;
}

/**
 * As eliminatórias (o mapa): 4 partidas, com paradas entre elas, Baú no meio e Treino no fim. Depois do mapa vem a fase
 * de grupos no Planalto (3 partidas) e a Final (docs/planos/campeonato.md, opção B).
 */
const LAYOUT = ['M', 'S', 'M', 'S', 'B', 'M', 'S', 'M', 'T'] as const;
export const LONG_ROWS = LAYOUT.length;
/** Partidas das eliminatórias (o mapa). */
export const MAP_MATCHES = LAYOUT.filter((r) => r === 'M').length;
/** Primeira partida da fase de grupos e a Final (índices de partida da copa). */
export const GROUP_START = MAP_MATCHES;
export const GROUP_GAMES = 3;
export const FINAL_MATCH = GROUP_START + GROUP_GAMES;
/** Partidas de uma Copa longa (contando a Final). */
export const LONG_MATCHES = FINAL_MATCH + 1;

/** Regiões de Kanto no mapa, de baixo pra cima: primeira e última linha (a tela desenha, a música troca por elas). */
export const MAP_REGIONS = [
    { id: 'rota1', rows: [0, 1] },
    { id: 'floresta', rows: [2, 3] },
    { id: 'mtmoon', rows: [4, 5] },
    { id: 'cerulean', rows: [6, 7] },
    { id: 'vitoria', rows: [8, 8] },
] as const;
export type MapRegion = (typeof MAP_REGIONS)[number]['id'];
export const regionOfRow = (row: number) =>
    MAP_REGIONS.find((r) => row >= r.rows[0] && row <= r.rows[1]) ?? MAP_REGIONS[0];

export const isMatchKind = (k: NodeKind) => k === 'jogo' || k === 'ginasio' || k === 'final';

/** Quantas partidas vêm antes desta linha (a 1ª partida é a 0). */
export const matchIndexOfRow = (row: number) => LAYOUT.slice(0, row).filter((r) => r === 'M').length;

/**
 * Ramos do mapa (PokéRogue): cada coluna é um caminho de Kanto com os seus tipos, sorteados 3 por mapa (esquerda, meio,
 * direita). Linha de 2 casas tem só a esquerda e a direita.
 */
export const BRANCHES: readonly (readonly string[])[] = [
    ['Water', 'Grass'],
    ['Rock', 'Ground', 'Fighting'],
    ['Ghost', 'Psychic'],
    ['Electric', 'Fire'],
    ['Normal', 'Bug'],
    ['Poison', 'Flying'],
];
const laneOf = (col: number, w: number) => (w === 1 ? 1 : w === 2 ? col * 2 : col);

/** Ginásio a partir desta partida (a 2ª). */
export const GYM_FROM_MATCH = 1;

/** Todos os caminhos do mapa, da 1ª linha ao Treino. */
export function mapPaths(nodes: readonly MapNode[]): MapNode[][] {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const out: MapNode[][] = [];
    const walk = (n: MapNode, acc: MapNode[]) => {
        if (!n.next.length) out.push([...acc, n]);
        for (const id of n.next) walk(byId.get(id)!, [...acc, n]);
    };
    for (const n of nodes.filter((x) => x.row === 0)) walk(n, []);
    return out;
}

export function buildCupMap(seed: string): CupMap {
    const rng = new Rng(seed, 'long-map');
    const widths = LAYOUT.map((r, i) => (r === 'T' ? 1 : i === 0 ? 3 : rng.int(2, 3)));
    const rows: MapNode[][] = LAYOUT.map((r, row) => {
        const w = widths[row];
        let kinds: NodeKind[];
        if (r === 'T') kinds = ['treino'];
        // a linha do Baú vira escolha: Baú ou Centro Pokémon
        else if (r === 'B') kinds = rng.shuffle<NodeKind>(w === 2 ? ['bau', 'centro'] : ['bau', 'centro', 'bau']);
        else if (r === 'S') {
            // Mercado, Evento e (com 3 casas) Treino; a escassez (abaixo) tira o que um caminho não pode ter dois
            kinds = rng.shuffle<NodeKind>(w === 2 ? ['mercado', 'evento'] : ['mercado', 'evento', 'treino']);
        } else {
            // Ginásio (elite opcional) a partir da 2ª partida, no máximo 1 por linha, sempre com um Jogo ao lado
            kinds = Array(w).fill('jogo');
            const nth = matchIndexOfRow(row);
            if (nth >= GYM_FROM_MATCH && rng.chance(0.75)) {
                kinds[rng.int(0, w - 1)] = 'ginasio';
            }
        }
        return kinds.map((kind, col) => ({ id: `r${row}c${col}`, row, col, kind, next: [] }));
    });
    // ligações sem cruzar: a casa i (de a) vai pras casas da faixa correspondente na linha de cima (de b)
    for (let row = 0; row < rows.length - 1; row++) {
        const a = rows[row].length;
        const b = rows[row + 1].length;
        rows[row].forEach((n, i) => {
            const lo = Math.floor((i * b) / a);
            const hi = Math.max(lo, Math.ceil(((i + 1) * b) / a) - 1);
            for (let j = lo; j <= hi; j++) n.next.push(rows[row + 1][j].id);
        });
    }
    // Uma diagonal a mais por vão entre casas vizinhas que não dividem destino (plano: copa-longa-tecnico.md). Ou a da
    // esquerda ganha a casa à direita do seu destino, ou a da direita a da esquerda; nunca as duas, senão cruza. Sorteio
    // próprio: o resto do mapa não muda.
    const diag = new Rng(seed, 'long-map-diag');
    const col = (id: string) => Number(id.slice(id.indexOf('c') + 1));
    for (let row = 0; row < rows.length - 1; row++) {
        const up = rows[row + 1];
        if (up.length === 1) continue;
        for (let i = 0; i < rows[row].length - 1; i++) {
            const [left, right] = [rows[row][i], rows[row][i + 1]];
            const maxL = Math.max(...left.next.map(col));
            const minR = Math.min(...right.next.map(col));
            if (maxL >= minR) continue; // já dividem uma casa: já tem escolha
            if (diag.chance(0.5) && maxL + 1 < up.length) left.next.push(up[maxL + 1].id);
            else if (minR - 1 >= 0) right.next.unshift(up[minR - 1].id);
        }
    }
    const nodes = rows.flat();
    // Escassez: no máximo `maxShops` Mercados por caminho e (sem `shopWithTreino`) Mercado e Treino nunca no mesmo
    // caminho. A casa que sobra (a mais de cima) vira `spare` (Evento ou Baú). Sem sorteio: o resto do mapa não muda.
    const stopTreino = (n: MapNode) => n.kind === 'treino' && LAYOUT[n.row] === 'S';
    const { maxShops, shopWithTreino } = ROTA_RULES;
    for (let guard = 0; guard < 50; guard++) {
        const bad = mapPaths(nodes).find((p) => {
            const shops = p.filter((n) => n.kind === 'mercado').length;
            return shops > maxShops || (shops > 0 && !shopWithTreino && p.some(stopTreino));
        });
        if (!bad) break;
        bad.filter((n) => n.kind === 'mercado' || stopTreino(n)).at(-1)!.kind = ROTA_RULES.spare;
    }
    // ramos e prêmios: sorteios próprios (o resto do mapa não muda)
    const br = new Rng(seed, 'long-map-branch');
    const lanes = br.shuffle([...BRANCHES]).slice(0, 3);
    const pz = new Rng(seed, 'long-map-prize');
    for (const line of rows) {
        const prizes = pz.shuffle([...mapPrizes()]);
        let k = 0;
        for (const n of line) {
            n.types = [...lanes[laneOf(n.col, line.length)]];
            if (n.kind === 'jogo') n.prize = prizes[k++];
        }
    }
    return { nodes, rows: LAYOUT.length };
}

export const nodeById = (map: CupMap, id: string) => map.nodes.find((n) => n.id === id);
/** Casas em que dá pra entrar agora: a 1ª linha no começo, ou as ligadas na casa atual. */
export const nextNodes = (map: CupMap, at: string | null): MapNode[] =>
    at === null
        ? map.nodes.filter((n) => n.row === 0)
        : (nodeById(map, at)?.next ?? []).flatMap((id) => nodeById(map, id) ?? []);

/**
 * Times da Rota (o "Jogo" da Copa longa): treinadores de Kanto, cada um puxado pros tipos dele. Sem líder: a quadra é a
 * de madeira e não tem técnico IA.
 */
export const ROUTE_TEAMS: (Omit<ClubTemplate, 'leader' | 'city'> & { trainer: string })[] = [
    {
        name: 'Caçadores de Insetos',
        trainer: 'bugcatcher',
        types: ['Bug', 'Grass'],
        tactic: 'offensive',
        color: 0x7fa83a,
        formation: '2-2',
    },
    {
        name: 'Montanhistas',
        trainer: 'hiker',
        types: ['Rock', 'Ground', 'Fighting'],
        tactic: 'defensive',
        color: 0x8a6a45,
        formation: 'ferrolho',
    },
    {
        name: 'Nadadores da Rota 19',
        trainer: 'swimmer',
        types: ['Water', 'Ice'],
        tactic: 'balanced',
        color: 0x2f7fc4,
        formation: '1-2-1',
    },
    {
        name: 'Equipe Rocket',
        trainer: 'rocket',
        types: ['Poison', 'Normal', 'Psychic'],
        tactic: 'counter',
        color: 0x3a3a46,
        formation: '3-1',
    },
    {
        name: 'Ornitólogos',
        trainer: 'birdkeeper',
        types: ['Flying', 'Normal'],
        tactic: 'offensive',
        color: 0xc9a23a,
        formation: '4-0',
    },
    {
        name: 'Faixas-Pretas',
        trainer: 'blackbelt',
        types: ['Fighting'],
        tactic: 'offensive',
        color: 0xb8322e,
        formation: '1-1-2',
    },
    {
        name: 'Médiuns de Lavender',
        trainer: 'channeler',
        types: ['Ghost', 'Psychic'],
        tactic: 'counter',
        color: 0x6a4d8f,
        formation: '1-2-1',
    },
    {
        name: 'Cientistas da Silph',
        trainer: 'scientist',
        types: ['Electric', 'Poison'],
        tactic: 'balanced',
        color: 0x4a8fb8,
        formation: '2-2',
    },
    {
        name: 'Motoqueiros',
        trainer: 'biker',
        types: ['Poison', 'Fire'],
        tactic: 'offensive',
        color: 0x8f3f2e,
        formation: '1-1-2',
    },
    {
        name: 'Pescadores',
        trainer: 'fisherman',
        types: ['Water'],
        tactic: 'defensive',
        color: 0x3f6f8f,
        formation: 'ferrolho',
    },
];

/** Sprite do treinador do rival (assets/trainers): a classe da Rota ou o líder do ginásio. */
export const rivalTrainer = (name: string): string | undefined =>
    ROUTE_TEAMS.find((t) => t.name === name)?.trainer ?? CLUBS.find((c) => c.name === name)?.leader;

/** Tipos do rival (o time da Rota ou o clube do ginásio) pelo nome. */
export const rivalTypes = (name: string): string[] =>
    ROUTE_TEAMS.find((t) => t.name === name)?.types ?? CLUBS.find((c) => c.name === name)?.types ?? [];

/** Titulares do tipo do treinador num time da Rota (o Ornitólogo tem pássaros). */
export const ROUTE_THEME_MIN = 3;

/** Força do rival pela partida (0 a 6 na Rota, 7 = Final): fácil no começo, puxado no fim. */
const LONG_DIFFICULTY = [-2, -1, 0, 1, 1, 1, 1, 4];
/** Ginásio de elite (Slay the Spire): o rival vem bem mais forte. */
export const GYM_SHIFT = 2;
/** Desafio de evento (Pássaro lendário, Equipe Rocket): o rival vem mais forte. */
export const CHALLENGE_SHIFT = 2;
/** O pássaro lendário de cada evento. */
export const LEGENDARY_BIRD = 145;

/** O Pokémon que o líder entrega na vitória do Ginásio (a carta forte dele na Gen 1). */
export const LEADER_ACE: Readonly<Record<string, number>> = {
    'Pewter Rochedo': 95,
    'Cerulean Cascata': 121,
    'Vermilion Voltagem': 26,
    'Celadon Arco-Íris': 45,
    'Fuchsia Ninjas': 110,
    'Saffron Mentes': 65,
    'Cinnabar Vulcão': 59,
    'Viridian Terra': 112,
    'Lavender Assombro': 94,
};

export interface OpponentOpts {
    /** Evento (entrevista, desafio): o rival entra mais fraco (−) ou mais forte (+). */
    shift?: number;
    /** Tipos do ramo: o rival sai dos times que têm um deles (se ainda tiver um que você não enfrentou). */
    types?: readonly string[];
    /** Esse time, sem sorteio (Equipe Rocket do evento). */
    club?: string;
    /** Espécie que entra de titular (o pássaro lendário). */
    boss?: number;
}
/** Itens do rival pela partida. */
const LONG_ITEMS = [0, 0, 0, 1, 0, 0, 1, 3];

/**
 * Rival de uma casa de partida. `faced` = nomes já enfrentados nesta copa (nunca repete). Sorteio próprio por partida
 * (`long-<n>-<tipo>`): a prévia do mapa e a partida dão o mesmo time.
 */
export function longOpponent(
    seed: string,
    match: number,
    kind: NodeKind,
    faced: readonly string[],
    { shift = 0, types, club: only, boss }: OpponentOpts = {},
): TeamSetup {
    const rng = new Rng(seed, `long-${match}-${kind}`);
    const indigo = CLUBS[CLUBS.length - 1];
    let club: Omit<ClubTemplate, 'leader' | 'city'>;
    if (kind === 'final') club = indigo;
    else {
        const all = kind === 'ginasio' ? CLUBS.filter((c) => c !== indigo) : ROUTE_TEAMS;
        const pool = only ? [...ROUTE_TEAMS, ...CLUBS].filter((c) => c.name === only) : all;
        const fresh = pool.filter((c) => !faced.includes(c.name));
        const typed = types?.length ? fresh.filter((c) => c.types.some((t) => types.includes(t))) : [];
        club = rng.pick(typed.length ? typed : fresh.length ? fresh : pool);
    }
    const base = LONG_DIFFICULTY[Math.min(match, LONG_DIFFICULTY.length - 1)];
    const difficulty = Math.max(-2, Math.min(4, base + (kind === 'ginasio' ? GYM_SHIFT : 0) + shift));
    // treinador da Rota joga com o tipo dele: pelo menos 3 dos 5 titulares
    const d = aiDraftTeam(rng, difficulty, club.types, club.formation, kind === 'jogo' ? ROUTE_THEME_MIN : 0);
    const items = LONG_ITEMS[Math.min(match, LONG_ITEMS.length - 1)] + (kind === 'ginasio' ? 1 : 0);
    for (const h of rng.shuffle([...d.lineup]).slice(0, items)) {
        const own = species(h.speciesId).types.flatMap((t) => TYPE_ITEM_FOR[t] ?? []);
        h.item = rng.pick([...ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type'), ...own]);
    }
    // o pássaro lendário entra no lugar do titular mais fraco (nunca o goleiro nem o capitão)
    if (boss !== undefined) {
        const at = d.lineup
            .map((p, i) => ({ i, ovr: viewInstance(p).overall }))
            .filter(({ i }) => i > 0 && d.lineup[i].uid !== d.captainUid)
            .sort((a, b) => a.ovr - b.ovr)[0]?.i;
        if (at !== undefined)
            d.lineup[at] = { ...createInstance(boss, new Rng(seed, `long-boss-${match}`)), uid: `boss-${match}` };
    }
    // só o Ginásio e a Final levam a MT do líder
    const tmRng = new Rng(seed, `long-tm-${match}`);
    const gymTms = { left: kind === 'jogo' ? 0 : RIVAL_GYM_TM_MAX };
    return {
        name: club.name,
        lineup: equipRivalTms(tmRng, club.name, d.lineup, gymTms),
        bench: equipRivalTms(tmRng, club.name, d.bench, gymTms),
        tactic: club.tactic,
        color: club.color,
        formation: club.formation,
        captainUid: d.captainUid,
    };
}

/**
 * Fase de grupos no Planalto: os 3 rivais do seu grupo (clubes de ginásio que você ainda não enfrentou), um por rodada,
 * com o líder e a MT dele. Sorteio próprio por rodada, como os rivais do mapa.
 */
export function longGroup(seed: string, faced: readonly string[]): TeamSetup[] {
    const out: TeamSetup[] = [];
    for (let i = 0; i < GROUP_GAMES; i++)
        out.push(longOpponent(seed, GROUP_START + i, 'ginasio', [...faced, ...out.map((o) => o.name)]));
    return out;
}
