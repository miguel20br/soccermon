import { SPECIES, type Species, type StatKey } from './data';

/** Atributos de futsal, todos em 1..99. */
export interface Attributes {
    pace: number; // velocidade máxima e aceleração (Speed)
    dribble: number; // condução e proteção de bola (Speed + Sp. Atk)
    shooting: number; // força e precisão do chute (Attack + Sp. Atk)
    passing: number; // precisão e visão de passe (Sp. Atk + Sp. Def)
    tackling: number; // desarme (Defense + Attack)
    strength: number; // corpo, divididas (Attack + Defense + peso)
    positioning: number; // leitura, interceptação, compostura (Sp. Def + Defense)
    stamina: number; // fôlego (HP)
    goalkeeping: number; // reflexo e alcance no gol (HP + Def + Sp. Def + tamanho)
}

export type AttrKey = keyof Attributes;
export type Position = 'GK' | 'FIXO' | 'ALA' | 'PIVO';
export const POSITIONS: Position[] = ['GK', 'FIXO', 'ALA', 'PIVO'];
export const POSITION_LABEL: Record<Position, string> = { GK: 'Goleiro', FIXO: 'Fixo', ALA: 'Ala', PIVO: 'Pivô' };

/** Entradas do atributo de goleiro (stats base em percentil + tamanho = peso/altura). */
export type GoalkeepingInput = StatKey | 'size';

/**
 * Fórmulas de posição. Os pesos são relativos (normalizados pela soma), então podem ser ajustados
 * livremente — é o que o Laboratório de Posições (?lab=posicoes) edita.
 */
export interface PositionFormulas {
    /** Composição do atributo "goleiro" a partir dos stats base. */
    goalkeeping: Partial<Record<GoalkeepingInput, number>>;
    FIXO: Partial<Record<AttrKey, number>>;
    ALA: Partial<Record<AttrKey, number>>;
    PIVO: Partial<Record<AttrKey, number>>;
    /** Pontos somados à nota só na hora de escolher as posições (ex.: GK -4 = só vai pro gol quem é claramente melhor lá). */
    bias?: Partial<Record<Position, number>>;
    /** Posições a até `margin` pontos da melhor nota contam como elegíveis… */
    margin: number;
    /** …até no máximo `maxPositions`. */
    maxPositions: number;
}

export const DEFAULT_FORMULAS: PositionFormulas = {
    goalkeeping: { hp: 30, def: 25, spd: 25, size: 20 },
    FIXO: { tackling: 35, positioning: 25, strength: 20, passing: 20 },
    ALA: { pace: 30, dribble: 30, passing: 25, stamina: 15 },
    PIVO: { shooting: 40, strength: 20, dribble: 20, positioning: 20 },
    margin: 4,
    maxPositions: 3,
};

/** Stat real no nível L (fórmula dos jogos, IV 31, sem EV). */
export function statAtLevel(base: number, level: number, key: StatKey): number {
    const core = Math.floor(((2 * base + 31) * level) / 100);
    return key === 'hp' ? core + level + 10 : core + 5;
}

const REF_LEVEL = 50;
const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

/** Distribuição de referência: stats dos 151 no nível 50, ordenados. */
const REFERENCE: Record<StatKey | 'weight' | 'height', number[]> = (() => {
    const ref = {} as Record<StatKey | 'weight' | 'height', number[]>;
    for (const k of STAT_KEYS) {
        ref[k] = SPECIES.map((s) => statAtLevel(s.baseStats[k], REF_LEVEL, k)).sort((a, b) => a - b);
    }
    ref.weight = SPECIES.map((s) => Math.log(s.weightkg + 1)).sort((a, b) => a - b);
    ref.height = SPECIES.map((s) => Math.log(s.heightm + 0.1)).sort((a, b) => a - b);
    return ref;
})();

/** Percentil (0..1) de `value` na distribuição, interpolado; acima do máximo extrapola levemente. */
function percentile(sorted: number[], value: number): number {
    const n = sorted.length;
    if (value <= sorted[0]) return 0;
    if (value >= sorted[n - 1]) {
        const span = sorted[n - 1] - sorted[Math.floor(n * 0.9)] || 1;
        return 1 + (0.1 * (value - sorted[n - 1])) / span;
    }
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (sorted[mid] <= value) lo = mid;
        else hi = mid;
    }
    const t = (value - sorted[lo]) / (sorted[hi] - sorted[lo] || 1);
    return (lo + t) / (n - 1);
}

