import { describe, expect, it } from 'vitest';
import { AGENCY } from './agency';
import { IDLE } from './commands';
import { FUTSAL_5, withConfig } from './config';
import { SPECIES, species } from './data';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { createMatch, maxFxType, step } from './match';
import { Rng } from './rng';
import type { MatchEvent, MatchState, TeamSetup } from './state';
import { v } from './vec';

/**
 * Golpe máximo por tipo, fase 1 (docs/planos/golpe-maximo-por-tipo.md): o lance montado na mão. Capitão (pivô, idx 4)
 * com a bola a 10 m do gol, N3 armado com toque perfeito; goleiro rival (idx 5) no gol, um zagueiro (idx 6) na linha do
 * chute a 4 m do gol e o resto longe. O capitão chuta no tick 1.
 */
function team(seed: string): TeamSetup {
    return { name: seed, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}

/** 1ª espécie de linha da Gen 1 cujo efeito N3 é `fx` (com os golpes que ela traz). */
function capOf(fx: string, skip = 0) {
    let n = 0;
    for (const sp of SPECIES) {
        if (sp.id > 151) continue;
        const inst = createInstance(sp.id, new Rng('mt-cap', String(sp.id)));
        if (maxFxType(inst.moves, sp.id, sp.types) === fx && n++ === skip) return inst;
    }
    throw new Error(`sem capitão ${fx}`);
}

interface Opts {
    seed?: string;
    flag?: boolean;
    gk?: number;
    def?: number;
    /** Onde fica o zagueiro (padrão: na linha do chute, a 4 m do gol). */
    defAt?: { x: number; y: number };
    gkY?: number;
}

function scene(fx: string, o: Opts = {}) {
    const A = team('mt-a');
    const B = team('mt-b');
    const cap = capOf(fx);
    const home = { ...A, lineup: A.lineup.map((p, i) => (i === 4 ? cap : p)), captainUid: cap.uid };
    const awayLine = B.lineup.map((p, i) =>
        i === 0 && o.gk
            ? createInstance(o.gk, new Rng('mt-gk'))
            : i === 1 && o.def
              ? createInstance(o.def, new Rng('mt-def'))
              : p,
    );
    const s = createMatch(withConfig({ maxType: o.flag ?? true }), home, { ...B, lineup: awayLine }, o.seed ?? 'mt');
    s.phase = 'play';
    const far = [v(8, 3), v(8, 17), v(4, 10), v(12, 10), v(15, 5), v(15, 15), v(20, 3)];
    s.players.forEach((p, i) => {
        p.pos = far[i % far.length];
        p.vel = v(0, 0);
    });
    const c = s.players[4];
    c.pos = v(30, 10);
    s.players[5].pos = v(39.3, o.gkY ?? 10);
    s.players[6].pos = o.defAt ? v(o.defAt.x, o.defAt.y) : v(36, 10.15);
    s.ball.owner = 4;
    s.ball.pos = v(30.3, 10);
    s.teams[0].agency.max = { idx: 4, until: 100, live: false, level: 3, q: 2 };
    const cmds = s.players.map(() => IDLE);
    cmds[4] = { type: 'shoot', target: v(40, 10.6), power: 1 };
    step(s, cmds);
    return s;
}

const idle = (s: MatchState, n: number) => {
    for (let i = 0; i < n && !s.finished; i++)
        step(
            s,
            s.players.map(() => IDLE),
        );
};
const of = <T extends MatchEvent['type']>(s: MatchState, type: T) =>
    s.events.filter((e): e is Extract<MatchEvent, { type: T }> => e.type === type);

/** Roda o lance em várias seeds até `pick` achar o que procura (bloqueio, defesa…). */
function until(fx: string, pick: (s: MatchState) => boolean, o: Opts = {}, n = 300) {
    for (let k = 0; k < n; k++) {
        const s = scene(fx, { ...o, seed: `mt-${k}` });
        idle(s, 30);
        if (pick(s)) return s;
    }
    return null;
}

describe('golpe máximo por tipo (fase 1)', () => {
    it('tipo do efeito: o do golpe máximo se for STAB, senão o 1º tipo; Aço vira Normal; todos os 151 têm um', () => {
        const ok = new Set(['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground']);
        for (const t of ['Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Fairy']) ok.add(t);
        for (const sp of SPECIES.filter((x) => x.id <= 151)) {
            const inst = createInstance(sp.id, new Rng('mt-all', String(sp.id)));
            expect(ok.has(maxFxType(inst.moves, sp.id, sp.types))).toBe(true);
        }
        // Gengar com golpe Psíquico (sem STAB) fica Fantasma; com Sludge (STAB do 2º tipo), Venenoso
        expect(maxFxType(['dreameater'], 94, species(94).types)).toBe('Ghost');
        expect(maxFxType(['sludge'], 94, species(94).types)).toBe('Poison');
        expect(maxFxType(['hyperbeam'], 149, species(149).types)).toBe('Dragon');
        expect(maxFxType(['thunderbolt'], 82, ['Electric', 'Steel'])).toBe('Electric');
        expect(maxFxType(['tackle'], 0, ['Steel'])).toBe('Normal');
    });

    it('com maxType desligado o N3 não tem efeito, e o N3 mira mais pro meio do gol (decisão 12)', () => {
        const s = scene('Fire', { flag: false });
        expect(s.ball.shot?.fx).toBeUndefined();
        expect(of(s, 'maxFx')).toHaveLength(0);
        // o alvo y=10,6 chega pro meio na fração `maxAim`: o chute sai mais perto de y=10 que o alvo pedido
        const on = scene('Fire');
        expect(on.ball.shot?.fx).toBe('Fire');
        expect(of(on, 'maxFx')[0]).toMatchObject({ step: 'shot', fx: 'Fire', by: 4, target: 5 });
        expect(AGENCY.maxAim).toBeLessThan(1);
    });

    it('Água: a onda tira o zagueiro da linha do chute; o goleiro anda 1 m e não cai', () => {
        const s = scene('Water');
        expect(Math.abs(s.players[6].pos.y - 10.15)).toBeGreaterThanOrEqual(AGENCY.maxType.push - 0.01);
        expect(s.players[5].stun).toBe(0);
        expect(of(s, 'knockback').map((e) => e.target)).toEqual(expect.arrayContaining([5, 6]));
    });

    it('Gelo: congela quem está na linha; Terrestre derruba quem está perto do gol, menos Voador', () => {
        expect(scene('Ice').players[6].status?.kind).toBe('frz');
        const quake = scene('Ground');
        expect(quake.players[6].stun).toBeGreaterThan(0);
        expect(quake.players[5].stun).toBe(0);
        expect(quake.ball.shot?.gkReach).toBeCloseTo(
            AGENCY.maxLevelShot[3].rivalReach * AGENCY.maxType.reach.Ground,
            6,
        );
        // Pidgeot (Voador) não cai
        expect(scene('Ground', { def: 18 }).players[6].stun).toBe(0);
    });

    it('Fantasma e Normal atravessam o zagueiro; Pedra fura o 1º; Voador vai por cima', () => {
        for (const fx of ['Ghost', 'Normal', 'Flying']) {
            for (let k = 0; k < 20; k++) {
                const s = scene(fx, { seed: `mt-thru-${k}` });
                idle(s, 30);
                expect(of(s, 'block').filter((e) => e.by === 6)).toHaveLength(0);
            }
        }
        expect(scene('Flying').ball.vz).toBeGreaterThan(0);
        // goleiro Normal (Snorlax) não se assusta com a bola fantasma
        expect(scene('Ghost', { gk: 143 }).ball.shot?.gkReach).toBeCloseTo(AGENCY.maxLevelShot[3].rivalReach, 6);
        expect(scene('Ghost').ball.shot?.gkReach).toBeCloseTo(AGENCY.maxLevelShot[3].rivalReach * 0.8, 6);
        const rock = until('Rock', (s) => of(s, 'trait').some((e) => e.fx === 'pierce'));
        expect(rock).not.toBeNull();
    });

    it('Psíquico: a bola curva pro canto longe do goleiro', () => {
        // goleiro pro lado de baixo (y < 10): a curva puxa pra cima; pro lado de cima, pra baixo
        expect(scene('Psychic', { gkY: 9.3 }).ball.shot?.curve).toBeGreaterThan(0);
        expect(scene('Psychic', { gkY: 10.7 }).ball.shot?.curve).toBeLessThan(0);
    });

    it('Elétrico: a bola sai 15% mais rápida que o mesmo chute sem o efeito', () => {
        const sp = (s: MatchState) => Math.hypot(s.ball.vel.x, s.ball.vel.y);
        expect(sp(scene('Electric')) / sp(scene('Electric', { flag: false }))).toBeCloseTo(AGENCY.maxType.speed, 2);
    });

    it('Venenoso: nuvem na frente do gol envenena e quem está nela não bloqueia', () => {
        const s = scene('Poison');
        expect(s.players[6].status?.kind).toBe('psn');
        expect(s.ball.shot?.blockedBy).toContain(6);
        expect(s.zones.some((z) => z.kind === 'smoke' && z.r === AGENCY.maxType.cloudR)).toBe(true);
    });

    it('Fogo: deixa rastro de fogo; o goleiro que defende se queima e espalma curto', () => {
        expect(scene('Fire').zones.filter((z) => z.kind === 'fire')).toHaveLength(2);
        const s = until('Fire', (x) => of(x, 'save').some((e) => e.by === 5), { defAt: { x: 10, y: 2 } });
        expect(s).not.toBeNull();
        expect(s!.players[5].status?.kind).toBe('brn');
    });

    it('Inseto: metade das vezes o goleiro pula na isca e não defende', () => {
        let decoys = 0;
        for (let k = 0; k < 60; k++) {
            const s = scene('Bug', { seed: `mt-bug-${k}`, defAt: { x: 10, y: 2 } });
            if (!s.ball.shot?.decoy) continue;
            decoys++;
            idle(s, 30);
            expect(of(s, 'save')).toHaveLength(0);
        }
        expect(decoys).toBeGreaterThan(15);
        expect(decoys).toBeLessThan(45);
    });

    it('Grama, Fada e Dragão: o goleiro alcança menos; Dragão sem vantagem de tipo, mas não contra Fada', () => {
        const n3 = AGENCY.maxLevelShot[3].rivalReach;
        expect(scene('Grass').ball.shot?.gkReach).toBeCloseTo(n3 * AGENCY.maxType.reach.Grass, 6);
        expect(scene('Fairy').ball.shot?.gkReach).toBeCloseTo(n3 * AGENCY.maxType.reach.Fairy, 6);
        const dragon = scene('Dragon');
        expect(dragon.ball.shot?.typeless).toBe(true);
        // Clefable (Fada) no gol: o Dragão não pega
        const fairy = scene('Dragon', { gk: 36 });
        expect(fairy.ball.shot?.typeless).toBeUndefined();
        expect(fairy.ball.shot?.gkReach).toBeCloseTo(n3, 6);
    });

    it('Lutador: bloqueado, a bola volta pro capitão e ele emenda de primeira', () => {
        const s = until('Fighting', (x) => of(x, 'block').some((e) => e.by === 6), {}, 300);
        expect(s).not.toBeNull();
        idle(s!, 40);
        const shots = of(s!, 'shot').filter((e) => e.by === 4);
        expect(shots.length).toBeGreaterThanOrEqual(2);
        expect(of(s!, 'maxFx').some((e) => e.step === 'hit' && e.fx === 'Fighting')).toBe(true);
    });

    it('o lance com efeito é determinístico (mesma seed, mesmos eventos)', () => {
        for (const fx of ['Bug', 'Psychic', 'Fighting', 'Water']) {
            const a = scene(fx, { seed: 'mt-det' });
            const b = scene(fx, { seed: 'mt-det' });
            idle(a, 60);
            idle(b, 60);
            expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
        }
        expect(FUTSAL_5.maxType).toBe(true);
    });
});
