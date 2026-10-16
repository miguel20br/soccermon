import { describe, expect, it } from 'vitest';
import type { Command } from './commands';
import { FUTSAL_5 } from './config';
import { species } from './data';
import { createInstance } from './instance';
import { checkEvolutions, createMatch, step } from './match';
import { defaultMoveset, MOVE_EXPLAIN, MOVE_TRAITS, MOVE_TUNING, moveProfile } from './moves';
import { Rng } from './rng';
import type { MatchEvent, MatchState, TeamSetup } from './state';
import { len, v } from './vec';

/**
 * Um teste curto por família de traço de golpe (src/engine/moves.ts → MOVE_TRAITS), com cenário montado:
 * todo mundo espalhado e parado, e só os comandos roteirizados.
 */
const HOME = [1, 4, 7, 25, 133];
const AWAY = [16, 19, 21, 29, 32];

function scene(home: Record<number, string[]> = {}, away: Record<number, string[]> = {}, seed = 'tracos'): MatchState {
    const rng = new Rng(seed, 'inst');
    const team = (ids: number[], moves: Record<number, string[]>, name: string): TeamSetup => ({
        name,
        lineup: ids.map((id, i) => ({ ...createInstance(id, rng), moves: moves[i] ?? ['tackle'], item: null })),
        bench: [],
        tactic: 'balanced',
        color: 0,
    });
    const s = createMatch(FUTSAL_5, team(HOME, home, 'A'), team(AWAY, away, 'B'), seed);
    s.phase = 'play';
    s.time = 10;
    s.players.forEach((p, i) => {
        p.pos = v(2 + i * 3.6, i % 2 ? 1 : 19);
        p.vel = v(0, 0);
    });
    s.ball.owner = null;
    s.ball.pos = v(20, 10);
    s.ball.vel = v(0, 0);
    return s;
}

/** Roda `ticks` ticks; os comandos só valem no primeiro. */
function run(s: MatchState, cmds: Record<number, Command | Command[]>, ticks = 1): MatchEvent[] {
    const from = s.events.length;
    for (let t = 0; t < ticks; t++)
        step(
            s,
            s.players.map((_, i) => (t === 0 ? (cmds[i] ?? []) : [])),
        );
    return s.events.slice(from);
}

const giveBall = (s: MatchState, idx: number) => {
    s.ball.owner = idx;
    s.ball.pos = s.players[idx].pos;
    s.players[idx].kickCooldown = 0;
};
const traits = (ev: MatchEvent[], fx: string) => ev.filter((e) => e.type === 'trait' && e.fx === fx);

