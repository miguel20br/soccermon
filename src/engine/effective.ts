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
    balanced: { attrs: { passing: 1.03, positioning: 1.03 }, drain: 1 },
    offensive: { attrs: { shooting: 1.03, positioning: 0.92, tackling: 0.95 }, drain: 1.3 },
    defensive: { attrs: { positioning: 1.15, tackling: 1.12, goalkeeping: 1.06 }, drain: 0.8 },
    counter: { attrs: { pace: 1.02, passing: 1.02, positioning: 1.02 }, drain: 1 },
};

/**
 * Em campo, a diferença de atributos pesa um pouco menos do que na carta (o time mais forte vencia 75% das
 * vezes; a meta é 60–65% pra ter zebra). A carta continua mostrando o número cheio.
 */
const COMPRESS = 0.42;
const COMPRESS_MID = 60;

/** Garra: quem perde por 3 ou mais cresce no jogo até diminuir a diferença (menos goleada, mais virada). */
export function comebackFactor(s: MatchState, team: 0 | 1): number {
    const behind = s.score[team === 0 ? 1 : 0] - s.score[team];
    return behind >= 3 ? Math.min(1.14, 1.06 + 0.03 * (behind - 3)) : 1;
}

export function fatigueFactor(p: PlayerState): number {
    return 0.72 + 0.28 * p.energy;
}

/** Bônus de "clutch" (Overgrow/Blaze/Torrent/Swarm) quando o fôlego está baixo. */
export function clutchActive(p: PlayerState): boolean {
    return !!p.ability.clutch && p.energy < 0.45;
}

/** Atributo efetivo neste instante: base × fadiga × buffs × status × habilidade × auras rivais. */
export function eff(s: MatchState, p: PlayerState, key: AttrKey): number {
    const base = COMPRESS_MID + (p.attr[key] - COMPRESS_MID) * COMPRESS;
    let v = base * fatigueFactor(p) * (TACTIC_MODS[s.teams[p.team].tactic].attrs[key] ?? 1) * comebackFactor(s, p.team);
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
