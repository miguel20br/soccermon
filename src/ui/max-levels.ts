import { AGENCY, maxCharge } from '../engine/agency';
import { species } from '../engine/data';
import { maxFxType, maxMoveOf } from '../engine/match';
import { MAX_SIGNATURE } from '../engine/signature-moves';
import type { MatchEvent } from '../engine/state';
import { dict, fmt, type Lang, pct } from '../i18n';

/**
 * O golpe máximo explicado (N1, N2, N3): o que cada nível dá e como a barra enche, montado com os números e as regras do
 * motor (`AGENCY`, `maxCharge`, `maxFxType`, `MAX_SIGNATURE`). Carta, legenda da partida, aviso de nível novo e Ajuda
 * leem daqui: o motor muda, o texto vai junto.
 */

/** Lances que enchem a barra, na ordem da explicação. */
const PLAYS = ['tackle', 'save', 'goal', 'shot', 'interception', 'move'] as const;
type Play = (typeof PLAYS)[number];

/** Um evento de cada lance, do time 0 (o jogador 0), pra medir os pontos no próprio `maxCharge`. */
const B = { tick: 0, half: 1, minute: 0 } as const;
const SAMPLE: Record<Play, MatchEvent> = {
    tackle: { ...B, type: 'tackle', by: 0, victim: 5, success: true },
    save: { ...B, type: 'save', by: 0, shooter: 5, caught: true },
    goal: { ...B, type: 'goal', by: 0, assist: null, team: 0, score: [1, 0], ownGoal: false },
    shot: { ...B, type: 'shot', by: 0, xg: 0.1, moveId: null },
    interception: { ...B, type: 'interception', by: 0, from: 5 },
    move: {
        ...B,
        type: 'move',
        by: 0,
        moveId: 'tackle',
        kind: 'strike',
        target: 5,
        effectiveness: 1,
        hit: true,
        withBall: false,
    },
};

/** Pontos de cada lance na barra (sem o bônus de quem está perdendo), medidos no `maxCharge` do motor. */
export function maxPlayPoints(): Record<Play, number> {
    const full = 3 * AGENCY.maxLevelPts;
    const out = {} as Record<Play, number>;
    for (const p of PLAYS) out[p] = Math.round(maxCharge([SAMPLE[p]], 0).charge * full * 100) / 100;
    return out;
}

/** O que o golpe máximo de um Pokémon é: o golpe que ele solta, o tipo do status (N1+) e o efeito do N3. */
export interface MaxPlan {
    move: string | null;
    /** Tipo do efeito (`maxFxType`): o status do N1 e a cor. */
    type: string;
    /** Efeito do N3: a assinatura da espécie ou o tipo. */
    fx: string;
    /** No gol, o golpe máximo é a bicuda. */
    gk: boolean;
}

export function maxPlan(moves: readonly string[], speciesId: number, gk: boolean): MaxPlan {
    return {
        move: maxMoveOf(moves, speciesId),
        type: maxFxType(moves, speciesId, species(speciesId).types),
        fx: MAX_SIGNATURE[speciesId] ?? maxFxType(moves, speciesId, species(speciesId).types),
        gk,
    };
}

const num = (n: number, lang: Lang) => n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');
const joinList = (xs: string[], lang: Lang) =>
    xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')}${dict(lang).match.agency.levels.and}${xs.at(-1)}`;

/** Verbo do efeito que o N1 passa em quem bloqueia ou defende ("queima", "faz recuar", "joga areia nos olhos de"…). */
export function maxStatusVerb(type: string, lang: Lang): string {
    const kind = AGENCY.maxStatus[type]?.[0] ?? 'flinch';
    return fmt(dict(lang).match.agency.levels.status[kind] ?? kind, { n: AGENCY.maxN1.drain });
}

/** Nome e o que faz o efeito do N3. */
export function maxFxText(fx: string, lang: Lang): { name: string; desc: string } {
    const a = dict(lang).match.agency;
    return { name: a.maxFx[fx]?.[0] ?? fx, desc: a.levels.fx[fx] ?? '' };
}

