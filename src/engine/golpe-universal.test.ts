import { describe, expect, it } from 'vitest';
import { AGENCY, bicudaCueNear, maxCharge } from './agency';
import { type Command, IDLE } from './commands';
import { FUTSAL_5 } from './config';
import { SPECIES } from './data';
import { aiDraftTeam } from './draft';
import { isIncapacitated } from './effective';
import { createInstance } from './instance';
import { applyAgencyOrder, createMatch, maxFxType, step } from './match';
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
        // no chute ninguém caiu ainda: cada um cai quando a bola chega nele (Miguel, 01/11: caíam antes da bola)
        expect(of(n2, 'knockback')).toEqual([]);
        expect(n2.players[6].stun).toBe(0);
        idle(n2, 12);
        expect(n2.players[6].stun).toBeGreaterThan(0);
        expect(n2.players[7].stun).toBeGreaterThan(0);
        expect(n2.players[8].stun).toBe(0);
        expect(n2.players[5].stun).toBe(0);
        const hits = of(n2, 'knockback');
        expect(hits.map((e) => e.target)).toEqual([7, 6]);
        // o da frente (3 m) antes do de trás (6 m), e a bola já perto de cada um quando ele cai
        expect(hits[0].tick).toBeGreaterThan(1);
        expect(hits[1].tick).toBeGreaterThan(hits[0].tick);
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
function bicudaScene(level: 1 | 2 | 3 | null, seed: string, q: 0 | 1 | 2 = 2, cap = 0, wall = false) {
    const A = team('gu-bi-a');
    const B = team('gu-bi-b');
    const s = createMatch(FUTSAL_5, { ...A, captainUid: A.lineup[cap].uid }, B, seed);
    s.phase = 'play';
    const spots = [v(0.7, 10), v(30, 3), v(30, 17), v(25, 10), v(34, 10), v(39.3, 10), v(20, 3), v(20, 17), v(14, 10)];
    s.players.forEach((p, i) => {
        p.pos = spots[i] ?? v(8, 10);
        p.vel = v(0, 0);
    });
    // `wall`: o fixo (idx 1) na frente do chute, pra bloquear
    if (wall) s.players[1].pos = v(4, 10);
    if (level) s.teams[0].agency.max = { idx: cap, until: 200, level, q };
    rivalShoots(s);
    return s;
}

