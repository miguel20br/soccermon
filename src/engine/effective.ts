import type { AttrKey } from './attributes';
import type { MatchState, PlayerState, Tactic } from './state';
import { dist2 } from './vec';

const STATUS_MODS: Record<string, Partial<Record<AttrKey, number>>> = {
    par: { pace: 0.6, dribble: 0.85 },
    brn: { shooting: 0.8, strength: 0.8 },
    psn: {},
    slp: {},
    frz: {},
    confusion: { passing: 0.7, shooting: 0.85 },
    infatuation: {},
};

/** Efeito da tática no motor (além do posicionamento da IA): toda escolha tem custo e benefício. */
export const TACTIC_MODS: Record<Tactic, { attrs: Partial<Record<AttrKey, number>>; drain: number }> = {
    balanced: { attrs: {}, drain: 1 },
    offensive: { attrs: { shooting: 1.03, positioning: 0.92, tackling: 0.95 }, drain: 1.3 },
    defensive: { attrs: { positioning: 1.12, tackling: 1.1, goalkeeping: 1.05 }, drain: 0.85 },
    counter: { attrs: { pace: 1.04, passing: 1.04, positioning: 1.03 }, drain: 1 },
};

export function fatigueFactor(p: PlayerState): number {
    return 0.72 + 0.28 * p.energy;
}

/** Bônus de "clutch" (Overgrow/Blaze/Torrent/Swarm) quando o fôlego está baixo. */
export function clutchActive(p: PlayerState): boolean {
    return !!p.ability.clutch && p.energy < 0.45;
}

/** Atributo efetivo neste instante: base × fadiga × buffs × status × habilidade × auras rivais. */
export function eff(s: MatchState, p: PlayerState, key: AttrKey): number {
    let v = p.attr[key] * fatigueFactor(p) * (TACTIC_MODS[s.teams[p.team].tactic].attrs[key] ?? 1);
    for (const b of p.buffs) if (b.attr === key) v *= b.factor;
    if (p.status) {
        v *= STATUS_MODS[p.status.kind]?.[key] ?? 1;
        v *= p.ability.whenStatused?.[key] ?? 1;
    }
    if (clutchActive(p) && (key === 'shooting' || key === 'dribble')) v *= p.ability.clutch ?? 1;
    for (const i of s.auraHolders) {
        const o = s.players[i];
        const aura = o.ability.aura!;
        if (o.team !== p.team && aura.attr === key && dist2(o.pos, p.pos) < aura.radius * aura.radius) {
            v *= aura.factor;
        }
    }
    return v;
}

export function isIncapacitated(p: PlayerState): boolean {
    if (p.stun > 0) return true;
    const k = p.status?.kind;
    return k === 'slp' || k === 'frz' || k === 'infatuation';
}
