import { describe, expect, it } from 'vitest';
import { pickedReward } from './track';

const mon = (uid: string, moves: string[], item: string | null = null) => ({ uid, speciesId: uid, moves, item });

describe('pickedReward', () => {
    const rewards = [
        { kind: 'pokemon', inst: mon('pidgey', ['tackle']), from: null },
        { kind: 'tm', move: 'bubblebeam', leader: null },
        { kind: 'item', item: 'leftovers' },
    ];
    // biome-ignore lint/suspicious/noExplicitAny: só os campos que a função lê
    const run = (picks: unknown[]) => ({ picks, rewards }) as any;
    const before = run([mon('a', ['tackle', 'growl']), mon('b', ['ember'])]);

    it('acha Pokémon, MT e item; pular dá null', () => {
        expect(pickedReward(before, run([...before.picks, mon('pidgey', ['tackle'])]))?.kind).toBe('pokemon');
        expect(pickedReward(before, run([mon('a', ['bubblebeam', 'growl']), before.picks[1]]))?.kind).toBe('tm');
        expect(pickedReward(before, run([before.picks[0], mon('b', ['ember'], 'leftovers')]))?.kind).toBe('item');
        expect(pickedReward(before, before)).toBeNull();
    });
});