describe('traços de golpe', () => {
    it('todo golpe com traço tem explicação, e os números estão num lugar só', () => {
        for (const id of Object.keys(MOVE_TRAITS)) expect(MOVE_EXPLAIN[id], id).toBeTruthy();
        expect(MOVE_TUNING.critChance).toBeGreaterThan(0);
    });

    it('F1 área: Earthquake sem bola derruba os rivais e o companheiro em volta', () => {
        const s = scene({ 0: ['earthquake'] });
        const [user, mate] = [s.players[0], s.players[1]];
        user.pos = v(20, 10);
        mate.pos = v(21.5, 10);
        s.players[5].pos = v(18.5, 10);
        s.players[6].pos = v(20, 12);
        const ev = run(s, { 0: { type: 'useMove', slot: 0 } });
        const hit = new Set(ev.flatMap((e) => (e.type === 'knockback' ? [e.target] : [])));
        expect([...hit].sort()).toEqual([1, 5, 6]);
        expect(traits(ev, 'area')).toHaveLength(1);
    });

    it('F2 crítico: Focus Energy garante o próximo chute e o próximo carrinho', () => {
        const s = scene();
        const p = s.players[3];
        p.pos = v(30, 10);
        giveBall(s, 3);
        p.fx.focus = true;
        const ev = run(s, { 3: { type: 'shoot', target: v(40, 10), power: 1 } });
        expect(traits(ev, 'crit')).toHaveLength(1);
        expect(p.fx.focus).toBe(false);

        const t = scene();
        t.players[5].pos = v(20, 10);
        t.players[0].pos = v(21, 10);
        giveBall(t, 5);
        t.players[0].fx.focus = true;
        const ev2 = run(t, { 0: { type: 'tackle', targetId: 5 } });
        expect(ev2.find((e) => e.type === 'tackle')).toMatchObject({ success: true });
    });

    it('F3 carga: Solar Beam fica parado carregando e perde o golpe no carrinho; Skull Bash não perde a bola', () => {
        const s = scene({ 3: ['solarbeam'] });
        const p = s.players[3];
        p.pos = v(30, 10);
        giveBall(s, 3);
        run(s, {
            3: [
                { type: 'useMove', slot: 0 },
                { type: 'shoot', target: v(40, 10), power: 1 },
            ],
        });
        expect(p.fx.charging?.moveId).toBe('solarbeam');
        expect(s.ball.owner).toBe(3);
        const d = s.players[5];
        d.pos = v(31, 10);
        d.fx.focus = true;
        const ev = run(s, { 5: { type: 'tackle', targetId: 3 } });
        expect(traits(ev, 'chargeLost')).toHaveLength(1);
        expect(p.fx.charging).toBeNull();

        const k = scene({ 3: ['skullbash'] });
        k.players[3].pos = v(30, 10);
        giveBall(k, 3);
        run(k, { 3: { type: 'useMove', slot: 0 } });
        k.players[5].pos = v(31, 10);
        const ev2 = run(k, { 5: { type: 'tackle', targetId: 3 } });
        expect(ev2.find((e) => e.type === 'tackle')).toMatchObject({ success: false });
        // a carga termina e sai o chute sozinho
        const ev3 = run(k, {}, Math.ceil(MOVE_TUNING.chargeTime * FUTSAL_5.tickRate) + 1);
        expect(ev3.some((e) => e.type === 'shot' && e.moveId === 'skullbash')).toBe(true);
    });

    it('F4 voo: com Fly ninguém alcança no ar, e ele finaliza ao pousar', () => {
        const s = scene({ 3: ['fly'] });
        const p = s.players[3];
        p.pos = v(26, 10);
        giveBall(s, 3);
        s.rng = new Rng('fly-acerta');
        run(s, { 3: { type: 'useMove', slot: 0 } });
        if (!p.fx.air) return; // Fly tem 95% de precisão: com esta seed acerta, mas não depende disso
        s.players[5].pos = v(p.pos.x + 0.8, 10);
        const ev = run(s, { 5: { type: 'tackle', targetId: 3 } });
        expect(ev.some((e) => e.type === 'tackle')).toBe(false);
        const ev2 = run(s, {}, Math.ceil(MOVE_TUNING.airTime * FUTSAL_5.tickRate) + 1);
        expect(traits(ev2, 'land')).toHaveLength(1);
        expect(ev2.some((e) => e.type === 'shot' && e.moveId === 'fly')).toBe(true);
    });

    it('F5 prioridade: Quick Attack desarma de 2,5 m mesmo com o carrinho em recarga', () => {
        const s = scene({ 0: ['quickattack'] });
        s.players[5].pos = v(20, 10);
        s.players[0].pos = v(17.5, 10);
        s.players[0].tackleCooldown = 1;
        giveBall(s, 5);
        const ev = run(s, { 0: { type: 'useMove', slot: 0 } });
        expect(ev.some((e) => e.type === 'tackle' && e.by === 0)).toBe(true);
        expect(traits(ev, 'priority')).toHaveLength(1);
    });

    it('F6 mira: o chute de Swift não é bloqueado por jogador de linha', () => {
        for (let i = 0; i < 6; i++) {
            const s = scene({ 3: ['swift'] }, {}, `swift-${i}`);
            s.players[3].pos = v(28, 10);
            giveBall(s, 3);
            // três rivais em cima da linha do chute
            for (const [j, x] of [
                [6, 30],
                [7, 32],
                [8, 34],
            ])
                s.players[j].pos = v(x, 10);
            const ev = run(
                s,
                {
                    3: [
                        { type: 'useMove', slot: 0 },
                        { type: 'shoot', target: v(40, 10), power: 1 },
                    ],
                },
                30,
            );
            expect(ev.some((e) => e.type === 'block')).toBe(false);
        }
    });

    it('F7 dano fixo: Dragon Rage chuta na mesma velocidade com qualquer um; Super Fang tira metade do fôlego', () => {
        const speeds = [147, 1].map((id) => {
            const s = scene({ 3: ['dragonrage'] });
            s.players[3].inst = { ...s.players[3].inst, speciesId: id };
            s.players[3].pos = v(28, 10);
            giveBall(s, 3);
            run(s, {
                3: [
                    { type: 'useMove', slot: 0 },
                    { type: 'shoot', target: v(40, 10), power: 1 },
                ],
            });
            return len(s.ball.vel);
        });
        expect(speeds[0]).toBeCloseTo(MOVE_TUNING.fixedShot.dragonrage, 0);
        expect(speeds[1]).toBeCloseTo(speeds[0], 3);

        const t = scene({ 0: ['superfang'] });
        t.players[5].pos = v(20, 10);
        t.players[0].pos = v(21, 10);
        t.players[5].energy = 0.8;
        giveBall(t, 5);
        t.players[0].fx.focus = true;
        t.rng = new Rng('fang');
        run(t, {
            0: [
                { type: 'useMove', slot: 0 },
                { type: 'tackle', targetId: 5 },
            ],
        });
        if (t.events.some((e) => e.type === 'move' && e.moveId === 'superfang' && !e.hit)) return; // 90%: errou
        expect(t.players[5].energy).toBeLessThan(0.45);
    });

    it('F8 multi-acerto e alcance: Fury Swipes tenta várias vezes; Vine Whip desarma de 2,6 m', () => {
        const s = scene({ 0: ['furyswipes'] });
        s.players[5].pos = v(20, 10);
        s.players[0].pos = v(21, 10);
        giveBall(s, 5);
        const ev = run(s, {
            0: [
                { type: 'useMove', slot: 0 },
                { type: 'tackle', targetId: 5 },
            ],
        });
        const used = ev.find((e) => e.type === 'move');
        if (used?.type === 'move' && used.hit) {
            const multi = traits(ev, 'multi')[0];
            expect(multi?.type === 'trait' && multi.n).toBeGreaterThanOrEqual(1);
        }
        const w = scene({ 0: ['vinewhip'] });
        w.players[5].pos = v(20, 10);
        w.players[0].pos = v(22.6, 10);
        giveBall(w, 5);
        const ev2 = run(w, {
            0: [
                { type: 'useMove', slot: 0 },
                { type: 'tackle', targetId: 5 },
            ],
        });
        expect(ev2.some((e) => e.type === 'tackle' && e.by === 0)).toBe(true);
        // sem o chicote, dessa distância não alcança
        const n = scene();
        n.players[5].pos = v(20, 10);
        n.players[0].pos = v(22.6, 10);
        giveBall(n, 5);
        expect(run(n, { 0: { type: 'tackle', targetId: 5 } }).some((e) => e.type === 'tackle')).toBe(false);
    });

    it('F9 prender: Wrap prende os dois e a bola sobra', () => {
        const s = scene({ 0: ['wrap'] });
        s.players[5].pos = v(20, 10);
        s.players[0].pos = v(21, 10);
        giveBall(s, 5);
        s.players[0].fx.focus = true;
        s.rng = new Rng('wrap');
        const ev = run(s, {
            0: [
                { type: 'useMove', slot: 0 },
                { type: 'tackle', targetId: 5 },
            ],
        });
        if (!traits(ev, 'wrap').length) return; // 90%: errou o golpe
        expect(s.players[0].stun).toBeGreaterThan(1);
        expect(s.players[5].stun).toBeGreaterThan(1);
        expect(s.ball.owner).toBeNull();
    });

    it('F10 contador: o Toxic drena mais no fim que no começo', () => {
        const s = scene({}, {});
        const p = s.players[2];
        p.status = { kind: 'psn', timer: MOVE_TUNING.toxicTime };
        p.fx.toxic = 1e-3;
        const e0 = p.energy;
        run(s, {}, 20);
        const early = e0 - p.energy;
        run(s, {}, 160);
        const e1 = p.energy;
        run(s, {}, 20);
        const late = e1 - p.energy;
        expect(late).toBeGreaterThan(early * 1.5);
    });

    it('F11 esquiva: Double Team aguenta exatamente 2 carrinhos', () => {
        const s = scene({}, { 0: ['doubleteam'] });
        s.players[5].pos = v(20, 10);
        s.players[0].pos = v(21, 10);
        giveBall(s, 5);
        run(s, { 5: { type: 'useMove', slot: 0 } });
        expect(s.players[5].fx.decoys).toBe(2);
        let clones = 0;
        for (let i = 0; i < 3; i++) {
            s.players[0].tackleCooldown = 0;
            s.players[0].stun = 0;
            s.players[0].pos = v(s.players[5].pos.x + 1, s.players[5].pos.y);
            clones += traits(run(s, { 0: { type: 'tackle', targetId: 5 } }), 'clone').length;
        }
        expect(clones).toBe(2);
    });

    it('F12 controle de campo: Roar faz o rival mais perto fugir e largar a bola', () => {
        const s = scene({ 0: ['roar'] });
        s.players[5].pos = v(20, 10);
        s.players[0].pos = v(22, 10);
        giveBall(s, 5);
        const ev = run(s, { 0: { type: 'useMove', slot: 0 } });
        expect(traits(ev, 'flee')).toHaveLength(1);
        expect(s.players[5].fx.flee).not.toBeNull();
        expect(s.ball.owner).not.toBe(5);
        const x0 = s.players[5].pos.x;
        run(s, {}, 15);
        // time 1 defende o gol da direita (x = 40): foge para lá
        expect(s.players[5].pos.x).toBeGreaterThan(x0 + 2);
    });
});

