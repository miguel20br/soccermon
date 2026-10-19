import { FUTSAL_5 } from '../engine/config';
import type { GoalNote, MatchDigest } from '../engine/match-stats';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent } from '../engine/state';

/**
 * Melhores momentos (0.8.8): quais lances da partida entram no replay e qual é o gol da copa. Tudo derivado dos
 * eventos que o motor já grava; a cena toca os trechos a partir dos snapshots da própria partida.
 */
export type MomentKind = 'goal' | 'save' | 'post' | 'move' | 'evolve';

export interface Moment {
    kind: MomentKind;
    team: 0 | 1;
    /** Jogador (índice da vaga) e nome na hora do lance (trocas mudam o dono da vaga). */
    by: number;
    name: string;
    /** Tick do clímax (o evento) e o trecho tocado [from, to]. */
    tick: number;
    from: number;
    to: number;
    /** Câmera lenta: do chute até logo depois do clímax. */
    slowFrom: number;
    slowTo: number;
    minute: number;
    moveId: string | null;
    /** Peso na escolha (maior = entra antes quando sobra lance). */
    weight: number;
}

const TICK = FUTSAL_5.tickRate;
/** Quanto do lance vem antes do chute (a jogada) e depois do clímax (a comemoração). */
const LEAD = Math.round(3.5 * TICK);
const TAIL = Math.round(2.5 * TICK);
/** Câmera lenta começa um pouco antes do chute e vai até um pouco depois do clímax. */
const SLOW_PRE = 6;
const SLOW_POST = 6;
/** Defesa só entra se o chute era perigoso (chance de gol) ou de golpe. */
const SAVE_XG = 0.3;
/** Máximo de lances no replay da partida (~1 min assistindo). */
export const MAX_MOMENTS = 6;

/** Nome de quem estava na vaga `idx` no tick (a última troca antes do lance vale). */
export function nameAt(m: MatchResult, idx: number, tick: number): string {
    let name = m.roster[idx]?.name ?? '';
    for (const e of m.events) {
        if (e.tick > tick) break;
        if (e.type === 'sub' && e.outIdx === idx) name = e.in;
    }
    return name;
}

type ShotEvent = Extract<MatchEvent, { type: 'shot' }>;

/** O chute que levou ao lance: o último de `by` até 4 s antes (cabeçada de escanteio também é chute). */
function shotBefore(events: MatchEvent[], i: number, by: number): ShotEvent | null {
    const at = events[i].tick;
    for (let j = i - 1; j >= 0 && at - events[j].tick <= 4 * TICK; j--) {
        const p = events[j];
        if (p.type === 'shot' && p.by === by) return p;
    }
    return null;
}

const teamOf = (m: MatchResult, idx: number): 0 | 1 => m.roster[idx]?.team ?? 0;

/**
 * Lances da partida para o replay, em ordem de jogo. Entram (peso entre parênteses, pra cortar quando passa de
 * `max`): gol (100; +15 de golpe; +10 do seu time), evolução (70), golpe máximo que saiu (55), defesaça (50 + chance
 * de gol do chute), bola na trave (45) e golpe super efetivo que acertou (35). Lances colados viram um só. A disputa
 * de pênaltis fica de fora (a cena anima ela à parte).
 */
export function pickMoments(m: MatchResult, max = MAX_MOMENTS, mine: 0 | 1 = 0): Moment[] {
    if (!m.snapshots.length) return [];
    const end = endTick(m);
    const out = m.events.flatMap((_, i) => momentAt(m, i, mine, end) ?? []);
    // lances colados (chute defendido que vira escanteio e gol): um trecho só, com a cara do mais importante
    out.sort((a, b) => a.from - b.from);
    const merged: Moment[] = [];
    for (const mo of out) {
        const prev = merged.at(-1);
        if (prev && mo.from <= prev.to) {
            const top = mo.weight > prev.weight ? mo : prev;
            merged[merged.length - 1] = { ...top, from: prev.from, to: Math.max(prev.to, mo.to) };
        } else merged.push(mo);
    }
    return merged
        .sort((a, b) => b.weight - a.weight || a.tick - b.tick)
        .slice(0, max)
        .sort((a, b) => a.tick - b.tick);
}

/** Último tick que o replay toca: o apito final (os pênaltis ficam de fora) ou o último snapshot. */
const endTick = (m: MatchResult) =>
    Math.min(
        m.events.find((x) => x.type === 'fulltime')?.tick ?? Number.POSITIVE_INFINITY,
        m.snapshots.at(-1)?.tick ?? 0,
    );

