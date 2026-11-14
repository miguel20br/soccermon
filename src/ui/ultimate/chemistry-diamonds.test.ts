import { describe, expect, it } from 'vitest';
import { diamondsOf } from './Chemistry';

describe('losangos de química (rascunho)', () => {
    it('0% = 0; até +3% = 1; até +6% = 2; acima = 3', () => {
        expect([1, 0.93, 1.03, 1.04, 1.06, 1.07, 1.2].map(diamondsOf)).toEqual([0, 0, 1, 2, 2, 3, 3]);
    });
});