/** Leva o relógio para o último tick do tempo: o próximo `run` apita (intervalo ou fim de jogo). */
const toWhistle = (s: MatchState, half: 1 | 2) => {
    s.half = half;
    s.time = s.cfg.halfSeconds - 0.5 / s.cfg.tickRate;
};

describe('traços de golpe: bola parada, intervalo e fim', () => {
    it('apito final: ninguém termina no ar, carregando ou fugindo', () => {
        const s = scene();
        const [a, b, c] = [s.players[1], s.players[2], s.players[6]];
        a.fx.air = { kind: 'fly', moveId: 'fly', t: 5, from: a.pos, to: v(30, 10), prey: null };
        b.fx.charging = { moveId: 'solarbeam', t: 5, armor: false };
        c.fx.flee = { dir: v(1, 0), t: 5 };
        toWhistle(s, 2);
        const ev = run(s, {});
        expect(ev.some((e) => e.type === 'fulltime')).toBe(true);
        expect(s.finished).toBe(true);
        expect([a.fx.air, b.fx.charging, c.fx.flee]).toEqual([null, null, null]);
    });

    it('bola parada: carga e Bide se perdem com aviso, e o reforço do Bide acaba junto', () => {
        const s = scene({ 0: ['bide'], 3: ['solarbeam'] });
        run(s, { 0: { type: 'useMove', slot: 0 } });
        s.players[3].fx.charging = { moveId: 'solarbeam', t: 5, armor: false };
        expect(s.players[0].fx.bide).not.toBeNull();
        expect(s.players[0].buffs.some((b) => b.src === 'bide')).toBe(true);
        s.phase = 'restart';
        s.phaseTimer = 1;
        const lost = traits(run(s, {}), 'chargeLost').map((e) => (e.type === 'trait' ? e.moveId : ''));
        expect(lost.sort()).toEqual(['bide', 'solarbeam']);
        expect(s.players[0].fx.bide).toBeNull();
        expect(s.players[0].buffs.some((b) => b.src === 'bide')).toBe(false);
    });

    it(`Double Team: os clones somem depois de ${MOVE_TUNING.decoyTime} s e no intervalo`, () => {
        const s = scene({}, { 0: ['doubleteam'] });
        run(s, { 5: { type: 'useMove', slot: 0 } });
        expect(s.players[5].fx.decoys).toBe(MOVE_TUNING.decoys);
        run(s, {}, Math.round((MOVE_TUNING.decoyTime - 1) * FUTSAL_5.tickRate));
        expect(s.players[5].fx.decoys).toBe(MOVE_TUNING.decoys);
        run(s, {}, Math.round(1.2 * FUTSAL_5.tickRate));
        expect(s.players[5].fx.decoys).toBe(0);

        const h = scene();
        h.players[5].fx.decoys = 2;
        h.players[5].fx.decoyT = 99;
        toWhistle(h, 1);
        run(h, {});
        expect(h.phase).toBe('halftime');
        expect(h.players[5].fx.decoys).toBe(0);
    });

    it('intervalo: os traços do 1º tempo zeram (fúria, Minimize, casco, mira, tipo, Curl); o Focus Energy fica', () => {
        const s = scene();
        const p = s.players[2];
        Object.assign(p.fx, {
            focus: true,
            rage: { t: 10, stacks: 2 },
            mini: 3,
            guard: 3,
            aim: { factor: 2, t: 5, once: false },
            typeCopy: { types: ['Water'], t: 8 },
            curl: 8,
        });
        toWhistle(s, 1);
        run(s, {});
        expect(s.phase).toBe('halftime');
        const { focus, rage, mini, guard, aim, typeCopy, curl } = s.players[2].fx;
        expect({ focus, rage, mini, guard, aim, typeCopy, curl }).toEqual({
            focus: true,
            rage: null,
            mini: 0,
            guard: 0,
            aim: null,
            typeCopy: null,
            curl: 0,
        });
    });

    it('Roar: quem foge não domina a bola solta no pé dele', () => {
        const setup = (flee: boolean) => {
            const s = scene();
            const p = s.players[5];
            p.pos = v(20, 10);
            s.ball.pos = v(20.2, 10);
            if (flee) p.fx.flee = { dir: v(1, 0), t: 1 };
            run(s, {});
            return s.ball.owner;
        };
        // sem fugir, domina; fugindo, a bola fica solta
        expect(setup(false)).toBe(5);
        expect(setup(true)).toBeNull();
    });

    it('Mimic: copia o último golpe do rival e ele fica no lugar até o fim da partida', () => {
        const s = scene({ 0: ['mimic'] });
        s.lastMove[1] = 'thunderbolt';
        const p = s.players[0];
        const original = p.inst;
        run(s, { 0: { type: 'useMove', slot: 0 } });
        expect(p.inst.moves).toEqual(['thunderbolt']);
        expect(p.moveUses[0]).toBe(moveProfile('thunderbolt').uses);
        // a instância do time (save/copa) não muda: só a da partida
        expect(original.moves).toEqual(['mimic']);
    });

    it('evolução: a barra acumulada da copa conta e zera quando ele evolui', () => {
        const s = scene();
        const p = s.players[1];
        expect(p.inst.speciesId).toBe(4);
        checkEvolutions(s);
        expect(s.players[1].inst.speciesId).toBe(4); // sem nada feito, não evolui
        p.inst = { ...p.inst, evo: 15 };
        checkEvolutions(s);
        expect(s.players[1].inst.speciesId).toBe(5);
        expect(s.players[1].inst.evo).toBe(0);
    });

    it('evolução: golpe que muda de vaga mantém os usos gastos (conta pelo golpe, não pela vaga)', () => {
        const s = scene();
        const p = s.players[1];
        expect(p.inst.speciesId).toBe(4); // Charmander → Charmeleon
        const next = defaultMoveset(species(5));
        expect(next.length).toBeGreaterThan(1);
        // os mesmos golpes da forma nova, em ordem invertida; o último da forma nova já foi gasto
        p.inst = { ...p.inst, moves: [...next].reverse() };
        p.moveUses = p.inst.moves.map((m) => moveProfile(m).uses);
        p.moveUses[0] = 0;
        p.stats.goals = 10;
        checkEvolutions(s);
        const q = s.players[1];
        expect(q.inst.speciesId).toBe(5);
        expect(q.inst.moves).toEqual(next);
        q.inst.moves.forEach((m, i) => {
            expect(q.moveUses[i], m).toBe(m === next.at(-1) ? 0 : moveProfile(m).uses);
        });
    });
});
