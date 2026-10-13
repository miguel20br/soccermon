import { species } from './data';
import type { PokemonInstance } from './instance';

/**
 * Sinergia de tipo (estilo Pokémon Auto Chess, adaptada ao 5v5): titulares que compartilham um tipo
 * ganham um bônus pequeno em todos os atributos. 2 do mesmo tipo = +3%, 3 ou mais = +6%.
 */
export interface Synergy {
    type: string;
    count: number;
    bonus: number;
}

export function computeSynergies(lineup: readonly PokemonInstance[]): Synergy[] {
    const counts = new Map<string, number>();
    for (const inst of lineup) {
        for (const t of species(inst.speciesId).types) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
        .filter(([, c]) => c >= 2)
        .map(([type, count]) => ({ type, count, bonus: count >= 3 ? 1.06 : 1.03 }))
        .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

/** Multiplicador para um jogador: a melhor sinergia entre os tipos dele (não acumula). */
export function synergyFactor(synergies: readonly Synergy[], types: readonly string[]): number {
    return synergies.filter((s) => types.includes(s.type)).reduce((best, s) => Math.max(best, s.bonus), 1);
}
