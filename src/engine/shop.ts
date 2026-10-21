import type { TypeName } from './data';
import { SPECIES, species } from './data';
import { draftOptions } from './draft';
import { type PokemonInstance, viewInstance } from './instance';
import { ITEM_IDS, ITEMS, TYPE_ITEM_FOR } from './items';
import { Rng } from './rng';
import { rollSpecial } from './specials';
import { has, SPONSOR_IDS, type SponsorId } from './sponsors';
import { rollTmOffer } from './tm';

/**
 * Mercado da Copa rápida (docs/planos/copa-roguelike-plano.md): ₽ (Pokédólar) só existe dentro da copa. Depois de
 * cada vitória (menos a final e a Copa do Dia) vem a recompensa grátis e depois o Mercado. Tudo pela seed da copa:
 * mesma copa, mesma vitrine.
 */
export const ECONOMY = {
    win: 5,
    goal: 1,
    /** Gols que rendem ₽ por partida (o Fã-Clube tira o limite). */
    goalCap: 3,
    cleanSheet: 2,
    /** Juros: 1 ₽ a cada `interestPer` guardados, até `interestCap` (Cassino: `interestCapCassino`). */
    interestPer: 5,
    interestCap: 3,
    interestCapCassino: 5,
    /** S.S. Anne: a mais por vitória. */
    ssanne: 3,
} as const;

/** Patrocínios na vitrine de cada Mercado. */
export const SPONSOR_CHOICES = 2;

export const PRICES = {
    sponsor: 10,
    /** Pelo metal da carta (bronze ≤64, prata 65–74, ouro 75+). */
    pokemon: { bronze: 4, prata: 5, ouro: 7 },
    pack: 6,
    item: 3,
    tm: 5,
    /** Trocar a vitrine: 2, e +1 a cada vez no mesmo Mercado. */
    reroll: 2,
} as const;

/** Quanto a vitória rendeu (o Mercado mostra a conta). */
export interface Earnings {
    win: number;
    goals: number;
    clean: number;
    /** Patrocínio (S.S. Anne). */
    bonus: number;
    /** Juros sobre o que você trouxe guardado do Mercado anterior. */
    interest: number;
    total: number;
}

export function interestOf(saved: number, sponsors: readonly string[] = []): number {
    const cap = has(sponsors, 'cassino') ? ECONOMY.interestCapCassino : ECONOMY.interestCap;
    return Math.min(cap, Math.floor(Math.max(0, saved) / ECONOMY.interestPer));
}

/** O que uma vitória rende, com os juros do que estava guardado (`saved`). Derrota não rende nada. */
export function winEarnings(
    goalsFor: number,
    goalsAgainst: number,
    saved: number,
    sponsors: readonly string[] = [],
): Earnings {
    const cap = has(sponsors, 'fanclube') ? Number.POSITIVE_INFINITY : ECONOMY.goalCap;
    const e = {
        win: ECONOMY.win,
        goals: Math.min(goalsFor, cap) * ECONOMY.goal,
        clean: goalsAgainst === 0 ? ECONOMY.cleanSheet : 0,
        bonus: has(sponsors, 'ssanne') ? ECONOMY.ssanne : 0,
        interest: interestOf(saved, sponsors),
    };
    return { ...e, total: e.win + e.goals + e.clean + e.bonus + e.interest };
}

export type Metal = 'bronze' | 'prata' | 'ouro';
export const metalOf = (overall: number): Metal => (overall >= 75 ? 'ouro' : overall >= 65 ? 'prata' : 'bronze');

export type ShopOffer =
    | { kind: 'pokemon'; inst: PokemonInstance; price: number }
    | { kind: 'pack'; type: TypeName; price: number }
    | { kind: 'item'; item: string; price: number }
    | { kind: 'tm'; move: string; leader: string | null; price: number }
    | { kind: 'sponsor'; id: SponsorId; price: number };

/** O Mercado aberto: vitrine, quantas trocas e o que já foi comprado (índices da vitrine). */
export interface ShopState {
    stage: number;
    rerolls: number;
    offers: ShopOffer[];
    sold: number[];
    /** A conta da vitória que abriu este Mercado. */
    earned: Earnings;
}

