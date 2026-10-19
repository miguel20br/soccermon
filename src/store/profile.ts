import { MOVES, SPECIES } from '../engine/data';
import type { PlayerLine } from '../engine/match-stats';
import { defaultMoveset } from '../engine/moves';
import type { MatchResult } from '../engine/runners/batch-runner';
import { EVENT_TYPES, ICONS, type SpecialKind } from '../engine/specials';
import type { TitleId, TrainerId } from './missions';

/** Treinador e título de quem começa (aqui e não em missions.ts: missions lê o perfil, sem importação em ciclo). */
export const DEFAULT_TRAINER: TrainerId = 'red';
export const DEFAULT_TITLE: TitleId = 'pallet';

/**
 * Perfil, Pokédex e golpes descobertos (save v5). Tudo cosmético ou de registro: nada daqui mexe em
 * atributo nem no motor. Funções puras (recebem o estado antigo e devolvem o novo) para dar para testar.
 */

/** Paleta curada do clube: todas com contraste bom na quadra e no placar. */
export const CLUB_COLORS = [
    { id: 'vermelho', name: 'Vermelho', hex: 0xe8423f },
    { id: 'azul', name: 'Azul', hex: 0x2f6fde },
    { id: 'verde', name: 'Verde', hex: 0x2fa84f },
    { id: 'amarelo', name: 'Amarelo', hex: 0xf2c230 },
    { id: 'laranja', name: 'Laranja', hex: 0xf07f1d },
    { id: 'roxo', name: 'Roxo', hex: 0x8a4fd0 },
    { id: 'rosa', name: 'Rosa', hex: 0xe0529c },
    { id: 'ciano', name: 'Ciano', hex: 0x1fb5c9 },
    { id: 'vinho', name: 'Vinho', hex: 0x9b1d3a },
    { id: 'grafite', name: 'Grafite', hex: 0x3a3f4b },
] as const;

export type ClubColorId = (typeof CLUB_COLORS)[number]['id'];

export const clubColorHex = (id: ClubColorId | string | undefined) =>
    (CLUB_COLORS.find((c) => c.id === id) ?? CLUB_COLORS[0]).hex;

/** Letra da faixa da torcida em cima da cor do clube: escura nas cores claras (amarelo, uniforme branco), branca no resto. */
export function bannerInk(color: number): number {
    const luma = ((color >> 16) & 255) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114;
    return luma > 150 ? 0x0e1430 : 0xffffff;
}

/** Distância simples entre duas cores RGB (0..~441). */
export function colorDistance(a: number, b: number): number {
    const dr = ((a >> 16) & 255) - ((b >> 16) & 255);
    const dg = ((a >> 8) & 255) - ((b >> 8) & 255);
    const db = (a & 255) - (b & 255);
    return Math.hypot(dr, dg, db);
}

/** Uniformes reserva do rival quando a cor dele fica parecida com a do seu clube. */
const AWAY_KITS = [0xf2f2f2, 0x26282e, 0xf2c230, 0x2f6fde];
const CLASH = 110;

/** Cor que o rival usa contra você: a dele, ou um uniforme reserva se ficar parecida demais. */
export function rivalColor(player: number, rival: number): number {
    if (colorDistance(player, rival) >= CLASH) return rival;
    return AWAY_KITS.find((k) => colorDistance(player, k) >= CLASH * 1.5) ?? 0xf2f2f2;
}

/** Avatar: foto do Google ou sprite do Pokémon (`shiny` opcional: save antigo não tem = normal). */
export type Avatar = { kind: 'google' } | { kind: 'pokemon'; speciesId: number; shiny?: boolean };

export interface Profile {
    /** Nome do treinador ('' = usa o nome da conta Google, ou "Treinador"). */
    trainerName: string;
    avatar: Avatar;
    /** Nome fixo do clube: já vem preenchido na Nova copa. */
    clubName: string;
    /** Sigla de 3 letras (placar no celular). */
    clubTag: string;
    clubColor: ClubColorId;
    /** Frase da faixa da torcida (índice em `profile.club.banners` do i18n). Sem o campo = a 1ª, "Vai, {clube}!". */
    banner?: number;
    /** Escudo e uniforme (club-kit.ts): ids opcionais; sem o campo = o padrão (escudo, pokébola, branco, liso). */
    clubColor2?: string;
    kitPattern?: string;
    crestShape?: string;
    crestSymbol?: string;
    /** Vitrine: até 3 destaques escolhidos (medals.ts: `m:<medalha>`, `c:<coleção>`, `s:<espécie>`). */
    showcase?: string[];
    /** Sprite do treinador e título embaixo do nome (missions.ts). */
    trainer: TrainerId;
    title: string;
    /** Missões cumpridas: liberam treinadores e títulos. */
    missionsDone: string[];
    /** Títulos resgatados com código (title-codes.ts). */
    redeemedTitles: string[];
}

