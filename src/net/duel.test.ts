import { describe, expect, it } from 'vitest';
import { aiDraftTeam, DRAFT_PICKS } from '../engine/draft';
import { Rng } from '../engine/rng';
import type { TeamSetup } from '../engine/state';
import {
    autoLineup,
    type Ctx,
    clockAdjust,
    emoteAllowed,
    HALFTIME_MS,
    type Intent,
    isRoomCode,
    leadTicks,
    newShared,
    optionsFor,
    type Peer,
    type Role,
    reduce,
    roomCode,
    type Shared,
    tickTimers,
    WO_WAIT_MS,
} from './duel-state';
import {
    checkReveal,
    makeChain,
    matchSeedOf,
    openedSegments,
    playableUntil,
    randomSecret,
    SEG_TICKS,
    segmentOf,
    segmentSeeds,
} from './seal';
import { localTransport, type NetMsg } from './transport';

const peer = (id: string): Peer => ({
    id,
    name: id,
    avatar: '',
    avatarGoogle: false,
    trainer: 'red',
    title: 'pallet',
    clubName: `${id} FC`,
    clubTag: id.slice(0, 3).toUpperCase(),
    clubColor: 0xff0000,
    engine: 1,
    app: '0.8.5',
});
const ctx = (now = 0, extra: Partial<Ctx> = {}): Ctx => ({
    now,
    present: { host: true, guest: true },
    tick: 0,
    ...extra,
});
const team = (seed: string): TeamSetup => {
    const t = aiDraftTeam(new Rng(seed, 'team'), 1);
    return { name: seed, ...t, tactic: 'balanced', color: 0xff0000, formation: '1-2-1' };
};
const C = 'a'.repeat(64);

/** Sala com os dois prontos (modo à escolha). */
function lobby(mode: Shared['mode']): Shared {
    let s = newShared('ABCDEF', peer('ana'), mode, 4, 'seed-teste');
    s = reduce(s, { k: 'join', peer: peer('bia') }, 'guest', ctx());
    s = reduce(s, { k: 'ready', ready: true, commit: C }, 'host', ctx());
    return reduce(s, { k: 'ready', ready: true, commit: C }, 'guest', ctx());
}

function inMatch(): Shared {
    let s = lobby('ready');
    s = reduce(s, { k: 'team', team: team('a') }, 'host', ctx());
    return reduce(s, { k: 'team', team: team('b') }, 'guest', ctx());
}

describe('lacres (seed por trecho)', () => {
    it('a corrente abre trecho a trecho e recusa segredo errado', async () => {
        const chain = await makeChain(randomSecret(), 5);
        expect(await checkReveal(chain[0], 1, chain[1])).toBe(true);
        expect(await checkReveal(chain[0], 3, chain[3])).toBe(true);
        expect(await checkReveal(chain[0], 2, chain[3])).toBe(false);
        expect(await checkReveal(chain[0], 1, randomSecret())).toBe(false);
    });

    it('trechos de 2 min, trava no fim do último aberto pelos dois e seed igual pros dois lados', async () => {
        expect(SEG_TICKS).toBe(360);
        expect(segmentOf(0)).toBe(1);
        expect(segmentOf(359)).toBe(1);
        expect(segmentOf(360)).toBe(2);
        const h = ['', 'a1', 'a2', 'a3'];
        const g = ['', 'b1', 'b2'];
        expect(openedSegments(h, g)).toBe(2);
        expect(playableUntil(2)).toBe(720);
        const s1 = await segmentSeeds('SALA', h, g);
        const s2 = await segmentSeeds('SALA', h, g);
        expect(s1).toHaveLength(3);
        expect(s1).toEqual(s2);
        expect(s1[1]).not.toBe(s1[2]);
        expect(matchSeedOf(s1)).toBe(s1[1]);
    });
});