/** O lance do evento `i`, se ele vale replay (ver `pickMoments`). */
function momentAt(m: MatchResult, i: number, mine: 0 | 1, end: number): Moment | null {
    if (!m.snapshots.length) return null;
    const ev = m.events;
    const e = ev[i];
    const first = m.snapshots[0].tick;
    if (e.tick > end) return null;
    const make = (
        kind: MomentKind,
        by: number,
        weight: number,
        moveId: string | null,
        start: number,
        team = teamOf(m, by),
    ): Moment => ({
        kind,
        team,
        by,
        name: nameAt(m, by, e.tick),
        tick: e.tick,
        from: Math.max(first, start - LEAD),
        to: Math.min(end, e.tick + TAIL),
        slowFrom: Math.max(first, start - SLOW_PRE),
        slowTo: Math.min(end, e.tick + SLOW_POST),
        minute: Math.floor(e.minute),
        moveId,
        weight,
    });
    if (e.type === 'goal') {
        const shot = e.ownGoal ? null : shotBefore(ev, i, e.by);
        const moveId = shot?.moveId ?? null;
        const weight = 100 + (moveId ? 15 : 0) + (e.team === mine ? 10 : 0);
        return make('goal', e.by, weight, moveId, shot?.tick ?? e.tick - 10, e.team);
    }
    if (e.type === 'save') {
        const shot = shotBefore(ev, i, e.shooter);
        if (!shot || (shot.xg < SAVE_XG && !shot.moveId)) return null;
        return make('save', e.by, 50 + Math.round(shot.xg * 40), shot.moveId, shot.tick);
    }
    if (e.type === 'post') {
        const shot = shotBefore(ev, i, e.shooter);
        return make('post', e.shooter, 45, shot?.moveId ?? null, shot?.tick ?? e.tick - 10);
    }
    if (e.type === 'evolve') return make('evolve', e.by, 70, null, e.tick);
    if (e.type === 'max' && e.phase === 'hit') return make('move', e.by, 55, e.moveId ?? null, e.tick);
    if (e.type === 'move' && e.hit && (e.effectiveness ?? 1) >= 2) return make('move', e.by, 35, e.moveId, e.tick);
    return null;
}

/** O lance de um gol (o n-ésimo gol da partida, contando os dois times), pro gol da copa. */
export function goalMoment(m: MatchResult, goalNo: number): Moment | null {
    let n = -1;
    for (let i = 0; i < m.events.length; i++) {
        if (m.events[i].type === 'goal' && ++n === goalNo) return momentAt(m, i, 0, endTick(m));
    }
    return null;
}

// ------------------------------------------------------------------ gol da copa

export type CupGoalReason =
    | { kind: 'move'; moveId: string }
    | { kind: 'distance'; meters: number }
    | { kind: 'comeback'; minute: number }
    | { kind: 'equalizer'; minute: number }
    | { kind: 'lead'; minute: number }
    | { kind: 'late'; minute: number }
    | { kind: 'final' };

export interface CupGoalPick {
    stage: number;
    /** Índice do gol entre todos os gols da partida (`digest.goals`, os dois times). */
    goalNo: number;
    goal: GoalNote;
    points: number;
    reasons: CupGoalReason[];
}

const PITCH = FUTSAL_5.pitch;
/** Seu time sempre ataca o gol de x = comprimento (src/engine/match.ts → goalXFor). */
export const shotMeters = (g: GoalNote) => Math.round(Math.hypot(PITCH.length - g.x, PITCH.width / 2 - g.y));

/** Fase da final (a última da copa). */
const FINAL_STAGE = 3;

/**
 * Gol da copa: o seu gol (não contra) com mais pontos. Critério simples e mostrado na tela:
 * - golpe no chute: +3;
 * - distância: +1 a cada 4 m de distância do gol (de 12 m = +3);
 * - peso no placar: virada +3, desempate +2, empate +2;
 * - fim de jogo (35' em diante): +1; gol na final: +1.
 * Empate nos pontos: o mais tarde na copa.
 */
export function cupGoal(results: { stage: number; stats?: { digest?: MatchDigest } }[]): CupGoalPick | null {
    let best: CupGoalPick | null = null;
    for (const r of results) {
        const goals = r.stats?.digest?.goals ?? [];
        const score = [0, 0];
        let wasBehind = false;
        goals.forEach((g, goalNo) => {
            const before = [score[0], score[1]];
            score[g.team]++;
            if (before[0] < before[1]) wasBehind = true;
            if (g.team !== 0 || g.ownGoal) return;
            const reasons: CupGoalReason[] = [];
            let points = 0;
            if (g.moveId) {
                points += 3;
                reasons.push({ kind: 'move', moveId: g.moveId });
            }
            const meters = shotMeters(g);
            points += meters / 4;
            if (meters >= 8) reasons.push({ kind: 'distance', meters });
            if (before[0] === before[1]) {
                if (wasBehind) {
                    points += 3;
                    reasons.push({ kind: 'comeback', minute: g.minute });
                } else if (before[0] > 0) {
                    points += 2;
                    reasons.push({ kind: 'lead', minute: g.minute });
                }
            } else if (before[0] + 1 === before[1]) {
                points += 2;
                reasons.push({ kind: 'equalizer', minute: g.minute });
            }
            if (g.minute >= 35) {
                points += 1;
                reasons.push({ kind: 'late', minute: g.minute });
            }
            if (r.stage === FINAL_STAGE) {
                points += 1;
                reasons.push({ kind: 'final' });
            }
            const pick = { stage: r.stage, goalNo, goal: g, points, reasons };
            if (
                !best ||
                points > best.points ||
                (points === best.points && (r.stage > best.stage || (r.stage === best.stage && goalNo > best.goalNo)))
            )
                best = pick;
        });
    }
    return best;
}
