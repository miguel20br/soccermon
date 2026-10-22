import { describe, expect, it } from 'vitest';
import { FORMATIONS, type FormationId, hasEdge } from './formations';

const ids = Object.keys(FORMATIONS) as FormationId[];

describe('vantagem tática das formações', () => {
    it('é um ciclo: cada uma (menos o Losango) ganha de uma e perde de uma, nunca de mão dupla', () => {
        for (const f of ids) {
            const beats = ids.filter((o) => hasEdge(f, o));
            const beatenBy = ids.filter((o) => hasEdge(o, f));
            expect(beats.length).toBe(f === '1-2-1' ? 0 : 1);
            expect(beatenBy.length).toBe(f === '1-2-1' ? 0 : 1);
            for (const o of beats) expect(hasEdge(o, f)).toBe(false);
        }
    });
});