/** O rival (idx 9) chuta de 8 m no meio do gol do time 0 e o lance roda até o desfecho (bicuda, defesa, gol ou bloqueio). */
function rivalShoots(s: MatchState) {
    const seen = s.events.length;
    const done = () => s.events.slice(seen).some((e) => ['max', 'save', 'goal', 'block'].includes(e.type));
    s.players[9].pos = v(8, 10);
    s.players[9].kickCooldown = 0;
    s.ball.owner = 9;
    s.ball.pos = v(7.7, 10);
    s.ball.vel = v(0, 0);
    s.ball.shot = null;
    const cmds = IDLE_ALL(s);
    cmds[9] = { type: 'shoot', target: v(0, 10), power: 1 };
    step(s, cmds);
    for (let i = 0; i < 30 && !done(); i++) idle(s, 1);
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

    it('toque fora: a bicuda sai mesmo assim, mais fraca (Miguel 05/11: N1/N2 sempre cruzam, N3 sempre chuta)', () => {
        for (const s of reached(2, 'fora', 0)) {
            expect(of(s, 'max')).toEqual([expect.objectContaining({ by: 0, team: 0, phase: 'hit', level: 2, q: 0 })]);
            expect(s.teams[0].agency.max).toBeNull();
            expect(s.ball.lastKick).toMatchObject({ by: 0, kind: 'pass' });
        }
        for (const s of reached(3, 'fora3', 0)) expect(s.ball.shot).toMatchObject({ by: 0, max: { level: 3 } });
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

    it('botão: a bicuda acende só no chute que o goleiro capitão vai alcançar, do chute até o toque nele', () => {
        // alcançou (golpe máximo do rival ou não): o evento `gkReach` marca a hora, do chute até um tick antes do toque
        for (const s of reached(null, 'cue', 2, 0, 10)) {
            const reach = of(s, 'gkReach')[0];
            const shot = of(s, 'shot').find((e) => e.by === 9)!;
            expect(reach).toMatchObject({ by: 0, shooter: 9, from: shot.tick });
            expect(bicudaCueNear(s.events, shot.tick, shot.tick, 0)).toBe(true);
            expect(bicudaCueNear(s.events, reach.tick - 1, reach.tick - 1, 0)).toBe(true);
            // depois do toque, e antes do chute, apagado; e nunca pro goleiro do rival
            expect(bicudaCueNear(s.events, reach.tick, reach.tick + 20, 0)).toBe(false);
            expect(bicudaCueNear(s.events, 0, shot.tick - 1, 0)).toBe(false);
            expect(bicudaCueNear(s.events, 0, 999, 5)).toBe(false);
        }
        // bloqueado antes de chegar nele: não acende
        let blocked = 0;
        for (let k = 0; k < 40; k++) {
            const s = bicudaScene(null, `gu-bi-wall-${k}`, 2, 0, true);
            if (!of(s, 'block').some((e) => e.by === 1)) continue;
            blocked++;
            expect(of(s, 'gkReach')).toHaveLength(0);
            expect(bicudaCueNear(s.events, 0, s.tick, 0)).toBe(false);
        }
        expect(blocked).toBeGreaterThan(0);
        // goleiro que não é capitão: sem o evento
        for (let k = 0; k < 5; k++) expect(of(bicudaScene(null, `gu-bi-nc-${k}`, 2, 4), 'gkReach')).toHaveLength(0);
    });

    it('o toque vale só pra aquele chute: bloqueado, o pedido some sem gastar e o chute seguinte é defesa normal', () => {
        let seen = 0;
        for (let k = 0; k < 40 && seen < 3; k++) {
            const s = bicudaScene(2, `gu-bi-once-${k}`, 2, 0, true);
            if (!of(s, 'block').some((e) => e.by === 1)) continue;
            seen++;
            idle(s, 1);
            expect(s.teams[0].agency.max).toBeNull();
            // o fixo sai da frente; o 2º chute chega no goleiro sem bicuda (antes ficava armada 5 s e saía aqui)
            s.players[1].pos = v(30, 3);
            for (let n = 0; n < 10 && !of(s, 'gkReach').length; n++) rivalShoots(s);
            expect(of(s, 'gkReach').length).toBeGreaterThan(0);
            expect(of(s, 'max')).toHaveLength(0);
        }
        expect(seen).toBeGreaterThan(0);
    });

    it('a ordem da bicuda só arma na hora dela (o chute do rival no ar ou o rival com a bola na zona do goleiro)', () => {
        const A = team('gu-bi-a');
        const s = createMatch(FUTSAL_5, { ...A, captainUid: A.lineup[0].uid }, team('gu-bi-b'), 'gu-bi-hora');
        s.phase = 'play';
        // barra no N1 (10 defesas do time 0)
        for (let i = 0; i < 10; i++)
            s.events.push({ tick: 0, half: 1, minute: 0, type: 'save', by: 0, shooter: 9, caught: true });
        expect(maxCharge(s.events, 0, 0).level).toBe(1);
        const order = { tick: 0, team: 0 as const, kind: 'max' as const, q: 2 as const };
        // bola do rival longe do gol do time 0: o toque (atrasado) não arma nada pro próximo chute
        s.ball.owner = 9;
        s.players[9].pos = v(30, 10);
        applyAgencyOrder(s, order);
        expect(s.teams[0].agency.max).toBeNull();
        // o rival na zona do goleiro: arma
        s.players[9].pos = v(8, 10);
        applyAgencyOrder(s, order);
        expect(s.teams[0].agency.max).toMatchObject({ idx: 0, level: 1 });
    });
});

describe('N1 por tipo (tabela do Miguel, 02/11/2026)', () => {
    /** Para no tick em que o efeito `status` do N1 do tipo `type` pega `target` (0 = não pegou em `n` seeds). */
    function n1Hit(type: string, status: string, target = 5, o: Opts = {}, n = 200) {
        for (let k = 0; k < n; k++) {
            const s = shoot({ level: 1, type, seed: `gu-n1-${k}`, ...o });
            for (let i = 0; i < 40 && !s.finished; i++) {
                if (of(s, 'status').some((e) => e.target === target && e.source === 'max' && e.status === status))
                    return s;
                step(s, IDLE_ALL(s));
            }
        }
        return null;
    }

    it('Psíquico faz dormir (não confunde mais)', () => {
        const s = n1Hit('Psychic', 'slp');
        expect(s?.players[5].status?.kind).toBe('slp');
    });

    it('Planta: a semente do Leech Seed, o fôlego vai pro capitão que chutou', () => {
        const s = n1Hit('Grass', 'seed', 6, { defAt: [{ x: 36, y: 10 }] }) ?? n1Hit('Grass', 'seed');
        const target = s && of(s, 'status').find((e) => e.status === 'seed' && e.source === 'max')?.target;
        expect(target).toBeDefined();
        expect(s?.players[target as number].seeded).toMatchObject({ by: 4, timer: AGENCY.maxN1.seed });
    });

    it('Terrestre: areia nos olhos (o blind do Sand Attack, 6 s)', () => {
        const s = n1Hit('Ground', 'blind');
        expect(s?.players[5].fx.aim).toEqual({ factor: 2, t: 6, once: false });
    });

    it('Inseto: a teia deixa lento por 3 s', () => {
        const s = n1Hit('Bug', 'web');
        expect(s?.players[5].buffs).toContainEqual({
            attr: 'pace',
            factor: AGENCY.maxN1.webPace,
            timer: AGENCY.maxN1.web,
        });
    });

    it('Água: leva quem defende 2 m pra trás, no sentido do chute', () => {
        for (let k = 0; k < 200; k++) {
            const s = shoot({ level: 1, type: 'Water', seed: `gu-n1-${k}`, defAt: [{ x: 35, y: 10 }] });
            for (let i = 0; i < 40; i++) {
                const before = s.players[6].pos.x;
                step(s, IDLE_ALL(s));
                const kb = of(s, 'knockback').find((e) => e.target === 6 && e.moveId === 'surf');
                if (!kb) continue;
                // a onda (2 m) por cima do empurrão do bloqueio com golpe (1 m)
                expect(s.players[6].pos.x - before).toBeGreaterThanOrEqual(AGENCY.maxN1.push);
                return;
            }
        }
        throw new Error('a onda não pegou ninguém');
    });

    it('Voador: vai pro alto 1 s, fora do lance, e volta sem o pouso do Fly', () => {
        const s = n1Hit('Flying', 'lift');
        expect(s?.players[5].fx.air).not.toBeNull();
        if (!s) return;
        const tick = s.tick;
        idle(s, Math.round(AGENCY.maxN1.lift * 20) + 1);
        expect(s.players[5].fx.air).toBeNull();
        expect(of(s, 'trait').filter((e) => e.by === 5 && e.tick > tick && e.fx === 'land')).toEqual([]);
        expect(s.players[5].tackleBonus).toBeNull();
    });

    it('Lutador: mão dormente, a próxima defesa do goleiro não encaixa', () => {
        const s = n1Hit('Fighting', 'numb');
        expect(s?.players[5].fx.numb).toBe(true);
        // a próxima defesa: chute comum no goleiro, com e sem a mão dormente (mesma seed)
        const caughtWith = (numb: boolean) => {
            let caught = 0;
            for (let k = 0; k < 60; k++) {
                const t = setup({ seed: `gu-numb-${k}` });
                t.teams[0].agency.max = null;
                t.players[5].fx.numb = numb;
                const cmds = IDLE_ALL(t);
                cmds[4] = { type: 'shoot', target: v(40, 10.5), power: 0.6 };
                step(t, cmds);
                idle(t, 30);
                caught += of(t, 'save').filter((e) => e.by === 5 && e.caught).length;
                if (of(t, 'save').some((e) => e.by === 5)) expect(t.players[5].fx.numb).toBe(false);
            }
            return caught;
        };
        expect(caughtWith(false)).toBeGreaterThan(0);
        expect(caughtWith(true)).toBe(0);
    });

    it('Pedra: preso no lugar 2 s (não anda), mas ainda defende', () => {
        const s = n1Hit('Rock', 'root', 6, { defAt: [{ x: 36, y: 10 }] });
        expect(s?.players[6].fx.root).toBeGreaterThan(1.9);
        if (!s) return;
        const at = s.players[6].pos;
        for (let i = 0; i < 20; i++) {
            const cmds = IDLE_ALL(s);
            cmds[6] = { type: 'move', dir: v(0, 1), sprint: true };
            step(s, cmds);
        }
        expect(s.players[6].pos).toEqual(at);
        expect(isIncapacitated(s.players[6])).toBe(false);
    });

    it('Dragão: o time de quem defendeu perde 5 pontos da barra', () => {
        const s = n1Hit('Dragon', 'drain');
        expect(s).not.toBeNull();
        const B = { tick: 0, half: 1, minute: 0 } as const;
        const saves: MatchEvent[] = Array.from({ length: 12 }, (_, i) => ({
            ...B,
            tick: i,
            type: 'save',
            by: 5,
            shooter: 0,
            caught: true,
        }));
        const drain: MatchEvent = { ...B, tick: 20, type: 'status', target: 5, status: 'drain', by: 4, source: 'max' };
        expect(maxCharge(saves, 1).level).toBe(1);
        expect(maxCharge([...saves, drain], 1).level).toBe(0);
        expect(maxCharge([...saves, drain], 1).charge * 30).toBeCloseTo(12 - AGENCY.maxN1.drain);
        // não mexe na barra do time de quem chutou
        expect(maxCharge([...saves, drain], 0).charge).toBe(0);
    });
});

describe('defesa do golpe máximo: nunca encaixa (Miguel, 01/11/2026)', () => {
    /** O capitão (idx 4) solta o golpe no meio do gol; devolve os lances em que o goleiro rival (idx 5) defendeu. */
    function saved(level: 1 | 2 | 3, tag: string, n: number, gkCaptain = false, armed = false) {
        const out: { s: MatchState; gkBall: boolean }[] = [];
        for (let k = 0; k < n; k++) {
            const s = setup({ level, seed: `gu-parry-${tag}-${k}` });
            if (gkCaptain) for (const p of s.players) if (p.team === 1) p.captain = p.idx === 5;
            if (armed) s.teams[1].agency.max = { idx: gkCaptain ? 5 : 9, until: 200, level: 1, q: 2 };
            const cmds = IDLE_ALL(s);
            cmds[4] = { type: 'shoot', target: v(40, 10), power: 1 };
            step(s, cmds);
            // o goleiro não fica com a bola nem logo depois da defesa (a sobra da trave é viva)
            let gkBall = false;
            for (let i = 0; i < 40 && !s.finished; i++) {
                step(s, IDLE_ALL(s));
                if (s.ball.owner === 5 && of(s, 'save').some((e) => e.by === 5)) gkBall = true;
            }
            if (of(s, 'save').some((e) => e.by === 5 && e.shooter === 4)) out.push({ s, gkBall });
        }
        return out;
    }

    it('N1 a N3: o goleiro espalma pra escanteio ou na trave (rebote vivo) e não fica com a bola', () => {
        const kinds = new Set<string>();
        for (const level of [1, 2, 3] as const) {
            const got = saved(level, String(level), level === 3 ? 160 : 40);
            if (level < 3) expect(got.length).toBeGreaterThan(3);
            for (const { s, gkBall } of got) {
                const save = of(s, 'save').find((e) => e.by === 5)!;
                expect(save.caught).toBe(false);
                expect(['corner', 'post']).toContain(save.parry);
                kinds.add(save.parry!);
                expect(gkBall).toBe(false);
                // na trave: a bola bate no poste (o 'post' do chute) e volta pra quadra
                if (save.parry === 'post') expect(of(s, 'post').some((e) => e.tick >= save.tick)).toBe(true);
                if (save.parry === 'corner')
                    expect(of(s, 'corner').some((e) => e.tick >= save.tick && e.team === 0)).toBe(true);
            }
        }
        expect([...kinds].sort()).toEqual(['corner', 'post']);
        expect(AGENCY.maxParry.post).toBeGreaterThan(0);
    });

    it('counter: só o goleiro capitão com o golpe armado devolve, e no N1 é o lançamento (só o N3 vai no gol)', () => {
        const counters = saved(1, 'counter', 30, true, true);
        expect(counters.length).toBeGreaterThan(0);
        for (const { s } of counters) {
            const save = of(s, 'save').find((e) => e.by === 5)!;
            expect(save.parry).toBeUndefined();
            expect(of(s, 'max').find((e) => e.team === 1)).toMatchObject({ by: 5, phase: 'hit', tick: save.tick });
            // N1: o lançamento pro companheiro sai no mesmo tick, sem chute no gol
            expect(of(s, 'shot').some((e) => e.by === 5 && e.tick === save.tick)).toBe(false);
            expect(s.ball.lastKick).toMatchObject({ by: 5, kind: 'pass', tick: save.tick });
        }
        // sem a condição (goleiro não é capitão, ou é capitão sem nada armado), espalma
        for (const [gkCaptain, armed] of [
            [false, true],
            [true, false],
        ] as const) {
            const got = saved(1, `sem-${gkCaptain}-${armed}`, 30, gkCaptain, armed);
            expect(got.length).toBeGreaterThan(0);
            for (const { s } of got) {
                expect(of(s, 'max').some((e) => e.team === 1 && e.phase === 'hit')).toBe(false);
                expect(['corner', 'post']).toContain(of(s, 'save').find((e) => e.by === 5)!.parry);
            }
        }
    });
});

describe('golpe de linha armado até o chute (motor 19)', () => {
    /** Lance montado sem nada armado, com a barra no N1 e a bola com o goleiro do time (o capitão sem ela). */
    function armed() {
        const s = setup();
        s.teams[0].agency.max = null;
        addSaves(s, 10);
        s.ball.owner = 0;
        s.ball.pos = s.players[0].pos;
        applyAgencyOrder(s, { tick: s.tick, team: 0, kind: 'max', q: 2 });
        expect(s.teams[0].agency.max).toMatchObject({ idx: 4, level: 1 });
        return s;
    }
    const addSaves = (s: MatchState, n: number) => {
        for (let i = 0; i < n; i++)
            s.events.push({ tick: s.tick, half: 1, minute: 0, type: 'save', by: 0, shooter: 9, caught: true });
    };

    it('a ordem longe do chute sai no próximo chute da zona, bem depois de maxArmTicks, no nível da barra', () => {
        const s = armed();
        // o Duelo carimba a ordem 2 s à frente: até o motor 18 ela sumia em `maxArmTicks`
        idle(s, AGENCY.maxArmTicks + 50);
        expect(s.teams[0].agency.max).toMatchObject({ idx: 4 });
        expect(of(s, 'max')).toHaveLength(0);
        // a barra encheu armada: sai no N2
        addSaves(s, 10);
        s.ball.owner = 4;
        s.ball.pos = v(30.3, 10);
        const cmds = IDLE_ALL(s);
        cmds[4] = { type: 'shoot', target: v(40, 10), power: 1 };
        step(s, cmds);
        expect(of(s, 'max').at(-1)).toMatchObject({ phase: 'hit', by: 4, level: 2 });
        expect(s.teams[0].agency.max).toBeNull();
    });

    it('o intervalo cancela o armado sem gastar a barra', () => {
        const s = armed();
        s.time = s.cfg.halfSeconds;
        for (let i = 0; i < 2000 && s.phase !== 'halftime'; i++) idle(s, 1);
        expect(s.phase).toBe('halftime');
        expect(s.teams[0].agency.max).toBeNull();
        expect(of(s, 'maxArm').map((e) => e.on)).toEqual([true, false]);
        expect(maxCharge(s.events, 0, s.tick).level).toBe(1);
    });
});
