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
    it('o aviso sai com o nome do líder', () => {
        let n = 0;
        for (let k = 1; k <= 10 && !n; k++) {
            const r = runMatch(FUTSAL_5, team('cm-a', 'A'), { ...team('cm-b', 'B'), coach: 'ltsurge' }, `cm-${k}`, {
                snapshots: false,
            });
            const c = new Commentator(r, ['Casa', 'Fora']);
            const calls = r.events.filter((e) => e.type === 'coach').map((e) => c.lineFor(e));
            n = calls.length;
            for (const line of calls) expect(line?.text).toContain('Lt. Surge');
        }
        expect(n).toBeGreaterThan(0);
    });
});

describe('narração do golpe máximo', () => {
    it('só fala quando o golpe sai: o toque fora fica mudo', () => {
        const r = runMatch(FUTSAL_5, team('cm-a', 'A'), team('cm-b', 'B'), 'cm-max', { snapshots: false });
        const c = new Commentator(r, ['Casa', 'Fora']);
        const max = (phase: 'start' | 'hit' | 'miss') =>
            c.lineFor({
                type: 'max',
                tick: 10,
                minute: 1,
                half: 1,
                team: 0,
                by: 0,
                phase,
                moveId: null,
                level: 1,
                q: 2,
            });
        expect(max('start')).toBeNull();
        expect(max('miss')).toBeNull();
        expect(max('hit')?.text).toBeTruthy();
    });
});

describe('narração da bicuda', () => {
    it('a defesa do mesmo tick fica muda: a fala é a da bicuda', () => {
        const r = runMatch(FUTSAL_5, team('cm-a', 'A'), team('cm-b', 'B'), 'cm-bic', { snapshots: false });
        const gk = r.roster.findIndex((p) => p.role === 'GK');
        const at = { tick: 99999, minute: 40, half: 2 as const };
        const save = { type: 'save' as const, ...at, by: gk, shooter: 7, caught: false };
        const hit = {
            type: 'max' as const,
            ...at,
            team: r.roster[gk].team,
            by: gk,
            phase: 'hit' as const,
            moveId: null,
            level: 2 as const,
            q: 2 as const,
        };
        const c = new Commentator({ ...r, events: [...r.events, save, hit] }, ['Casa', 'Fora']);
        expect(c.lineFor(save)).toBeNull();
        expect(c.lineFor(hit)?.text).toContain('BICUDA');
        // sem bicuda no tick, a defesa fala como sempre
        expect(new Commentator(r, ['Casa', 'Fora']).lineFor(save)?.text).toBeTruthy();
    });
});
