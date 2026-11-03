import { describe, expect, it } from 'vitest';
import { statusesOf } from './club-status';

const u = {
    team: { order: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
    evos: [{ uid: 'a' }, { uid: 'z' }],
    locked: ['g', 'y'],
} as never;

describe('statusesOf', () => {
    it('titular, banco, evolução, trava e livre', () => {
        expect(statusesOf(u, 'a')).toEqual(['starter', 'evo']);
        expect(statusesOf(u, 'f')).toEqual(['bench']);
        expect(statusesOf(u, 'g')).toEqual(['bench', 'locked']);
        expect(statusesOf(u, 'y')).toEqual(['locked']);
        expect(statusesOf(u, 'z')).toEqual(['evo']);
        expect(statusesOf(u, 'q')).toEqual(['free']);
    });
});
