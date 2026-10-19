import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Peer, type Shared, versionsOk } from './duel-state';
import { applyPatch } from './patch';

// a sessão roda no navegador: aqui sem Phaser nem Supabase, com o BroadcastChannel do Node no lugar da outra aba
vi.mock('../game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } }));
vi.mock('../cloud/cloud', () => ({ realtimeClient: () => null }));
vi.stubGlobal('window', globalThis);
// a sala guardada (quem recarrega a página volta com ela)
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => mem.set(k, v),
    removeItem: (k: string) => mem.delete(k),
});

const { clockEvery, duel, useDuel } = await import('./session');

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

const lobbyOf = (room: string, rev: number): Shared => ({
    rev,
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
});

describe('sessão: só o que mudou (patch)', () => {
    it('host: quem entra recebe o estado inteiro e depois só as diferenças, que refazem o mesmo estado', async () => {
        const room = await duel.create(peer('ana'), 'disputa', 4, true);
        const bia = tab(room, 'bia');
        bia.send({ t: 'hello', peer: peer('bia'), rev: 0 });
        await wait(150);
        await duel.setReady(true);
        await wait(150);
        const states = bia.got.filter((m) => m.t === 'state' || m.t === 'patch');
        expect(states[0].t).toBe('state');
        expect(states.filter((m) => m.t === 'patch').length).toBeGreaterThanOrEqual(2);
        let mine = JSON.parse(JSON.stringify(states[0].shared)) as Shared;
        for (const m of states.slice(1)) {
            if (m.t === 'state') mine = m.shared as Shared;
            else {
                expect(m.base).toBe(mine.rev);
                mine = applyPatch(mine, m.d)!;
            }
        }
        expect(mine).toEqual(JSON.parse(JSON.stringify(shared())));
        expect(shared().ready.host).toBe(true);
        bia.close();
    });

    it('convidado: patch em cima do estado do host aplica; perdeu um, pede o inteiro (need) e se cura', async () => {
        const room = 'KQPTCH';
        const ana = tab(room, 'ana');
        duel.join(room, peer('bia'), true);
        ana.send({ t: 'state', shared: lobbyOf(room, 5), o: 'ana' });
        await wait(150);
        expect(shared().rev).toBe(5);
        ana.send({
            t: 'patch',
            base: 5,
            bo: 'ana',
            rev: 6,
            d: [
                [['rev'], 6],
                [['ready', 'host'], true],
            ],
        });
        await wait(150);
        expect(shared().rev).toBe(6);
        expect(shared().ready.host).toBe(true);
        // o rev 7 se perdeu: o 8 não encaixa, pede o estado inteiro
        ana.got.length = 0;
        ana.send({ t: 'patch', base: 7, bo: 'ana', rev: 8, d: [[['rev'], 8]] });
        await wait(150);
        expect(shared().rev).toBe(6);
        expect(ana.got.some((m) => m.t === 'need' && m.to === 'ana')).toBe(true);
        ana.send({
            t: 'state',
            shared: { ...lobbyOf(room, 8), ready: { host: true, guest: false }, seed: 'y' },
            o: 'ana',
        });
        await wait(150);
        expect(shared().rev).toBe(8);
        expect(shared().seed).toBe('y');
        // e volta a aceitar só as diferenças
        ana.send({
            t: 'patch',
            base: 8,
            bo: 'ana',
            rev: 9,
            d: [
                [['rev'], 9],
                [['seed'], 'z'],
            ],
        });
        await wait(150);
        expect(shared().seed).toBe('z');
        ana.close();
    });

    it('convidado que recarrega a página: o estado guardado não serve de base, pede o inteiro', async () => {
        const room = 'KQRLOA';
        const ana = tab(room, 'ana');
        duel.join(room, peer('bia'), true);
        ana.send({ t: 'state', shared: lobbyOf(room, 5), o: 'ana' });
        await wait(150);
        duel.leave();
        duel.join(room, peer('bia'), true);
        expect(shared().rev).toBe(5);
        ana.got.length = 0;
        ana.send({ t: 'patch', base: 5, bo: 'ana', rev: 6, d: [[['rev'], 6]] });
        await wait(150);
        expect(ana.got.some((m) => m.t === 'need')).toBe(true);
        ana.send({ t: 'state', shared: lobbyOf(room, 6), o: 'ana' });
        await wait(150);
        expect(shared().rev).toBe(6);
        ana.close();
    });

    it('anti-trapaça igual por patch: o do convidado (placar inventado) e o de um terceiro não valem no host', async () => {
        const room = await duel.create(peer('ana'), 'disputa', 4, true);
        const bia = tab(room, 'bia');
        const eve = tab(room, 'eve');
        bia.send({ t: 'hello', peer: peer('bia'), rev: 0 });
        await wait(150);
        const rev = shared().rev;
        const forged = [
            [['rev'], rev + 50],
            [['phase'], 'done'],
            [['result'], { score: [0, 10], shootout: null, winner: 'guest' }],
        ];
        bia.send({ t: 'patch', base: rev, bo: 'ana', rev: rev + 50, d: forged });
        eve.send({ t: 'patch', base: rev, bo: 'ana', rev: rev + 50, d: forged });
        await wait(150);
        expect(shared().rev).toBe(rev);
        expect(shared().phase).toBe('lobby');
        expect(shared().result).toBeUndefined();
        bia.close();
        eve.close();
    });
});

