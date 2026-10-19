import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import type { GoalNote, MatchDigest } from '../engine/match-stats';
import { Rng } from '../engine/rng';
import { type MatchResult, runMatch } from '../engine/runners/batch-runner';
import type { MatchEvent, TeamSetup } from '../engine/state';
import { cupGoal, goalMoment, MAX_MOMENTS, pickMoments, shotMeters } from './moments';

function team(seed: string, name: string): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 0), tactic: 'balanced', color: 0 };
}

/** Partida de mentira: só os eventos e snapshots que a escolha lê. */
function fake(events: Partial<MatchEvent>[], ticks = 2000): MatchResult {
    const base = { half: 1 as const, minute: 10 };
    return {
        seed: 'x',
        score: [0, 0],
        shootout: null,
        winner: null,
        events: events.map((e) => ({ ...base, ...e }) as MatchEvent),
        snapshots: [
            {
                tick: 0,
                half: 1,
                minute: 0,
                phase: 'kickoff',
                bx: 0,
                by: 0,
                bz: 0,
                owner: -1,
                bfx: '',
                score: [0, 0],
                p: [],
            },
            {
                tick: ticks,
                half: 2,
                minute: 40,
                phase: 'play',
                bx: 0,
                by: 0,
                bz: 0,
                owner: -1,
                bfx: '',
                score: [0, 0],
                p: [],
            },
        ],
        roster: [0, 1, 2, 3].map((idx) => ({
            idx,
            team: (idx < 2 ? 0 : 1) as 0 | 1,
            uid: `u${idx}`,
            speciesId: 25,
            name: `P${idx}`,
            role: 'ALA',
            shiny: false,
            captain: false,
            item: null,
            stats: {} as MatchResult['roster'][0]['stats'],
            energy: 1,
        })),
        finalRoster: [],
        subbedOut: [],
        possession: [0.5, 0.5],
        ticks,
    };
}

describe('melhores momentos', () => {
    it('pega gol, defesaça, trave e evolução; defesa fácil e chute comum ficam de fora', () => {
        const m = fake([
            { type: 'shot', tick: 100, by: 1, xg: 0.1, moveId: null },
            { type: 'save', tick: 110, by: 2, shooter: 1, caught: true }, // fácil: fora
            { type: 'shot', tick: 400, by: 1, xg: 0.5, moveId: null },
            { type: 'save', tick: 410, by: 2, shooter: 1, caught: false }, // defesaça
            { type: 'shot', tick: 700, by: 3, xg: 0.2, moveId: 'thunderbolt' },
            { type: 'goal', tick: 712, by: 3, assist: null, team: 1, score: [0, 1], ownGoal: false },
            { type: 'evolve', tick: 1000, by: 0, team: 0, uid: 'u0', from: 4, into: 5, role: 'ALA' },
            { type: 'shot', tick: 1300, by: 1, xg: 0.2, moveId: null },
            { type: 'post', tick: 1310, shooter: 1 },
        ]);
        const got = pickMoments(m);
        expect(got.map((x) => x.kind)).toEqual(['save', 'goal', 'evolve', 'post']);
        const goal = got[1];
        expect(goal.moveId).toBe('thunderbolt');
        expect(goal.name).toBe('P3');
        // câmera lenta do chute ao gol, dentro do trecho
        expect(goal.slowFrom).toBeLessThanOrEqual(700);
        expect(goal.slowTo).toBeGreaterThanOrEqual(712);
        expect(goal.from).toBeLessThan(goal.slowFrom);
        expect(goal.to).toBeGreaterThan(goal.slowTo);
    });

    it('lances colados viram um só, com a cara do mais importante', () => {
        const m = fake([
            { type: 'shot', tick: 400, by: 1, xg: 0.5, moveId: null },
            { type: 'save', tick: 410, by: 2, shooter: 1, caught: false },
            { type: 'shot', tick: 440, by: 0, xg: 0.3, moveId: null },
            { type: 'goal', tick: 450, by: 0, assist: null, team: 0, score: [1, 0], ownGoal: false },
        ]);
        const got = pickMoments(m);
        expect(got).toHaveLength(1);
        expect(got[0].kind).toBe('goal');
        expect(got[0].from).toBeLessThanOrEqual(400 - 60);
    });

    it('corta no máximo, guardando os gols, e nada depois do apito final (pênaltis)', () => {
        const events: Partial<MatchEvent>[] = [];
        for (let k = 0; k < 10; k++) {
            events.push({ type: 'shot', tick: 150 * k + 100, by: 1, xg: 0.6, moveId: null });
            events.push({ type: 'save', tick: 150 * k + 105, by: 2, shooter: 1, caught: false });
        }
        events.push({ type: 'shot', tick: 1700, by: 1, xg: 0.2, moveId: null });
        events.push({ type: 'goal', tick: 1710, by: 1, assist: null, team: 0, score: [1, 0], ownGoal: false });
        events.push({ type: 'fulltime', tick: 1800, score: [1, 0] });
        events.push({ type: 'penalty', tick: 1900, by: 1, gk: 2, scored: true, round: 1, shootout: [1, 0] });
        const got = pickMoments(fake(events));
        expect(got).toHaveLength(MAX_MOMENTS);
        expect(got.some((x) => x.kind === 'goal')).toBe(true);
        expect(got.every((x) => x.to <= 1800)).toBe(true);
        // em ordem de jogo
        expect(got.map((x) => x.tick)).toEqual([...got].map((x) => x.tick).sort((a, b) => a - b));
    });

    it('partida sem snapshots (save antigo) não tem replay', () => {
        const m = {
            ...fake([{ type: 'goal', tick: 10, by: 0, assist: null, team: 0, score: [1, 0], ownGoal: false }]),
        };
        expect(pickMoments({ ...m, snapshots: [] })).toEqual([]);
    });

    it('partida de verdade: todo gol do tempo normal tem lance, dentro dos snapshots', () => {
        let m: MatchResult | null = null;
        for (let k = 0; k < 6 && !m; k++) {
            const r = runMatch(FUTSAL_5, team(`mo-a${k}`, 'A'), team(`mo-b${k}`, 'B'), `mo-${k}`);
            if (r.score[0] + r.score[1] >= 2) m = r;
        }
        expect(m).not.toBeNull();
        const match = m as MatchResult;
        const goals = match.events.filter((e) => e.type === 'goal');
        goals.forEach((g, n) => {
            const mo = goalMoment(match, n);
            expect(mo?.tick).toBe(g.tick);
            expect(mo!.from).toBeGreaterThanOrEqual(match.snapshots[0].tick);
            expect(mo!.to).toBeLessThanOrEqual(match.snapshots.at(-1)!.tick);
        });
        const got = pickMoments(match);
        expect(got.length).toBeGreaterThan(0);
        expect(got.length).toBeLessThanOrEqual(MAX_MOMENTS);
    });
});

