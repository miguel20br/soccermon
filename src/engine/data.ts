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

export const SPECIES: Species[] = pokemonJson as Species[];
export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));
export const MOVES = movesJson as unknown as Record<string, MoveData>;
export const ABILITIES = abilitiesJson as Record<string, AbilityData>;
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
