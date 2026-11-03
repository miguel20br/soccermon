import { describe, expect, it } from 'vitest';
import { AGENCY } from './agency';
import { type Command, IDLE } from './commands';
import { FUTSAL_5 } from './config';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { createMatch, step } from './match';
import { Rng } from './rng';
import { LiveRunner } from './runners/live-runner';
import type { MatchEvent, MatchState, TeamSetup } from './state';
import { v } from './vec';

/**
 * Duelo da bicuda (motor 21): o capitão do time 0 (pivô, idx 4) chuta o N3 de 10 m; o goleiro do time 1 (idx 5) é o
 * capitão, com a bicuda N3 armada. Alcançou: segura, a partida para e a bicuda vira gol sempre.
 */
function team(seed: string): TeamSetup {
    return { name: seed, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}

const IDLE_ALL = (s: MatchState): Command[] => s.players.map(() => IDLE);
const of = <T extends MatchEvent['type']>(s: MatchState, type: T, from = 0) =>
    s.events.slice(from).filter((e): e is Extract<MatchEvent, { type: T }> => e.type === type);

function duel(seed: string, level: 1 | 2 | 3 = 3, q: 1 | 2 = 2) {
    const A = team('sd-a');
    const B = team('sd-b');
    const s = createMatch(FUTSAL_5, { ...A, captainUid: A.lineup[4].uid }, { ...B, captainUid: B.lineup[0].uid }, seed);
    s.phase = 'play';
    const far = [v(8, 3), v(8, 17), v(4, 10), v(12, 10), v(15, 5), v(15, 15), v(20, 3)];
    s.players.forEach((p, i) => {
        p.pos = far[i % far.length];
        p.vel = v(0, 0);
    });
    s.players[4].pos = v(30, 10);
    s.players[5].pos = v(39.3, 10);
    // o goleiro do time 0 no meio do próprio gol e um zagueiro do time 0 na linha da bicuda: no chute de verdade eles
    // defendem ou bloqueiam parte das vezes
    s.players[0].pos = v(0.8, 10);
    s.players[1].pos = v(20, 10);
    s.ball.owner = 4;
    s.ball.pos = v(30.3, 10);
    s.teams[0].agency.max = { idx: 4, until: 100, level: 3, q: 2 };
    s.teams[1].agency.max = { idx: 5, until: 200, level, q };
    const cmds = IDLE_ALL(s);
    cmds[4] = { type: 'shoot', target: v(40, 10), power: 1 };
    step(s, cmds);
    for (let i = 0; i < 30 && !of(s, 'showdown').length && !of(s, 'goal').length; i++) step(s, IDLE_ALL(s));
    return s;
}

/** Roda até o gol (ou `n` ticks). */
function untilGoal(s: MatchState, n = 400) {
    for (let i = 0; i < n && !of(s, 'goal').length; i++) step(s, IDLE_ALL(s));
}

describe('duelo da bicuda (motor 21)', () => {
    it('o N3 que o goleiro capitão alcança com a bicuda N3 armada para a partida e vira gol dele, sempre', () => {
        let seen = 0;
        for (let k = 0; k < 40; k++) {
            const s = duel(`sd-${k}`, 3, ((k % 2) + 1) as 1 | 2);
            const sd = of(s, 'showdown')[0];
            if (!sd) continue;
            seen++;
            expect(sd).toMatchObject({ team: 1, gk: 5, shooter: 4 });
            expect(s.phase).toBe('showdown');
            expect(s.ball.owner).toBe(5);
            expect(s.teams[1].agency.max).toBeNull();
            // todo mundo parado e o relógio parado até o chute
            const pos = s.players.map((p) => ({ ...p.pos }));
            const time = s.time;
            while (s.tick < sd.kick - 1) step(s, IDLE_ALL(s));
            expect(s.phase).toBe('showdown');
            expect(s.time).toBe(time);
            expect(s.players.map((p) => p.pos)).toEqual(pos);
            expect(of(s, 'max').filter((e) => e.team === 1)).toHaveLength(0);
            const kickAt = s.events.length;
            untilGoal(s);
            const hit = of(s, 'max', kickAt)[0];
            expect(hit).toMatchObject({ team: 1, by: 5, phase: 'hit', level: 3, q: sd.q });
            expect(hit.tick).toBe(sd.kick);
            const goal = of(s, 'goal', kickAt)[0];
            expect(goal).toMatchObject({ team: 1, by: 5, ownGoal: false, assist: null });
            // ninguém tocou: nem defesa, nem bloqueio, nem trave, nem pra fora
            const between = s.events.slice(kickAt).map((e) => e.type);
            for (const t of ['save', 'block', 'post', 'wide', 'interception', 'tackle'] as const)
                expect(between).not.toContain(t);
            // a comemoração mais longa do jogo (o gol comum fica 3 s)
            expect(s.phase).toBe('goal');
            expect(s.phaseTimer).toBe(AGENCY.showdown.goal);
            expect(AGENCY.showdown.goal).toBeGreaterThan(3);
            // na bicuda, todo mundo parado; só o goleiro rival (idx 0) pulou pro outro canto, longe da bola
            expect(s.players.map((p) => p.pos).filter((_, i) => i !== 0)).toEqual(pos.filter((_, i) => i !== 0));
            expect(Math.abs(s.players[0].pos.y - s.ball.pos.y)).toBeGreaterThan(1.5);
        }
        expect(seen).toBeGreaterThan(5);
    });

    it('toque fora não segura: vira a defesa de sempre, sem duelo', () => {
        let misses = 0;
        for (let k = 0; k < 20; k++) {
            const s = duelWith(`sd-q0-${k}`, 3, 0);
            if (of(s, 'max').some((e) => e.team === 1 && e.phase === 'miss')) {
                misses++;
                expect(of(s, 'showdown')).toHaveLength(0);
            }
        }
        expect(misses).toBeGreaterThan(0);
    });

    it('sem duelo fora do N3 contra N3: a bicuda N1/N2 contra o N3 e a N3 contra o N2 são o counter de sempre', () => {
        for (const [shot, bicuda] of [
            [3, 1],
            [3, 2],
            [2, 3],
        ] as const) {
            let seen = 0;
            for (let k = 0; k < 20; k++) {
                const s = duelWith(`sd-c${shot}${bicuda}-${k}`, shot, 2, bicuda);
                if (!of(s, 'max').some((e) => e.team === 1 && e.phase === 'hit')) continue;
                seen++;
                expect(of(s, 'showdown')).toHaveLength(0);
                expect(s.phase).not.toBe('showdown');
            }
            expect(seen, `chute N${shot}, bicuda N${bicuda}`).toBeGreaterThan(0);
        }
    });

    it('?demo=bicuda: o par escolhido cai no duelo (de Inseto também) e a partida inteira é a mesma em toda rodada', () => {
        // [goleiro capitão do time 0, pivô capitão do rival]
        for (const [gk, atk] of [
            [4, 6],
            [13, 8],
            [25, 26],
            [129, 130],
            [1, 15],
        ]) {
            const rng = new Rng(`sd-demo-${gk}`, 'demo');
            const A = team('sd-a');
            const B = team('sd-b');
            const mine = A.lineup.map((p, i) => (i === 0 ? createInstance(gk, rng) : p));
            const theirs = B.lineup.map((p, i) => (i === 4 ? createInstance(atk, rng) : p));
            const home = { ...A, lineup: mine, captainUid: mine[0].uid, demoBicudaAt: 200 };
            const away = { ...B, lineup: theirs, captainUid: theirs[4].uid };
            const run = () => {
                const r = new LiveRunner(FUTSAL_5, home, away, `sd-demo-${gk}`);
                while (!r.finished) r.step();
                return r.state.events;
            };
            const ev = run();
            const sd = ev.find((e) => e.type === 'showdown');
            expect(sd, `${gk} x ${atk}`).toMatchObject({ team: 0 });
            const goal = ev.find((e) => e.type === 'goal' && e.tick > (sd?.tick ?? 0));
            expect(goal).toMatchObject({ team: 0, ownGoal: false });
            expect(JSON.stringify(run())).toBe(JSON.stringify(ev));
        }
    });
});

/** O lance de `duel` com o golpe do rival no nível `shotLevel` e a bicuda no nível `level` com o toque `q`. */
function duelWith(seed: string, shotLevel: 1 | 2 | 3, q: 0 | 1 | 2, level: 1 | 2 | 3 = 3) {
    const A = team('sd-a');
    const B = team('sd-b');
    const s = createMatch(FUTSAL_5, { ...A, captainUid: A.lineup[4].uid }, { ...B, captainUid: B.lineup[0].uid }, seed);
    s.phase = 'play';
    const far = [v(8, 3), v(8, 17), v(4, 10), v(12, 10), v(15, 5), v(15, 15), v(20, 3)];
    s.players.forEach((p, i) => {
        p.pos = far[i % far.length];
        p.vel = v(0, 0);
    });
    s.players[4].pos = v(30, 10);
    s.players[5].pos = v(39.3, 10);
    s.ball.owner = 4;
    s.ball.pos = v(30.3, 10);
    s.teams[0].agency.max = { idx: 4, until: 100, level: shotLevel, q: 2 };
    s.teams[1].agency.max = { idx: 5, until: 200, level, q };
    const cmds = IDLE_ALL(s);
    cmds[4] = { type: 'shoot', target: v(40, 10), power: 1 };
    step(s, cmds);
    for (let i = 0; i < 30; i++) step(s, IDLE_ALL(s));
    return s;
}