const goal = (o: Partial<GoalNote>): GoalNote => ({
    minute: 10,
    team: 0,
    uid: 'u',
    speciesId: 25,
    name: 'Pikachu',
    assistUid: null,
    moveId: null,
    x: 36,
    y: 10,
    ownGoal: false,
    ...o,
});
const stage = (n: number, goals: GoalNote[]) => ({
    stage: n,
    stats: { digest: { goals, half: null, moves: {}, evolutions: [] } as MatchDigest },
});

describe('gol da copa', () => {
    it('golpe e distância pesam: o chute de longe com golpe ganha do gol de perto', () => {
        const pick = cupGoal([
            stage(0, [goal({ x: 37, name: 'perto' })]),
            stage(1, [goal({ x: 26, moveId: 'thunderbolt', name: 'golaço' })]),
        ]);
        expect(pick?.goal.name).toBe('golaço');
        expect(pick?.stage).toBe(1);
        expect(pick?.reasons.map((r) => r.kind)).toEqual(['move', 'distance']);
        expect(shotMeters(pick!.goal)).toBe(14);
    });

    it('virada no fim conta: o gol que vira aos 38 ganha do primeiro gol', () => {
        const pick = cupGoal([
            stage(2, [
                goal({ team: 1, minute: 5 }),
                goal({ minute: 20, name: 'empate' }),
                goal({ minute: 38, name: 'virada' }),
            ]),
        ]);
        expect(pick?.goal.name).toBe('virada');
        expect(pick?.goalNo).toBe(2);
        expect(pick?.reasons.map((r) => r.kind)).toEqual(['comeback', 'late']);
    });

    it('gol contra e gol do rival nunca são o gol da copa; copa sem gol seu = nada', () => {
        expect(cupGoal([stage(0, [goal({ ownGoal: true }), goal({ team: 1 })])])).toBeNull();
        expect(cupGoal([{ stage: 0 }])).toBeNull();
    });

    it('empate nos pontos: o mais tarde na copa', () => {
        const pick = cupGoal([stage(0, [goal({ name: 'a' })]), stage(1, [goal({ name: 'b' })])]);
        expect(pick?.goal.name).toBe('b');
    });
});
