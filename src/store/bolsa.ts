/**
 * Bolsa do técnico na campanha (docs/planos/itens-ativos.md, A1): começa com 1 Poção, cresce no Mercado e no Baú da
 * Rota e na recompensa da Relâmpago, e o item usado na partida some. Atrás de bandeira (ADR 0005): `?lab=itens` no dev
 * e nas prévias (src/ui/bolsa-lab.ts liga aqui); em produção nada disso aparece e o sorteio de sempre não muda (a
 * Bolsa sorteia num `Rng` próprio).
 */
import { BAG_OFFERED, BAG_PRICE, type BagItem } from '../engine/bag';
import type { Reward } from '../engine/rewards';
import { Rng } from '../engine/rng';
import type { ShopOffer } from '../engine/shop';
import type { MatchEvent } from '../engine/state';

let on = false;
let all = false;
export const bolsaOn = () => on;
/** `full`: `?lab=itens-todos` (pra testar): a copa começa com todos os itens oferecidos em vez de 1 Poção. */
export const setBolsaLab = (v: boolean, full = false) => {
    on = v;
    all = v && full;
};
/** Bolsa do começo da copa: 1 Poção (o plano); no `?lab=itens-todos`, todos (sem Cura Total). */
export const bolsaStart = (): BagItem[] => (all ? [...BAG_OFFERED] : ['potion']);

/** Espaços: 3 na Rota, 2 na Relâmpago. */
export const bolsaSlots = (long: boolean) => (long ? 3 : 2);
/** Chance de um item da Bolsa no lugar do último item da recompensa (Relâmpago e Baú da Rota). */
export const BOLSA_REWARD_CHANCE = 0.35;

/** Tira da Bolsa o que o seu time (0) usou na partida. */
export function bolsaAfter(bolsa: readonly BagItem[], events: readonly MatchEvent[]): BagItem[] {
    const left = [...bolsa];
    for (const e of events)
        if (e.type === 'bag' && e.team === 0) {
            const i = left.indexOf(e.item);
            if (i >= 0) left.splice(i, 1);
        }
    return left;
}

/** Um item da Bolsa na vitrine do Mercado da Rota (sorteio próprio pela casa e pela troca). */
export function bolsaOffer(seed: string, key: string, reroll: number): ShopOffer {
    const item = new Rng(seed, `bolsa-shop-${key}-r${reroll}`).pick([...BAG_OFFERED]);
    return { kind: 'bolsa', item, price: BAG_PRICE[item] };
}

/** Às vezes um item da Bolsa no lugar do último item da recompensa (sorteio próprio). */
export function withBolsa(options: Reward[], seed: string, key: string, reroll: number): Reward[] {
    const rng = new Rng(seed, `bolsa-reward-${key}-r${reroll}`);
    if (!rng.chance(BOLSA_REWARD_CHANCE)) return options;
    const at = options.map((o) => o.kind).lastIndexOf('item');
    if (at < 0) return options;
    const item = rng.pick([...BAG_OFFERED]);
    return options.map((o, i) => (i === at ? { kind: 'bolsa', item } : o));
}
