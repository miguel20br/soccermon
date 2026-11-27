import { describe, expect, it } from 'vitest';
import type { MatchResult } from '../engine/runners/batch-runner';
import { GOAL_CUE_WINDOW, type GoalTrack, goalCueAt } from './goal-cue';

const goal = (tick: number, team: 0 | 1, by: number, score: [number, number], ownGoal = false) =>
    ({ type: 'goal', tick, team, by, assist: null, score, ownGoal }) as MatchResult['events'][number];

describe('aviso das metas de gol na partida do UT', () => {
    const m = { events: [goal(100, 0, 3, [1, 0]), goal(300, 1, 7, [1, 1]), goal(500, 0, 4, [2, 1])] };
    const uidAt = (idx: number) => `p${idx}`;
    const tracks: GoalTrack[] = [
        { kind: 'objective', period: 'day', have: 1, of: 4 },
        { kind: 'evo', uid: 'p3', name: 'Pikachu', have: 0, of: 2 },
        { kind: 'evo', uid: 'p4', name: 'Eevee', have: 1, of: 2 },
    ];

    it('soma o que o save tinha com os gols da partida, só nas metas que o gol fez andar', () => {
        expect(goalCueAt(m, 110, tracks, uidAt)?.lines.map((l) => [l.kind, l.n])).toEqual([
            ['objective', 2],
            ['evo', 1],
        ]);
        // gol do Eevee: a meta do dia (3/4) e a Evolução dele fechando (2/2)
        expect(goalCueAt(m, 520, tracks, uidAt)?.lines.map((l) => [l.kind, l.n, l.of])).toEqual([
            ['objective', 3, 4],
            ['evo', 2, 2],
        ]);
    });

    it('gol do rival não avisa; gol velho some; meta já cheia não aparece de novo', () => {
        expect(goalCueAt(m, 250, tracks, uidAt)?.tick).toBe(100);
        expect(goalCueAt(m, 310, tracks, uidAt)).toBeNull();
        expect(goalCueAt(m, 100 + GOAL_CUE_WINDOW + 1, tracks, uidAt)).toBeNull();
        expect(goalCueAt(m, 520, [{ kind: 'objective', period: 'day', have: 4, of: 4 }], uidAt)).toBeNull();
    });

    it('gol contra do rival conta pro time, não pra Evolução de ninguém', () => {
        const own = { events: [goal(50, 0, 3, [1, 0], true)] };
        expect(goalCueAt(own, 60, tracks, uidAt)?.lines.map((l) => l.kind)).toEqual(['objective']);
    });
});
