import { computeAttributes, eligiblePositions, type Position, positionRating } from './attributes';
import { SPECIES, type Species, type Tier } from './data';
import { type FormationId, formationOf } from './formations';
import { createInstance, DEFAULT_LEVEL, type PokemonInstance } from './instance';
import type { Rng } from './rng';

/**
 * Draft estilo "7 a 0": rodada 0 = capitão (raro, qualquer posição); nas rodadas seguintes você escolhe
 * uma vaga e saem 3 Pokémon que jogam naquela posição. 5 titulares + 2 reservas = 7 escolhas.
 * A raridade sobe ao longo das rodadas (estilo RarityProbabilityPerLevel do Pokémon Auto Chess).
 */
export const DRAFT_PICKS = 7;
export const BENCH_SIZE = 2;

/** Vagas do draft da IA/testes na formação padrão (titulares na ordem da formação + 2 reservas). */
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
/** Capitão: sempre raro para cima. */
const CAPTAIN_ODDS = [0, 0, 0.62, 0.3, 0.08];

interface SpeciesProfile {
    eligible: Position[];
    ratings: Record<Position, number>;
}
const PROFILE_CACHE = new Map<number, SpeciesProfile>();
export function speciesProfile(sp: Species): SpeciesProfile {
    let v = PROFILE_CACHE.get(sp.id);
    if (!v) {
        const a = computeAttributes(sp, DEFAULT_LEVEL);
        v = {
            eligible: eligiblePositions(a, sp.id),
            ratings: {
                GK: positionRating(a, 'GK'),
                FIXO: positionRating(a, 'FIXO'),
                ALA: positionRating(a, 'ALA'),
                PIVO: positionRating(a, 'PIVO'),
            },
        };
        PROFILE_CACHE.set(sp.id, v);
    }
    return v;
}

export const canPlay = (sp: Species, need: Position | 'ANY') =>
    need === 'ANY' || speciesProfile(sp).eligible.includes(need);

/**
 * Gera opções distintas: todas jogam na posição pedida, nunca repetem espécies já escolhidas e têm
 * pelo menos 2 tipos primários diferentes entre si.
 */
export function draftOptions(
    rng: Rng,
    round: number,
    taken: ReadonlySet<number>,
    count = 3,
    preferTypes: readonly string[] = [],
    needOverride?: Position | 'ANY',
    oddsOverride?: number[],
): PokemonInstance[] {
    const need = needOverride ?? DRAFT_ROUNDS[round]?.need ?? 'ANY';
    // Pivô é a posição mais escassa: a vaga puxa um pouco mais de raridade para não sobrar só nota baixa
    const boost = need === 'PIVO' ? 2 : 0;
    const odds = oddsOverride ?? TIER_ODDS[Math.min(round + boost, TIER_ODDS.length - 1)];
    const chosen: Species[] = [];
    let guard = 0;
    while (chosen.length < count && guard++ < 500) {
        const tier = rng.weighted(TIERS, (t) => odds[TIERS.indexOf(t)]);
        const pool = SPECIES.filter(
            (sp) => sp.tier === tier && !taken.has(sp.id) && !chosen.some((c) => c.id === sp.id) && canPlay(sp, need),
        );
        if (!pool.length) continue;
        // times temáticos (ginásios) preferem os próprios tipos
        const themed = preferTypes.length ? pool.filter((sp) => sp.types.some((t) => preferTypes.includes(t))) : [];
        const pick = rng.pick(themed.length && rng.chance(0.75) ? themed : pool);
        const typesSoFar = new Set(chosen.map((c) => c.types[0]));
        if (chosen.length === 2 && typesSoFar.size === 1 && typesSoFar.has(pick.types[0]) && guard < 400) continue;
        chosen.push(pick);
    }
    return chosen.map((sp) => createInstance(sp.id, rng));
}

/** 3 opções de capitão: raros, épicos ou lendários, de qualquer posição. */
export function captainOptions(rng: Rng, taken: ReadonlySet<number>, count = 3): PokemonInstance[] {
    return draftOptions(rng, 0, taken, count, [], 'ANY', CAPTAIN_ODDS);
}

/** IA do draft: escolhe a opção com melhor nota na posição pedida (com um toque de aleatoriedade). */
export function aiPick(rng: Rng, options: PokemonInstance[], need: Position | 'ANY'): PokemonInstance {
    const score = (inst: PokemonInstance) => {
        const prof = speciesProfile(SPECIES.find((s) => s.id === inst.speciesId)!);
        const r = need === 'ANY' ? Math.max(...Object.values(prof.ratings)) : prof.ratings[need];
        return r + rng.range(0, 6);
    };
    let best = options[0];
    let bestScore = score(best);
    for (const o of options.slice(1)) {
        const sc = score(o);
        if (sc > bestScore) {
            best = o;
            bestScore = sc;
        }
    }
    return best;
}

/**
 * Monta um time da IA completo (adversários da copa), vaga por vaga da formação.
 * Dificuldade: 0 = escolhe meio no chute · 1 = melhor de 3 · 2 = melhor de 4 · 3 = melhor de 5 com raridade antecipada.
 */
export function aiDraftTeam(
    rng: Rng,
    difficulty: number,
    preferTypes: readonly string[] = [],
    formation?: FormationId,
): { lineup: PokemonInstance[]; bench: PokemonInstance[]; captainUid: string } {
    const needs: (Position | 'ANY')[] = [...formationOf(formation).slots, 'ANY', 'ANY'];
    const taken = new Set<number>();
    const picks: PokemonInstance[] = [];
    const extra = Math.max(0, difficulty - 1);
    needs.forEach((need, round) => {
        const options = draftOptions(rng, Math.min(6, round + extra), taken, 3 + extra, preferTypes, need);
        const pick = difficulty === 0 && rng.chance(0.6) ? rng.pick(options) : aiPick(rng, options, need);
        taken.add(pick.speciesId);
        picks.push(pick);
    });
    const lineup = picks.slice(0, needs.length - BENCH_SIZE);
    // capitão da IA: o titular de melhor nota
    const overall = (p: PokemonInstance) =>
        Math.max(...Object.values(speciesProfile(SPECIES[p.speciesId - 1]).ratings));
    const captain = lineup.reduce((best, p) => (overall(p) > overall(best) ? p : best));
    return { lineup, bench: picks.slice(needs.length - BENCH_SIZE), captainUid: captain.uid };
}
