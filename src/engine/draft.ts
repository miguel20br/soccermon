import { bestPosition, computeAttributes, type Position, positionRating } from './attributes';
import { SPECIES, type Species, type Tier } from './data';
import { createInstance, DEFAULT_LEVEL, type PokemonInstance } from './instance';
import type { Rng } from './rng';
import { FUTSAL_SLOTS } from './state';

/**
 * Draft "escolha 1 de 3". 7 rodadas: goleiro, 4 de linha (na ordem dos slots) e 2 reservas.
 * A raridade sobe ao longo das rodadas (estilo RarityProbabilityPerLevel do Pokémon Auto Chess).
 */
export interface DraftRound {
    index: number;
    need: Position | 'ANY';
    label: string;
}

export const DRAFT_ROUNDS: DraftRound[] = [
    { index: 0, need: 'GK', label: 'Goleiro' },
    { index: 1, need: 'FIXO', label: 'Fixo' },
    { index: 2, need: 'ALA', label: 'Ala' },
    { index: 3, need: 'ALA', label: 'Ala' },
    { index: 4, need: 'PIVO', label: 'Pivô' },
    { index: 5, need: 'ANY', label: 'Reserva' },
    { index: 6, need: 'ANY', label: 'Reserva' },
];

const TIERS: Tier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
/** Probabilidade de cada raridade por rodada. */
const TIER_ODDS: number[][] = [
    [0.35, 0.35, 0.25, 0.05, 0],
    [0.35, 0.35, 0.25, 0.05, 0],
    [0.3, 0.35, 0.28, 0.07, 0],
    [0.25, 0.33, 0.32, 0.09, 0.01],
    [0.2, 0.3, 0.35, 0.12, 0.03],
    [0.2, 0.3, 0.35, 0.12, 0.03],
    [0.15, 0.25, 0.38, 0.16, 0.06],
];

const VIEW_CACHE = new Map<number, { natural: Position; ratings: Record<Position, number> }>();
export function speciesProfile(sp: Species) {
    let v = VIEW_CACHE.get(sp.id);
    if (!v) {
        const a = computeAttributes(sp, DEFAULT_LEVEL);
        v = {
            natural: bestPosition(a).pos,
            ratings: {
                GK: positionRating(a, 'GK'),
                FIXO: positionRating(a, 'FIXO'),
                ALA: positionRating(a, 'ALA'),
                PIVO: positionRating(a, 'PIVO'),
            },
        };
        VIEW_CACHE.set(sp.id, v);
    }
    return v;
}

/**
 * Gera 3 opções distintas para a rodada: preferem a posição necessária, nunca repetem espécies já
 * escolhidas e têm pelo menos 2 tipos primários diferentes entre si.
 */
export function draftOptions(
    rng: Rng,
    round: number,
    taken: ReadonlySet<number>,
    count = 3,
    preferTypes: readonly string[] = [],
    needOverride?: Position | 'ANY',
): PokemonInstance[] {
    const need = needOverride ?? DRAFT_ROUNDS[round]?.need ?? 'ANY';
    const odds = TIER_ODDS[Math.min(round, TIER_ODDS.length - 1)];
    const chosen: Species[] = [];
    let guard = 0;
    while (chosen.length < count && guard++ < 500) {
        const tier = rng.weighted(TIERS, (t) => odds[TIERS.indexOf(t)]);
        const pool = SPECIES.filter((sp) => {
            if (sp.tier !== tier || taken.has(sp.id) || chosen.some((c) => c.id === sp.id)) return false;
            if (need === 'ANY') return true;
            const prof = speciesProfile(sp);
            if (need === 'GK') return prof.natural === 'GK' || prof.ratings.GK >= 60;
            return prof.natural === need || prof.ratings[need] >= Math.max(...Object.values(prof.ratings)) - 4;
        });
        if (!pool.length) continue;
        // times temáticos (ginásios) preferem os próprios tipos
        const themed = preferTypes.length ? pool.filter((sp) => sp.types.some((t) => preferTypes.includes(t))) : [];
        const pick = rng.pick(themed.length && rng.chance(0.75) ? themed : pool);
        const typesSoFar = new Set(chosen.map((c) => c.types[0]));
        if (chosen.length === 2 && typesSoFar.size === 1 && typesSoFar.has(pick.types[0])) continue;
        chosen.push(pick);
    }
    return chosen.map((sp) => createInstance(sp.id, rng));
}

/** IA do draft: escolhe a opção com melhor nota na posição necessária (com um toque de aleatoriedade). */
export function aiPick(rng: Rng, options: PokemonInstance[], round: number): PokemonInstance {
    const need = DRAFT_ROUNDS[round]?.need ?? 'ANY';
    return options.reduce((best, o) => {
        const score = (inst: PokemonInstance) => {
            const prof = speciesProfile(SPECIES.find((s) => s.id === inst.speciesId)!);
            const r = need === 'ANY' ? Math.max(...Object.values(prof.ratings)) : prof.ratings[need];
            return r + rng.range(0, 6);
        };
        return score(o) > score(best) ? o : best;
    });
}

/**
 * Monta um time da IA completo (adversários da copa).
 * Dificuldade: 0 = escolhe meio no chute · 1 = melhor de 3 · 2 = melhor de 4 · 3 = melhor de 5 com raridade antecipada.
 */
export function aiDraftTeam(
    rng: Rng,
    difficulty: number,
    preferTypes: readonly string[] = [],
): { lineup: PokemonInstance[]; bench: PokemonInstance[] } {
    const taken = new Set<number>();
    const picks: PokemonInstance[] = [];
    const extra = Math.max(0, difficulty - 1);
    for (let round = 0; round < DRAFT_ROUNDS.length; round++) {
        const options = draftOptions(rng, Math.min(6, round + extra), taken, 3 + extra, preferTypes);
        const pick = difficulty === 0 && rng.chance(0.6) ? rng.pick(options) : aiPick(rng, options, round);
        taken.add(pick.speciesId);
        picks.push(pick);
    }
    return { lineup: picks.slice(0, FUTSAL_SLOTS.length), bench: picks.slice(FUTSAL_SLOTS.length) };
}