export const DEFAULT_PROFILE: Profile = {
    trainerName: '',
    avatar: { kind: 'pokemon', speciesId: 25 },
    clubName: 'Pallet FC',
    clubTag: 'PAL',
    clubColor: 'vermelho',
    trainer: DEFAULT_TRAINER,
    title: DEFAULT_TITLE,
    missionsDone: [],
    redeemedTitles: [],
};

/** Quantas frases a faixa da torcida tem (lista fechada, todas liberadas por enquanto). */
export const BANNER_COUNT = 12;
/** Frase da faixa: número fora da lista (save estragado, peer de outra versão) vira a 1ª. */
export const bannerOf = (n: unknown): number =>
    typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < BANNER_COUNT ? n : 0;

/** Sigla a partir do nome: "Pallet FC" → "PAL". */
export function tagFromName(name: string): string {
    const letters = name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/gi, '')
        .toUpperCase();
    return (letters.slice(0, 3) || 'SOC').padEnd(3, 'X');
}

/**
 * Página de uma espécie na Pokédex. Entrada existindo = "visto" (apareceu no seu draft, nas recompensas
 * ou no time adversário). `matches > 0` = "jogou" (entrou em quadra pelo seu time, pelo menos 1 minuto).
 */
export interface DexEntry {
    matches: number;
    minutes: number;
    goals: number;
    assists: number;
    wins: number;
    /** Copas ganhas com ele tendo jogado. */
    titles: number;
    /** Melhor nota de partida (0–10) e maior nota de carta que já passou pelo seu time. */
    bestRating: number;
    bestOvr: number;
    /** Álbum: edições que já jogaram por você (bits de EDITION_BIT). Saves antes da v9 não têm. */
    editions?: number;
}

export type Dex = Record<number, DexEntry>;

export const EMPTY_ENTRY: DexEntry = {
    matches: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    wins: 0,
    titles: 0,
    bestRating: 0,
    bestOvr: 0,
};

export const isPlayed = (e: DexEntry | undefined) => !!e && e.matches > 0;

/**
 * Linha de partida pra Pokédex (`dexLines` em game-store.ts): `evoForm` = uma das duas formas de quem evoluiu em
 * quadra numa passagem de 1+ minuto (as duas jogaram, mesmo que uma tenha ficado só segundos).
 */
export type DexLine = PlayerLine & { evoForm?: boolean };

/** A regra única do "jogou" numa partida: seu time, 1+ minuto em quadra (ou uma das formas de quem evoluiu). */
export const playedLine = (l: Pick<DexLine, 'team' | 'minutes' | 'evoForm'>) =>
    l.team === 0 && (l.minutes >= 1 || !!l.evoForm);

/** Vistos: espécies do jogo com página na Pokédex (a aba Todos/Vistos da Pokédex conta igual). */
export const seenCount = (dex: Dex, list: readonly { id: number }[] = SPECIES) =>
    list.filter((sp) => dex[sp.id]).length;

/** Jogaram pelo seu time (`isPlayed`): Pokédex, Carvalho dourado, medalha Elenco, platina e Kanto completo. */
export const playedCount = (dex: Dex, list: readonly { id: number }[] = SPECIES) =>
    list.filter((sp) => isPlayed(dex[sp.id])).length;

/** Marca espécies como vistas (não mexe em quem já está na Dex). Devolve o mesmo objeto se nada mudou. */
export function markSeen(dex: Dex, ids: Iterable<number>): Dex {
    let out: Dex | null = null;
    for (const id of ids) {
        if (dex[id] || out?.[id]) continue;
        out ??= { ...dex };
        out[id] = { ...EMPTY_ENTRY };
    }
    return out ?? dex;
}

/** Marca espécies como "jogou" (código de conserto): quem já jogou fica como está. */
export function markPlayed(dex: Dex, ids: Iterable<number>): Dex {
    const out: Dex = { ...dex };
    for (const id of ids) {
        const cur = out[id] ?? EMPTY_ENTRY;
        if (cur.matches < 1) out[id] = { ...cur, matches: 1 };
    }
    return out;
}

