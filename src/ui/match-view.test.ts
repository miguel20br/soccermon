import { describe, expect, it } from 'vitest';
import { maxCallCue, maxCharge } from '../engine/agency';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import type { MatchEvent, TeamSetup } from '../engine/state';
import { maxCueAt } from './components/Sideline';
import {
    captainAt,
    halftimeEnd,
    MAX_CUE_EARLY,
    MAX_CUE_LATCH,
    type MaxWait,
    maxCallCueNear,
    maxWaitNext,
    whoAt,
} from './match-view';

const team = (seed: string, name: string): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 0),
    tactic: 'balanced',
    color: 0,
});

describe('saída do intervalo', () => {
    // a prancheta recalcula de 10 em 10 ticks: no começo do 2º tempo ela já mostra quem entrou (antes da 0.8.6 a
    // reprodução passava ~2 s do intervalo parado com quem saiu na prancheta). O tick do intervalo varia por partida.
    it.each([5, 2, 7])('o 2º tempo começa já armado, com a troca do vestiário em quadra (seed %i)', (seed) => {
        const home = { ...team(`sub-a${seed}`, 'A'), manualSubs: true };
        const away = team(`sub-b${seed}`, 'B');
        const base = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
        const ht = base.events.find((e) => e.type === 'halftime')?.tick ?? 0;
        const [out, inn] = [home.lineup[2], home.bench[0]];
        const r = runMatch(FUTSAL_5, home, away, seed, {
            orders: [{ tick: ht + 1, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const end = halftimeEnd(r.snapshots, ht);
        expect(end).toBeGreaterThan(ht);
        expect(r.snapshots.find((s) => s.tick === end)?.phase).not.toBe('halftime');
        const idx = r.roster.findIndex((p) => p.uid === out.uid);
        expect(whoAt(r, [home, away], idx, Math.floor(end / 10) * 10).inst?.uid).toBe(inn.uid);
    });
});

describe('capitão na partida (cara dos emotes e pose do "Vamooo!")', () => {
    const home = { ...team('cap-a', 'A'), manualSubs: true };
    const away = team('cap-b', 'B');
    const cap = home.lineup.find((p) => p.uid === home.captainUid) ?? home.lineup[0];
    const capIdx = home.lineup.indexOf(cap);
    const fake = (events: unknown[]) =>
        ({
            roster: [
                ...home.lineup.map((p, i) => ({ idx: i, team: 0, uid: p.uid })),
                ...away.lineup.map((p, i) => ({ idx: 5 + i, team: 1, uid: p.uid })),
            ],
            events,
        }) as unknown as Parameters<typeof captainAt>[0];

    it('o capitão que evolui no meio da partida passa a ter a cara da forma nova', () => {
        const m = fake([{ type: 'evolve', tick: 100, team: 0, uid: cap.uid, from: cap.speciesId, into: 999 }]);
        expect(captainAt(m, [home, away], 0, 99).speciesId).toBe(cap.speciesId);
        expect(captainAt(m, [home, away], 0, 100).speciesId).toBe(999);
    });

    it('a pose só vale com ele em quadra: saiu numa troca, sem vaga', () => {
        const m = fake([{ type: 'sub', tick: 50, team: 0, outUid: cap.uid, inUid: home.bench[0].uid, outIdx: capIdx }]);
        expect(captainAt(m, [home, away], 0, 49).idx).toBe(capIdx);
        expect(captainAt(m, [home, away], 0, 50).idx).toBeNull();
    });
});

describe('"Esperar" no golpe máximo (maxWaitNext)', () => {
    /** Passa a barra e a hora certa quadro a quadro; devolve se o aviso estava apagado em cada um. */
    const run = (from: number, frames: [level: number, cue: boolean][]) => {
        let w: MaxWait | null = { level: from };
        return frames.map(([level, cue]) => {
            w = maxWaitNext(w, level, cue);
            return w !== null;
        });
    };

    it('N1 e N2: apaga até a barra subir de nível, mesmo passando por outras horas certas', () => {
        for (const lv of [1, 2])
            expect(
                run(lv, [
                    [lv, true],
                    [lv, false],
                    [lv, true],
                    [lv + 1, true],
                    [lv + 1, true],
                ]),
            ).toEqual([true, true, true, false, false]);
    });

    it('N3: pula só esta hora certa; a próxima janela acende de novo', () => {
        expect(
            run(3, [
                [3, true],
                [3, true],
                [3, false],
                [3, true],
            ]),
        ).toEqual([true, true, false, false]);
    });

    it('golpe usado (a barra zera): o "Esperar" acaba', () => {
        expect(maxWaitNext({ level: 2 }, 0, false)).toBeNull();
        expect(maxWaitNext(null, 1, true)).toBeNull();
    });
});

describe('botão do golpe máximo (chamar o capitão e a hora certa)', () => {
    const home = team('cue-a', 'A');
    const away = team('cue-b', 'B');
    const { pitch } = FUTSAL_5;

    it('o passe no ar não apaga o "chamar": vale o último dono da bola (o botão piscava a cada passe)', () => {
        const r = runMatch(FUTSAL_5, { ...home, captainUid: home.lineup[1].uid }, away, 'cue-call');
        let checked = 0;
        for (let i = 1; i < r.snapshots.length && checked < 5; i++) {
            const [prev, s] = [r.snapshots[i - 1], r.snapshots[i]];
            if (s.phase !== 'play' || s.owner >= 0 || !maxCallCue(prev, 0, 'FIXO', pitch)) continue;
            expect(maxCallCue(s, 0, 'FIXO', pitch)).toBe(false);
            expect(maxCallCueNear(r.snapshots, s.tick, 0, 'FIXO')).toBe(true);
            checked++;
        }
        expect(checked).toBe(5);
        // bola do rival: apaga na hora
        const rival = r.snapshots.find((s) => s.phase === 'play' && s.owner >= 5);
        expect(rival && maxCallCueNear(r.snapshots, rival.tick, 0, 'FIXO')).toBe(false);
    });

    it('goleiro capitão: a bicuda acende do N1 só no chute que ele alcança; o de linha diz se é "chamando" ou a hora certa', () => {
        const gk = { ...home, captainUid: home.lineup[0].uid };
        const r = runMatch(FUTSAL_5, gk, away, 'cue-gk');
        const setups: [TeamSetup, TeamSetup] = [gk, away];
        const ready = r.snapshots.filter((s) => maxCharge(r.events, 0, s.tick, 5).level >= 1);
        const reach = r.events.filter(
            (e): e is Extract<MatchEvent, { type: 'gkReach' }> => e.type === 'gkReach' && e.by === 0,
        );
        const lit = reach.filter((e) => maxCharge(r.events, 0, e.from, 5).level >= 1);
        expect(lit.length).toBeGreaterThan(0);
        for (const e of lit) expect(maxCueAt(r, setups, 0, e.from)).toBe('hora');
        // aceso só em volta de um chute que ele alcança (a tela acende um pouco antes e apaga um pouco depois)
        const near = (t: number) => reach.some((e) => t >= e.from - MAX_CUE_EARLY && t < e.tick + MAX_CUE_LATCH);
        for (const s of ready) if (maxCueAt(r, setups, 0, s.tick) === 'hora') expect(near(s.tick)).toBe(true);
        // e o chute bloqueado não acende
        const blocked = r.events.filter((e) => e.type === 'block' && e.shooter >= 5 && !near(e.tick));
        expect(blocked.length).toBeGreaterThan(0);
        for (const e of blocked) expect(maxCueAt(r, setups, 0, e.tick)).toBe(false);
        // o goleiro não "chama": fora do chute vindo, apagado
        expect(new Set(ready.map((s) => maxCueAt(r, setups, 0, s.tick)))).toEqual(new Set([false, 'hora']));

        const line = { ...home, captainUid: home.lineup[3].uid };
        const r2 = runMatch(FUTSAL_5, line, away, 'cue-line');
        const kinds = new Set(r2.snapshots.map((s) => maxCueAt(r2, [line, away], 0, s.tick)));
        expect(kinds).toEqual(new Set([false, 'call', 'hora']));
    });
});
