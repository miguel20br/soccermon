import { species } from './data';
import type { PokemonInstance } from './instance';

/**
 * Sinergia de tipo (estilo Pokémon Auto Chess, adaptada ao 5v5): titulares que compartilham um tipo
 * ganham um bônus pequeno em todos os atributos. 2 do mesmo tipo = +3%, 3 = +6%, 4 = +8%.
 * Monotipo (Miguel, 04/11/2026): os 5 em campo do mesmo tipo = +12%; com o banco do tipo, 6 no elenco = +16% e 7 = +22%.
 */
export interface Synergy {
    type: string;
    count: number;
    bonus: number;
    /** Monotipo: quantos do elenco (titulares + reservas) são do tipo (5 a 7). */
    mono?: number;
}

const TYPE_BONUS: Record<number, number> = { 2: 1.03, 3: 1.06, 4: 1.08 };
export const MONO_BONUS: Record<number, number> = { 5: 1.12, 6: 1.16, 7: 1.22 };

/** Teto de sinergia (tipo × história) por Pokémon: só o monotipo passa, e a história soma no máximo +5% por cima. */
export const SYNERGY_CAP = 1.15;
export const synergyCap = (syn: number) => Math.max(SYNERGY_CAP, syn + 0.05);

/** `rest`: o resto do elenco (reservas e quem já saiu), que só conta para o monotipo. */
export function computeSynergies(lineup: readonly PokemonInstance[], rest: readonly PokemonInstance[] = []): Synergy[] {
    const counts = new Map<string, number>();
    for (const inst of lineup) {
        for (const t of species(inst.speciesId).types) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
        .filter(([, c]) => c >= 2)
        .map(([type, count]): Synergy => {
            if (count < 5 || count < lineup.length) return { type, count, bonus: TYPE_BONUS[Math.min(count, 4)] };
            const mono = Math.min(7, count + rest.filter((p) => species(p.speciesId).types.includes(type)).length);
            return { type, count, bonus: MONO_BONUS[mono], mono };
        })
        .sort((a, b) => b.count - a.count || (a.type < b.type ? -1 : a.type > b.type ? 1 : 0));
}

/** Multiplicador para um jogador: a melhor sinergia entre os tipos dele (não acumula). */
export function synergyFactor(synergies: readonly Synergy[], types: readonly string[]): number {
    return synergies.filter((s) => types.includes(s.type)).reduce((best, s) => Math.max(best, s.bonus), 1);
}
