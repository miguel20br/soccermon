import { species } from '../engine/data';
import { type DuelRecord, duelWins } from './duels';
import type { Records } from './game-store';
import { MISSIONS, type SaveView } from './missions';
import { type Career, type CareerSeal, EDITION_BIT, isPlayed, kantoComplete, topSeal } from './profile';

/**
 * Medalhas com degraus (bronze, prata, ouro, platina), padrão Pokémon GO. Só cosmético e 100% retroativo: cada
 * medalha é um número que o save já guarda, e o degrau sai na hora (nada novo é salvo, então save antigo e nuvem
 * já chegam com as medalhas). Os números dos degraus são PROPOSTA (docs/planos/medalhas.md): decisão do Miguel.
 */
export type Tier = 0 | 1 | 2 | 3 | 4;
/** Nome do degrau (classe CSS e i18n). 0 = ainda sem medalha. */
export const TIER_NAMES = ['nenhum', 'bronze', 'prata', 'ouro', 'platina'] as const;
export type TierName = (typeof TIER_NAMES)[number];

/** O que as medalhas leem: o que as missões leem + a carreira inteira, os recordes e o Duelo. */
export interface MedalView extends SaveView {
    career: Career;
    records: Records;
    duels: DuelRecord[];
}

export interface Medal {
    id: string;
    /** Bronze, prata, ouro, platina. */
    steps: [number, number, number, number];
    value: (v: MedalView) => number;
}

const popcount = (n: number) => {
    let c = 0;
    for (let x = n; x; x &= x - 1) c++;
    return c;
};
const entries = (v: MedalView) => Object.entries(v.dex).map(([id, e]) => [Number(id), e] as const);
const titlesOf = (v: MedalView) => Math.max(v.records.titles, v.hall.length);
const COLLECTION_IDS = MISSIONS.filter((m) => m.group === 'colecoes').map((m) => m.id);

export const MEDALS: Medal[] = [
    { id: 'pokedex', steps: [40, 80, 120, 151], value: (v) => Object.keys(v.dex).length },
    { id: 'elenco', steps: [25, 60, 100, 151], value: (v) => entries(v).filter(([, e]) => isPlayed(e)).length },
    { id: 'partidas', steps: [10, 50, 250, 1000], value: (v) => v.career.matches },
    { id: 'vitorias', steps: [5, 30, 150, 600], value: (v) => v.career.wins },
    { id: 'artilheiro', steps: [100, 500, 2000, 5000], value: (v) => v.career.goalsFor },
    { id: 'copas', steps: [5, 25, 100, 300], value: (v) => v.records.cups },
    { id: 'campeao', steps: [1, 5, 25, 100], value: titlesOf },
    { id: 'sequencia', steps: [2, 3, 5, 8], value: (v) => v.records.bestStreak ?? 0 },
    { id: 'penaltis', steps: [1, 5, 20, 50], value: (v) => v.career.shootoutWins },
    { id: 'evolucoes', steps: [5, 25, 100, 300], value: (v) => v.records.evolucoes ?? 0 },
    { id: 'movedex', steps: [25, 60, 100, 150], value: (v) => Object.keys(v.moves).length },
    {
        id: 'figurinhas',
        steps: [100, 250, 400, 622],
        value: (v) => entries(v).reduce((n, [, e]) => n + popcount(e.editions ?? 0), 0),
    },
    {
        id: 'shiny',
        steps: [1, 5, 15, 40],
        value: (v) => entries(v).filter(([, e]) => (e.editions ?? 0) & EDITION_BIT.shiny).length,
    },
    { id: 'icones', steps: [1, 3, 10, 25], value: (v) => v.records.icones ?? 0 },
    { id: 'destaques', steps: [1, 5, 15, 40], value: (v) => v.records.destaques ?? 0 },
    {
        id: 'selos',
        steps: [1, 5, 15, 40],
        value: (v) => {
            const kanto = kantoComplete(v.dex);
            return entries(v).filter(([, e]) => topSeal(e, kanto)).length;
        },
    },
    {
        id: 'tipos',
        steps: [3, 7, 12, 17],
        value: (v) => new Set(entries(v).flatMap(([id, e]) => (e.titles > 0 ? species(id).types : []))).size,
    },
    { id: 'colecoes', steps: [1, 3, 6, 9], value: (v) => COLLECTION_IDS.filter((id) => v.done.has(id)).length },
    { id: 'missoes', steps: [10, 20, 35, MISSIONS.length], value: (v) => v.done.size },
    { id: 'duelista', steps: [1, 10, 50, 200], value: (v) => duelWins(v.records, v.duels) },
];

const BY_ID = new Map(MEDALS.map((m) => [m.id, m]));
export const medalById = (id: string) => BY_ID.get(id);

/** Degrau de um valor: quantos degraus ele já passou. */
export const tierOf = (m: Medal, value: number): Tier => m.steps.filter((s) => value >= s).length as Tier;

export interface MedalProgress {
    medal: Medal;
    value: number;
    tier: Tier;
    /** Meta do próximo degrau (null = platina, acabou). */
    next: number | null;
}

