import { MOVES } from '../engine/data';
import type { PokemonInstance } from '../engine/instance';
import { ITEMS } from '../engine/items';

/**
 * Quantos golpes do Pokémon um item aproveita, para itens cujo efeito depende do golpe (mesma regra do
 * motor em src/engine/match.ts): item de tipo fortalece golpes daquele tipo; King's Rock vale nos golpes
 * que acertam (fora os de Status). Outros itens: null (não depende dos golpes).
 */
export interface ItemFit {
    /** Golpes que o item aproveita. */
    count: number;
    /** Tipo fortalecido (itens de tipo). */
    type?: string;
}

export function itemFit(itemId: string, inst: PokemonInstance): ItemFit | null {
    const item = ITEMS[itemId];
    if (!item) return null;
    if (item.kind === 'type' && item.type) {
        return { type: item.type, count: inst.moves.filter((m) => MOVES[m]?.type === item.type).length };
    }
    if (item.kind === 'kingsrock') {
        return { count: inst.moves.filter((m) => MOVES[m] && MOVES[m].category !== 'Status').length };
    }
    return null;
}

/** O item depende dos golpes de quem segura? (mostra a contagem em cada Pokémon do time) */
export const itemDependsOnMoves = (itemId: string) => {
    const kind = ITEMS[itemId]?.kind;
    return kind === 'type' || kind === 'kingsrock';
};
