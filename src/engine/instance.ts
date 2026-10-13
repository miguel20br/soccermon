import { type Attributes, computeAttributes, eligiblePositions, type Position, positionRating } from './attributes';
import { type Species, species } from './data';
import { defaultMoveset } from './moves';
import type { Rng } from './rng';

/**
 * Um Pokémon "de verdade" no time — não só a espécie. No MVP todos jogam no nível 50;
 * na carreira entram XP, nível, golpes aprendidos e evolução.
 */
export interface PokemonInstance {
    uid: string;
    speciesId: number;
    level: number;
    xp: number;
    moves: string[];
    ability: string;
    shiny: boolean;
    nickname: string | null;
    /** Condição física entre partidas (0..1). Na copa do MVP sempre volta a 1. */
    condition: number;
    /** Item segurado (src/engine/items.ts), ou null. */
    item?: string | null;
}

export const DEFAULT_LEVEL = 50;
const SHINY_CHANCE = 1 / 64; // bem mais generoso que os jogos — é um fan game, deixa a alegria acontecer

export function createInstance(speciesId: number, rng: Rng, level = DEFAULT_LEVEL): PokemonInstance {
    const sp = species(speciesId);
    return {
        uid: `${speciesId}-${Math.floor(rng.next() * 1e9).toString(36)}`,
        speciesId,
        level,
        xp: 0,
        moves: defaultMoveset(sp),
        // habilidade oculta é mais rara (1 em 5)
        ability:
            sp.abilities.length > 1 && rng.chance(0.2)
                ? sp.abilities[sp.abilities.length - 1]
                : rng.pick(sp.abilities.slice(0, Math.max(1, sp.abilities.length - 1))),
        shiny: rng.chance(SHINY_CHANCE),
        nickname: null,
        condition: 1,
    };
}

export interface InstanceView {
    instance: PokemonInstance;
    species: Species;
    attributes: Attributes;
    naturalPosition: Position;
    /** Posições em que joga bem (a principal primeiro). */
    positions: Position[];
    overall: number;
    displayName: string;
}

export function viewInstance(inst: PokemonInstance): InstanceView {
    const sp = species(inst.speciesId);
    const attributes = computeAttributes(sp, inst.level);
    const positions = eligiblePositions(attributes, sp.id);
    return {
        instance: inst,
        species: sp,
        attributes,
        naturalPosition: positions[0],
        positions,
        overall: positionRating(attributes, positions[0]),
        displayName: inst.nickname ?? sp.name,
    };
}