/** Guarda a maior nota de carta de uma espécie que passou pelo seu time. */
export function markOvr(dex: Dex, entries: Iterable<[number, number]>): Dex {
    let out: Dex | null = null;
    for (const [id, ovr] of entries) {
        const cur = (out ?? dex)[id] ?? EMPTY_ENTRY;
        if (ovr <= cur.bestOvr) continue;
        out ??= { ...dex };
        out[id] = { ...cur, bestOvr: ovr };
    }
    return out ?? dex;
}

/** Soma uma partida na Dex: quem `playedLine` aceita conta como "jogou"; o resto (rival, menos de 1 minuto) fica "visto". */
export function recordMatchInDex(dex: Dex, lines: DexLine[], won: boolean): Dex {
    const out: Dex = { ...dex };
    // o mesmo Pokémon pode ter duas "passagens" (saiu e voltou): soma tudo numa partida só
    const mine = new Map<number, { minutes: number; goals: number; assists: number; rating: number }>();
    for (const l of lines) {
        if (!playedLine(l)) {
            out[l.speciesId] ??= { ...EMPTY_ENTRY };
            continue;
        }
        const acc = mine.get(l.speciesId) ?? { minutes: 0, goals: 0, assists: 0, rating: 0 };
        acc.minutes += l.minutes;
        acc.goals += l.stats.goals;
        acc.assists += l.stats.assists;
        acc.rating = Math.max(acc.rating, l.rating);
        mine.set(l.speciesId, acc);
    }
    for (const [id, acc] of mine) {
        const cur = out[id] ?? EMPTY_ENTRY;
        out[id] = {
            ...cur,
            matches: cur.matches + 1,
            minutes: cur.minutes + acc.minutes,
            goals: cur.goals + acc.goals,
            assists: cur.assists + acc.assists,
            wins: cur.wins + (won ? 1 : 0),
            bestRating: Math.max(cur.bestRating, acc.rating),
        };
    }
    return out;
}

/** Título: soma 1 para cada espécie que jogou alguma partida da copa campeã. */
export function recordTitleInDex(dex: Dex, speciesIds: Iterable<number>): Dex {
    const out: Dex = { ...dex };
    for (const id of new Set(speciesIds)) {
        const cur = out[id];
        if (cur && cur.matches > 0) out[id] = { ...cur, titles: cur.titles + 1 };
    }
    return out;
}

/** Golpes descobertos: quantas vezes cada golpe apareceu em campo nas suas partidas (os dois times). */
export type MoveDex = Record<string, number>;

export function recordMovesSeen(moves: MoveDex, m: Pick<MatchResult, 'events'>): MoveDex {
    const out: MoveDex = { ...moves };
    for (const e of m.events) {
        // o Transformar do Ditto não vira evento 'move' (acontece sozinho no apito): conta pelo 'transform'
        const id = e.type === 'move' || e.type === 'shot' ? e.moveId : e.type === 'transform' ? 'transform' : null;
        if (id) out[id] = (out[id] ?? 0) + 1;
    }
    return out;
}

let gameMoves: ReadonlySet<string> | null = null;
/** Golpes que dá para ver em campo (alguém aprende ou leva no moveset padrão): o total da Golpedex. */
export function gameMoveIds(): ReadonlySet<string> {
    if (!gameMoves) {
        const known = new Set(SPECIES.flatMap((sp) => [...sp.learnset, ...defaultMoveset(sp)]));
        gameMoves = new Set(Object.keys(MOVES).filter((id) => known.has(id)));
    }
    return gameMoves;
}

const DITTO = 132;
/**
 * Vezes que o golpe apareceu em campo. Transformar (Ditto) não gera evento de golpe na partida (o Ditto
 * se transforma sozinho no apito), então vale como visto quando o Ditto já jogou.
 */
export function timesSeen(id: string, moves: MoveDex, dex: Dex): number {
    const n = moves[id] ?? 0;
    if (id === 'transform' && n === 0 && isPlayed(dex[DITTO])) return dex[DITTO].matches;
    return n;
}

/** Golpes descobertos (o número da Golpedex): os do jogo que já apareceram em campo, Transformar pelo Ditto. */
export function movesFound(moves: MoveDex, dex: Dex): number {
    let n = 0;
    for (const id of gameMoveIds()) if (timesSeen(id, moves, dex) > 0) n++;
    return n;
}