/** Força a mais do chute no nível (perfeito): "+25%". */
const power = (lv: 1 | 2 | 3) => pct(AGENCY.maxLevelShot[lv].power);

/** O que o nível `lv` dá, completo (carta, legenda, Ajuda). Cada nível leva o do anterior. */
export function maxLevelText(plan: MaxPlan, lv: 1 | 2 | 3, lang: Lang): string {
    const L = dict(lang).match.agency.levels;
    const fx = maxFxText(plan.fx, lang);
    const vars = { pw: power(lv), st: maxStatusVerb(plan.type, lang), fx: fx.name, desc: fx.desc };
    return fmt((plan.gk ? L.gkRow : L.row)[lv - 1], vars);
}

/** O que muda ao chegar no nível `lv`, curto (legenda da partida): "derruba quem estiver no caminho". */
export function maxLevelGain(plan: MaxPlan, lv: 1 | 2 | 3, lang: Lang): string {
    const L = dict(lang).match.agency.levels;
    const vars = { st: maxStatusVerb(plan.type, lang), fx: maxFxText(plan.fx, lang).name };
    return fmt((plan.gk ? L.gkGain : L.gain)[lv - 1], vars);
}

/** O aviso na partida quando a barra sobe: "N2 liberado: derruba quem estiver no caminho". */
export const maxLevelUnlocked = (plan: MaxPlan, lv: 1 | 2 | 3, lang: Lang) =>
    fmt(dict(lang).match.agency.levels.unlocked, { n: lv, what: maxLevelGain(plan, lv, lang) });

/** Como a barra enche: pontos por nível, lances agrupados pelo valor e o bônus de quem está perdendo. */
export function maxFillText(lang: Lang): string {
    const L = dict(lang).match.agency.levels;
    const pts = maxPlayPoints();
    const byValue = new Map<number, string[]>();
    for (const p of PLAYS) byValue.set(pts[p], [...(byValue.get(pts[p]) ?? []), L.play[p]]);
    const groups = [...byValue.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([v, names]) => fmt(L.playGroup, { plays: joinList(names, lang), n: num(v, lang) }));
    const [, b1, b2] = AGENCY.maxBehind;
    return fmt(L.fill, {
        n1: AGENCY.maxLevelPts,
        n2: 2 * AGENCY.maxLevelPts,
        n3: 3 * AGENCY.maxLevelPts,
        plays: groups.join('; ').replace(/^./, (c) => c.toUpperCase()),
        b1: num(b1, lang),
        b2: num(b2, lang),
    });
}

/** O toque na hora certa: o quanto do extra do nível vale com bom e fora (perfeito vale tudo). */
export function maxTimingText(lang: Lang): string {
    const [off, good] = AGENCY.maxGrade;
    return fmt(dict(lang).match.agency.levels.timing, {
        good: Math.round(good * 100),
        off: Math.round(off * 100),
    });
}

/**
 * Nível que o time `side` acabou de alcançar: o tick do lance que encheu o gomo, se foi até `window` ticks antes de
 * `tick`. Mede no `maxCharge` do motor, lance a lance do time.
 */
export function maxLevelUpAt(
    events: readonly MatchEvent[],
    side: 0 | 1,
    tick: number,
    window: number,
): { level: 1 | 2 | 3; tick: number } | null {
    // o caso comum (nada subiu): duas contas; o lance a lance só quando o nível subiu ou o golpe saiu na janela
    const used = events.some((e) => e.type === 'max' && e.team === side && e.tick > tick - window && e.tick <= tick);
    if (!used && maxCharge(events, side, tick).level <= maxCharge(events, side, tick - window).level) return null;
    let found: { level: 1 | 2 | 3; tick: number } | null = null;
    let prev = -1;
    for (const e of events) {
        if (e.tick > tick) break;
        if (e.tick <= tick - window || e.tick === prev) continue;
        prev = e.tick;
        const before = maxCharge(events, side, e.tick - 1).level;
        const after = maxCharge(events, side, e.tick).level;
        if (after > before) found = { level: after as 1 | 2 | 3, tick: e.tick };
    }
    return found;
}
