import type { Position } from '../engine/attributes';
import { type FormationId, formationOf } from '../engine/formations';
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

/**
 * Média dos titulares pela nota na vaga (quem está fora de posição puxa a média pra baixo, como em campo).
 * `lineup` na ordem das vagas da formação; vaga vazia não conta. A mesma conta no draft, na escalação, no
 * VERSUS, no Duelo e na final da tela de campeão.
 */
export function lineupAverage(
    lineup: readonly (PokemonInstance | null | undefined)[],
    formation: FormationId | undefined,
): number {
    const slots = formationOf(formation).slots;
    const ratings = lineup.flatMap((p, i) => (p ? [slotRating(p, slots[i] ?? 'ANY')] : []));
    return ratings.length ? Math.round(ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0;
}