/** Preço da próxima troca de vitrine (Creche: a 1ª de cada Mercado é grátis). */
export function rerollPrice(rerolls: number, sponsors: readonly string[] = []): number {
    if (rerolls === 0 && has(sponsors, 'creche')) return 0;
    return PRICES.reroll + rerolls;
}

/** Raridade dos Pokémon avulsos sobe a cada fase (mesma escada dos reforços da recompensa). */
const SHOP_ROUND = [3, 5, 6];

interface ShopInput {
    seed: string;
    stage: number;
    reroll: number;
    team: readonly PokemonInstance[];
    sponsors: readonly string[];
    eventType: string | null;
    captain: PokemonInstance | null;
}

/**
 * Vitrine: 2 Pokémon avulsos, 1 pacote de tipo (o da semana ou o do capitão), 1 item ou MT e 1 Patrocínio que você
 * ainda não tem. Loja de Departamentos: +1 Pokémon.
 */
export function shopOffers({ seed, stage, reroll, team, sponsors, eventType, captain }: ShopInput): ShopOffer[] {
    const rng = new Rng(seed, `shop-${stage}-r${reroll}`);
    const taken = new Set(team.map((p) => p.speciesId));
    const count = 2 + (has(sponsors, 'loja') ? 1 : 0);
    const mons: ShopOffer[] = draftOptions(rng, SHOP_ROUND[Math.min(stage, 2)], taken, count, [], 'ANY').map((m) => {
        const inst = rollSpecial(m, eventType);
        return { kind: 'pokemon', inst, price: PRICES.pokemon[metalOf(viewInstance(inst).overall)] };
    });

    // o tipo da semana, o do capitão ou um sorteado, desde que ainda tenha carta fora do seu time (pacote vazio travava)
    const capType = captain ? species(captain.speciesId).types[0] : null;
    const left = (t: string) => SPECIES.filter((sp) => sp.types.includes(t) && !taken.has(sp.id)).length;
    const packType = [eventType, capType, ...rng.shuffle(SPECIES.map((sp) => sp.types[0]))].find(
        (t): t is TypeName => !!t && left(t) >= 3,
    );

    const tm = rng.chance(0.35) ? rollTmOffer(rng, team) : null;
    let gear: ShopOffer;
    if (tm) gear = { kind: 'tm', ...tm, price: PRICES.tm };
    else {
        const owned = new Set(team.map((p) => p.item).filter(Boolean));
        const typed = [...new Set(team.flatMap((p) => species(p.speciesId).types))]
            .map((t) => TYPE_ITEM_FOR[t])
            .filter((id) => id && !owned.has(id));
        const general = ITEM_IDS.filter((id) => ITEMS[id].kind !== 'type' && !owned.has(id));
        const pool = typed.length && rng.chance(0.5) ? typed : general.length ? general : ITEM_IDS;
        gear = { kind: 'item', item: rng.pick(pool), price: PRICES.item };
    }

    const free = SPONSOR_IDS.filter((id) => !sponsors.includes(id));
    const out: ShopOffer[] = [
        ...mons,
        ...(packType ? [{ kind: 'pack' as const, type: packType, price: PRICES.pack }] : []),
        gear,
    ];
    // 2 Patrocínios à escolha (pedido do Miguel, 21/10/2026), diferentes e que você ainda não tem
    for (const id of rng.shuffle([...free]).slice(0, SPONSOR_CHOICES))
        out.push({ kind: 'sponsor', id, price: PRICES.sponsor });
    return out;
}

/** As cartas do pacote de tipo (3, ou 4 com a Safari Zone): você fica com 1. `n` = quantos pacotes já abriu na copa. */
export function packCards(
    seed: string,
    stage: number,
    type: TypeName,
    team: readonly PokemonInstance[],
    sponsors: readonly string[],
    eventType: string | null,
    n = 0,
): PokemonInstance[] {
    const rng = new Rng(seed, `pack-${stage}-${type}-${n}`);
    const taken = new Set(team.map((p) => p.speciesId));
    const count = has(sponsors, 'safari') ? 4 : 3;
    const round = SHOP_ROUND[Math.min(stage, 2)];
    return draftOptions(rng, round, taken, count, [], 'ANY', undefined, type).map((m) => rollSpecial(m, eventType));
}