export function medalProgress(v: MedalView): MedalProgress[] {
    return MEDALS.map((medal) => {
        const value = medal.value(v);
        const tier = tierOf(medal, value);
        return { medal, value, tier, next: (medal.steps as readonly number[])[tier] ?? null };
    });
}

/** Degrau atual de cada medalha (id → degrau), pra destravar peças do clube e montar a vitrine. */
export const medalTiers = (v: MedalView): Record<string, Tier> =>
    Object.fromEntries(medalProgress(v).map((p) => [p.medal.id, p.tier]));

// ------------------------------------------------------------------------------------------- vitrine
/**
 * Vitrine de 3 destaques (o "display" do TCG Pocket): medalha, coleção temática completa ou selo de carreira de
 * uma espécie. O perfil guarda só a escolha (`m:artilheiro`, `c:colIniciais`, `s:25`); o degrau sai do save na hora.
 * Pro Duelo vai já resolvido (`m:artilheiro:3`, `c:colIniciais`, `s:25:holo`), porque o rival não tem o seu save.
 */
export const SHOWCASE_MAX = 3;

export type ShowItem =
    | { kind: 'm'; id: string; tier: Tier }
    | { kind: 'c'; id: string }
    | { kind: 's'; speciesId: number; seal: CareerSeal };

const SEAL_TIER: Record<CareerSeal, Tier> = { folha: 1, holo: 2, prisma: 3, ouro: 4 };
/** Coleção completa vale moldura de prata (proposta). */
export const COLLECTION_TIER: Tier = 2;
export const itemTier = (it: ShowItem): Tier =>
    it.kind === 'm' ? it.tier : it.kind === 's' ? SEAL_TIER[it.seal] : COLLECTION_TIER;

/** Moldura do avatar: o melhor degrau entre os destaques escolhidos (0 = sem moldura). */
export const frameTier = (items: ShowItem[]): Tier => Math.max(0, ...items.map(itemTier)) as Tier;

/** A vitrine do seu save: só o que você já tem (medalha sem degrau, coleção incompleta e selo perdido saem). */
export function resolveShowcase(choice: unknown, v: MedalView): ShowItem[] {
    if (!Array.isArray(choice)) return [];
    const tiers = medalTiers(v);
    const kanto = kantoComplete(v.dex);
    const out: ShowItem[] = [];
    for (const raw of choice) {
        if (typeof raw !== 'string' || out.length >= SHOWCASE_MAX) continue;
        const [kind, id] = raw.split(':');
        if (kind === 'm' && tiers[id]) out.push({ kind, id, tier: tiers[id] });
        else if (kind === 'c' && COLLECTION_IDS.includes(id) && v.done.has(id)) out.push({ kind, id });
        else if (kind === 's') {
            const seal = topSeal(v.dex[Number(id)], kanto);
            if (seal) out.push({ kind, speciesId: Number(id), seal });
        }
    }
    return out;
}

/** Id da escolha (o que o perfil guarda). */
export const showKey = (it: ShowItem) => (it.kind === 's' ? `s:${it.speciesId}` : `${it.kind}:${it.id}`);

/** Pro Duelo: cada destaque com o degrau. */
export const encodeShowcase = (items: ShowItem[]) =>
    items.map((it) =>
        it.kind === 'm' ? `m:${it.id}:${it.tier}` : it.kind === 's' ? `s:${it.speciesId}:${it.seal}` : `c:${it.id}`,
    );

const SEALS = Object.keys(SEAL_TIER);
/** Vitrine que veio do rival: só ids conhecidos e degraus válidos (o resto é ignorado), no máximo 3. */
export function parseShowcase(raw: unknown): ShowItem[] {
    if (!Array.isArray(raw)) return [];
    const out: ShowItem[] = [];
    // lixo na frente não ocupa vaga: olha até 10 e fica com os 3 primeiros que valem
    for (const s of raw.slice(0, 10)) {
        if (out.length >= SHOWCASE_MAX) break;
        if (typeof s !== 'string' || s.length > 40) continue;
        const [kind, id, extra] = s.split(':');
        const tier = Number(extra);
        if (kind === 'm' && BY_ID.has(id) && Number.isInteger(tier) && tier >= 1 && tier <= 4)
            out.push({ kind, id, tier: tier as Tier });
        else if (kind === 'c' && COLLECTION_IDS.includes(id)) out.push({ kind, id });
        else if (kind === 's' && SEALS.includes(extra)) {
            const n = Number(id);
            if (Number.isInteger(n) && n >= 1 && n <= 151) out.push({ kind, speciesId: n, seal: extra as CareerSeal });
        }
    }
    return out;
}

/** Liga/desliga um destaque na escolha (no máximo 3; o 4º não entra). */
export function toggleShowcase(choice: readonly string[] | undefined, key: string): string[] {
    const cur = (choice ?? []).filter((k) => typeof k === 'string');
    if (cur.includes(key)) return cur.filter((k) => k !== key);
    return cur.length >= SHOWCASE_MAX ? cur : [...cur, key];
}
