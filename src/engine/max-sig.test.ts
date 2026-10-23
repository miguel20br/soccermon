import { describe, expect, it } from 'vitest';
import { AGENCY } from './agency';
import { IDLE } from './commands';
import { FUTSAL_5, withConfig } from './config';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { createMatch, maxFxType, step } from './match';
import { Rng } from './rng';
import { MAX_SIGNATURE } from './signature-moves';
import type { MatchEvent, MatchState, TeamSetup } from './state';
import { v } from './vec';

/**
 * Golpe máximo por Pokémon, fase 2 (assinaturas, `maxSig`): o mesmo lance de max-type.test.ts. Capitão (pivô, idx 4)
 * da espécie pedida a 10 m do gol com o N3 armado; goleiro rival (idx 5) no gol, um zagueiro (idx 6) na linha do chute
 * a 4 m do gol e o resto longe. O capitão chuta no tick 1.
 */
function team(seed: string): TeamSetup {
    return { name: seed, ...aiDraftTeam(new Rng(seed, 'team'), 1), tactic: 'balanced', color: 0, manualSubs: true };
}

interface Opts {
    seed?: string;
    sig?: boolean;
    gk?: number;
    /** Capitão rival (idx 7) dessa espécie (o Ditto copia o efeito dele). */
    rivalCap?: number;
    defAt?: { x: number; y: number };
    gkY?: number;
    /** Pra onde o capitão chuta (padrão: no gol). */
    aim?: { x: number; y: number };
}

