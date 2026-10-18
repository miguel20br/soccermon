import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import type { TeamSetup } from '../engine/state';
import { halftimeEnd, whoAt } from './match-view';

const team = (seed: string, name: string): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 0),
    tactic: 'balanced',
    color: 0,
});

describe('saída do intervalo', () => {
    it('o 2º tempo começa já armado, com a troca do vestiário em quadra', () => {
        const home = { ...team('sub-a', 'A'), manualSubs: true };
        const away = team('sub-b', 'B');
        const base = runMatch(FUTSAL_5, home, away, 5, { snapshots: false });
        const ht = base.events.find((e) => e.type === 'halftime')?.tick ?? 0;
        const [out, inn] = [home.lineup[2], home.bench[0]];
        const r = runMatch(FUTSAL_5, home, away, 5, {
            orders: [{ tick: ht + 1, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const end = halftimeEnd(r.snapshots, ht);
        expect(end).toBeGreaterThan(ht);
        expect(r.snapshots.find((s) => s.tick === end)?.phase).not.toBe('halftime');
        // a prancheta recalcula de 10 em 10 ticks: no começo do 2º tempo ela já mostra quem entrou
        const idx = r.roster.findIndex((p) => p.uid === out.uid);
        expect(whoAt(r, [home, away], idx, Math.floor(end / 10) * 10).inst?.uid).toBe(inn.uid);
    });
});
