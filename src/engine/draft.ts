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
    /** Só deste tipo (pacote de tipo do Mercado). */
    onlyType?: string,
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
            (sp) =>
                sp.tier === tier &&
                !taken.has(sp.id) &&
                !chosen.some((c) => c.id === sp.id) &&
                canPlay(sp, need) &&
                (!onlyType || sp.types.includes(onlyType)),
        );
        if (!pool.length) continue;
        // times temáticos (ginásios) preferem os próprios tipos
        const themed = preferTypes.length ? pool.filter((sp) => sp.types.some((t) => preferTypes.includes(t))) : [];
        const pick = rng.pick(themed.length && rng.chance(0.75) ? themed : pool);
        const typesSoFar = new Set(chosen.map((c) => c.types[0]));
        if (!onlyType && chosen.length === 2 && typesSoFar.size === 1 && typesSoFar.has(pick.types[0]) && guard < 400)
            continue;
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

/**
 * "Monta pra mim" (escolha do jogador): a opção e a vaga em que ela tem a maior nota, como a carta mostra
 * na vaga (no banco, a nota da posição principal). Empate: a primeira. Sem sorteio: mesma seed, mesmo time.
 */
export function bestFit(
    options: readonly PokemonInstance[],
    roles: readonly (Position | 'ANY')[],
): { option: number; role: number } {
    let best = { option: 0, role: 0 };
    let top = -1;
    for (const [i, o] of options.entries())
        for (const [j, r] of roles.entries()) {
            const v = slotRating(o, r);
            if (v > top) {
                top = v;
                best = { option: i, role: j };
            }
        }
    return best;
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

/** Um Pokémon dos `types` que joga em `need`, com a nota na vaga mais perto da de `like`. */
function themedLike(
    rng: Rng,
    like: PokemonInstance,
    need: Position | 'ANY',
    taken: ReadonlySet<number>,
    types: readonly string[],
): PokemonInstance | null {
    const target = speciesSlotRating(species(like.speciesId), need);
    const pool = SPECIES.filter(
        (sp) => !taken.has(sp.id) && canPlay(sp, need) && sp.types.some((t) => types.includes(t)),
    );
    if (!pool.length) return null;
    const gap = (sp: Species) => Math.abs(speciesSlotRating(sp, need) - target);
    const best = Math.min(...pool.map(gap));
    return createInstance(rng.pick(pool.filter((sp) => gap(sp) === best)).id, rng);
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
    /** Titulares mínimos dos `preferTypes` (times da Rota: o Ornitólogo tem pássaros). 0 = só a preferência de 75%. */
    themeMin = 0,
): { lineup: PokemonInstance[]; bench: PokemonInstance[]; captainUid: string } {
    const needs: (Position | 'ANY')[] = [...formationOf(formation).slots, 'ANY', 'ANY'];
    const starters = needs.length - BENCH_SIZE;
    const themed = (p: PokemonInstance) => species(p.speciesId).types.some((t) => preferTypes.includes(t));
    const taken = new Set<number>();
    const picks: PokemonInstance[] = [];
    const extra = Math.max(0, difficulty - 1);
    needs.forEach((need, round) => {
        // estreante: raridade de começo de draft em todas as vagas
        const r = difficulty < 0 ? 0 : Math.min(6, round + extra);
        const options = draftOptions(rng, r, taken, 3 + extra, preferTypes, need);
        const random = difficulty < 0 || (difficulty === 0 && rng.chance(0.6));
        let pick = random ? rng.pick(options) : aiPick(rng, options, need);
        // tema no limite: só as vagas que faltam dão conta do mínimo, então esta tem que ser do tipo. Entra o do tipo
        // com a nota na vaga mais perto da escolhida, pra força do time não mudar
        const missing = themeMin - picks.filter(themed).length;
        if (round < starters && missing > 0 && missing >= starters - round && !themed(pick))
            pick = themedLike(rng, pick, need, taken, preferTypes) ?? pick;
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

// ------------------------------------------------------------------------------ Rota: pré-evoluções (docs/planos/rota-pre-evolucoes.md)

/** Forma-base da linha evolutiva (a própria espécie se não tem `prevo`). */
export function rootOf(id: number): number {
    let sp = species(id);
    while (sp.prevo) sp = species(sp.prevo);
    return sp.id;
}

/** Nota máxima da espécie em qualquer posição que ela joga. */
const bestRating = (sp: Species) => Math.max(...Object.values(speciesProfile(sp).ratings));
/** Sem linha evolutiva dentro dos 151 (nem `prevo`, nem quem evolua dela). */
const loneSpecies = (sp: Species) => !sp.prevo && !SPECIES.some((o) => o.prevo === sp.id);
/** Nota máxima que um sem-linha pode ter no draft inicial da Rota; os mais fortes entram por Baú e reforços. */
export const LONE_START_MAX = 74;

/** Espécies que não saem no draft inicial nem no capitão da Rota: sem linha e acima de `LONE_START_MAX`. */
export const ROUTE_START_BANNED: ReadonlySet<number> = new Set(
    SPECIES.filter((sp) => loneSpecies(sp) && bestRating(sp) > LONE_START_MAX).map((sp) => sp.id),
);

/**
 * Cada opção vira a forma-base da linha (Charizard sai Charmander). Fica como está se a base já está no time
 * (`taken`) ou já saiu nesta mesma rodada. Mantém o `uid` da opção.
 */
export function babyOptions(options: PokemonInstance[], rng: Rng, taken: ReadonlySet<number>): PokemonInstance[] {
    const used = new Set<number>();
    return options.map((o) => {
        const root = rootOf(o.speciesId);
        if (root === o.speciesId || taken.has(root) || used.has(root)) {
            used.add(o.speciesId);
            return o;
        }
        used.add(root);
        return { ...createInstance(root, rng), uid: o.uid };
    });
}
