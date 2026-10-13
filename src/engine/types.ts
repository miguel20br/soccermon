import { effectiveness, type TypeName } from './data';

/**
 * Multiplicador de tipo suavizado para duelos: o futsal não pode virar "super efetivo = vitória garantida".
 * Usa o melhor tipo ofensivo do atacante (ou o tipo do golpe, quando há golpe).
 */
export function typeMultiplier(attackTypes: readonly TypeName[], defenseTypes: readonly TypeName[]): number {
    const eff = Math.max(...attackTypes.map((t) => effectiveness(t, defenseTypes)));
    return smooth(eff);
}

export function smooth(eff: number): number {
    if (eff >= 4) return 1.25;
    if (eff >= 2) return 1.12;
    if (eff >= 1) return 1;
    if (eff >= 0.5) return 0.9;
    if (eff > 0) return 0.84;
    return 0.8;
}

/** Rótulo para a narração. */
export function effectivenessLabel(eff: number): 'super' | 'normal' | 'weak' | 'immune' {
    if (eff >= 2) return 'super';
    if (eff === 0) return 'immune';
    if (eff < 1) return 'weak';
    return 'normal';
}
