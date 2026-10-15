import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { decode, encode } from './domain-move';

describe('mudança de endereço', () => {
    it('empacota e desempacota o save sem perder nada (com acento e números)', async () => {
        const save = {
            records: { cups: 3, titles: 1 },
            profile: { clubName: 'Água Viva FC' },
            dex: { 25: { matches: 2 } },
        };
        const packed = await encode(save);
        expect(packed).toMatch(/^[zj][A-Za-z0-9_-]+$/);
        expect(await decode(packed)).toEqual(save);
    });
});
