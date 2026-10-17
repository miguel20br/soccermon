import type { Position } from '../engine/attributes';
import { type PokemonInstance, slotRating, viewInstance } from '../engine/instance';

export interface SlotRating {
    rating: number;
    /** O que mostrar: a nota, ou "?" pro Ditto (vira o melhor da posição em campo). */
    display: string;
    /** 'main' = posição principal, 'alt' = outra posição em que joga bem, 'off' = fora de posição. */
    fit: 'main' | 'alt' | 'off';
}

/** Nota do Pokémon jogando numa posição (no banco, a nota da posição principal). */
export function ratingAt(inst: PokemonInstance, role: Position | 'ANY'): SlotRating {
    const view = viewInstance(inst);
    const ditto = inst.speciesId === 132;
    if (role === 'ANY') return { rating: view.overall, display: ditto ? '?' : String(view.overall), fit: 'main' };
    const idx = view.positions.indexOf(role);
    const rating = slotRating(inst, role);
    return {
        rating,
        display: ditto ? '?' : String(rating),
        fit: idx === 0 ? 'main' : idx > 0 ? 'alt' : 'off',
    };
}
