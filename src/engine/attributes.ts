import { SPECIES, type Species, type StatKey } from './data';
import { dln } from './dmath';

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
    /** Físico: o corpo mexe nos atributos (pontos somados), além do que os stats base já dizem. */
    physique?: Physique;
    /** Pontos somados à nota só na hora de escolher as posições (ex.: GK -4 = só vai pro gol quem é claramente melhor lá). */
    bias?: Partial<Record<Position, number>>;
    /** Posições a até `margin` pontos da melhor nota contam como elegíveis… */
    margin: number;
    /** …até no máximo `maxPositions`. */
    maxPositions: number;
}

/**
 * Físico. `body`: pontos por formato do corpo (PokeAPI). `smallAgility`: pontos de drible e velocidade
 * para o menor Pokémon (o maior perde o mesmo; o meio fica neutro).
 */
export interface Physique {
    body: Record<string, Partial<Record<AttrKey, number>>>;
    smallAgility: number;
}

/** Regra da v0.4 (só stats), mantida pra comparação no laboratório. */
export const FORMULAS_V04: PositionFormulas = {
    goalkeeping: { hp: 30, def: 25, spd: 25, size: 20 },
    FIXO: { tackling: 35, positioning: 25, strength: 20, passing: 20 },
    ALA: { pace: 30, dribble: 30, passing: 25, stamina: 15 },
    PIVO: { shooting: 40, strength: 20, dribble: 20, positioning: 20 },
    margin: 4,
    maxPositions: 3,
};

/**
 * Físico (v0.5): quem tem mãos/braços defende melhor; quadrúpedes, aves e peixes não. Bichos de várias
 * cabeças enxergam o jogo (passe). Os pequenos driblam melhor, os gigantes pior.
 */
export const BODY_EFFECTS: Record<string, { label: string; note: string; mods: Partial<Record<AttrKey, number>> }> = {
    humanoid: { label: 'Humanoide', note: 'Mãos de goleiro', mods: { goalkeeping: 6 } },
    arms: { label: 'Com braços', note: 'Mãos de goleiro', mods: { goalkeeping: 6 } },
    upright: { label: 'Bípede', note: 'Usa as mãos no gol', mods: { goalkeeping: 2 } },
    blob: { label: 'Bolha', note: 'Ocupa o gol inteiro', mods: { goalkeeping: 4 } },
    ball: { label: 'Bola', note: 'Ocupa o gol', mods: { goalkeeping: 3 } },
    tentacles: { label: 'Tentáculos', note: 'Alcança tudo no gol', mods: { goalkeeping: 4 } },
    quadruped: { label: 'Quadrúpede', note: 'Corredor, sem mãos', mods: { goalkeeping: -6, pace: 3, dribble: 2 } },
    legs: { label: 'Pernas', note: 'Corredor, sem mãos', mods: { goalkeeping: -4, pace: 3 } },
    wings: { label: 'Asas', note: 'Voa pela ala, sem mãos', mods: { goalkeeping: -5, pace: 2, positioning: 2 } },
    'bug-wings': { label: 'Asas de inseto', note: 'Voa pela ala, sem mãos', mods: { goalkeeping: -5, pace: 2 } },
    fish: { label: 'Peixe', note: 'Péssimo no gol', mods: { goalkeeping: -8 } },
    squiggle: { label: 'Serpente', note: 'Corpo forte, sem mãos', mods: { goalkeeping: -4, strength: 2 } },
    armor: { label: 'Couraça', note: 'Blindado na marcação', mods: { goalkeeping: -2, tackling: 4, strength: 2 } },
    heads: { label: 'Várias cabeças', note: 'Enxerga o jogo todo', mods: { passing: 4, positioning: 2 } },
};