describe('sala', () => {
    it('código fácil de ditar', () => {
        const c = roomCode((n) => Math.floor(Math.random() * n));
        expect(isRoomCode(c)).toBe(true);
        expect(isRoomCode('ABC10O')).toBe(false);
    });

    it('versões diferentes: os dois prontos e não começa', () => {
        let s = newShared('ABCDEF', peer('ana'), 'ready', 4, 'x');
        s = reduce(s, { k: 'join', peer: { ...peer('bia'), engine: 2 } }, 'guest', ctx());
        s = reduce(s, { k: 'ready', ready: true, commit: C }, 'host', ctx());
        s = reduce(s, { k: 'ready', ready: true, commit: C }, 'guest', ctx());
        expect(s.phase).toBe('lobby');
    });

    it('pronto sem lacre não vale; terceiro com outro id não toma a vaga', () => {
        let s = newShared('ABCDEF', peer('ana'), 'ready', 4, 'x');
        s = reduce(s, { k: 'join', peer: peer('bia') }, 'guest', ctx());
        expect(reduce(s, { k: 'ready', ready: true }, 'guest', ctx())).toBe(s);
        expect(reduce(s, { k: 'join', peer: peer('caio') }, 'guest', ctx())).toBe(s);
    });

    it('os dois com time pronto: começa a partida com uids separados por lado', () => {
        const s = inMatch();
        expect(s.phase).toBe('match');
        expect(s.teams.host?.lineup[0].uid.endsWith('~h')).toBe(true);
        expect(s.teams.guest?.lineup[0].uid.endsWith('~g')).toBe(true);
    });
});

describe('log de ordens', () => {
    it('carimba à frente do mais adiantado, sempre depois da última, e limita a 3 táticas', () => {
        let s = inMatch();
        const order = (
            tactic: 'offensive' | 'defensive' | 'counter' | 'balanced',
            tick: number,
            _by: Role,
        ): Intent => ({
            k: 'order',
            order: { kind: 'tactic', tactic },
            tick,
        });
        s = reduce(s, order('offensive', 100, 'guest'), 'guest', ctx(0, { tick: 120 }));
        expect(s.log[0]).toMatchObject({ team: 1, tactic: 'offensive', seq: 1, tick: 120 + leadTicks(4) });
        s = reduce(s, order('defensive', 0, 'host'), 'host', ctx(0, { tick: 10 }));
        expect(s.log[1].tick).toBe(s.log[0].tick + 1);
        expect(s.log[1].team).toBe(0);
        // mesma tática de agora não gasta troca
        expect(reduce(s, order('offensive', 0, 'guest'), 'guest', ctx(0, { tick: 900 }))).toBe(s);
        s = reduce(s, order('defensive', 0, 'guest'), 'guest', ctx(0, { tick: 900 }));
        s = reduce(s, order('counter', 0, 'guest'), 'guest', ctx(0, { tick: 1000 }));
        expect(s.log.filter((o) => o.team === 1)).toHaveLength(3);
        expect(reduce(s, order('balanced', 0, 'guest'), 'guest', ctx(0, { tick: 1100 }))).toBe(s);
    });

    it('troca: só quem está em quadra sai, só quem está no banco entra, e no intervalo vale no tick seguinte', () => {
        let s = inMatch();
        const t = s.teams.host!;
        const sub = (outUid: string, inUid: string, ht = false): Intent => ({
            k: 'order',
            order: { kind: 'sub', outUid, inUid },
            tick: 0,
            ht,
        });
        expect(reduce(s, sub(t.bench[0].uid, t.bench[1].uid), 'host', ctx())).toBe(s);
        s = reduce(s, sub(t.lineup[2].uid, t.bench[0].uid, true), 'host', ctx(0, { tick: 3600, htTick: 3600 }));
        expect(s.log[0].tick).toBe(3601);
        // quem saiu não sai de novo; quem entrou já entrou
        expect(reduce(s, sub(t.lineup[2].uid, t.bench[1].uid), 'host', ctx())).toBe(s);
        expect(reduce(s, sub(t.lineup[3].uid, t.bench[0].uid), 'host', ctx())).toBe(s);
        s = reduce(s, sub(t.bench[0].uid, t.bench[1].uid), 'host', ctx(0, { tick: 4000 }));
        expect(s.log).toHaveLength(2);
    });
});

