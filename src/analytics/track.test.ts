import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COACH_EVENTS, EVENT_NAMES, pickedReward, sendable } from './track';

describe('nomes dos eventos', () => {
    it('a lista do cliente é a da última migração do game_events_name_check (fora dela, o lote inteiro dá 400)', () => {
        const dir = 'supabase/migrations';
        const last = readdirSync(dir)
            .filter((f) => readFileSync(`${dir}/${f}`, 'utf8').includes('add constraint game_events_name_check'))
            .sort()
            .at(-1)!;
        const sql = readFileSync(`${dir}/${last}`, 'utf8');
        const list = sql.slice(sql.indexOf('name in ('));
        const names = [...list.slice(0, list.indexOf(')')).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
        expect([...EVENT_NAMES].sort()).toEqual(names.sort());
    });

    it('nome desconhecido não entra; coach_* só com a migração no ar', () => {
        expect(sendable('screen')).toBe(true);
        expect(sendable('nao_existe')).toBe(false);
        expect(sendable('coach_shown')).toBe(COACH_EVENTS);
    });
});

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
