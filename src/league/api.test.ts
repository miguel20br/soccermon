import { describe, expect, it } from 'vitest';
import { squadOf } from './api';

describe('squadOf (time no ranking)', () => {
    it('lê os 5 ids e o capitão', () => {
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: 2 })).toEqual({ ids: [1, 4, 7, 25, 150], captain: 2 });
    });
    it('sem capitão, -1', () => {
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: null })?.captain).toBe(-1);
        expect(squadOf({ squad: [1, 4, 7, 25, 150] })?.captain).toBe(-1);
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: 9 })?.captain).toBe(-1);
    });
    it('linha sem time (antiga, ou servidor sem a migração) não mostra ícones', () => {
        expect(squadOf({})).toBeNull();
        expect(squadOf({ squad: null, captain: null })).toBeNull();
        expect(squadOf({ squad: [1, 2, 3], captain: 0 })).toBeNull();
        expect(squadOf({ squad: [1, 2, 3, 4, 0], captain: 0 })).toBeNull();
    });
});