describe('intervalo, velocidade e W.O.', () => {
    it('intervalo acaba com os dois prontos ou no tempo; quem está fora ganha a troca da IA técnica', () => {
        let s = inMatch();
        s = reduce(s, { k: 'atHalftime' }, 'host', ctx(1000));
        expect(s.halftime?.until).toBe(1000 + HALFTIME_MS);
        s = reduce(s, { k: 'htReady' }, 'host', ctx(2000));
        expect(tickTimers(s, ctx(3000)).secondHalf).toBe(false);
        const g = s.teams.guest!;
        const aiSub = (side: 0 | 1) => (side === 1 ? { outUid: g.lineup[1].uid, inUid: g.bench[0].uid } : null);
        const away = tickTimers(s, ctx(3000, { present: { host: true, guest: false }, aiSub, htTick: 3600 }));
        expect(away.secondHalf).toBe(true);
        expect(away.log).toMatchObject([{ team: 1, kind: 'sub', tick: 3601 }]);
        expect(tickTimers(s, ctx(1000 + HALFTIME_MS)).secondHalf).toBe(true);
    });

    it('pedido de velocidade: aceito troca, sem resposta em 5 s fica como está', () => {
        let s = inMatch();
        s = reduce(s, { k: 'speed', speed: 8 }, 'guest', ctx(0));
        expect(s.speedAsk).toMatchObject({ by: 'guest', speed: 8 });
        // quem pediu não aceita o próprio pedido
        expect(reduce(s, { k: 'speedAnswer', yes: true }, 'guest', ctx(1))).toBe(s);
        expect(reduce(s, { k: 'speedAnswer', yes: true }, 'host', ctx(1)).speed).toBe(8);
        const late = tickTimers(s, ctx(5000));
        expect(late.speedAsk).toBeUndefined();
        expect(late.speed).toBe(4);
    });

    it('quem não abre o trecho seguinte perde por W.O. 60 s depois do fim do trecho aberto', () => {
        let s = inMatch();
        const k0 = s.kickoffAt ?? 0;
        s = reduce(s, { k: 'reveal', seg: 1, x: 'h1' }, 'host', ctx(k0));
        s = reduce(s, { k: 'reveal', seg: 1, x: 'g1' }, 'guest', ctx(k0));
        s = reduce(s, { k: 'reveal', seg: 2, x: 'h2' }, 'host', ctx(k0));
        // tela no meio do trecho 1: não trava
        expect(tickTimers(s, ctx(k0 + 1000, { tick: 200 })).waitSince).toBeUndefined();
        // chegou no fim do trecho 1 sem o convidado abrir o 2
        s = tickTimers(s, ctx(k0 + 2000, { tick: SEG_TICKS - 0.5 }));
        expect(s.waitSince).toBe(k0 + 2000);
        expect(tickTimers(s, ctx(k0 + 2000 + WO_WAIT_MS - 1, { tick: SEG_TICKS })).phase).toBe('match');
        const wo = tickTimers(s, ctx(k0 + 2000 + WO_WAIT_MS, { tick: SEG_TICKS }));
        expect(wo.phase).toBe('done');
        expect(wo.result).toMatchObject({ winner: 'host', wo: true });
        // voltou e abriu a tempo: a espera some
        const back = reduce(s, { k: 'reveal', seg: 2, x: 'g2' }, 'guest', ctx(k0 + 3000));
        expect(tickTimers(back, ctx(k0 + 4000, { tick: SEG_TICKS })).waitSince).toBeUndefined();
    });

    it('hash de trecho diferente marca que as partidas se separaram', () => {
        let s = inMatch();
        s = reduce(s, { k: 'reveal', seg: 2, x: 'h2', hash: 'aaa' }, 'host', ctx());
        expect(reduce(s, { k: 'reveal', seg: 2, x: 'g2', hash: 'aaa' }, 'guest', ctx()).desync).toBeFalsy();
        expect(reduce(s, { k: 'reveal', seg: 2, x: 'g2', hash: 'bbb' }, 'guest', ctx()).desync).toBe(true);
    });
});

