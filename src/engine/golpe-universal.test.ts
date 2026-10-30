import { describe, expect, it } from 'vitest';
import { AGENCY, maxCharge, maxCue } from './agency';
import { type Command, IDLE } from './commands';
import { FUTSAL_5 } from './config';
import { SPECIES } from './data';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { applyAgencyOrder, createMatch, maxFxType, snapshot, step } from './match';
import { Rng } from './rng';
import { validOrder } from './runners/live-runner';
import type { MatchEvent, MatchState, TeamSetup } from './state';
import { v } from './vec';

/**
 * Golpe máximo universal e a bicuda do goleiro capitão (o parry dele; motor 17, docs/planos/golpe-universal.md), no lance montado na mão como em
 * max-type.test.ts: capitão (pivô, idx 4) a 10 m do gol com o golpe armado; goleiro rival (idx 5) no gol; zagueiro
 * (idx 6) onde o teste pedir; o resto longe.
 */
function team(seed: string): TeamSetup {
    return { name: seed, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}

/** 1ª espécie de linha da Gen 1 cujo tipo do golpe máximo é `fx`. */
function capOf(fx: string) {
    for (const sp of SPECIES) {
        if (sp.id > 151) continue;
        const inst = createInstance(sp.id, new Rng('gu-cap', String(sp.id)));
        if (maxFxType(inst.moves, sp.id, sp.types) === fx) return inst;
    }
    throw new Error(`sem capitão ${fx}`);
}

interface Opts {
    seed?: string;
    type?: string;
    level?: 1 | 2 | 3;
    defAt?: { x: number; y: number }[];
    gkY?: number;
    aim?: { x: number; y: number };
}

const IDLE_ALL = (s: MatchState): Command[] => s.players.map(() => IDLE);
const of = <T extends MatchEvent['type']>(s: MatchState, type: T) =>
    s.events.filter((e): e is Extract<MatchEvent, { type: T }> => e.type === type);
const idle = (s: MatchState, n: number) => {
    for (let i = 0; i < n && !s.finished; i++) step(s, IDLE_ALL(s));
};

/** Monta o lance, sem chutar. */
function setup(o: Opts = {}) {
    const A = team('gu-a');
    const B = team('gu-b');
    const cap = capOf(o.type ?? 'Fire');
    const home = { ...A, lineup: A.lineup.map((p, i) => (i === 4 ? cap : p)), captainUid: cap.uid };
    const s = createMatch(FUTSAL_5, home, B, o.seed ?? 'gu');
    s.phase = 'play';
    const far = [v(8, 3), v(8, 17), v(4, 10), v(12, 10), v(15, 5), v(15, 15), v(20, 3)];
    s.players.forEach((p, i) => {
        p.pos = far[i % far.length];
        p.vel = v(0, 0);
    });
    s.players[4].pos = v(30, 10);
    s.players[5].pos = v(39.3, o.gkY ?? 10);
    (o.defAt ?? []).forEach((at, k) => {
        s.players[6 + k].pos = v(at.x, at.y);
    });
    s.ball.owner = 4;
    s.ball.pos = v(30.3, 10);
    s.teams[0].agency.max = { idx: 4, until: 100, level: o.level ?? 3, q: 2 };
    return s;
}

/** O capitão chuta no tick 1 (golpe máximo armado). */
function shoot(o: Opts = {}) {
    const s = setup(o);
    const cmds = IDLE_ALL(s);
    cmds[4] = { type: 'shoot', target: o.aim ? v(o.aim.x, o.aim.y) : v(40, 10), power: 1 };
    step(s, cmds);
    return s;
}

/** Roda o lance em várias seeds até `pick` achar o que procura. */
function until(pick: (s: MatchState) => boolean, o: Opts = {}, n = 200, after = 30) {
    for (let k = 0; k < n; k++) {
        const s = shoot({ ...o, seed: `gu-${k}` });
        idle(s, after);
        if (pick(s)) return s;
    }
    return null;
}

describe('golpe máximo universal (motor 17)', () => {
    it('N1: o status do tipo pega quem defende e quem bloqueia (Fogo queima, Normal derruba)', () => {
        // o status do golpe máximo (source 'max'), não o efeito secundário do golpe
        const hit = (target: number, status: string) => (s: MatchState) =>
            of(s, 'status').some((e) => e.target === target && e.source === 'max' && e.status === status);
        const fire = until(hit(5, 'brn'), { level: 1 });
        expect(fire && of(fire, 'save').some((e) => e.by === 5)).toBe(true);
        const block = until(hit(6, 'brn'), { level: 1, defAt: [{ x: 36, y: 10 }] });
        expect(block && of(block, 'block').some((e) => e.by === 6)).toBe(true);
        const normal = until(hit(5, 'flinch'), { level: 1, type: 'Normal' });
        expect(normal).not.toBeNull();
        // todo tipo tem um status
        for (const t of ['Fire', 'Electric', 'Poison', 'Ice', 'Psychic', 'Normal'])
            expect(AGENCY.maxStatus[t]).toBeDefined();
    });

    it('N2: derruba os jogadores de linha na linha do chute; o goleiro e quem está longe da linha não caem', () => {
        const defAt = [
            { x: 36, y: 10.2 },
            { x: 33, y: 9.5 },
            { x: 33, y: 15 },
        ];
        const n2 = shoot({ level: 2, defAt });
        expect(n2.players[6].stun).toBeGreaterThan(0);
        expect(n2.players[7].stun).toBeGreaterThan(0);
        expect(n2.players[8].stun).toBe(0);
        expect(n2.players[5].stun).toBe(0);
        expect(of(n2, 'knockback').map((e) => e.target)).toEqual([6, 7]);
        // no N1 ninguém cai
        const n1 = shoot({ level: 1, defAt });
        expect([6, 7, 8].map((i) => n1.players[i].stun)).toEqual([0, 0, 0]);
    });

    it('N3: sempre no alvo, mesmo mirando pra fora (o N2 mirando pra fora sai)', () => {
        const aim = { x: 40, y: 16 };
        for (let k = 0; k < 20; k++) {
            const s = shoot({ level: 3, aim, seed: `gu-on-${k}`, type: 'Normal' });
            expect(s.ball.shot?.onTarget).toBe(true);
        }
        expect(shoot({ level: 2, aim }).ball.shot?.onTarget).toBe(false);
    });

    it('efeito na bola: a curva vai pro canto longe do goleiro, com teto de metade da curva do Psíquico', () => {
        const up = shoot({ level: 1, gkY: 10.8, aim: { x: 40, y: 10.8 } }).ball.shot!;
        const down = shoot({ level: 1, gkY: 9.2, aim: { x: 40, y: 9.2 } }).ball.shot!;
        expect(up.curve).toBeLessThan(0);
        expect(down.curve).toBeGreaterThan(0);
        // no fim do caminho a curva não passa do teto (m por metro de chute)
        const s = shoot({ level: 1, gkY: 10.8, aim: { x: 40, y: 10.8 } });
        const t = (40 - s.ball.pos.x) / s.ball.vel.x;
        const bend = Math.abs(0.5 * s.ball.shot!.curve! * t * t);
        expect(bend).toBeLessThanOrEqual((40 - s.ball.pos.x) * AGENCY.maxType.curve * AGENCY.maxCurve + 1e-9);
        // o N3 Psíquico fica com a curva dele (maior), sem somar
        const psy = shoot({ level: 3, type: 'Psychic', gkY: 10.8, aim: { x: 40, y: 10.6 } });
        const tp = (40 - psy.ball.pos.x) / psy.ball.vel.x;
        expect(Math.abs(0.5 * psy.ball.shot!.curve! * tp * tp)).toBeGreaterThan(bend);
    });
});

/**
 * Bicuda: o rival (idx 9) chuta de 8 m no gol do time 0; o goleiro capitão (idx 0) tem o golpe armado no nível e na nota
 * pedidos (`level` null: sem nada armado). `cap`: quem é o capitão do time 0 (0 = o goleiro).
 */
function bicudaScene(level: 1 | 2 | 3 | null, seed: string, q: 0 | 1 | 2 = 2, cap = 0) {
    const A = team('gu-bi-a');
    const B = team('gu-bi-b');
    const s = createMatch(FUTSAL_5, { ...A, captainUid: A.lineup[cap].uid }, B, seed);
    s.phase = 'play';
    const spots = [v(0.7, 10), v(30, 3), v(30, 17), v(25, 10), v(34, 10), v(39.3, 10), v(20, 3), v(20, 17), v(14, 10)];
    s.players.forEach((p, i) => {
        p.pos = spots[i] ?? v(8, 10);
        p.vel = v(0, 0);
    });
    s.players[9].pos = v(8, 10);
    s.ball.owner = 9;
    s.ball.pos = v(7.7, 10);
    if (level) s.teams[0].agency.max = { idx: cap, until: 200, level, q };
    const cmds = IDLE_ALL(s);
    cmds[9] = { type: 'shoot', target: v(0, 10), power: 1 };
    step(s, cmds);
    for (let i = 0; i < 30 && !of(s, 'max').length && !of(s, 'save').length && !of(s, 'goal').length; i++) idle(s, 1);
    return s;
}

/** Lances (seeds) em que o goleiro alcançou o chute: defendeu, deu a bicuda ou tentou. */
function reached(level: 1 | 2 | 3 | null, tag: string, q: 0 | 1 | 2 = 2, cap = 0, n = 10) {
    const out: MatchState[] = [];
    for (let k = 0; k < n; k++) {
        const s = bicudaScene(level, `gu-bi-${tag}-${k}`, q, cap);
        if (of(s, 'max').length || of(s, 'save').some((e) => e.by === 0)) out.push(s);
    }
    expect(out.length).toBeGreaterThan(0);
    return out;
}

describe('bicuda do goleiro capitão: o golpe máximo dele é o parry (motor 17)', () => {
    it('N1 e N2: lançamento pro companheiro no campo rival, sem chute no gol; N3: chute no alvo', () => {
        for (const level of [1, 2, 3] as const) {
            for (const s of reached(level, String(level))) {
                const hit = of(s, 'max')[0];
                expect(hit).toMatchObject({ by: 0, team: 0, phase: 'hit', level });
                const gkShot = of(s, 'shot').some((e) => e.by === 0);
                if (level === 3) {
                    expect(gkShot).toBe(true);
                    expect(s.ball.shot).toMatchObject({ by: 0, onTarget: true, max: { level: 3 } });
                } else {
                    expect(gkShot).toBe(false);
                    expect(s.ball.lastKick).toMatchObject({ by: 0, kind: 'pass' });
                    expect(s.players[s.ball.lastKick!.receiverId!].pos.x).toBeGreaterThan(20);
                }
            }
        }
    });

    it('N3: o goleiro rival defende como num chute normal (sem o alcance e a chance do N3)', () => {
        // a % de gol de verdade (goleiro se mexendo) sai do `calibrate --agencia`
        for (const s of reached(3, 'n3')) {
            expect(s.ball.shot).toMatchObject({ by: 0, max: { level: 3 } });
            expect(s.ball.shot?.gkReach).toBeUndefined();
            expect(s.ball.shot?.gkSave).toBeUndefined();
            expect(s.ball.shot?.decoy).toBeUndefined();
        }
    });

    it('toque fora: gasta a barra (max "miss") e vira a defesa de sempre daquele chute, sem bicuda', () => {
        for (const s of reached(2, 'fora', 0)) {
            idle(s, 20);
            expect(of(s, 'max')).toEqual([expect.objectContaining({ by: 0, team: 0, phase: 'miss', level: 2, q: 0 })]);
            expect(s.teams[0].agency.max).toBeNull();
            expect(of(s, 'shot').some((e) => e.by === 0)).toBe(false);
            expect(s.ball.lastKick?.kind === 'pass' && s.ball.lastKick.by === 0).toBe(false);
            expect(of(s, 'save').some((e) => e.by === 0) || of(s, 'goal').length > 0).toBe(true);
        }
    });

    it('vale contra o golpe máximo do rival também (não existe parry à parte)', () => {
        // o capitão do time 0 solta o golpe máximo N1; o goleiro do time 1 é o capitão, com a bicuda armada
        let seen = 0;
        for (let k = 0; k < 20 && seen < 3; k++) {
            const s = setup({ level: 1, seed: `gu-vs-${k}` });
            for (const p of s.players) if (p.team === 1) p.captain = p.idx === 5;
            s.teams[1].agency.max = { idx: 5, until: 200, level: 1, q: 2 };
            const cmds = IDLE_ALL(s);
            cmds[4] = { type: 'shoot', target: v(40, 10), power: 1 };
            step(s, cmds);
            idle(s, 20);
            const gk = of(s, 'max').find((e) => e.team === 1);
            if (!gk) continue;
            seen++;
            expect(gk).toMatchObject({ by: 5, phase: 'hit', level: 1 });
            expect(of(s, 'max').find((e) => e.team === 0)).toMatchObject({ by: 4, phase: 'hit' });
        }
        expect(seen).toBeGreaterThan(0);
    });

    it('goleiro que não é capitão não tem bicuda: o golpe armado do capitão de linha fica pro chute dele', () => {
        for (const s of reached(1, 'linha', 2, 4)) {
            expect(of(s, 'max')).toHaveLength(0);
            expect(s.teams[0].agency.max).toMatchObject({ idx: 4 });
        }
        // e a ordem `parry` não existe mais (a Liga e o Duelo recusam)
        expect(validOrder({ tick: 1, team: 0, kind: 'parry', q: 2 } as never)).toBe(false);
    });

    it('sem barra não tem bicuda: o pedido não arma e o goleiro defende normal', () => {
        const s = bicudaScene(null, 'gu-bi-vazia');
        expect(maxCharge(s.events, 0, 0).level).toBe(0);
        const fresh = createMatch(
            FUTSAL_5,
            { ...team('gu-bi-a'), captainUid: team('gu-bi-a').lineup[0].uid },
            team('gu-bi-b'),
            'x',
        );
        fresh.phase = 'play';
        applyAgencyOrder(fresh, { tick: 0, team: 0, kind: 'max', q: 2 });
        expect(fresh.teams[0].agency.max).toBeNull();
        expect(of(s, 'max')).toHaveLength(0);
    });

    it('botão: a hora da bicuda acende com qualquer chute do rival vindo no gol (golpe máximo ou não)', () => {
        const s = shoot({ level: 1, seed: 'gu-cue' });
        const snap = snapshot(s);
        expect(snap.shot).toEqual({ by: 4, max: true });
        expect(maxCue(snap, 1, 5, 'GK', FUTSAL_5.pitch)).toBe(true);
        expect(maxCue(snap, 0, 0, 'GK', FUTSAL_5.pitch)).toBe(false);
        expect(maxCue({ ...snap, shot: { by: 4, max: false } }, 1, 5, 'GK', FUTSAL_5.pitch)).toBe(true);
        // depois do goleiro, nada aceso
        expect(maxCue({ ...snap, shot: undefined }, 1, 5, 'GK', FUTSAL_5.pitch)).toBe(false);
    });
});