const toAttr = (p: number) => Math.round(Math.min(99, Math.max(1, 22 + 75 * p)));

/** Média ponderada com pesos relativos (normalizados pela soma). */
function weighted<K extends string>(values: Record<K, number>, weights: Partial<Record<K, number>>): number {
    let sum = 0;
    let total = 0;
    for (const [k, w] of Object.entries(weights) as [K, number][]) {
        if (!w) continue;
        sum += values[k] * w;
        total += w;
    }
    return total > 0 ? sum / total : 0;
}

export function computeAttributes(
    sp: Species,
    level: number,
    formulas: PositionFormulas = DEFAULT_FORMULAS,
): Attributes {
    const p = {} as Record<StatKey, number>;
    for (const k of STAT_KEYS) p[k] = percentile(REFERENCE[k], statAtLevel(sp.baseStats[k], level, k));
    const w = percentile(REFERENCE.weight, Math.log(sp.weightkg + 1));
    // "tamanho" (peso + altura): goleiro grande fecha o gol
    const size = 0.5 * w + 0.5 * percentile(REFERENCE.height, Math.log(sp.heightm + 0.1));

    return {
        pace: toAttr(p.spe),
        dribble: toAttr(0.7 * p.spe + 0.3 * p.spa),
        shooting: toAttr(0.6 * p.atk + 0.4 * p.spa),
        passing: toAttr(0.65 * p.spa + 0.35 * p.spd),
        tackling: toAttr(0.7 * p.def + 0.3 * p.atk),
        strength: toAttr(0.35 * p.atk + 0.35 * p.def + 0.3 * w),
        positioning: toAttr(0.7 * p.spd + 0.3 * p.def),
        stamina: toAttr(p.hp),
        goalkeeping: toAttr(weighted({ ...p, size }, formulas.goalkeeping)),
    };
}

export function positionRating(a: Attributes, pos: Position, formulas: PositionFormulas = DEFAULT_FORMULAS): number {
    if (pos === 'GK') return Math.round(a.goalkeeping);
    return Math.round(weighted(a as unknown as Record<AttrKey, number>, formulas[pos]));
}

/** Multiplicador por jogar fora de posição. */
export function outOfPositionFactor(natural: Position, playing: Position): number {
    if (natural === playing) return 1;
    if (natural === 'GK' || playing === 'GK') return 0.75;
    return 0.93;
}

/** Casos icônicos que a regra automática não pega (espécie → posições extras). */
export const POSITION_OVERRIDES: Record<number, Position[]> = {
    95: ['GK'], // Onix: a muralha de pedra
};

/**
 * Posições em que o Pokémon joga bem: todas a até `margin` pontos da melhor nota (máx. `maxPositions`),
 * ordenadas pela nota. Ex.: Snorlax → Goleiro, Fixo e Pivô.
 */
export function eligiblePositions(
    a: Attributes,
    speciesId?: number,
    formulas: PositionFormulas = DEFAULT_FORMULAS,
): Position[] {
    const ratings = POSITIONS.map((pos) => ({
        pos,
        r: positionRating(a, pos, formulas) + (formulas.bias?.[pos] ?? 0),
    })).sort((x, y) => y.r - x.r);
    const best = ratings[0].r;
    const list = ratings
        .filter((x) => x.r >= best - formulas.margin)
        .slice(0, formulas.maxPositions)
        .map((x) => x.pos);
    for (const extra of (speciesId !== undefined && POSITION_OVERRIDES[speciesId]) || []) {
        if (!list.includes(extra)) list.push(extra);
    }
    return list;
}

/** Multiplicador para jogar em `playing`: principal 1, secundária 0,98, fora das elegíveis penaliza. */
export function positionFactor(eligible: readonly Position[], playing: Position): number {
    const idx = eligible.indexOf(playing);
    if (idx === 0) return 1;
    if (idx > 0) return 0.98;
    return outOfPositionFactor(eligible[0], playing);
}