function scene(id: number, o: Opts = {}) {
    const A = team('ms-a');
    const B = team('ms-b');
    const cap = createInstance(id, new Rng('ms-cap', String(id)));
    const home = { ...A, lineup: A.lineup.map((p, i) => (i === 4 ? cap : p)), captainUid: cap.uid };
    const awayLine = B.lineup.map((p, i) =>
        i === 0 && o.gk
            ? createInstance(o.gk, new Rng('ms-gk'))
            : i === 2 && o.rivalCap
              ? createInstance(o.rivalCap, new Rng('ms-rc'))
              : p,
    );
    const away = { ...B, lineup: awayLine, captainUid: awayLine[o.rivalCap ? 2 : 0].uid };
    const cfg = withConfig({ maxSig: o.sig ?? true });
    const s = createMatch(cfg, home, away, o.seed ?? 'ms');
    s.phase = 'play';
    const far = [v(8, 3), v(8, 17), v(4, 10), v(12, 10), v(15, 5), v(15, 15), v(20, 3)];
    s.players.forEach((p, i) => {
        p.pos = far[i % far.length];
        p.vel = v(0, 0);
    });
    s.players[4].pos = v(30, 10);
    s.players[5].pos = v(39.3, o.gkY ?? 10);
    s.players[6].pos = o.defAt ? v(o.defAt.x, o.defAt.y) : v(36, 10.15);
    s.ball.owner = 4;
    s.ball.pos = v(30.3, 10);
    s.teams[0].agency.max = { idx: 4, until: 100, live: false, level: 3, q: 2 };
    const cmds = s.players.map(() => IDLE);
    cmds[4] = { type: 'shoot', target: o.aim ? v(o.aim.x, o.aim.y) : v(40, 10.6), power: 1 };
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
const fxOf = (s: MatchState) => of(s, 'maxFx').find((e) => e.step === 'shot')?.fx;

/** Roda o lance em várias seeds até `pick` achar o que procura (bloqueio, defesa…). */
function until(id: number, pick: (s: MatchState) => boolean, o: Opts = {}, n = 300) {
    for (let k = 0; k < n; k++) {
        const s = scene(id, { ...o, seed: `ms-${k}` });
        idle(s, 30);
        if (pick(s)) return s;
    }
    return null;
}
const n3 = AGENCY.maxLevelShot[3].rivalReach;
const saved = (s: MatchState) => of(s, 'save').some((e) => e.by === 5);
const noDef = { defAt: { x: 10, y: 2 } };

describe('golpe máximo por Pokémon (fase 2, assinaturas)', () => {
    it('12 assinaturas; sem a bandeira cada uma volta pro efeito do tipo (motor 12)', () => {
        expect(Object.keys(MAX_SIGNATURE)).toHaveLength(12);
        for (const [id, sig] of Object.entries(MAX_SIGNATURE)) {
            expect(AGENCY.maxSig[sig]).toBeDefined();
            if (sig === 'metronome' || sig === 'transform') continue;
            expect(fxOf(scene(Number(id)))).toBe(sig);
            const inst = createInstance(Number(id), new Rng('ms-cap', id));
            const off = scene(Number(id), { sig: false });
            expect(fxOf(off)).toBe(maxFxType(inst.moves, Number(id), off.players[4].sp.types));
        }
        expect(FUTSAL_5.maxSig).toBeUndefined();
    });

    it('Dragonite (Hyper Beam): fura todos os bloqueios e o goleiro alcança x0,85', () => {
        for (let k = 0; k < 20; k++) {
            const s = scene(149, { seed: `ms-hb-${k}` });
            idle(s, 30);
            expect(of(s, 'block').filter((e) => e.by === 6)).toHaveLength(0);
        }
        expect(scene(149).ball.shot?.gkReach).toBeCloseTo(n3 * 0.85, 6);
    });

    it('Snorlax (Body Slam): se joga no chute (o rival perto cai e fica paralisado); o goleiro que defende também', () => {
        const slam = scene(143, { defAt: { x: 31, y: 12 } });
        expect(slam.players[6].stun).toBeGreaterThan(0);
        expect(slam.players[6].status?.kind).toBe('par');
        expect(of(slam, 'maxFx').some((e) => e.step === 'hit' && e.target === 6)).toBe(true);
        // sem a bandeira (efeito do Normal) ninguém perto cai no chute
        expect(scene(143, { defAt: { x: 31, y: 12 }, sig: false }).players[6].stun).toBe(0);
        const s = until(143, saved, noDef);
        expect(s).not.toBeNull();
        const gk = s!.players[5];
        expect(gk.status?.kind).toBe('par');
        expect(of(s!, 'maxFx').some((e) => e.step === 'hit' && e.target === 5)).toBe(true);
    });

    it('Snorlax no gol: na defesa máxima N3 deita na frente do gol (aviso e alcance x1,8)', () => {
        const A = team('ms-a');
        const B = team('ms-b');
        const snorlax = createInstance(143, new Rng('ms-gk-cap'));
        const home = { ...A, lineup: A.lineup.map((p, i) => (i === 0 ? snorlax : p)), captainUid: snorlax.uid };
        const s = createMatch(withConfig({ maxSig: true }), home, B, 'ms-wall');
        s.phase = 'play';
        s.players[9].pos = v(8, 10);
        s.ball.owner = 9;
        s.ball.pos = v(7.7, 10);
        s.teams[0].agency.max = { idx: 0, until: 100, live: false, level: 3, q: 2 };
        step(
            s,
            s.players.map(() => IDLE),
        );
        expect(of(s, 'maxFx')).toEqual([expect.objectContaining({ fx: 'rest', by: 0, step: 'shot' })]);
        expect(AGENCY.maxSigFx.wallReach).toBeGreaterThan(AGENCY.maxLevelGk[3].reach);
    });

    it('Arcanine (Fire Blast): a estrela derruba e queima o zagueiro perto do gol', () => {
        const s = scene(59);
        expect(s.players[6].stun).toBeGreaterThan(0);
        expect(s.players[6].status?.kind).toBe('brn');
    });

    it('Articuno (Blizzard): a área inteira congela, até quem está fora da linha do chute', () => {
        const s = scene(144, { defAt: { x: 36, y: 14 } });
        expect(s.players[6].status?.kind).toBe('frz');
        expect(s.players[5].status).toBeNull();
        expect(s.ball.shot?.gkReach).toBeCloseTo(n3 * 0.9, 6);
    });

    it('Blastoise (Hydro Pump): a onda empurra e, se o goleiro espalma, ele emenda de primeira', () => {
        expect(Math.abs(scene(9).players[6].pos.y - 10.15)).toBeGreaterThanOrEqual(AGENCY.maxType.push - 0.01);
        const s = until(9, (x) => saved(x) && !of(x, 'save').some((e) => e.caught), noDef);
        expect(s).not.toBeNull();
        idle(s!, 40);
        expect(of(s!, 'shot').filter((e) => e.by === 4).length).toBeGreaterThanOrEqual(2);
        // a sobra: o chute pra fora também volta pro Blastoise (sem tiro de meta)
        const wide = until(9, (x) => of(x, 'wide').length > 0, { ...noDef, aim: { x: 40, y: 15 } });
        expect(wide).not.toBeNull();
        expect(of(wide!, 'goalkick')).toHaveLength(0);
        expect(of(wide!, 'maxFx').some((e) => e.step === 'hit' && e.target === 4)).toBe(true);
    });

    it('Charizard (Flamethrower): voa 2 m rumo ao gol, chuta por cima e queima o goleiro que defende', () => {
        const s = scene(6);
        expect(s.players[4].pos.x).toBeGreaterThan(31.5);
        expect(s.ball.vz).toBeGreaterThan(0);
        const off = scene(6, { sig: false });
        expect(off.players[4].pos.x).toBeLessThan(30.5);
        const burn = until(6, saved, noDef);
        expect(burn?.players[5].status?.kind).toBe('brn');
    });

    it('Pikachu (Thunderbolt): o raio salta do goleiro pros 2 rivais mais perto e paralisa', () => {
        const s = scene(25, { defAt: { x: 37, y: 13 } });
        expect(s.players[6].status?.kind).toBe('par');
        const hits = of(s, 'maxFx').filter((e) => e.step === 'hit');
        expect(hits[0].target).toBe(5);
        expect(hits.length).toBeGreaterThanOrEqual(2);
        expect(hits.length).toBeLessThanOrEqual(1 + AGENCY.maxSigFx.chainN);
    });

    it('Gengar (Dream Eater): atravessa a defesa e o goleiro dorme (alcance x0,75), até goleiro Normal', () => {
        for (let k = 0; k < 20; k++) {
            const s = scene(94, { seed: `ms-de-${k}` });
            idle(s, 30);
            expect(of(s, 'block').filter((e) => e.by === 6)).toHaveLength(0);
        }
        expect(scene(94, { gk: 143 }).ball.shot?.gkReach).toBeCloseTo(n3 * 0.75, 6);
    });

    it('Mewtwo (Psychic): curva mais que o Psíquico do tipo, pro canto longe do goleiro', () => {
        const sig = scene(150, { gkY: 9.3 }).ball.shot?.curve ?? 0;
        const type = scene(150, { gkY: 9.3, sig: false }).ball.shot?.curve ?? 0;
        expect(sig).toBeGreaterThan(0);
        expect(sig).toBeGreaterThanOrEqual(type);
        expect(scene(150, { gkY: 10.7 }).ball.shot?.curve).toBeLessThan(0);
    });

    it('Gyarados (Tsunami): empurra todos os rivais, até os longe do chute, e fica em fúria', () => {
        const s = scene(130);
        expect(of(s, 'knockback').length).toBe(5);
        expect(s.players[4].buffs.some((b) => b.attr === 'shooting' && b.factor > 1)).toBe(true);
    });

    it('Mew (Metronome): sorteia um efeito de tipo com o rng da partida (mesma seed, mesmo efeito)', () => {
        const got = new Set<string>();
        for (let k = 0; k < 30; k++) {
            const a = scene(151, { seed: `ms-mew-${k}` });
            const b = scene(151, { seed: `ms-mew-${k}` });
            expect(fxOf(a)).toBe(fxOf(b));
            expect(of(a, 'maxFx')[0]).toMatchObject({ fx: 'metronome', step: 'hit' });
            got.add(fxOf(a)!);
        }
        expect(got.size).toBeGreaterThanOrEqual(6);
    });

    it('Ditto (Transform): copia o efeito do capitão rival; Ditto contra Ditto vira Normal', () => {
        const s = scene(132, { rivalCap: 149 });
        expect(of(s, 'maxFx')[0]).toMatchObject({ fx: 'transform', step: 'hit' });
        expect(fxOf(s)).toBe('hyperbeam');
        expect(fxOf(scene(132, { rivalCap: 132 }))).toBe('Normal');
    });

    it('o lance com assinatura é determinístico (mesma seed, mesmos eventos)', () => {
        for (const id of [151, 9, 25, 130, 6]) {
            const a = scene(id, { seed: 'ms-det' });
            const b = scene(id, { seed: 'ms-det' });
            idle(a, 60);
            idle(b, 60);
            expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
        }
    });
});