describe('sessão: jogo de versão antiga na sala', () => {
    it('convidado antigo (só entende o estado inteiro e repete o hello): vê a sala com o aviso, sem vaivém', async () => {
        const room = await duel.create(peer('ana'), 'disputa', 4, true);
        const old = tab(room, 'bia');
        const oldPeer = { ...peer('bia'), app: '0.8.4' };
        old.send({ t: 'hello', peer: oldPeer, rev: 0 });
        await wait(150);
        const rev = shared().rev;
        // o jogo antigo ignora o patch e, vendo rev maior no relógio, manda hello de novo
        for (let k = 0; k < 3; k++) {
            old.send({ t: 'hello', peer: oldPeer, rev });
            await wait(100);
        }
        expect(shared().rev).toBe(rev);
        const full = old.got.filter((m) => m.t === 'state').at(-1)?.shared as Shared;
        expect(full.rev).toBe(rev);
        expect(full.peers.guest?.app).toBe('0.8.4');
        expect(versionsOk(full)).toBe(false);
        // pronto dos dois não começa a partida com versões diferentes
        await duel.setReady(true);
        old.send({ t: 'intent', intent: { k: 'ready', ready: true, commit: 'a'.repeat(64), specialLimit: 3 } });
        await wait(150);
        expect(shared().phase).toBe('lobby');
        old.close();
    });
});

describe('sessão: batida do relógio', () => {
    it('a cada 2,5 s na partida e 5 s fora dela (lobby, draft, escalação, resultado)', () => {
        expect(clockEvery('match')).toBe(2500);
        for (const p of ['lobby', 'team', 'draft', 'preview', 'done'] as const) expect(clockEvery(p)).toBe(5000);
    });
});

describe('sessão: pronto da escolha que dá pra desfazer', () => {
    const teamPhase = (room: string, rev: number, seal: Record<'host' | 'guest', string | null>): Shared => ({
        ...lobbyOf(room, rev),
        mode: 'ready',
        phase: 'team',
        choice: { seal, opened: { host: false, guest: false } },
    });
    const intents = (got: Record<string, unknown>[], k: string) =>
        got.flatMap((m) => {
            const i = m.t === 'intent' ? (m.intent as Record<string, unknown>) : null;
            return i?.k === k ? [i] : [];
        });

    it('desfazer leva o lacre da sala, repete depois de recarregar e, se o rival lacrou antes, abre o de antes', async () => {
        const room = 'KQUNDO';
        const ana = tab(room, 'ana');
        duel.join(room, peer('bia'), true);
        ana.send({ t: 'state', shared: teamPhase(room, 5, { host: null, guest: null }), o: 'ana' });
        await wait(150);
        const recipe = { time: 'de antes' };
        await duel.sealChoice(recipe);
        await wait(100);
        const seal = intents(ana.got, 'choiceSeal')[0]?.seal as string;
        expect(seal).toMatch(/^[0-9a-f]{64}$/);
        ana.send({ t: 'state', shared: teamPhase(room, 6, { host: null, guest: seal }), o: 'ana' });
        await wait(150);
        expect(useDuel.getState().choiceSealed).toBe(true);
        // a tela destrava na hora e o desfazer vai com o lacre que está na sala
        duel.unsealChoice();
        expect(useDuel.getState().choiceSealed).toBe(false);
        await wait(100);
        expect(intents(ana.got, 'choiceUnseal')).toEqual([{ k: 'choiceUnseal', seal }]);
        // recarrega no meio (o desfazer ainda não entrou na sala): volta e manda de novo sozinho
        duel.leave();
        duel.join(room, peer('bia'), true);
        ana.got.length = 0;
        ana.send({ t: 'state', shared: teamPhase(room, 7, { host: null, guest: seal }), o: 'ana' });
        await wait(1200);
        expect(useDuel.getState().choiceSealed).toBe(false);
        expect(intents(ana.got, 'choiceUnseal').at(-1)).toEqual({ k: 'choiceUnseal', seal });
        // corrida: o pronto do rival entrou antes do desfazer; os dois lacrados, abre o valor do lacre de antes
        ana.got.length = 0;
        ana.send({ t: 'state', shared: teamPhase(room, 8, { host: 'a'.repeat(64), guest: seal }), o: 'ana' });
        await wait(1200);
        expect(intents(ana.got, 'choiceOpen')[0]?.value).toEqual(recipe);
        ana.close();
    });
});
