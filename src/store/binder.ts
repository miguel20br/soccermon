import { SPECIES_BY_ID } from '../engine/data';
import { type DuelMonRecipe, monFromRecipe, monProblems, monRecipe } from '../engine/duel-validate';
import { type PokemonInstance, viewInstance } from '../engine/instance';
import { defaultMoveset } from '../engine/moves';
import type { RunState } from './game-store';
import type { HallEntry } from './profile';

/**
 * Fichário: as cartas que entraram no seu time (draft, recompensa, evolução). Pro save não crescer sem limite, guarda
 * todas as notáveis (edição, Shiny, nota 85+, campeã) e as últimas 50 quaisquer, até 300 no total (passou, saem
 * primeiro as não notáveis mais antigas). Cada carta vai como receita (a mesma do Duelo), que o motor desenha de novo.
 */
export type BinderFrom = 'draft' | 'recompensa' | 'evolucao' | 'hall';
const FROMS: BinderFrom[] = ['draft', 'recompensa', 'evolucao', 'hall'];

export interface BinderCard {
    /** uid da carta; a forma evoluída ganha `>espécie` (o Charmander e o Charmeleon da mesma carta são duas). */
    id: string;
    card: DuelMonRecipe;
    /** Quando entrou (ms). */
    at: number;
    from: BinderFrom;
    /** Seed da copa de onde veio. */
    cup?: string;
    /** Estava no elenco campeão. */
    champ?: boolean;
}

export const BINDER_RECENT = 50;
export const BINDER_MAX = 300;
export const NOTABLE_OVR = 85;
/** Vitrine de cartas no Perfil e no VERSUS do Duelo. */
export const CARD_SHOWCASE_MAX = 3;

export const binderKey = (p: PokemonInstance) => (p.evolved ? `${p.uid}>${p.speciesId}` : p.uid);

/** A carta pra desenhar (o uid de origem fica: a evolução do Eevee sai dele). */
export const binderInst = (c: BinderCard): PokemonInstance => monFromRecipe(c.card, c.id.split('>')[0]);

export const binderOvr = (c: BinderCard) => viewInstance(binderInst(c)).overall;

export const isNotable = (c: BinderCard) =>
    !!c.champ || !!c.card.special || c.card.shiny || binderOvr(c) >= NOTABLE_OVR;

/** A barra de evolução da copa não é da carta: fica de fora. */
const recipeOf = (p: PokemonInstance): DuelMonRecipe => {
    const { evo: _, ...r } = monRecipe(p);
    return r;
};

/** Últimas 50 + notáveis, no máximo 300 (sai primeiro a não notável mais antiga, depois a notável mais antiga). */
export function pruneBinder(list: BinderCard[]): BinderCard[] {
    const sorted = [...list].sort((a, b) => b.at - a.at);
    const notable = new Map(sorted.map((c) => [c, isNotable(c)]));
    const kept = sorted.filter((c, i) => i < BINDER_RECENT || notable.get(c));
    let extra = kept.length - BINDER_MAX;
    if (extra <= 0) return kept;
    const drop = new Set<BinderCard>();
    for (const pass of [false, true])
        for (let i = kept.length - 1; i >= 0 && extra > 0; i--)
            if (notable.get(kept[i]) === pass) {
                drop.add(kept[i]);
                extra--;
            }
    return kept.filter((c) => !drop.has(c));
}

/**
 * Põe cartas no fichário. A mesma carta de novo (virou Destaque, ganhou selo de MVP, foi campeã) atualiza a entrada:
 * fica a data e a origem de quando chegou.
 */
export function binderAdd(
    list: BinderCard[],
    cards: PokemonInstance[],
    meta: { from: BinderFrom; at: number; cup?: string; champ?: boolean },
): BinderCard[] {
    if (!cards.length) return list;
    const byId = new Map(list.map((c) => [c.id, c]));
    upsert(byId, cards, meta);
    return pruneBinder([...byId.values()]);
}

function upsert(
    byId: Map<string, BinderCard>,
    cards: PokemonInstance[],
    meta: { from: BinderFrom; at: number; cup?: string; champ?: boolean },
) {
    for (const p of cards) {
        const id = binderKey(p);
        const prev = byId.get(id);
        const champ = !!prev?.champ || !!meta.champ;
        const cup = prev?.cup ?? meta.cup;
        byId.set(id, {
            id,
            card: recipeOf(p),
            at: prev?.at ?? meta.at,
            from: prev?.from ?? meta.from,
            ...(cup && { cup }),
            ...(champ && { champ }),
        });
    }
}

/** Junta o fichário da nuvem com o do aparelho: união pela carta (a versão de nota maior), sem duplicar. */
export function mergeBinder(a: BinderCard[] = [], b: BinderCard[] = []): BinderCard[] {
    const byId = new Map<string, BinderCard>();
    for (const c of [...a, ...b]) {
        const prev = byId.get(c.id);
        if (!prev) {
            byId.set(c.id, c);
            continue;
        }
        const first = c.at < prev.at ? c : prev;
        const best = binderOvr(c) > binderOvr(prev) ? c : prev;
        const champ = !!prev.champ || !!c.champ;
        byId.set(c.id, { ...first, card: best.card, ...(champ && { champ }) });
    }
    // o elenco refeito do Hall (save antigo de um lado) sai quando o outro lado tem as cartas de verdade da copa
    const real = new Set([...byId.values()].flatMap((c) => (c.from !== 'hall' && c.cup ? [c.cup] : [])));
    return pruneBinder([...byId.values()].filter((c) => c.from !== 'hall' || !real.has(c.cup ?? '')));
}