export const DEFAULT_FORMULAS: PositionFormulas = {
    goalkeeping: { hp: 30, def: 25, spd: 25, size: 20 },
    FIXO: { tackling: 35, positioning: 25, strength: 20, passing: 20 },
    ALA: { pace: 30, dribble: 30, passing: 25, stamina: 15 },
    // Pivô "trombador": segura a bola de costas pro gol, força pesa tanto quanto o chute
    PIVO: { shooting: 35, strength: 35, dribble: 15, positioning: 15 },
    physique: {
        smallAgility: 6,
        body: Object.fromEntries(Object.entries(BODY_EFFECTS).map(([k, b]) => [k, b.mods])),
    },
    bias: { GK: -2, PIVO: 2 },
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
    ref.weight = SPECIES.map((s) => dln(s.weightkg + 1)).sort((a, b) => a - b);
    ref.height = SPECIES.map((s) => dln(s.heightm + 0.1)).sort((a, b) => a - b);
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

/**
 * "Tamanho" (0..1, peso + altura entre os 151): goleiro grande fecha o gol. Serpente só pelo peso: a altura dela é
 * comprimento (Ekans tem 2 m e 7 kg; auditoria de posições, 17/10/2026).
 */
export function sizePercentile(sp: Species): number {
    const w = percentile(REFERENCE.weight, dln(sp.weightkg + 1));
    if (sp.shape === 'squiggle') return w;
    return 0.5 * w + 0.5 * percentile(REFERENCE.height, dln(sp.heightm + 0.1));
}

/**
 * Jogo aéreo (disputa no alto do escanteio, docs/planos/escanteio.md): força 45%, tamanho 35%, posicionamento 20%.
 * `size` é o `sizePercentile` (0..1). A disputa no motor e o selo "Jogo aéreo" do painel usam esta mesma conta.
 */
export function aerialScore(strength: number, positioning: number, size: number): number {
    return 0.45 * strength + 0.35 * size * 99 + 0.2 * positioning;
}

/** Selo do painel: alto/médio/baixo (terços aproximados dos 151 no nível 50). */
export function aerialLevel(score: number): 'high' | 'mid' | 'low' {
    return score >= AERIAL_HIGH ? 'high' : score >= AERIAL_MID ? 'mid' : 'low';
}
const AERIAL_HIGH = 68;
const AERIAL_MID = 49;

/** Físico pra mostrar na carta: porte + formato do corpo. */
export function physiqueOf(sp: Species): { size: string; body: string; note: string } {
    const s = sizePercentile(sp);
    const size = s < 0.25 ? 'Pequeno' : s < 0.6 ? 'Médio' : s < 0.88 ? 'Grande' : 'Gigante';
    const b = BODY_EFFECTS[sp.shape];
    return { size, body: b?.label ?? sp.shape, note: b?.note ?? '' };
}

/**
 * Ajuste fino por espécie (balanceamento, Bloco 3): pontos num atributo de quem rendia em campo bem diferente
 * da nota. Mexe de preferência num atributo que a nota da posição não usa (o Pivô não conta velocidade, o Ala não
 * conta chute), então a nota fica a mesma e o campo chega perto dela. Aparece na carta como qualquer atributo.
 */
export const SPECIES_TUNING: Record<number, Partial<Record<AttrKey, number>>> = {
    // rendiam abaixo da nota
    25: { shooting: 4 }, // Pikachu (Ala): chute 47
    101: { shooting: 5, pace: 3 }, // Electrode (Ala): chute 54; velocidade 99, a maior base da Gen 1 (150)
    124: { shooting: 5 }, // Jynx (Ala): chute 62
    127: { pace: 6 }, // Pinsir (Pivô): o Pivô não conta velocidade
    136: { pace: 6 }, // Flareon (Pivô): idem
    // rendiam acima da nota
    128: { tackling: -6, strength: -3 }, // Tauros (Pivô): Pivô 76 → 75, Fixo 76 → 73, Ala fica 74
    142: { shooting: -3 }, // Aerodactyl (Ala): Pivô 77 → 76, Ala fica 82
    // auditoria de posições (17/10/2026, aprovada pelo Miguel): identidade Gen 1 e quem não tinha lugar bom
    11: { goalkeeping: 1 }, // Metapod: só Harden, fica no gol com 38 (a regra da serpente tirava)
    15: { shooting: 8, strength: 5 }, // Beedrill: o ferrão vira Pivô 65 (era Ala 63)
    28: { positioning: 6, strength: 2 }, // Sandslash: raro prata, Fixo 73 → 75
    30: { tackling: 3, positioning: 2 }, // Nidorina: linha ♀ defensiva, vira Fixo 58 (Nidoqueen tem Fixo)
    33: { shooting: 3, strength: 3 }, // Nidorino: linha do Nidoking, vira Pivô 58 (era Ala 59)
    40: { goalkeeping: 5 }, // Wigglytuff: o balão infla e fecha o gol, 66 → 71
    59: { pace: 4 }, // Arcanine: ExtremeSpeed, velocidade 85 → 89 (Pivô fica 87)
    78: { pace: 3 }, // Rapidash: o cavalo de corrida vira Ala 83 (era Pivô 81 pelo bônus do Pivô)
    95: { strength: 10, tackling: 8, positioning: 8 }, // Onix: 210 kg de pedra, Fixo 63 → 70
    103: { strength: 3, shooting: 2 }, // Exeggutor: o épico mais fraco, Pivô 80 → 82
    106: { shooting: 10, strength: 4 }, // Hitmonlee: o chutador tinha chute 69, Pivô 70 → 75
    113: { goalkeeping: 3 }, // Chansey: rara prata (Defesa 5), Goleiro 73 → 76
    119: { shooting: 4, strength: 3 }, // Seaking: raro prata, Pivô 70 → 72
    122: { goalkeeping: 5, stamina: 8, pace: 4 }, // Mr. Mime: a parede invisível, Goleiro 75 e Ala 80
    130: { shooting: 6 }, // Gyarados: épico abaixo dos raros, Pivô 81 → 83
    131: { strength: 5, positioning: 4 }, // Lapras: a balsa de 220 kg, Fixo 81 → 83
    134: { pace: 4, dribble: 4 }, // Vaporeon: lenta na Ala pros 525 de BST, 76 → 79
    143: { strength: 6, goalkeeping: -2 }, // Snorlax: o mais pesado de Kanto tinha força 83; rendia acima no gol (93 → 91)
};

export function computeAttributes(
    sp: Species,
    level: number,
    formulas: PositionFormulas = DEFAULT_FORMULAS,
): Attributes {
    const p = {} as Record<StatKey, number>;
    for (const k of STAT_KEYS) p[k] = percentile(REFERENCE[k], statAtLevel(sp.baseStats[k], level, k));
    const w = percentile(REFERENCE.weight, dln(sp.weightkg + 1));
    const size = sizePercentile(sp);

    const attr: Attributes = {
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
    const phys = formulas.physique;
    if (phys) {
        const bonus: Partial<Record<AttrKey, number>> = { ...phys.body[sp.shape] };
        // pequeno = ágil, grande = pesado (centrado no Pokémon de tamanho médio)
        const agility = phys.smallAgility * (1 - 2 * Math.min(1, size));
        bonus.dribble = (bonus.dribble ?? 0) + agility;
        bonus.pace = (bonus.pace ?? 0) + agility / 2;
        for (const [k, b] of Object.entries(bonus) as [AttrKey, number][]) {
            attr[k] = Math.round(Math.min(99, Math.max(1, attr[k] + b)));
        }
    }
    for (const [k, b] of Object.entries(SPECIES_TUNING[sp.id] ?? {}) as [AttrKey, number][]) {
        attr[k] = Math.round(Math.min(99, Math.max(1, attr[k] + b)));
    }
    return attr;
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
    11: ['ALA'], // Metapod: a linha do Caterpie pode ficar na Ala até o Butterfree
    14: ['ALA'], // Kakuna: idem, do Weedle ao Beedrill
    48: ['ALA'], // Venonat: dá pra apostar no Venomoth (Ala 80) desde o draft
    62: ['ALA'], // Poliwrath: o Poliwhirl que evolui na Ala não cai pra 53
    76: ['PIVO'], // Golem: a pedra rolando (o Graveler jogava de Pivô)
    95: ['GK'], // Onix: a muralha de pedra
    112: ['FIXO', 'PIVO'], // Rhydon: o rinoceronte de broca também tromba na linha
    122: ['GK'], // Mr. Mime: a parede invisível (Barrier, Reflect)
    132: ['GK', 'FIXO', 'ALA', 'PIVO'], // Ditto: joga em qualquer posição (vira o melhor dela em campo)
    151: ['FIXO', 'PIVO', 'GK'], // Mew: aprende todas as MTs, joga em qualquer lugar
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

/**
 * Multiplicador para jogar em `playing`: principal 1, secundária 0,98, fora das elegíveis penaliza. Com os
 * atributos, a secundária nunca passa da nota da principal (Dragonite Pivô 90 não vira Goleiro 91).
 */
export function positionFactor(eligible: readonly Position[], playing: Position, a?: Attributes): number {
    const idx = eligible.indexOf(playing);
    if (idx === 0) return 1;
    if (idx > 0) return a ? Math.min(0.98, positionRating(a, eligible[0]) / positionRating(a, playing)) : 0.98;
    return outOfPositionFactor(eligible[0], playing);
}
