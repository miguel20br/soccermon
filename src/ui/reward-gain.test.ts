import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import type { RunState } from '../store/game-store';
import { rewardGains } from './reward-gain';

const rng = new Rng('gain', 'test');
const picks = [74, 4, 25, 7, 95, 10, 92].map((id) => createInstance(id, rng));
const run = {
    formation: '1-2-1',
    picks,
    lineup: picks.slice(0, 5).map((p) => p.uid),
    bench: picks.slice(5).map((p) => p.uid),
    captainUid: picks[2].uid,
    sponsors: [],
} as unknown as RunState;

describe('rewardGains', () => {
    it('Eviolite: quem ainda evolui ganha nota (antes -> depois)', () => {
        const g = rewardGains(run, { kind: 'item', item: 'eviolite' });
        expect(g.length).toBeGreaterThan(0);
        for (const x of g) expect(x.after).toBeGreaterThan(x.before);
        expect(g.some((x) => x.uid === picks[0].uid)).toBe(true);
    });
    it('Leftovers não mexe em número: lista vazia', () => {
        expect(rewardGains(run, { kind: 'item', item: 'leftovers' })).toEqual([]);
    });
    it('Patrocínio de campo só lista quem sobe, e MT não lista nada', () => {
        for (const x of rewardGains(run, { kind: 'sponsor', id: 'academia' }))
            expect(x.after).toBeGreaterThan(x.before);
        expect(rewardGains(run, { kind: 'tm', move: 'tackle', leader: '' } as never)).toEqual([]);
    });
});
