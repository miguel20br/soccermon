import { describe, expect, it } from 'vitest';
import { Action, type MatchSnapshot, SNAP_STRIDE } from '../engine/state';
import { POST_SHAKE, postShakeAt } from '../game/court';
import {
    ballSquashAt,
    bumpPose,
    KICK_SQUASH,
    kickSquash,
    latestAt,
    RUN_BURST,
    runBurstPose,
    runBursts,
    runDustAt,
    trapPose,
    traps,
} from './match-view';

/** Snapshots a cada 2 ticks de um jogador só, com a posição x (m) de cada um; `owner` opcional por snapshot. */
function track(xs: number[], extra: Partial<MatchSnapshot>[] = []): MatchSnapshot[] {
    return xs.map((x, n) => {
        const p = new Array(SNAP_STRIDE).fill(0);
        p[0] = x;
        p[1] = 10;
        p[3] = Action.Run;
        return {
            tick: n * 2,
            half: 1,
            minute: 0,
            phase: 'play',
            bx: 0,
            by: 0,
            bz: 0,
            owner: -1,
            bfx: '',
            score: [0, 0],
            p,
            ...extra[n],
        } as MatchSnapshot;
    });
}

// 0,5 m por snapshot = 5 m/s (correndo); 0 = parado
const still = (n: number, at: number) => Array.from({ length: n }, () => at);
const run = (n: number, from: number, step = 0.5) => Array.from({ length: n }, (_, i) => from + step * (i + 1));

describe('arrancada e freada (squash & stretch, só tela)', () => {
    it('parado → correndo é arrancada pra onde ele corre; correndo → parado é freada', () => {
        const xs = [...still(8, 5), ...run(20, 5)];
        const stopAt = xs.at(-1) ?? 0;
        const all = [...xs, ...still(10, stopAt)];
        const b = runBursts(track(all), 1);
        expect(b.map((x) => x.kind)).toEqual(['go', 'stop']);
        expect(b[0].dir.x).toBeCloseTo(1);
        expect(b[1].dir.x).toBeCloseTo(1);
        // a arrancada no último snapshot parado, a freada no último correndo
        expect(b[0].tick).toBe(7 * 2);
        expect(b[1].tick - b[0].tick).toBeGreaterThanOrEqual(RUN_BURST.gap);
    });

    it('trotando ou em lance parado não conta, e duas seguidas respeitam o intervalo', () => {
        // 1 m/s → 2,5 m/s: abaixo de "correndo"
        expect(runBursts(track([...still(6, 5), ...run(10, 5, 0.25)]), 1)).toEqual([]);
        const kickoff = track([...still(8, 5), ...run(10, 5)], [{}, {}, {}, {}, {}, {}, {}, { phase: 'kickoff' }]);
        expect(runBursts(kickoff, 1)).toEqual([]);
        // arranca, para logo e arranca de novo: só a 1ª (o resto cai no intervalo)
        const choppy = [...still(6, 5), ...run(3, 5), ...still(3, 6.5), ...run(3, 6.5), ...still(6, 8)];
        expect(runBursts(track(choppy), 1)).toHaveLength(1);
    });

    it('arrancada inclina pra frente e estica de lado; freada joga pra trás e amassa; sutil', () => {
        const go = { by: 0, tick: 10, kind: 'go' as const, dir: { x: 1, y: 0 }, dusted: false };
        const stop = { ...go, kind: 'stop' as const };
        let peak = 0;
        for (let t = 9; t < 10 + RUN_BURST.len; t += 0.25) {
            const g = runBurstPose(go, t);
            const s = runBurstPose(stop, t);
            if (!g || !s) continue;
            expect(g.tilt).toBeGreaterThanOrEqual(0);
            expect(g.sx).toBeGreaterThanOrEqual(1);
            expect(s.tilt).toBeLessThanOrEqual(0);
            expect(s.sy).toBeLessThanOrEqual(1);
            peak = Math.max(peak, g.sx - 1, 1 - s.sy);
        }
        expect(peak).toBeGreaterThan(0.05);
        expect(peak).toBeLessThanOrEqual(0.1);
        // correndo pra esquerda: inclina pra esquerda; pra baixo na tela: estica na altura
        expect(runBurstPose({ ...go, dir: { x: -1, y: 0 } }, 12)?.tilt).toBeLessThan(0);
        const down = runBurstPose({ ...go, dir: { x: 0, y: 1 } }, 12);
        expect(down?.sy).toBeGreaterThan(1);
        expect(down?.sx).toBeLessThan(1);
        expect(runBurstPose(go, 9)).toBeNull();
        expect(runBurstPose(go, 10 + RUN_BURST.len)).toBeNull();
        expect(runBurstPose(go, 12, true)).toBeNull();
        // a poeira sai atrás do pé na arrancada e na frente na freada
        expect(runDustAt(go).x).toBeLessThan(0);
        expect(runDustAt(stop).x).toBeGreaterThan(0);
    });
});