/** Números da carreira do treinador (somam todas as copas). */
export interface Career {
    matches: number;
    wins: number;
    losses: number;
    /** Vitórias nos pênaltis (também contam em `wins`). */
    shootoutWins: number;
    goalsFor: number;
    goalsAgainst: number;
}

export const EMPTY_CAREER: Career = {
    matches: 0,
    wins: 0,
    losses: 0,
    shootoutWins: 0,
    goalsFor: 0,
    goalsAgainst: 0,
};

export function recordMatchInCareer(c: Career, score: [number, number], won: boolean, shootout: boolean): Career {
    return {
        matches: c.matches + 1,
        wins: c.wins + (won ? 1 : 0),
        losses: c.losses + (won ? 0 : 1),
        shootoutWins: c.shootoutWins + (won && shootout ? 1 : 0),
        goalsFor: c.goalsFor + score[0],
        goalsAgainst: c.goalsAgainst + score[1],
    };
}

/** Álbum de edições: uma figurinha por edição de cada espécie. */
export type AlbumEdition = 'normal' | 'shiny' | SpecialKind;
export const ALBUM_EDITIONS: AlbumEdition[] = ['normal', 'shiny', 'evento', 'icone', 'destaque'];
export const EDITION_BIT: Record<AlbumEdition, number> = { normal: 1, shiny: 2, evento: 4, icone: 8, destaque: 16 };

/** Edições que existem para a espécie: Ícone só para os 20 da lista, Evento só com um tipo que entra em evento. */
export function albumSlots(sp: { id: number; types: readonly string[] }): AlbumEdition[] {
    return ALBUM_EDITIONS.filter(
        (e) => (e !== 'icone' || sp.id in ICONS) && (e !== 'evento' || sp.types.some((t) => EVENT_TYPES.includes(t))),
    );
}

export const hasSticker = (e: DexEntry | undefined, ed: AlbumEdition) => !!((e?.editions ?? 0) & EDITION_BIT[ed]);

/** Gerações do jogo (por enquanto só Kanto): agrupam os avatares no Perfil. */
export const GENERATIONS = [{ gen: 1, region: 'Kanto', from: 1, to: 151 }] as const;

/**
 * Avatares liberados de uma geração: o Pikachu sempre, os que jogaram pelo seu time e, ao lado da normal, a
 * versão shiny de quem já tem a figurinha Shiny no álbum.
 */
export function avatarOptions(dex: Dex, g: { from: number; to: number }): { speciesId: number; shiny: boolean }[] {
    const out: { speciesId: number; shiny: boolean }[] = [];
    for (let id = g.from; id <= g.to; id++) {
        const e = dex[id];
        if (id === 25 || isPlayed(e)) out.push({ speciesId: id, shiny: false });
        if (hasSticker(e, 'shiny')) out.push({ speciesId: id, shiny: true });
    }
    return out;
}

/** Álbum de uma lista de espécies: figurinhas coladas e quantas existem. */
export function albumCount(dex: Dex, list: readonly { id: number; types: readonly string[] }[] = SPECIES) {
    let got = 0;
    let total = 0;
    for (const sp of list)
        for (const ed of albumSlots(sp)) {
            total++;
            if (hasSticker(dex[sp.id], ed)) got++;
        }
    return { got, total };
}

/** Bits da carta: a edição especial e o shiny (sem nenhum dos dois = Normal). */
export function editionBits(card: { shiny: boolean; special?: { kind: SpecialKind } | null }): number {
    const bits = (card.shiny ? EDITION_BIT.shiny : 0) | (card.special ? EDITION_BIT[card.special.kind] : 0);
    return bits || EDITION_BIT.normal;
}

/** Cola figurinhas: cada (espécie, bits) de quem jogou. Só vale para espécie que já "jogou" na Dex. */
export function recordEditions(dex: Dex, played: Iterable<[number, number]>): Dex {
    let out: Dex | null = null;
    for (const [id, bits] of played) {
        const cur = (out ?? dex)[id];
        if (!cur || cur.matches <= 0 || ((cur.editions ?? 0) | bits) === (cur.editions ?? 0)) continue;
        out ??= { ...dex };
        out[id] = { ...cur, editions: (cur.editions ?? 0) | bits };
    }
    return out ?? dex;
}

