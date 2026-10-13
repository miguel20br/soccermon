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
    goalkeeping: number; // reflexo e alcance no gol (HP + Def + Sp. Def + Speed)
}

export type AttrKey = keyof Attributes;
export type Position = 'GK' | 'FIXO' | 'ALA' | 'PIVO';
export const POSITIONS: Position[] = ['GK', 'FIXO', 'ALA', 'PIVO'];
export const POSITION_LABEL: Record<Position, string> = { GK: 'Goleiro', FIXO: 'Fixo', ALA: 'Ala', PIVO: 'Pivô' };

/** Stat real no nível L (fórmula dos jogos, IV 31, sem EV). */
export function statAtLevel(base: number, level: number, key: StatKey): number {
    const core = Math.floor(((2 * base + 31) * level) / 100);
    return key === 'hp' ? core + level + 10 : core + 5;
}

const REF_LEVEL = 50;
const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

/** Distribuição de referência: stats dos 151 no nível 50, ordenados. */
const REFERENCE: Record<StatKey | 'weight', number[]> = (() => {
    const ref = {} as Record<StatKey | 'weight', number[]>;
    for (const k of STAT_KEYS) {
        ref[k] = SPECIES.map((s) => statAtLevel(s.baseStats[k], REF_LEVEL, k)).sort((a, b) => a - b);
    }
    ref.weight = SPECIES.map((s) => Math.log(s.weightkg + 1)).sort((a, b) => a - b);
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

export function computeAttributes(sp: Species, level: number): Attributes {
    const p = {} as Record<StatKey, number>;
    for (const k of STAT_KEYS) p[k] = percentile(REFERENCE[k], statAtLevel(sp.baseStats[k], level, k));
    const w = percentile(REFERENCE.weight, Math.log(sp.weightkg + 1));

    return {
        pace: toAttr(p.spe),
        dribble: toAttr(0.7 * p.spe + 0.3 * p.spa),
        shooting: toAttr(0.6 * p.atk + 0.4 * p.spa),
        passing: toAttr(0.65 * p.spa + 0.35 * p.spd),
        tackling: toAttr(0.7 * p.def + 0.3 * p.atk),
        strength: toAttr(0.35 * p.atk + 0.35 * p.def + 0.3 * w),
        positioning: toAttr(0.7 * p.spd + 0.3 * p.def),
        stamina: toAttr(p.hp),
        goalkeeping: toAttr(0.3 * p.hp + 0.25 * p.def + 0.25 * p.spd + 0.2 * p.spe),
    };
}

export function positionRating(a: Attributes, pos: Position): number {
    switch (pos) {
        case 'GK':
            return Math.round(a.goalkeeping);
        case 'FIXO':
            return Math.round(0.35 * a.tackling + 0.25 * a.positioning + 0.2 * a.strength + 0.2 * a.passing);
        case 'ALA':
            return Math.round(0.3 * a.pace + 0.3 * a.dribble + 0.25 * a.passing + 0.15 * a.stamina);
        case 'PIVO':
            return Math.round(0.4 * a.shooting + 0.2 * a.strength + 0.2 * a.dribble + 0.2 * a.positioning);
    }
}

export function bestPosition(a: Attributes): { pos: Position; rating: number } {
    // Goleiro só é "melhor posição" quando claramente destacado — evita times de goleiros no draft
    let best: { pos: Position; rating: number } = { pos: 'FIXO', rating: positionRating(a, 'FIXO') };
    for (const pos of POSITIONS) {
        const r = positionRating(a, pos) - (pos === 'GK' ? 4 : 0);
        if (r > best.rating) best = { pos, rating: positionRating(a, pos) };
    }
    return best;
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

const ELIGIBLE_MARGIN = 4;
const MAX_POSITIONS = 3;

/**
 * Posições em que o Pokémon joga bem: todas a até 4 pontos da melhor nota (máx. 3), ordenadas pela nota.
 * Ex.: Snorlax → Fixo, Goleiro e Pivô.
 */
export function eligiblePositions(a: Attributes, speciesId?: number): Position[] {
    const ratings = POSITIONS.map((pos) => ({ pos, r: positionRating(a, pos) })).sort((x, y) => y.r - x.r);
    const best = ratings[0].r;
    const list = ratings
        .filter((x) => x.r >= best - ELIGIBLE_MARGIN)
        .slice(0, MAX_POSITIONS)
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