describe('chute, dominada e choque (squash & stretch, só tela)', () => {
    it('chute: encolhe antes do contato e estica depois, inclinando pro lado da bola', () => {
        const pre = kickSquash(-2, 1);
        const hit = kickSquash(0.5, 1);
        expect(pre?.sy).toBeLessThan(1);
        expect(pre?.sx).toBeGreaterThan(1);
        expect(pre?.tilt).toBeLessThan(0);
        expect(hit?.sy).toBeGreaterThan(1.1);
        expect(hit?.tilt).toBeGreaterThan(0);
        expect(kickSquash(0.5, -1)?.tilt).toBeLessThan(0);
        expect(kickSquash(-KICK_SQUASH.lead, 1)).toBeNull();
        expect(kickSquash(KICK_SQUASH.tail, 1)).toBeNull();
        expect(kickSquash(0.5, 1, true)).toBeNull();
    });

    it('dominada: a bola solta que vira de alguém, com a bola rolando; amassa de leve', () => {
        const s = track(still(6, 5), [{}, {}, { owner: 0 }, { owner: 0 }, {}, { owner: 0, phase: 'kickoff' }]);
        expect(traps(s)).toEqual([{ by: 0, tick: 4 }]);
        let peak = 0;
        for (let t = -1; t <= 4; t += 0.25) {
            const p = trapPose(t);
            if (p) peak = Math.max(peak, 1 - p.sy);
        }
        expect(peak).toBeGreaterThan(0.04);
        expect(peak).toBeLessThanOrEqual(0.071);
        expect(trapPose(1, true)).toBeNull();
    });

    it('choque: os dois amassam no contato e inclinam pra longe um do outro', () => {
        const right = bumpPose(1, 5);
        const left = bumpPose(1, -5);
        expect(right?.sy).toBeLessThan(0.9);
        expect(right?.tilt).toBeGreaterThan(0);
        expect(left?.tilt).toBeLessThan(0);
        expect(bumpPose(6, 5)).toBeNull();
        expect(bumpPose(1, 5, true)).toBeNull();
    });

    it('bola: achata no impacto, volta esticando e assenta redonda', () => {
        expect(ballSquashAt(-1)).toBe(0);
        expect(ballSquashAt(50)).toBeCloseTo(-1);
        expect(ballSquashAt(120)).toBeCloseTo(0.6);
        expect(ballSquashAt(259)).toBeCloseTo(0, 3);
        expect(ballSquashAt(260)).toBe(0);
        // sem salto entre as fases
        for (let ms = 1; ms < 260; ms++) expect(Math.abs(ballSquashAt(ms) - ballSquashAt(ms - 1))).toBeLessThan(0.05);
    });

    it('trave: balança, amortece e para no fim', () => {
        expect(postShakeAt(0)).toBe(0);
        expect(postShakeAt(POST_SHAKE.ms)).toBe(0);
        let max = 0;
        for (let ms = 0; ms < POST_SHAKE.ms; ms += 5) max = Math.max(max, Math.abs(postShakeAt(ms)));
        expect(max).toBeGreaterThan(POST_SHAKE.px * 0.5);
        expect(max).toBeLessThanOrEqual(POST_SHAKE.px);
        // o 2º balanço é menor que o 1º
        const half = 1000 / POST_SHAKE.hz / 2;
        expect(Math.abs(postShakeAt(half * 1.5))).toBeLessThan(Math.abs(postShakeAt(half * 0.5)));
    });

    it('latestAt: o último até o tick', () => {
        const l = [{ tick: 2 }, { tick: 5 }, { tick: 9 }];
        expect(latestAt(l, 1)).toBeUndefined();
        expect(latestAt(l, 5)?.tick).toBe(5);
        expect(latestAt(l, 8)?.tick).toBe(5);
        expect(latestAt(l, 99)?.tick).toBe(9);
    });
});
