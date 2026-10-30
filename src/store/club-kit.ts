import type { Tier } from './medals';
import { CLUB_COLORS, clubColorHex, colorDistance, type Profile, rivalColor } from './profile';

/**
 * Escudo montável (formato + símbolo + 2 cores) e uniforme (cor secundária + padrão) do clube. Só cosmético: o
 * perfil guarda ids (campos opcionais; save antigo fica com o padrão, que é o visual de antes). Alguns símbolos e
 * padrões saem de coleções temáticas e medalhas (`UNLOCK`, proposta pro Miguel).
 */
export const CREST_SHAPES = ['escudo', 'redondo', 'hexagono', 'diamante', 'flamula'] as const;
export type CrestShape = (typeof CREST_SHAPES)[number];

export const CREST_SYMBOLS = [
    // livres
    'pokebola',
    'raio',
    'chama',
    'gota',
    // coleções temáticas
    'folha',
    'asa',
    'espiral',
    'lua',
    'joia',
    'punho',
    'chifre',
    'rocha',
    'estrela',
    // medalhas
    'bola',
    'coroa',
    'taca',
    'espadas',
] as const;
export type CrestSymbol = (typeof CREST_SYMBOLS)[number];

export const KIT_PATTERNS = ['liso', 'listras', 'faixa', 'meio'] as const;
export type KitPattern = (typeof KIT_PATTERNS)[number];

/** Cor secundária: as do clube + branco (camisa reserva clássica). */
export const SECOND_COLORS = [{ id: 'branco', name: 'Branco', hex: 0xf2f2f2 }, ...CLUB_COLORS] as const;
export type SecondColorId = (typeof SECOND_COLORS)[number]['id'];
export const secondColorHex = (id: string | undefined) =>
    (SECOND_COLORS.find((c) => c.id === id) ?? SECOND_COLORS[0]).hex;

/** O que libera cada peça: uma coleção temática completa ou um degrau de medalha. Sem regra = livre. */
export type Unlock = { collection: string } | { medal: string; tier: Tier };
export const UNLOCK: Partial<Record<CrestSymbol | KitPattern, Unlock>> = {
    folha: { collection: 'colIniciais' },
    asa: { collection: 'colPassaros' },
    espiral: { collection: 'colFosseis' },
    lua: { collection: 'colEevee' },
    joia: { collection: 'colLendarios' },
    punho: { collection: 'colHitmons' },
    chifre: { collection: 'colNidos' },
    rocha: { collection: 'colBrock' },
    estrela: { collection: 'colMisty' },
    bola: { medal: 'artilheiro', tier: 2 },
    coroa: { medal: 'campeao', tier: 2 },
    taca: { medal: 'campeao', tier: 3 },
    espadas: { medal: 'duelista', tier: 1 },
    faixa: { medal: 'vitorias', tier: 1 },
    meio: { medal: 'campeao', tier: 1 },
};

/** A peça já é sua? (`done` = missões cumpridas; `tiers` = degrau de cada medalha). */
export function isUnlocked(
    piece: CrestSymbol | KitPattern,
    done: ReadonlySet<string>,
    tiers: Record<string, Tier>,
): boolean {
    const u = UNLOCK[piece];
    if (!u) return true;
    return 'collection' in u ? done.has(u.collection) : (tiers[u.medal] ?? 0) >= u.tier;
}

/** Visual do clube num lugar só: placar, VERSUS, quadra e editor. */
export interface ClubLook {
    color: number;
    color2: number;
    pattern: KitPattern;
    shape: CrestShape;
    symbol: CrestSymbol;
}

const pick = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
    list.includes(v as T) ? (v as T) : fallback;
const colorOk = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 0xffffff;

export const DEFAULT_LOOK: Omit<ClubLook, 'color'> = {
    color2: SECOND_COLORS[0].hex,
    pattern: 'liso',
    shape: 'escudo',
    symbol: 'pokebola',
};

/** O seu clube pelo perfil (campos que faltam ou estão estragados viram o padrão). */
export const lookOfProfile = (
    p: Pick<Profile, 'clubColor' | 'clubColor2' | 'kitPattern' | 'crestShape' | 'crestSymbol'>,
): ClubLook => ({
    color: clubColorHex(p.clubColor),
    color2: secondColorHex(p.clubColor2),
    pattern: pick(KIT_PATTERNS, p.kitPattern, 'liso'),
    shape: pick(CREST_SHAPES, p.crestShape, 'escudo'),
    symbol: pick(CREST_SYMBOLS, p.crestSymbol, 'pokebola'),
});

/** Clube que veio do rival no Duelo (ids desconhecidos e cores fora do formato viram o padrão). */
export function lookOfPeer(p: {
    clubColor: number;
    color2?: unknown;
    kitPattern?: unknown;
    crestShape?: unknown;
    crestSymbol?: unknown;
}): ClubLook {
    return {
        color: colorOk(p.clubColor) ? p.clubColor : CLUB_COLORS[0].hex,
        color2: colorOk(p.color2) ? p.color2 : DEFAULT_LOOK.color2,
        pattern: pick(KIT_PATTERNS, p.kitPattern, 'liso'),
        shape: pick(CREST_SHAPES, p.crestShape, 'escudo'),
        symbol: pick(CREST_SYMBOLS, p.crestSymbol, 'pokebola'),
    };
}

/** Escudo dos clubes da copa: o símbolo do tipo do ginásio (os outros, o símbolo do Soccermon, id `pokebola`). */
const CUP_SYMBOL: Record<string, CrestSymbol> = {
    'Pewter Rochedo': 'rocha',
    'Cerulean Cascata': 'gota',
    'Vermilion Voltagem': 'raio',
    'Celadon Arco-Íris': 'folha',
    'Cinnabar Vulcão': 'chama',
    'Liga Índigo': 'coroa',
};
export const lookOfCupClub = (name: string, color: number): ClubLook => ({
    ...DEFAULT_LOOK,
    color,
    symbol: CUP_SYMBOL[name] ?? 'pokebola',
});

/**
 * Uniforme do rival contra você: se a cor dele bater com a sua, ele entra com o reserva (liso, na cor reserva,
 * com o símbolo em branco ou grafite pra ler).
 */
export function againstLook(mine: ClubLook, theirs: ClubLook): ClubLook {
    const color = rivalColor(mine.color, theirs.color);
    if (color === theirs.color) return theirs;
    const color2 = colorDistance(color, 0xf2f2f2) > 120 ? 0xf2f2f2 : 0x3a3f4b;
    return { ...theirs, color, color2, pattern: 'liso' };
}

/** Campos do perfil que vão pra sala do Duelo. */
export const peerLookFields = (look: ClubLook) => ({
    color2: look.color2,
    kitPattern: look.pattern,
    crestShape: look.shape,
    crestSymbol: look.symbol,
});

/** Os dois lados de uma partida (o seu no seu lado; o rival no reserva se bater). */
export function matchLooks(mine: ClubLook, theirs: ClubLook, mySide: 0 | 1 = 0): [ClubLook, ClubLook] {
    const other = againstLook(mine, theirs);
    return mySide === 0 ? [mine, other] : [other, mine];
}

/** O uniforme em quadra: a cor secundária só aparece com padrão (liso = o anel de sempre). */
export const fieldKit = (look: ClubLook): { color2: number } | null =>
    look.pattern === 'liso' ? null : { color2: look.color2 };
