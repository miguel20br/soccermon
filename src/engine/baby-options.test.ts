import { describe, expect, it } from 'vitest';
import { babyOptions, ROUTE_START_BANNED, rootOf } from './draft';
import { createInstance } from './instance';
import { Rng } from './rng';

describe('babyOptions: base repetida não deixa opção evoluída', () => {
    it('base na mesma rodada ou no time: sorteia outra forma-base, sempre igual pra mesma seed', () => {
        for (let k = 0; k < 30; k++) {
            const mk = () => new Rng(`b${k}`, 'x');
            const opts = [86, 87, 6].map((id) => createInstance(id, mk())); // Seel, Dewgong, Charizard
            const taken = new Set([4]); // Charmander já no time
            const out = babyOptions(opts, mk(), taken);
            expect(out.map((o) => o.uid)).toEqual(opts.map((o) => o.uid));
            const ids = out.map((o) => o.speciesId);
            expect(new Set(ids).size).toBe(3);
            for (const id of ids) {
                expect(rootOf(id)).toBe(id);
                expect(taken.has(id)).toBe(false);
                expect(ROUTE_START_BANNED.has(id)).toBe(false);
            }
            expect(babyOptions(opts, mk(), taken).map((o) => o.speciesId)).toEqual(ids);
        }
    });
});
