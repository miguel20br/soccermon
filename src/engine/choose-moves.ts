import { MOVES, species } from './data';
import type { PokemonInstance } from './instance';
import { defaultMoveset } from './moves';
import { SIGNATURE } from './signature-moves';

/**
 * Escolher os golpes (item 8 da 0.9.54, atrás de `?lab=golpes-escolher`): o jogador troca os golpes do moveset
 * por outros que a espécie aprende (learnset, que já inclui o que as MTs ensinam). A assinatura nunca sai (a carta
 * não perde a cara) e o número de vagas continua o de hoje. A escolha fica em `PokemonInstance.moves`; `picked`
 * lembra quais não eram do padrão nem de MT, pra sobreviverem à evolução. Escolhido não ganha o bônus de MT.
 */

/** Golpes que a instância pode levar: o learnset da espécie mais o que ela já leva. */
export function pickableMoves(inst: PokemonInstance): string[] {
    const set = new Set([...species(inst.speciesId).learnset, ...inst.moves]);
    return [...set].filter((m) => MOVES[m]).sort();
}

/** Troca o conjunto de golpes. Null se o conjunto é inválido (tamanho, repetido, fora do learnset, sem a assinatura). */
export function chooseMoves(inst: PokemonInstance, moves: readonly string[]): PokemonInstance | null {
    const pool = new Set(pickableMoves(inst));
    const sig = SIGNATURE[inst.speciesId];
    if (moves.length !== inst.moves.length || new Set(moves).size !== moves.length) return null;
    if (!moves.every((m) => pool.has(m))) return null;
    if (sig && inst.moves.includes(sig) && !moves.includes(sig)) return null;
    const base = defaultMoveset(species(inst.speciesId));
    const taught = (inst.taught ?? []).filter((m) => moves.includes(m));
    const picked = moves.filter((m) => !base.includes(m) && !taught.includes(m));
    const out: PokemonInstance = { ...inst, moves: [...moves] };
    if (taught.length) out.taught = taught;
    else delete out.taught;
    if (picked.length) out.picked = picked;
    else delete out.picked;
    return out;
}
