import { describe, expect, it } from 'vitest';
import { createInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../rarity';
import { DITTO, dittoDisguise } from './DittoMask';

describe('Ditto disfarçado no pacote', () => {
    it('vira outra espécie do mesmo metal, com a mesma edição, e a mesma carta dá sempre o mesmo disfarce', () => {
        for (let k = 0; k < 20; k++) {
            const ditto = {
                ...createInstance(DITTO, new Rng(`d${k}`)),
                special: k % 4 ? null : { kind: 'destaque' as const },
            };
            const mask = dittoDisguise(ditto);
            expect(mask.speciesId).not.toBe(DITTO);
            expect(mask.ability).not.toBe('imposter');
            expect(mask.special).toEqual(ditto.special);
            expect(metalOf(viewInstance(mask).overall)).toBe(metalOf(viewInstance(ditto).overall));
            expect(dittoDisguise(ditto).speciesId).toBe(mask.speciesId);
        }
    });
});
