import { describe, expect, it } from 'vitest';
import { FUTSAL_5, STOPPAGE, withConfig } from './config';
import { matchHash } from './determinism';
import { aiDraftTeam } from './draft';
import { eff, FINAL_PRESSURE, finalPressureTeam } from './effective';
import { createMatch, minuteOf } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import type { MatchEvent, TeamSetup } from './state';

function team(seed: string, name: string): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 0), tactic: 'balanced', color: 0 };
}

const home = team('fp-a', 'A');
const away = team('fp-b', 'B');
/** Ticks de jogo por minuto do relógio (futsal: 9 s de simulação = 180 ticks). */
const TICKS_PER_MIN = (FUTSAL_5.halfSeconds / FUTSAL_5.displayHalfMinutes) * FUTSAL_5.tickRate;

describe('acréscimos', () => {
    it('mesma seed dá a mesma partida, com 1 a 3 minutos de acréscimo em cada tempo', () => {
        for (const seed of [1, 2, 3, 'acr']) {
            const a = runMatch(FUTSAL_5, home, away, seed);
            expect(matchHash(runMatch(FUTSAL_5, home, away, seed))).toBe(matchHash(a));
            const stops = a.events.filter((e) => e.type === 'stoppage');
            expect(stops.map((e) => e.half)).toEqual([1, 2]);
            const end = [a.events.find((e) => e.type === 'halftime')!, a.events.find((e) => e.type === 'fulltime')!];
            stops.forEach((e, h) => {
                if (e.type !== 'stoppage') return;
                expect(e.minutes).toBeGreaterThanOrEqual(STOPPAGE.min);
                expect(e.minutes).toBeLessThanOrEqual(STOPPAGE.max);
                // o relógio para no 20'/40'; o jogo corre os minutos de acréscimo (mais as bolas paradas)
                expect(e.minute).toBe(20 * (h + 1));
                expect(end[h].minute).toBe(20 * (h + 1));
                expect(end[h].tick - e.tick).toBeGreaterThanOrEqual(e.minutes * TICKS_PER_MIN);
            });
            // o minuto nunca passa de 40 nem volta pra trás (estatísticas, trechos do duelo e barra de pressão)
            let prev = 0;
            for (const sn of a.snapshots) {
                expect(sn.minute).toBeGreaterThanOrEqual(prev);
                expect(sn.minute).toBeLessThanOrEqual(40);
                prev = sn.minute;
            }
        }
    });

    it('sem acréscimos na configuração o tempo acaba no apito de sempre', () => {
        const cfg = withConfig({ stoppage: undefined });
        const r = runMatch(cfg, home, away, 7);
        expect(r.events.some((e) => e.type === 'stoppage')).toBe(false);
        const ht = r.events.find((e) => e.type === 'halftime')!;
        const ko2 = r.events.find((e) => e.type === 'kickoff' && e.half === 2)!;
        expect(ht.minute).toBe(20);
        expect(ko2.tick).toBeGreaterThan(ht.tick);
        expect(r.events.at(-1)?.type).toBe('end');
        // com acréscimos a partida é mais longa
        expect(runMatch(FUTSAL_5, home, away, 7).ticks).toBeGreaterThan(r.ticks);
    });
});

describe('Pressão final', () => {
    it('só quem perde, só no 2º tempo e só nos últimos 3 minutos (com os acréscimos)', () => {
        const s = createMatch(FUTSAL_5, home, away, 'fp');
        const windowStart = FUTSAL_5.halfSeconds * (1 - FINAL_PRESSURE.lastMinutes / FUTSAL_5.displayHalfMinutes);
        s.score = [1, 2];
        s.half = 1;
        s.time = FUTSAL_5.halfSeconds - 1;
        expect(finalPressureTeam(s)).toBe(null);
        s.half = 2;
        s.time = windowStart - 0.5;
        expect(finalPressureTeam(s)).toBe(null);
        s.time = windowStart + 0.5;
        expect(minuteOf(s)).toBeGreaterThan(37);
        expect(finalPressureTeam(s)).toBe(0);
        s.time = FUTSAL_5.halfSeconds + 10; // acréscimos
        expect(minuteOf(s)).toBe(40);
        expect(finalPressureTeam(s)).toBe(0);
        s.score = [3, 2];
        expect(finalPressureTeam(s)).toBe(1);
        s.score = [2, 2];
        expect(finalPressureTeam(s)).toBe(null);
    });

    it('o bônus vale só pro time na pressão', () => {
        const s = createMatch(FUTSAL_5, home, away, 'fp');
        const p0 = s.players.find((p) => p.team === 0 && p.role !== 'GK')!;
        const p1 = s.players.find((p) => p.team === 1 && p.role !== 'GK')!;
        const before = [eff(s, p0, 'shooting'), eff(s, p1, 'shooting'), eff(s, p0, 'tackling')];
        s.pressure = 0;
        expect(eff(s, p0, 'shooting')).toBeCloseTo(before[0] * (FINAL_PRESSURE.attrs.shooting ?? 1), 10);
        expect(eff(s, p0, 'shooting')).toBeGreaterThan(before[0]);
        expect(eff(s, p1, 'shooting')).toBe(before[1]);
        expect(eff(s, p0, 'tackling')).toBe(before[2]);
    });

    it('na partida, o aviso sai pra quem perde a partir do minuto 37 e some no empate', () => {
        let seen = 0;
        for (const seed of [1, 2, 3, 4, 5, 6]) {
            const r = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
            let score: [number, number] = [0, 0];
            let on: 0 | 1 | null = null;
            for (const e of r.events as MatchEvent[]) {
                if (e.type === 'goal') score = e.score;
                if (e.type !== 'pressure') continue;
                expect(e.half).toBe(2);
                expect(e.minute).toBeGreaterThanOrEqual(40 - FINAL_PRESSURE.lastMinutes);
                expect(e.team).not.toBe(on);
                if (e.team === null) expect(score[0]).toBe(score[1]);
                else expect(score[e.team]).toBeLessThan(score[1 - e.team]);
                on = e.team;
                seen++;
            }
        }
        expect(seen).toBeGreaterThan(0);
    });
});