/** Fichário vindo de fora do aparelho (backup, nuvem): só entradas que são cartas de verdade; o resto sai. */
export function cleanBinder(raw: unknown): BinderCard[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: BinderCard[] = [];
    for (const c of raw as Partial<BinderCard>[]) {
        if (!c || typeof c !== 'object' || typeof c.id !== 'string' || c.id.length > 80 || seen.has(c.id)) continue;
        if (typeof c.at !== 'number' || !Number.isFinite(c.at) || !FROMS.includes(c.from as BinderFrom)) continue;
        if (!c.card || monProblems(c.card, '').length) continue;
        seen.add(c.id);
        out.push({
            id: c.id,
            card: c.card,
            at: c.at,
            from: c.from as BinderFrom,
            ...(typeof c.cup === 'string' && { cup: c.cup }),
            ...(c.champ === true && { champ: true }),
        });
    }
    return pruneBinder(out);
}

const fromOf = (p: PokemonInstance): BinderFrom =>
    p.evolved ? 'evolucao' : /-c\d+$/.test(p.uid) ? 'recompensa' : 'draft';

/** Carta do Hall da Fama (que só guarda espécie e Shiny): o golpe e a habilidade padrão da espécie. */
function hallCard(h: HallEntry, i: number): PokemonInstance | null {
    const p = h.squad[i];
    const sp = SPECIES_BY_ID.get(p?.speciesId);
    if (!sp || sp.id > 151) return null;
    return {
        uid: `hall-${h.id}-${i}`,
        speciesId: sp.id,
        level: 50,
        xp: 0,
        moves: defaultMoveset(sp),
        ability: sp.id === 132 ? 'imposter' : sp.abilities[0],
        shiny: !!p.shiny,
        nickname: null,
        condition: 1,
    };
}

/**
 * Save de antes do fichário: as cartas das copas guardadas (a atual e as paradas) e os elencos do Hall da Fama (o
 * que dá pra refazer: espécie e Shiny). Copa que já veio das copas guardadas não entra de novo pelo Hall.
 */
export function binderBackfill(runs: (RunState | null | undefined)[], hall: HallEntry[]): BinderCard[] {
    const b = new Map<string, BinderCard>();
    const cups = new Set<string>();
    for (const r of runs) {
        if (!r || !Array.isArray(r.picks)) continue;
        const at = r.startedAt ?? r.endedAt ?? 0;
        cups.add(r.seed);
        for (const p of r.picks) upsert(b, [p], { from: fromOf(p), at, cup: r.seed });
        if (r.status === 'champion') {
            const squad = [...r.lineup, ...r.bench].flatMap((uid) => r.picks.filter((p) => p.uid === uid));
            upsert(b, squad, { from: 'draft', at, cup: r.seed, champ: true });
        }
    }
    for (const h of hall) {
        if (cups.has(h.id) || !Array.isArray(h.squad)) continue;
        const cards = h.squad.map((_, i) => hallCard(h, i)).filter((p): p is PokemonInstance => !!p);
        upsert(b, cards, { from: 'hall', at: h.date, cup: h.id, champ: true });
    }
    return pruneBinder([...b.values()]);
}

/** O fichário do save: o que já tem, ou (save de antes dele) o que dá pra tirar das copas e do Hall. */
export const binderOf = (s: {
    binder?: unknown;
    run?: RunState | null;
    parkedRuns?: RunState[];
    hall?: HallEntry[];
}): BinderCard[] =>
    Array.isArray(s.binder) ? cleanBinder(s.binder) : binderBackfill([s.run, ...(s.parkedRuns ?? [])], s.hall ?? []);

// ------------------------------------------------------------------------------------------- vitrine
/** A vitrine do seu save: só as cartas que ainda estão no fichário, no máximo 3. */
export function resolveCardShowcase(choice: unknown, binder: BinderCard[]): BinderCard[] {
    if (!Array.isArray(choice)) return [];
    const byId = new Map(binder.map((c) => [c.id, c]));
    return choice.flatMap((id) => (typeof id === 'string' && byId.get(id)) || []).slice(0, CARD_SHOWCASE_MAX);
}

/**
 * Vitrine de cartas que veio do rival no Duelo: só cartas que uma copa poderia dar (a mesma conferência do Time
 * pronto), no máximo 3; lixo na frente não ocupa vaga (olha até 10).
 */
export function parseCardShowcase(raw: unknown): PokemonInstance[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .slice(0, 10)
        .filter((m) => !monProblems(m, '').length)
        .slice(0, CARD_SHOWCASE_MAX)
        .map((m, i) => monFromRecipe(m, `vitrine-${i}`));
}