/**
 * Selo de carreira por espécie (só cosmético, não mexe na carta): sai do que a Dex já conta, então é retroativo.
 * Cada degrau olha um número próprio e vale o mais alto que a espécie alcançou:
 * Folha = 10 partidas, Holo = 25 gols, Prisma = 5 títulos, Ouro escuro = Prisma + Kanto completo (os 151 jogaram
 * pelo seu time).
 */
export type CareerSeal = 'folha' | 'holo' | 'prisma' | 'ouro';
export const CAREER_SEALS: CareerSeal[] = ['folha', 'holo', 'prisma', 'ouro'];
export const SEAL_GOAL = { folha: 10, holo: 25, prisma: 5 } as const;

/** Kanto completo: todas as espécies do jogo já jogaram pelo seu time. */
export const kantoComplete = (dex: Dex) => playedCount(dex) === SPECIES.length;

/** Degraus que a espécie já tem (em ordem). `kanto` = Kanto completo (calcule uma vez com `kantoComplete`). */
export function sealsOf(e: DexEntry | undefined, kanto: boolean): CareerSeal[] {
    if (!e) return [];
    const out: CareerSeal[] = [];
    if (e.matches >= SEAL_GOAL.folha) out.push('folha');
    if (e.goals >= SEAL_GOAL.holo) out.push('holo');
    if (e.titles >= SEAL_GOAL.prisma) out.push('prisma', ...(kanto ? (['ouro'] as const) : []));
    return out;
}

/** O selo mais alto da espécie (o que aparece na grade), ou null. */
export const topSeal = (e: DexEntry | undefined, kanto: boolean): CareerSeal | null => sealsOf(e, kanto).at(-1) ?? null;

/** Junta duas Dex (nuvem + aparelho): fica o maior de cada número, e as figurinhas dos dois lados. */
export function mergeDex(a: Dex = {}, b: Dex = {}): Dex {
    const out: Dex = { ...a };
    for (const [k, eb] of Object.entries(b)) {
        const id = Number(k);
        const ea = out[id];
        if (!ea) {
            out[id] = { ...EMPTY_ENTRY, ...eb };
            continue;
        }
        const merged = { ...ea };
        for (const key of Object.keys(EMPTY_ENTRY) as (keyof DexEntry)[]) {
            merged[key] = Math.max(ea[key] ?? 0, eb[key] ?? 0);
        }
        // figurinha é bitmask: o maior perderia a de um lado (Shiny 2 contra Normal+Evento 5)
        const editions = (ea.editions ?? 0) | (eb.editions ?? 0);
        if (editions) merged.editions = editions;
        out[id] = merged;
    }
    return out;
}

export function mergeMoves(a: MoveDex = {}, b: MoveDex = {}): MoveDex {
    const out: MoveDex = { ...a };
    for (const [id, n] of Object.entries(b)) out[id] = Math.max(out[id] ?? 0, n);
    return out;
}

export function mergeCareer(a: Career = EMPTY_CAREER, b: Career = EMPTY_CAREER): Career {
    // a carreira é um contador só: fica a que tem mais partidas (somar duplicaria o que já subiu)
    return (b.matches ?? 0) > (a.matches ?? 0) ? { ...EMPTY_CAREER, ...b } : { ...EMPTY_CAREER, ...a };
}

/** Um título no Hall da Fama (como o da Gen 1: o time campeão, guardado para sempre). */
export interface HallEntry {
    /** seed da copa (uma copa só entra uma vez). */
    id: string;
    /** Quando o título saiu (ms). */
    date: number;
    club: string;
    clubColor: ClubColorId;
    formation: string;
    titleNo: number;
    perfect: boolean;
    /** Placares das 4 partidas (pênaltis à parte). */
    scores: [number, number][];
    squad: { speciesId: number; shiny: boolean; name: string; ovr: number; goals: number; captain: boolean }[];
    /** Treinador e título de quem ganhou (títulos antes da 0.8.3 não têm). */
    trainer?: TrainerId;
    trainerTitle?: string;
}

/** Guarda os últimos 50 títulos, como o Hall of Fame do Red/Blue. */
export const MAX_HALL = 50;

/** Junta o Hall da nuvem com o do aparelho: união pela copa, mais recentes primeiro. */
export function mergeHall(a: HallEntry[] = [], b: HallEntry[] = []): HallEntry[] {
    const byId = new Map<string, HallEntry>();
    for (const e of [...a, ...b]) if (!byId.has(e.id)) byId.set(e.id, e);
    return [...byId.values()].sort((x, y) => y.date - x.date).slice(0, MAX_HALL);
}
