import abilitiesJson from '../data/abilities.json';
import movesJson from '../data/moves.json';
import pokemonJson from '../data/pokemon.json';
import typechartJson from '../data/typechart.json';

export type TypeName = string;
export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Species {
    id: number;
    slug: string;
    name: string;
    types: TypeName[];
    baseStats: Record<StatKey, number>;
    bst: number;
    tier: Tier;
    abilities: string[];
    learnset: string[];
    evolvesTo: { id: number; level: number | null; method: string; item?: string | null }[];
    prevo: number | null;
    heightm: number;
    weightkg: number;
    /** Formato do corpo (PokeAPI): humanoid, upright, arms, quadruped, legs, wings, bug-wings, fish, squiggle, tentacles, blob, ball, armor, heads. */
    shape: string;
}

export interface MoveData {
    id: string;
    name: string;
    type: TypeName;
    category: 'Physical' | 'Special' | 'Status';
    power: number;
    accuracy: number;
    priority: number;
    pp: number;
    selfBoosts: Partial<Record<string, number>> | null;
    targetBoosts: Partial<Record<string, number>> | null;
    target: string;
    status: string | null;
    heal: boolean;
    multihit: number | number[] | null;
    /** Efeito secundário (ex.: Thunderbolt 10% paralisar). */
    secondary: {
        chance: number;
        status: string | null;
        volatile: string | null;
        boosts: Partial<Record<string, number>> | null;
    } | null;
    shortDesc: string;
    descPt: string | null;
}

export interface AbilityData {
    id: string;
    name: string;
    shortDesc: string;
    descPt: string | null;
}

/**
 * Exceções fora do learnset da Gen 1 (decididas com o Miguel, uma por uma). Valem em tudo: moveset padrão, MT e
 * validação do Duelo.
 * - Gengar: Sludge. Na Gen 1 o único golpe Venenoso dele era o Toxic; da Gen 2 em diante ele aprende Sludge Bomb.
 */
export const LEARNSET_EXTRA: Readonly<Record<number, readonly string[]>> = { 94: ['sludge'] };
export const SPECIES: Species[] = (pokemonJson as Species[]).map((sp) =>
    LEARNSET_EXTRA[sp.id] ? { ...sp, learnset: [...sp.learnset, ...LEARNSET_EXTRA[sp.id]] } : sp,
);
export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));
export const MOVES = movesJson as unknown as Record<string, MoveData>;
/**
 * Ajustes de jogo nos dados da Gen 1 (o `build-data` refaz o JSON; o ajuste fica aqui e vale na carta e em campo).
 * 22/10/2026, MTs que ninguém pegava (Miguel, opção A nas 3 piores): Mega Drain 40 ⇒ 100, BubbleBeam 65 ⇒ 100,
 * Fissure 30% ⇒ 50% de acerto.
 */
const MOVE_DATA_TUNING: Readonly<Record<string, Partial<MoveData>>> = {
    megadrain: { power: 100 },
    bubblebeam: { power: 100 },
    fissure: { accuracy: 50, descPt: MOVES.fissure?.descPt?.replace('30%', '50%') ?? null },
};
for (const [id, patch] of Object.entries(MOVE_DATA_TUNING)) MOVES[id] = { ...MOVES[id], ...patch };
export const ABILITIES = abilitiesJson as Record<string, AbilityData>;
// no Soccermon o Imposter do Ditto copia o melhor da posição dele em campo, de qualquer time
if (ABILITIES.imposter) {
    ABILITIES.imposter = {
        ...ABILITIES.imposter,
        descPt: 'Transform: no apito inicial, o Ditto vira uma cópia do melhor Pokémon da posição dele em campo, seja do seu time ou do rival.',
    };
}
export const TYPES: TypeName[] = typechartJson.types;
const CHART = typechartJson.chart as Record<string, Record<string, number>>;

export function species(id: number): Species {
    const s = SPECIES_BY_ID.get(id);
    if (!s) throw new Error(`Espécie desconhecida: ${id}`);
    return s;
}

/** Efetividade total de um tipo atacante contra uma lista de tipos defensores (0, 0.25 … 4). */
export function effectiveness(attack: TypeName, defense: readonly TypeName[]): number {
    return defense.reduce((m, d) => m * (CHART[attack]?.[d] ?? 1), 1);
}
