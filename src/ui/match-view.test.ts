import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import type { TeamSetup } from '../engine/state';
import { captainAt, halftimeEnd, type MaxWait, maxWaitNext, whoAt } from './match-view';

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
