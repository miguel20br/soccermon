import { viewInstance } from '../engine/instance';
import type { MatchResult } from '../engine/runners/batch-runner';
import { evoGoalsNeed, evoReady } from '../store/ultimate/evolutions';
import { objectivesAt, objectivesNow } from '../store/ultimate/objectives';
import type { UltimateSave } from '../store/ultimate/ultimate';

/**
 * Progresso das metas de gol durante a partida do Time Ultimate (ideia de playtester, 07/12/2026): a cada gol seu, o
 * aviso do canto diz quanto a meta já tem contando a partida ("Meta do dia: 3/4 gols", "Evolução de Pikachu: 1/2
 * gols"). O save só conta no apito final (`finishMatch`); aqui é a mesma conta, ao vivo, sem gravar nada.
 */
export type GoalTrack =
    /** Objetivo de gols do time (`kind: 'goals'`): `have` = o que o save já tinha. */
    | { kind: 'objective'; period: 'day' | 'week' | 'event'; have: number; of: number }
    /** Evolução de uma carta de linha: gols dela. */
    | { kind: 'evo'; uid: string; name: string; have: number; of: number };

export type GoalCueLine = GoalTrack & { n: number };

/** Depois de quantos ticks o aviso não aparece mais (o gol ficou pra trás: retomada, Pular). */
export const GOAL_CUE_WINDOW = 200;

/**
 * O aviso do último gol seu até `tick` (null = nenhum gol recente ou nenhuma meta andou com ele). `uidAt(idx, tick)`
 * = quem estava na vaga na hora (trocas). Só entram as metas que este gol fez andar.
 */
export function goalCueAt(
    m: Pick<MatchResult, 'events'>,
    tick: number,
    tracks: readonly GoalTrack[],
    uidAt: (idx: number, tick: number) => string | undefined,
): { tick: number; lines: GoalCueLine[] } | null {
    if (!tracks.length) return null;
    let last = -1;
    for (let i = m.events.length - 1; i >= 0; i--) {
        const e = m.events[i];
        if (e.tick > tick) continue;
        if (e.tick < tick - GOAL_CUE_WINDOW) return null;
        if (e.type === 'goal' && e.team === 0) {
            last = i;
            break;
        }
    }
    if (last < 0) return null;
    const goal = m.events[last];
    if (goal.type !== 'goal') return null;
    const scorer = goal.ownGoal ? undefined : uidAt(goal.by, goal.tick);
    const lines: GoalCueLine[] = [];
    for (const t of tracks) {
        if (t.kind === 'objective') {
            // o gol do time (gol contra do rival também conta, como no placar)
            const n = t.have + goal.score[0];
            if (n - 1 < t.of) lines.push({ ...t, n: Math.min(t.of, n) });
            continue;
        }
        if (t.uid !== scorer) continue;
        let mine = 0;
        for (let i = 0; i <= last; i++) {
            const e = m.events[i];
            if (e.type === 'goal' && e.team === 0 && !e.ownGoal && uidAt(e.by, e.tick) === t.uid) mine++;
        }
        const n = t.have + mine;
        if (n - 1 < t.of) lines.push({ ...t, n: Math.min(t.of, n) });
    }
    return lines.length ? { tick: goal.tick, lines } : null;
}

/**
 * As metas de gol do Time Ultimate no começo da partida: objetivos de gols ainda abertos e Evoluções de cartas de linha
 * (o goleiro conta defesas, que não avisam: seriam um aviso a cada defesa).
 */
export function utGoalTracks(u: Pick<UltimateSave, 'objectives' | 'evos' | 'cards'>, now: number): GoalTrack[] {
    const g = objectivesAt(u.objectives, now);
    const out: GoalTrack[] = objectivesNow(now)
        .filter((o) => o.kind === 'goals' && !g.done.includes(o.id))
        .map((o) => ({ kind: 'objective', period: o.period, have: g.prog[o.id] ?? 0, of: o.goal }));
    for (const e of u.evos) {
        const card = u.cards.find((c) => c.uid === e.uid);
        if (!card || e.role === 'GK' || evoReady(e)) continue;
        out.push({
            kind: 'evo',
            uid: e.uid,
            name: viewInstance(card).displayName,
            have: e.prog.goals,
            of: evoGoalsNeed(e),
        });
    }
    return out;
}
