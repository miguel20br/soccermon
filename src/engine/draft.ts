import {
    type Attributes,
    computeAttributes,
    eligiblePositions,
    type Position,
    positionFactor,
    positionRating,
} from './attributes';
import { SPECIES, type Species, species, type Tier } from './data';
import { type FormationId, formationOf } from './formations';
import { createInstance, DEFAULT_LEVEL, type PokemonInstance, slotRating } from './instance';
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
    attributes: Attributes;
    eligible: Position[];
    ratings: Record<Position, number>;
}
const PROFILE_CACHE = new Map<number, SpeciesProfile>();
export function speciesProfile(sp: Species): SpeciesProfile {
    let v = PROFILE_CACHE.get(sp.id);
    if (!v) {
        const a = computeAttributes(sp, DEFAULT_LEVEL);
        v = {
            attributes: a,
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

/** Nota de prata (cartas: bronze até 64, prata 65–74, ouro 75+). */
export const SILVER = 65;

/** Nota da espécie na vaga, como a carta mostra (sem edição especial). */
function speciesSlotRating(sp: Species, need: Position | 'ANY'): number {
    const prof = speciesProfile(sp);
    if (need === 'ANY') return prof.ratings[prof.eligible[0]];
    return Math.round(prof.ratings[need] * positionFactor(prof.eligible, need, prof.attributes));
}

/** "Promessa": evolui para ouro (75+) na vaga. */
export const PROMISE = 75;
/** Chance de a rodada ganhar uma promessa quando nenhuma das 3 é (0,5 deu 0,97 evolução por copa; meta ~1,2). */
export const PROMISE_CHANCE = 1;

const MAX_ID = SPECIES.length;
/** Nota da forma evoluída na vaga; com várias evoluções (Eevee), a pior delas. null se não evolui. */
function speciesEvolvedRating(sp: Species, need: Position | 'ANY'): number | null {
    const into = sp.evolvesTo.filter((e) => e.id <= MAX_ID);
    return into.length ? Math.min(...into.map((e) => speciesSlotRating(SPECIES[e.id - 1], need))) : null;
}

/**
 * As 3 opções do draft do jogador (Bloco 2 do balanceamento, 17/10/2026): as de `draftOptions` com duas garantias,
 * sempre trocando a opção mais fraca. A IA e as recompensas seguem com `draftOptions` puro.
 * - piso de prata: se as 3 saem bronze na vaga, entra uma prata que joga ali (de preferência uma promessa);
 * - promessa: se nenhuma evolui para ouro na vaga, entra uma que evolui (a carta mostra a nota depois de evoluir).
 */
export function playerDraftOptions(
    rng: Rng,
    round: number,
    taken: ReadonlySet<number>,
    need: Position | 'ANY',
): PokemonInstance[] {
    const out = draftOptions(rng, round, taken, 3, [], need);
    if (!out.length) return out;
    const rating = (o: PokemonInstance) => slotRating(o, need);
    const promise = (sp: Species) => (speciesEvolvedRating(sp, need) ?? 0) >= PROMISE;
    const candidates = (min: number) =>
        SPECIES.filter(
            (sp) =>
                !taken.has(sp.id) &&
                !out.some((o) => o.speciesId === sp.id) &&
                canPlay(sp, need) &&
                sp.tier !== 'epic' &&
                sp.tier !== 'legendary' &&
                speciesSlotRating(sp, need) >= min,
        );
    const replaceWeakest = (pool: Species[]) => {
        if (!pool.length) return;
        const weakest = out.reduce((w, o, i) => (rating(o) < rating(out[w]) ? i : w), 0);
        out[weakest] = createInstance(rng.pick(pool).id, rng);
    };
    if (!out.some((o) => rating(o) >= SILVER)) {
        const silver = candidates(SILVER);
        const promising = silver.filter(promise);
        replaceWeakest(promising.length ? promising : silver);
    }
    if (!out.some((o) => promise(species(o.speciesId))) && rng.chance(PROMISE_CHANCE)) {
        replaceWeakest(candidates(0).filter(promise));
    }
    return out;
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
 * Dificuldade: -1 = estreante (raridade de começo de draft, escolhe sempre no chute) · 0 = escolhe meio no chute · 1 = melhor de 3 · 2 = melhor de 4 · 3 = melhor de 5 com raridade antecipada.
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
        // estreante: raridade de começo de draft em todas as vagas
        const r = difficulty < 0 ? 0 : Math.min(6, round + extra);
        const options = draftOptions(rng, r, taken, 3 + extra, preferTypes, need);
        const random = difficulty < 0 || (difficulty === 0 && rng.chance(0.6));
        const pick = random ? rng.pick(options) : aiPick(rng, options, need);
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