describe('drafts', () => {
    it('Disputa: 4 cartas, um tira, o outro tira, 2 queimam, alterna quem abre; acabou o tempo sai a maior nota', () => {
        let s = lobby('disputa');
        expect(s.phase).toBe('draft');
        const d0 = s.draft!;
        expect(d0.options).toHaveLength(4);
        const first = d0.turn!;
        const second: Role = first === 'host' ? 'guest' : 'host';
        // fora da vez não vale
        expect(reduce(s, { k: 'pick', uid: d0.options[0].uid }, second, ctx())).toBe(s);
        s = reduce(s, { k: 'pick', uid: d0.options[0].uid }, first, ctx(10));
        expect(s.draft?.turn).toBe(second);
        expect(s.draft?.options).toHaveLength(3);
        s = reduce(s, { k: 'pick', uid: s.draft!.options[0].uid }, second, ctx(20));
        expect(s.draft?.round).toBe(1);
        expect(s.draft?.burned).toHaveLength(2);
        expect(s.draft?.turn).toBe(second);
        // o resto no tempo esgotado
        let now = 100;
        while (s.phase === 'draft') {
            now += 31_000;
            s = tickTimers(s, ctx(now));
        }
        expect(s.phase).toBe('preview');
        const all = [...s.draft!.picks.host, ...s.draft!.picks.guest].map((p) => p.speciesId);
        expect(all).toHaveLength(DRAFT_PICKS * 2);
        expect(new Set([...all, ...s.draft!.burned]).size).toBe(all.length + s.draft!.burned.length);
        expect(s.teams.host?.lineup).toHaveLength(5);
        expect(s.teams.host?.captainUid).toBe(s.draft!.picks.host[0].uid);
        // prévia: os dois prontos começa a partida
        s = reduce(s, { k: 'previewReady' }, 'host', ctx(now));
        s = reduce(s, { k: 'previewReady' }, 'guest', ctx(now));
        expect(s.phase).toBe('match');
    });

    it('Cada um com seus pacotes: mesma sorte, cada um no seu ritmo, o rival não vê as cartas', () => {
        let s = lobby('pacotes');
        const a = optionsFor(s, 'host');
        const b = optionsFor(s, 'guest');
        expect(a.map((o) => o.speciesId)).toEqual(b.map((o) => o.speciesId));
        s = reduce(s, { k: 'pick', uid: a[1].uid }, 'host', ctx(10));
        expect(s.draft!.picks.host).toHaveLength(1);
        expect(s.draft!.picks.guest).toHaveLength(0);
        let now = 10;
        while (s.phase === 'draft') {
            now += 31_000;
            s = tickTimers(s, ctx(now));
        }
        expect(s.phase).toBe('preview');
        // prévia de 30 s: trocar formação refaz a escalação
        s = reduce(s, { k: 'formation', formation: '2-2' }, 'guest', ctx(now));
        expect(s.teams.guest?.formation).toBe('2-2');
        expect(tickTimers(s, ctx(now + 30_000)).phase).toBe('match');
    });

    it('escalação automática põe o capitão em quadra', () => {
        const t = team('cap');
        const picks = [...t.bench, ...t.lineup];
        const { lineup, bench } = autoLineup(picks, '1-2-1', t.bench[0].uid);
        expect(lineup.some((p) => p.uid === t.bench[0].uid)).toBe(true);
        expect(lineup).toHaveLength(5);
        expect(bench).toHaveLength(2);
    });
});

describe('relógio e emotes', () => {
    it('convidado atrás acelera, muito atrás pula, muito à frente espera', () => {
        expect(clockAdjust(5, 2).rate).toBe(1);
        expect(clockAdjust(30, 2).rate).toBe(1.1);
        expect(clockAdjust(-30, 2).rate).toBe(0.9);
        expect(clockAdjust(200, 2).seek).toBe(true);
        expect(clockAdjust(-200, 2).rate).toBe(0);
        // em 8x a mesma diferença em ticks é pouco tempo
        expect(clockAdjust(30, 8).rate).toBe(1);
    });

    it('1 emote a cada 3 s e o grito do capitão a cada 10 s', () => {
        expect(emoteAllowed({ any: 0, grito: 0 }, 'boa', 2999)).toBe(false);
        expect(emoteAllowed({ any: 0, grito: 0 }, 'boa', 3000)).toBe(true);
        expect(emoteAllowed({ any: 0, grito: 0 }, 'grito', 9000)).toBe(false);
        expect(emoteAllowed({ any: 0, grito: -10_000 }, 'grito', 3000)).toBe(true);
    });
});

describe('transporte local (BroadcastChannel)', () => {
    it('duas pontas se veem e trocam mensagens só entre si', async () => {
        const a = localTransport('TESTE1', 'a');
        const b = localTransport('TESTE1', 'b');
        const got: NetMsg[] = [];
        b.onMessage((m) => got.push(m));
        const peers: string[][] = [];
        a.onPeers((ids) => peers.push(ids));
        a.send({ t: 'hello', n: 1 });
        a.send({ t: 'hello', n: 2, to: 'c' });
        b.send({ t: 'beat-test' });
        await new Promise((r) => setTimeout(r, 50));
        expect(got.map((m) => m.n)).toEqual([1]);
        expect(peers.at(-1)).toEqual(['b']);
        a.close();
        b.close();
    });
});
