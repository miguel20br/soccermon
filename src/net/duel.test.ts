import { describe, expect, it } from 'vitest';
import { FUTSAL_5, MAX_TACTIC_CHANGES } from '../engine/config';
import { aiDraftTeam, DRAFT_PICKS } from '../engine/draft';
import {
    countSpecials,
    type DuelTeamRecipe,
    teamFromRecipe,
    teamRecipe,
    validarTimeDuelo,
} from '../engine/duel-validate';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import type { TeamSetup } from '../engine/state';
import {
    autoLineup,
    blocker,
    type Ctx,
    canClaimWO,
    clockAdjust,
    disputaOptions,
    emoteAllowed,
    HALFTIME_MS,
    type Intent,
    isRoomCode,
    leadTicks,
    newShared,
    ordersOf,
    type Peer,
    packOptions,
    type Role,
    reduce,
    roomCode,
    type Shared,
    tagTeam,
    tickTimers,
    WO_WAIT_MS,
} from './duel-state';
import { buildRegistro, registroInputs } from './record';
import {
    abrir,
    CHAIN_LEN,
    checkReveal,
    holdTick,
    lacrar,
    makeChain,
    openedSegments,
    randomSecret,
    SEG_COUNT,
    segIdx,
    segmentOfMinute,
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
const H = (c: string) => c.repeat(64);

/** Sala com os dois prontos (modo à escolha). */
function lobby(mode: Shared['mode']): Shared {
    let s = newShared('ABCDEF', peer('ana'), mode, 4, 'seed-teste');
    s = reduce(s, { k: 'join', peer: peer('bia') }, 'guest', ctx());
    s = reduce(s, { k: 'ready', ready: true, commit: H('a'), specialLimit: 3 }, 'host', ctx());
    return reduce(s, { k: 'ready', ready: true, commit: H('b'), specialLimit: 3 }, 'guest', ctx());
}

/** Time pronto: os dois lacram e abrem (a sessão confere o sal; aqui é a regra do estado). */
function inMatch(): Shared {
    let s = lobby('ready');
    s = reduce(s, { k: 'choiceSeal', seal: H('1') }, 'host', ctx());
    s = reduce(s, { k: 'choiceSeal', seal: H('2') }, 'guest', ctx());
    s = reduce(s, { k: 'choiceOpen', value: teamRecipe(team('a')), salt: 'x' }, 'host', ctx());
    s = reduce(s, { k: 'choiceOpen', value: teamRecipe(team('b')), salt: 'y' }, 'guest', ctx());
    // depois do time, a mesma escalação lacrada dos drafts
    expect(s.phase).toBe('preview');
    const cfg = (r: 'host' | 'guest') => {
        const tm = s.teams[r]!;
        return {
            formation: tm.formation ?? '1-2-1',
            tactic: tm.tactic,
            order: [...tm.lineup, ...tm.bench].map((p) => p.uid),
        };
    };
    s = reduce(s, { k: 'choiceSeal', seal: H('3') }, 'host', ctx());
    s = reduce(s, { k: 'choiceSeal', seal: H('4') }, 'guest', ctx());
    s = reduce(s, { k: 'choiceOpen', value: cfg('host'), salt: 'z' }, 'host', ctx());
    return reduce(s, { k: 'choiceOpen', value: cfg('guest'), salt: 'w' }, 'guest', ctx());
}

describe('lacres (seed por trecho e por rodada)', () => {
    it('a corrente abre trecho a trecho e recusa segredo errado', async () => {
        const chain = await makeChain(randomSecret(), 5);
        expect(await checkReveal(chain[0], 1, chain[1])).toBe(true);
        expect(await checkReveal(chain[0], 3, chain[3])).toBe(true);
        expect(await checkReveal(chain[0], 2, chain[3])).toBe(false);
        expect(await checkReveal(chain[0], 1, randomSecret())).toBe(false);
    });

    it('uma corrente cobre as 7 rodadas do draft e os trechos da partida', async () => {
        const chain = await makeChain(randomSecret());
        expect(chain).toHaveLength(CHAIN_LEN + 1);
        expect(await checkReveal(chain[0], segIdx(20), chain[segIdx(20)])).toBe(true);
        expect(segIdx(0)).toBe(8);
        expect(segIdx(SEG_COUNT - 1)).toBe(CHAIN_LEN);
    });

    it('trechos do motor: 2 min de relógio (0–19) e os pênaltis (20); seed igual pros dois lados', async () => {
        expect(segmentOfMinute(0)).toBe(0);
        expect(segmentOfMinute(1.99)).toBe(0);
        expect(segmentOfMinute(2)).toBe(1);
        expect(segmentOfMinute(39.9)).toBe(19);
        expect(segmentOfMinute(40)).toBe(20);
        const h = ['a0', 'a1', 'a2'];
        const g = ['b0', 'b1'];
        expect(openedSegments(h, g)).toBe(2);
        const s1 = await segmentSeeds('SALA', h, g);
        expect(s1).toHaveLength(2);
        expect(s1).toEqual(await segmentSeeds('SALA', h, g));
        expect(s1[0]).not.toBe(s1[1]);
        const snaps = [0, 2, 4, 6].map((m, i) => ({ tick: i * 100, minute: m }));
        expect(holdTick(snaps, 2)).toBe(200);
        expect(holdTick(snaps, SEG_COUNT)).toBe(Number.POSITIVE_INFINITY);
    });

    it('lacre de escolha só abre com o mesmo valor e o mesmo sal', async () => {
        const { seal, salt } = await lacrar({ round: 2, uid: 'x' });
        expect(await abrir({ round: 2, uid: 'x' }, salt, seal)).toBe(true);
        expect(await abrir({ round: 2, uid: 'y' }, salt, seal)).toBe(false);
        expect(await abrir({ round: 2, uid: 'x' }, randomSecret(), seal)).toBe(false);
    });
});

describe('validarTimeDuelo (time pronto)', () => {
    const ok = teamRecipe(team('valido'));
    const edit = (f: (r: DuelTeamRecipe) => void) => {
        const r = structuredClone(ok);
        f(r);
        return validarTimeDuelo(r);
    };

    it('time de copa passa; receita refaz o time com os mesmos golpes', () => {
        expect(validarTimeDuelo(ok)).toEqual([]);
        const back = teamFromRecipe(ok, '~h');
        expect(back.lineup.map((p) => p.speciesId)).toEqual(ok.lineup.map((m) => m.speciesId));
        expect(back.lineup[0].level).toBe(50);
        expect(back.captainUid).toBe([...back.lineup, ...back.bench][ok.captain].uid);
    });

    it('save editado não passa: espécie, golpe, habilidade, item, edição, repetido, elenco', () => {
        expect(edit((r) => (r.lineup[0].speciesId = 152)).length).toBeGreaterThan(0);
        expect(edit((r) => (r.lineup[0].moves = ['hyper-beam-x'])).length).toBeGreaterThan(0);
        expect(edit((r) => (r.lineup[0].ability = 'wonder-guard')).length).toBeGreaterThan(0);
        expect(edit((r) => (r.lineup[0].item = 'master-ball')).length).toBeGreaterThan(0);
        expect(edit((r) => (r.lineup[0].special = { kind: 'destaque', level: 9 })).length).toBeGreaterThan(0);
        expect(edit((r) => (r.lineup[1] = { ...r.lineup[0] })).length).toBeGreaterThan(0);
        expect(edit((r) => r.lineup.pop()).length).toBeGreaterThan(0);
        expect(validarTimeDuelo(null)).toEqual(['time vazio']);
    });
});

describe('limite de cartas especiais (regra da sala no Time pronto)', () => {
    const base = teamRecipe(team('especiais'));
    const withSpecials = (n: number): DuelTeamRecipe => {
        const r = structuredClone(base);
        [...r.lineup, ...r.bench].forEach((m, i) => {
            m.shiny = false;
            m.special = i < n ? { kind: 'destaque', level: 1 } : null;
        });
        return r;
    };

    it('conta Shiny, Destaque, Ícone e Evento; nenhuma, até 3 e livre', () => {
        const four = withSpecials(4);
        four.bench[1].special = null;
        four.bench[1].shiny = true;
        expect(countSpecials(four)).toBe(5);
        expect(validarTimeDuelo(withSpecials(0), 0)).toEqual([]);
        expect(validarTimeDuelo(withSpecials(1), 0).join()).toContain('cartas especiais: 1');
        expect(validarTimeDuelo(withSpecials(3), 3)).toEqual([]);
        expect(validarTimeDuelo(withSpecials(4), 3).join()).toContain('cartas especiais: 4 (a sala deixa 3)');
        expect(validarTimeDuelo(withSpecials(7), null)).toEqual([]);
    });

    it('a sala recusa time acima do limite e o pronto com outra regra na tela', () => {
        let s = newShared('ABCDEF', peer('ana'), 'ready', 4, 'x', 0);
        s = reduce(s, { k: 'join', peer: peer('bia') }, 'guest', ctx());
        // o convidado viu "até 3" (sala antiga, jogo diferente): não vale
        expect(reduce(s, { k: 'ready', ready: true, commit: H('b'), specialLimit: 3 }, 'guest', ctx())).toBe(s);
        s = reduce(s, { k: 'ready', ready: true, commit: H('a'), specialLimit: 0 }, 'host', ctx());
        s = reduce(s, { k: 'ready', ready: true, commit: H('b'), specialLimit: 0 }, 'guest', ctx());
        expect(s.phase).toBe('team');
        s = reduce(s, { k: 'choiceSeal', seal: H('1') }, 'host', ctx());
        s = reduce(s, { k: 'choiceSeal', seal: H('2') }, 'guest', ctx());
        expect(reduce(s, { k: 'choiceOpen', value: withSpecials(1), salt: 'x' }, 'host', ctx())).toBe(s);
        expect(
            reduce(s, { k: 'choiceOpen', value: withSpecials(0), salt: 'x' }, 'host', ctx()).choice?.opened.host,
        ).toBe(true);
    });

    it('a regra entra no registro do duelo', () => {
        const s = newShared('ABCDEF', peer('ana'), 'ready', 4, 'x', null);
        expect(s.specialLimit).toBeNull();
        expect(
            buildRegistro({ ...s, teams: { host: team('a'), guest: team('b') } }, 1, '0.8.5').specialLimit,
        ).toBeNull();
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
        s = reduce(s, { k: 'ready', ready: true, commit: H('a'), specialLimit: 3 }, 'host', ctx());
        s = reduce(s, { k: 'ready', ready: true, commit: H('b'), specialLimit: 3 }, 'guest', ctx());
        expect(s.phase).toBe('lobby');
    });

    it('mensagem inválida é ignorada: pronto sem lacre, terceiro com outro id, lixo', () => {
        let s = newShared('ABCDEF', peer('ana'), 'ready', 4, 'x');
        s = reduce(s, { k: 'join', peer: peer('bia') }, 'guest', ctx());
        expect(reduce(s, { k: 'ready', ready: true }, 'guest', ctx())).toBe(s);
        expect(reduce(s, { k: 'join', peer: peer('caio') }, 'guest', ctx())).toBe(s);
        expect(reduce(s, null as unknown as Intent, 'guest', ctx())).toBe(s);
        expect(reduce(s, { k: 'nada' } as unknown as Intent, 'guest', ctx())).toBe(s);
    });

    it('time pronto: só abre depois que os dois lacraram; time inválido não entra; uids separados por lado', () => {
        let s = lobby('ready');
        expect(s.phase).toBe('team');
        s = reduce(s, { k: 'choiceSeal', seal: H('1') }, 'host', ctx());
        // o outro ainda não lacrou: abrir agora não vale (ninguém escolhe vendo o time do outro)
        expect(reduce(s, { k: 'choiceOpen', value: teamRecipe(team('a')), salt: 'x' }, 'host', ctx())).toBe(s);
        s = reduce(s, { k: 'choiceSeal', seal: H('2') }, 'guest', ctx());
        const b = teamRecipe(team('b'));
        expect(
            reduce(s, { k: 'choiceOpen', value: { ...b, lineup: b.lineup.slice(0, 4) }, salt: 'y' }, 'guest', ctx()),
        ).toBe(s);
        const m = inMatch();
        expect(m.phase).toBe('match');
        expect(m.teams.host?.lineup[0].uid.endsWith('~h')).toBe(true);
        expect(m.teams.guest?.lineup[0].uid.endsWith('~g')).toBe(true);
    });
});

describe('log de ordens', () => {
    const tactic = (t: 'offensive' | 'defensive' | 'counter' | 'balanced', seq: number, tick = 0): Intent => ({
        k: 'order',
        order: { kind: 'tactic', tactic: t },
        tick,
        seq,
    });

    it('o host só põe o tick: seq é de quem mandou, repetida não entra, e o motor ordena por (tick, time, seq)', () => {
        let s = inMatch();
        s = reduce(s, tactic('offensive', 1, 100), 'guest', ctx(0, { tick: 120 }));
        expect(s.log[0]).toMatchObject({ team: 1, tactic: 'offensive', seq: 1, tick: 120 + leadTicks(4) });
        // a mesma ordem chegando de novo (reenvio) não duplica
        expect(reduce(s, tactic('offensive', 1, 100), 'guest', ctx(0, { tick: 130 }))).toBe(s);
        s = reduce(s, tactic('defensive', 1), 'host', ctx(0, { tick: 10 }));
        expect(s.log[1]).toMatchObject({ team: 0, seq: 1 });
        expect(s.log[1].tick).toBe(s.log[0].tick + 1);
        expect(ordersOf([s.log[1], s.log[0]]).map((o) => o.team)).toEqual([1, 0]);
    });

    it('mesmo limite pros dois: 3 táticas, e a mesma tática de agora não gasta troca', () => {
        let s = inMatch();
        expect(reduce(s, tactic('balanced', 1), 'guest', ctx())).toBe(s);
        s = reduce(s, tactic('offensive', 1), 'guest', ctx(0, { tick: 100 }));
        s = reduce(s, tactic('defensive', 2), 'guest', ctx(0, { tick: 900 }));
        s = reduce(s, tactic('counter', 3), 'guest', ctx(0, { tick: 1000 }));
        expect(s.log.filter((o) => o.team === 1)).toHaveLength(3);
        expect(reduce(s, tactic('balanced', 4), 'guest', ctx(0, { tick: 1100 }))).toBe(s);
    });

    it('troca: só quem está em quadra sai, só quem está no banco entra, e no intervalo vale no tick seguinte', () => {
        let s = inMatch();
        const t = s.teams.host!;
        const sub = (outUid: string, inUid: string, seq: number, ht = false): Intent => ({
            k: 'order',
            order: { kind: 'sub', outUid, inUid },
            tick: 0,
            seq,
            ht,
        });
        expect(reduce(s, sub(t.bench[0].uid, t.bench[1].uid, 1), 'host', ctx())).toBe(s);
        s = reduce(s, sub(t.lineup[2].uid, t.bench[0].uid, 1, true), 'host', ctx(0, { tick: 3600, htTick: 3600 }));
        expect(s.log[0].tick).toBe(3601);
        expect(reduce(s, sub(t.lineup[2].uid, t.bench[1].uid, 2), 'host', ctx())).toBe(s);
        expect(reduce(s, sub(t.lineup[3].uid, t.bench[0].uid, 2), 'host', ctx())).toBe(s);
        s = reduce(s, sub(t.bench[0].uid, t.bench[1].uid, 2), 'host', ctx(0, { tick: 4000 }));
        expect(s.log).toHaveLength(2);
    });
});

describe('intervalo, velocidade, W.O. e dessincronização', () => {
    it('intervalo acaba com os dois prontos, com quem está fora, ou no tempo', () => {
        let s = inMatch();
        s = reduce(s, { k: 'atHalftime' }, 'host', ctx(1000));
        expect(s.halftime?.until).toBe(1000 + HALFTIME_MS);
        s = reduce(s, { k: 'htReady' }, 'host', ctx(2000));
        expect(tickTimers(s, ctx(3000)).secondHalf).toBe(false);
        expect(tickTimers(s, ctx(3000, { present: { host: true, guest: false } })).secondHalf).toBe(true);
        expect(tickTimers(s, ctx(1000 + HALFTIME_MS)).secondHalf).toBe(true);
    });

    it('pedido de velocidade: aceito troca, sem resposta em 5 s fica como está', () => {
        let s = inMatch();
        s = reduce(s, { k: 'speed', speed: 8 }, 'guest', ctx(0));
        expect(s.speedAsk).toMatchObject({ by: 'guest', speed: 8 });
        expect(reduce(s, { k: 'speedAnswer', yes: true }, 'guest', ctx(1))).toBe(s);
        expect(reduce(s, { k: 'speedAnswer', yes: true }, 'host', ctx(1)).speed).toBe(8);
        const late = tickTimers(s, ctx(5000));
        expect(late.speedAsk).toBeUndefined();
        expect(late.speed).toBe(4);
    });

    it('quem não abre o trecho seguinte trava a sala; W.O. só pelo botão de quem ficou, depois de 60 s', () => {
        let s = inMatch();
        const k0 = s.kickoffAt ?? 0;
        s = reduce(s, { k: 'reveal', seg: 0, x: H('1') }, 'host', ctx(k0));
        s = reduce(s, { k: 'reveal', seg: 0, x: H('2') }, 'guest', ctx(k0));
        s = reduce(s, { k: 'reveal', seg: 1, x: H('3') }, 'host', ctx(k0));
        // tela no meio do trecho 0: não trava
        expect(blocker(s, { now: k0 + 9000, atHold: false })).toBeNull();
        // chegou no fim do trecho 0 sem o convidado abrir o 1
        s = tickTimers(s, ctx(k0 + 9000, { atHold: true }));
        expect(s.waitFor).toBe('guest');
        expect(s.waitSince).toBe(k0 + 9000);
        // nunca automático
        expect(tickTimers(s, ctx(k0 + 9000 + WO_WAIT_MS * 3, { atHold: true })).phase).toBe('match');
        expect(reduce(s, { k: 'claimWO' }, 'host', ctx(k0 + 9000 + WO_WAIT_MS - 1))).toBe(s);
        // quem está travando não pede W.O. contra o outro
        expect(canClaimWO(s, 'guest', k0 + 9000 + WO_WAIT_MS)).toBe(false);
        const wo = reduce(s, { k: 'claimWO' }, 'host', ctx(k0 + 9000 + WO_WAIT_MS));
        expect(wo.result).toMatchObject({ winner: 'host', wo: true });
        // voltou e abriu a tempo: a espera some
        const back = reduce(s, { k: 'reveal', seg: 1, x: H('4') }, 'guest', ctx(k0 + 9500));
        expect(tickTimers(back, ctx(k0 + 9600, { atHold: false })).waitFor).toBeUndefined();
    });

    it('hash de trecho diferente anula a partida em vez de seguir com placares diferentes', () => {
        let s = inMatch();
        s = reduce(s, { k: 'reveal', seg: 2, x: H('1'), hash: 'aaa' }, 'host', ctx());
        expect(reduce(s, { k: 'reveal', seg: 2, x: H('2'), hash: 'aaa' }, 'guest', ctx()).phase).toBe('match');
        const bad = reduce(s, { k: 'reveal', seg: 2, x: H('2'), hash: 'bbb' }, 'guest', ctx());
        expect(bad.phase).toBe('done');
        expect(bad.result?.desync).toBe(true);
    });

    it('hash feito com menos ordens (ordem atrasada) não anula: a tela refaz e manda de novo', () => {
        let s = inMatch();
        s = reduce(s, { k: 'reveal', seg: 2, x: H('1'), hash: '1:aaa' }, 'host', ctx());
        // o convidado ainda não tinha a ordem: hash diferente, mas com 0 ordens antes da divisa
        s = reduce(s, { k: 'reveal', seg: 2, x: H('2'), hash: '0:bbb' }, 'guest', ctx());
        expect(s.phase).toBe('match');
        // refez com a ordem: igual, segue
        expect(reduce(s, { k: 'reveal', seg: 2, x: H('2'), hash: '1:aaa' }, 'guest', ctx()).phase).toBe('match');
        // mesmas ordens e hash diferente: separou de verdade
        expect(reduce(s, { k: 'reveal', seg: 2, x: H('2'), hash: '1:ccc' }, 'guest', ctx()).result?.desync).toBe(true);
    });
});

/** Abre a rodada atual dos dois (segredo + seed, como a sessão faz). */
function openRound(s: Shared, now: number): Shared {
    const r = s.draft!.round;
    s = reduce(s, { k: 'roundReveal', round: r, x: H('c') }, 'host', ctx(now));
    s = reduce(s, { k: 'roundReveal', round: r, x: H('d') }, 'guest', ctx(now));
    return reduce(s, { k: 'roundSeed', round: r, seed: `seed-${r}` }, 'host', ctx(now));
}

describe('drafts', () => {
    it('pacotes são função só da seed da rodada (sem a seed, ninguém calcula a rodada seguinte)', () => {
        const a = disputaOptions('r1', 1, new Set()).map((o) => o.speciesId);
        expect(disputaOptions('r1', 1, new Set()).map((o) => o.speciesId)).toEqual(a);
        expect(disputaOptions('r2', 1, new Set()).map((o) => o.speciesId)).not.toEqual(a);
    });

    it('Disputa: a rodada só abre com os dois segredos; 4 cartas, um tira, o outro tira, 2 queimam', () => {
        let s = lobby('disputa');
        expect(s.phase).toBe('draft');
        expect(s.draft?.options).toHaveLength(0);
        s = openRound(s, 0);
        const d0 = s.draft!;
        expect(d0.options).toHaveLength(4);
        const first = d0.turn!;
        const second: Role = first === 'host' ? 'guest' : 'host';
        expect(reduce(s, { k: 'pick', uid: d0.options[0].uid }, second, ctx())).toBe(s);
        s = reduce(s, { k: 'pick', uid: d0.options[0].uid }, first, ctx(10));
        expect(s.draft?.turn).toBe(second);
        s = reduce(s, { k: 'pick', uid: s.draft!.options[0].uid }, second, ctx(20));
        expect(s.draft?.round).toBe(1);
        expect(s.draft?.burned).toHaveLength(2);
        expect(s.draft?.options).toHaveLength(0);
        // o resto no tempo esgotado (a Disputa é aberta: quem aplica tira a de maior nota)
        let now = 100;
        while (s.phase === 'draft') {
            s = openRound(s, now);
            now += 31_000;
            s = tickTimers(s, ctx(now));
            now += 31_000;
            s = tickTimers(s, ctx(now));
        }
        expect(s.phase).toBe('preview');
        const all = [...s.draft!.picks.host, ...s.draft!.picks.guest].map((p) => p.speciesId);
        expect(all).toHaveLength(DRAFT_PICKS * 2);
        expect(new Set([...all, ...s.draft!.burned]).size).toBe(all.length + s.draft!.burned.length);
        expect(s.teams.host?.captainUid).toBe(s.draft!.picks.host[0].uid);
    });

    it('Cada um com seus pacotes: lacre por rodada, os dois andam juntos e abrem tudo no fim', () => {
        let s = lobby('pacotes');
        const picks: Record<Role, ReturnType<typeof packOptions>> = { host: [], guest: [] };
        for (let r = 0; r < DRAFT_PICKS; r++) {
            s = openRound(s, r);
            for (const role of ['host', 'guest'] as Role[]) {
                const opts = packOptions(s.draft!.seeds[r], r, picks[role], role);
                expect(opts.length).toBeGreaterThan(0);
                picks[role].push(opts[0]);
                s = reduce(s, { k: 'seal', round: r, seal: H(role === 'host' ? 'e' : 'f') }, role, ctx(r));
            }
            expect(s.draft?.round).toBe(r + 1);
        }
        // cada um abre o próprio pacote: os dois não recebem as mesmas cartas
        expect(picks.host.map((p) => p.speciesId)).not.toEqual(picks.guest.map((p) => p.speciesId));
        s = reduce(s, { k: 'picksOpened', cards: picks.host }, 'host', ctx());
        expect(s.phase).toBe('draft');
        s = reduce(s, { k: 'picksOpened', cards: picks.guest }, 'guest', ctx(100));
        expect(s.phase).toBe('preview');
        // prévia lacrada: um lacra e abre; o outro não lacrou no tempo e fica com o time do draft
        const until = s.choice!.until!;
        const t = s.teams.guest!;
        const cfg = {
            formation: '2-2' as const,
            tactic: 'offensive' as const,
            order: [...t.lineup, ...t.bench].map((p) => p.uid),
        };
        s = reduce(s, { k: 'choiceSeal', seal: H('9') }, 'guest', ctx(until - 1));
        s = tickTimers(s, ctx(until + 5000));
        expect(s.choice?.seal.host).toBe('-');
        s = reduce(s, { k: 'choiceOpen', value: cfg, salt: 's' }, 'guest', ctx(until + 5001));
        expect(s.phase).toBe('match');
        expect(s.teams.guest?.formation).toBe('2-2');
        expect(s.teams.guest?.tactic).toBe('offensive');
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

describe('registro do duelo', () => {
    it('guarda receitas, uids, lacres e ordens por autor; refaz as entradas da partida', async () => {
        let s = inMatch();
        const x = [randomSecret(), randomSecret()];
        s = reduce(s, { k: 'reveal', seg: 0, x: x[0] }, 'host', ctx());
        s = reduce(s, { k: 'reveal', seg: 0, x: x[1] }, 'guest', ctx());
        s = reduce(s, { k: 'order', order: { kind: 'tactic', tactic: 'counter' }, tick: 0, seq: 1 }, 'guest', ctx());
        s = reduce(s, { k: 'order', order: { kind: 'corner', corner: 'area' }, tick: 0, seq: 2 }, 'guest', ctx());
        s = reduce(s, { k: 'order', order: { kind: 'tactic', tactic: 'offensive' }, tick: 0, seq: 1 }, 'host', ctx());
        const reg = JSON.parse(JSON.stringify(buildRegistro(s, 1, '0.8.5')));
        expect(reg.orders[0]).toHaveLength(1);
        expect(reg.orders[1]).toHaveLength(2);
        const inp = await registroInputs(reg);
        expect(inp.home.lineup.map((p) => p.uid)).toEqual(s.teams.host!.lineup.map((p) => p.uid));
        expect(inp.away.captainUid).toBe(s.teams.guest!.captainUid);
        expect(inp.orders.map((o) => o.team)).toEqual(ordersOf(s.log).map((o) => o.team));
        expect(inp.segmentSeeds).toEqual(await segmentSeeds('ABCDEF', [x[0]], [x[1]]));
        // o registro refaz a mesma partida
        const live = runMatch(FUTSAL_5, s.teams.host!, s.teams.guest!, inp.seed, {
            orders: ordersOf(s.log),
            segmentSeeds: inp.segmentSeeds,
            snapshots: false,
        });
        const again = runMatch(FUTSAL_5, inp.home, inp.away, inp.seed, {
            orders: inp.orders,
            segmentSeeds: inp.segmentSeeds,
            snapshots: false,
        });
        expect(again.score).toEqual(live.score);
        expect(again.events.length).toBe(live.events.length);
    });
});

describe('seed por trecho de verdade (motor)', () => {
    const home = tagTeam(team('casa'), 'host');
    const away = tagTeam(team('fora'), 'guest');
    const chainOf = (tag: string) => Array.from({ length: SEG_COUNT }, (_, k) => H(String((k + tag.length) % 10)));

    it('outros lacres dão outra partida; o mesmo trecho aberto não muda o que veio antes', async () => {
        const a = await segmentSeeds('SALA1', chainOf('a'), chainOf('b'));
        const b = await segmentSeeds('SALA1', chainOf('a'), chainOf('bb'));
        expect(a).toHaveLength(SEG_COUNT);
        const ra = runMatch(FUTSAL_5, home, away, 'base', { segmentSeeds: a });
        const ra2 = runMatch(FUTSAL_5, home, away, 'base', { segmentSeeds: a });
        const rb = runMatch(FUTSAL_5, home, away, 'base', { segmentSeeds: b });
        expect(ra2.events).toEqual(ra.events);
        expect(JSON.stringify(rb.events)).not.toBe(JSON.stringify(ra.events));
        // trava: a partida só com os 3 primeiros trechos é igual à inteira até o fim do trecho 2
        const part = runMatch(FUTSAL_5, home, away, 'base', { segmentSeeds: a.slice(0, 3) });
        const cut = holdTick(part.snapshots, 3);
        expect(cut).toBeGreaterThan(0);
        expect(part.events.filter((e) => e.tick < cut)).toEqual(ra.events.filter((e) => e.tick < cut));
    });
});

describe('escanteio no duelo', () => {
    it('ordem de escanteio passa pelo mesmo carimbo e pelo limite do motor (3, à parte da tática)', () => {
        let s = inMatch();
        const corner = (c: 'area' | 'short' | 'mixed', seq: number): Intent => ({
            k: 'order',
            order: { kind: 'corner', corner: c },
            tick: 0,
            seq,
        });
        // a instrução atual (Variar) não gasta troca
        expect(reduce(s, corner('mixed', 1), 'guest', ctx())).toBe(s);
        s = reduce(s, corner('area', 1), 'guest', ctx(0, { tick: 100 }));
        s = reduce(s, corner('short', 2), 'guest', ctx(0, { tick: 200 }));
        s = reduce(s, corner('area', 3), 'guest', ctx(0, { tick: 300 }));
        expect(s.log.filter((o) => o.team === 1)).toHaveLength(MAX_TACTIC_CHANGES);
        expect(reduce(s, corner('mixed', 4), 'guest', ctx(0, { tick: 400 }))).toBe(s);
        // tática continua com as 3 dela
        s = reduce(s, { k: 'order', order: { kind: 'tactic', tactic: 'counter' }, tick: 0, seq: 4 }, 'guest', ctx());
        expect(s.log.filter((o) => o.team === 1)).toHaveLength(4);
        // instrução que não existe não entra
        expect(reduce(s, corner('nada' as never, 5), 'guest', ctx())).toBe(s);
    });

    it('o cobrador vai na receita e tem que ser alguém do time', () => {
        const t = team('cobra');
        const r = teamRecipe({ ...t, corner: 'short', cornerTakerUid: t.lineup[3].uid });
        expect(r.cornerTaker).toBe(3);
        expect(validarTimeDuelo(r)).toEqual([]);
        expect(teamFromRecipe(r, '').cornerTakerUid).toBe(teamFromRecipe(r, '').lineup[3].uid);
        expect(validarTimeDuelo({ ...r, cornerTaker: 9 }).join()).toContain('cobrador');
        expect(validarTimeDuelo({ ...r, corner: 'nada' as never }).join()).toContain('escanteio');
        expect(tagTeam(teamFromRecipe(r, ''), 'guest').cornerTakerUid?.endsWith('~g')).toBe(true);
    });
});

describe('relógio e emotes', () => {
    it('convidado atrás acelera, muito atrás pula, muito à frente espera; em Lances pula mais cedo', () => {
        expect(clockAdjust(5, 2).rate).toBe(1);
        expect(clockAdjust(30, 2).rate).toBe(1.1);
        expect(clockAdjust(-30, 2).rate).toBe(0.9);
        expect(clockAdjust(200, 2).seek).toBe(true);
        expect(clockAdjust(-200, 2).rate).toBe(0);
        expect(clockAdjust(30, 8).rate).toBe(1);
        expect(clockAdjust(100, 'highlights').seek).toBe(true);
    });

    it('1 emote a cada 3 s e o grito do capitão a cada 10 s; emote desconhecido não passa', () => {
        expect(emoteAllowed({ any: 0, grito: 0 }, 'boa', 2999)).toBe(false);
        expect(emoteAllowed({ any: 0, grito: 0 }, 'boa', 3000)).toBe(true);
        expect(emoteAllowed({ any: 0, grito: 0 }, 'grito', 9000)).toBe(false);
        expect(emoteAllowed({ any: 0, grito: -10_000 }, 'grito', 3000)).toBe(true);
        expect(emoteAllowed({ any: 0, grito: 0 }, 'xss' as never, 99_000)).toBe(false);
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
