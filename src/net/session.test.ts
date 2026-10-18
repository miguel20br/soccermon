import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Peer, Shared } from './duel-state';

// a sessão roda no navegador: aqui sem Phaser nem Supabase, com o BroadcastChannel do Node no lugar da outra aba
vi.mock('../game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } }));
vi.mock('../cloud/cloud', () => ({ realtimeClient: () => null }));
vi.stubGlobal('window', globalThis);

const { duel, useDuel } = await import('./session');

const peer = (id: string): Peer => ({
    id,
    name: id,
    avatar: '',
    avatarGoogle: false,
    trainer: 'red',
    title: 'pallet',
    clubName: `${id} FC`,
    clubTag: 'PAL',
    clubColor: 0xff0000,
    engine: 1,
    app: '0.8.5',
});

/** Outra aba da sala: manda mensagens com o id que quiser. */
function tab(room: string, from: string) {
    const bc = new BroadcastChannel(`soccermon-duel-${room}`);
    let n = 0;
    const got: Record<string, unknown>[] = [];
    bc.onmessage = (e) => got.push(e.data);
    return {
        got,
        send: (m: Record<string, unknown>) => bc.postMessage({ ...m, from, n: ++n, b: `boot-${from}` }),
        close: () => bc.close(),
    };
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shared = () => useDuel.getState().shared as Shared;

afterEach(() => duel.leave(true));

describe('sessão: só quem aplica as regras manda o estado', () => {
    it('host: estado do convidado (rev+50, 0 x 10) e de um terceiro na sala não valem', async () => {
        const room = await duel.create(peer('ana'), 'disputa', 4, true);
        const bia = tab(room, 'bia');
        const eve = tab(room, 'eve');
        bia.send({ t: 'hello', peer: peer('bia'), rev: 0 });
        await wait(150);
        expect(shared().peers.guest?.id).toBe('bia');
        const rev = shared().rev;
        const forged = {
            ...shared(),
            rev: rev + 50,
            phase: 'done',
            result: { score: [0, 10], shootout: null, winner: 'guest' },
        };
        bia.send({ t: 'state', shared: forged });
        eve.send({ t: 'state', shared: { ...forged, rev: rev + 60 } });
        await wait(150);
        expect(shared().rev).toBe(rev);
        expect(shared().phase).toBe('lobby');
        expect(shared().result).toBeUndefined();
        bia.close();
        eve.close();
    });

    it('convidado: fica com o estado do host e recusa o de um terceiro', async () => {
        const room = 'KQWERT';
        const ana = tab(room, 'ana');
        const eve = tab(room, 'eve');
        duel.join(room, peer('bia'), true);
        const base: Shared = {
            rev: 5,
            room,
            game: 1,
            mode: 'disputa',
            speed: 4,
            specialLimit: 3,
            seed: 'x',
            phase: 'lobby',
            peers: { host: peer('ana'), guest: peer('bia') },
            ready: { host: false, guest: false },
            commits: {},
            roundReveals: { host: [], guest: [] },
            reveals: { host: [], guest: [] },
            teams: {},
            log: [],
            secondHalf: false,
            segHash: { host: {}, guest: {} },
            rematch: { host: false, guest: false },
        };
        eve.send({ t: 'state', shared: base });
        await wait(150);
        expect(useDuel.getState().shared).toBeNull();
        ana.send({ t: 'state', shared: base });
        await wait(150);
        expect(shared().rev).toBe(5);
        expect(useDuel.getState().role).toBe('guest');
        eve.send({ t: 'state', shared: { ...base, rev: 40, phase: 'done' } });
        await wait(150);
        expect(shared().rev).toBe(5);
        ana.send({ t: 'state', shared: { ...base, rev: 6 } });
        await wait(150);
        expect(shared().rev).toBe(6);
        ana.close();
        eve.close();
    });
});
