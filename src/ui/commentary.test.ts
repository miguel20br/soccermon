import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from '../engine/config';
import { aiDraftTeam } from '../engine/draft';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import type { TeamSetup } from '../engine/state';
import { Commentator } from './commentary';

const team = (seed: string, name: string): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 1),
    tactic: 'balanced',
    color: 0,
    manualSubs: true,
});

describe('narração do rival que reage', () => {
    it('o aviso sai com o nome do líder e o grito dele não é narrado duas vezes', () => {
        const r = runMatch(FUTSAL_5, team('cm-a', 'A'), { ...team('cm-b', 'B'), coach: 'ltsurge' }, 'cm-1', {
            snapshots: false,
        });
        const c = new Commentator(r, ['Casa', 'Fora']);
        const lines = r.events.map((e) => ({ e, line: c.lineFor(e) }));
        const calls = lines.filter((l) => l.e.type === 'coach');
        expect(calls.length).toBeGreaterThan(0);
        for (const { line } of calls) expect(line?.text).toContain('Lt. Surge');
        // o grito do rival já foi avisado pelo técnico: a linha genérica some (o Surge grita logo no começo)
        expect(r.events.some((e) => e.type === 'shout' && e.team === 1)).toBe(true);
        for (const { e, line } of lines) if (e.type === 'shout' && e.team === 1) expect(line).toBeNull();
    });
});
