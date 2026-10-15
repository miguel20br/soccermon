import { describe, expect, it } from 'vitest';
import { buildCupOpponents, CLUBS } from './cup';
import { MOVES, SPECIES, species } from './data';
import { evolveInstance } from './evolution';
import { createInstance, type PokemonInstance } from './instance';
import { defaultMoveset } from './moves';
import { rewardOptions } from './rewards';
import { Rng } from './rng';
import { SIGNATURE } from './signature-moves';
import {
    canLearn,
    GYM_TM,
    isProtectedMove,
    movesAfterEvolution,
    rareMovePool,
    rollTmOffer,
    teachMove,
    tmLabel,
} from './tm';

const make = (ids: number[], seed = 'tm') => {
    const rng = new Rng(seed, 'team');
    return ids.map((id) => createInstance(id, rng));
};

describe('MT do ginásio', () => {
    it('todo clube com ginásio tem a MT do líder da Gen 1', () => {
        for (const c of CLUBS) {
            if (c.city === 'Lavender' || c.city === 'Indigo Plateau') expect(GYM_TM[c.name]).toBeUndefined();
            else expect(MOVES[GYM_TM[c.name].move]).toBeDefined();
        }
        expect(GYM_TM['Pewter Rochedo'].move).toBe('bide');
        expect(tmLabel('bide')).toBe('MT34');
        expect(tmLabel('bubblebeam')).toBe('MT11');
        expect(tmLabel('fissure')).toBe('MT27');
        expect(tmLabel('fly')).toBe('MO02');
        expect(tmLabel('rollingkick')).toBeNull();
    });

    it('todo golpe tem quem aprenda (a Golpedex conta todos) e o baú raro só tem golpes fora dos movesets', () => {
        const learnable = Object.keys(MOVES).filter((m) => SPECIES.some((sp) => sp.learnset.includes(m)));
        expect(learnable).toHaveLength(Object.keys(MOVES).length);
        const used = new Set(SPECIES.flatMap((sp) => defaultMoveset(sp)));
        expect(rareMovePool().length).toBeGreaterThan(0);
        for (const m of rareMovePool()) expect(used.has(m)).toBe(false);
    });

    it('recompensa com MT é determinística e troca um item (nunca o reforço)', () => {
        const team = make([5, 7, 25, 74, 95, 10, 92]);
        const defeated = { name: 'Pewter Rochedo', players: make([74, 95, 111], 'rival') };
        let withTm = 0;
        for (let r = 0; r < 40; r++) {
            const a = rewardOptions('mt-seed', 0, r, team, defeated);
            expect(rewardOptions('mt-seed', 0, r, team, defeated)).toEqual(a);
            expect(a).toHaveLength(3);
            expect(a.filter((o) => o.kind === 'pokemon')).toHaveLength(1);
            const tms = a.filter((o) => o.kind === 'tm');
            expect(tms.length).toBeLessThanOrEqual(1);
            if (tms[0]?.kind === 'tm') {
                withTm++;
                // a MT do Brock (Bide): alguém do time aprende
                expect(tms[0]).toEqual({ kind: 'tm', move: 'bide', leader: 'Brock' });
                expect(a.filter((o) => o.kind === 'item')).toHaveLength(1);
            } else expect(a.filter((o) => o.kind === 'item')).toHaveLength(2);
        }
        // ~50% das rolagens
        expect(withTm).toBeGreaterThan(8);
        expect(withTm).toBeLessThan(32);
    });

    it('ninguém aprende a MT do ginásio: vem um golpe do baú raro que alguém do time aprende', () => {
        // ninguém deste time aprende Fissure (MT do Giovanni)
        const team = make([25, 16, 63, 92, 81]);
        expect(team.some((p) => canLearn(p, 'fissure'))).toBe(false);
        const offer = rollTmOffer(new Rng('x'), team, 'Viridian Terra');
        expect(offer?.leader).toBeNull();
        expect(rareMovePool()).toContain(offer?.move);
        expect(team.some((p) => canLearn(p, offer!.move))).toBe(true);
        // Lavender (sem ginásio) também puxa do baú raro
        expect(rollTmOffer(new Rng('y'), team, 'Lavender Assombro')?.leader).toBeNull();
    });

    it('ensinar: troca o golpe escolhido, guarda em `taught` e a assinatura é protegida', () => {
        const [charmeleon] = make([5]);
        expect(charmeleon.moves[0]).toBe(SIGNATURE[5]);
        expect(isProtectedMove(charmeleon, 0)).toBe(true);
        expect(teachMove(charmeleon, 'bide', 0)).toBeNull();
        // não aprende / já sabe / vaga inválida
        expect(teachMove(charmeleon, 'surf', 3)).toBeNull();
        expect(teachMove(charmeleon, charmeleon.moves[1], 3)).toBeNull();
        expect(teachMove(charmeleon, 'bide', 4)).toBeNull();
        const out = teachMove(charmeleon, 'bide', 3)!;
        expect(out.moves).toEqual([...charmeleon.moves.slice(0, 3), 'bide']);
        expect(out.taught).toEqual(['bide']);
        // ensinar por cima de um golpe ensinado tira o antigo da lista
        const again = teachMove(out, 'rage', 3)!;
        expect(again.taught).toEqual(['rage']);
        // Magikarp tem vaga: aprende sem esquecer
        const [karp] = make([129]);
        const k = teachMove(karp, 'dragonrage', karp.moves.length)!;
        expect(k.moves).toEqual([...karp.moves, 'dragonrage']);
    });

    it('golpe ensinado sobrevive à evolução (Charmeleon → Charizard)', () => {
        const [charmeleon] = make([5]);
        const taught = teachMove(charmeleon, 'bide', 2)!;
        const charizard = evolveInstance(taught, 6);
        expect(charizard.speciesId).toBe(6);
        expect(charizard.moves[0]).toBe(SIGNATURE[6]);
        expect(charizard.moves).toContain('bide');
        expect(charizard.moves.indexOf('bide')).toBe(2);
        expect(charizard.moves).toHaveLength(4);
        expect(charizard.taught).toEqual(['bide']);
        // sem MT, a evolução continua dando o moveset padrão (e sem campo `taught`)
        const plain = evolveInstance(charmeleon, 6);
        expect(plain.moves).toEqual(defaultMoveset(species(6)));
        expect('taught' in plain).toBe(false);
    });

    it('golpe que a forma nova não aprende fica para trás', () => {
        const inst: PokemonInstance = { ...make([5])[0], moves: ['slash', 'ember', 'growl', 'surf'], taught: ['surf'] };
        const out = movesAfterEvolution(inst, species(6));
        expect(out.moves).toEqual(defaultMoveset(species(6)));
        expect(out.taught).toEqual([]);
    });

    it('rivais entram com a MT do líder em quem aprende (determinístico)', () => {
        let checked = 0;
        for (let k = 0; k < 30 && checked < 3; k++) {
            const cup = buildCupOpponents(`rival${k}`);
            expect(buildCupOpponents(`rival${k}`)).toEqual(cup);
            for (const team of cup) {
                const gym = GYM_TM[team.name];
                if (!gym) continue;
                checked++;
                for (const p of [...team.lineup, ...team.bench]) {
                    if (!species(p.speciesId).learnset.includes(gym.move)) continue;
                    expect(p.moves).toContain(gym.move);
                    expect(p.moves.length).toBeLessThanOrEqual(4);
                    if (SIGNATURE[p.speciesId] && SIGNATURE[p.speciesId] !== gym.move)
                        expect(p.moves[0]).toBe(SIGNATURE[p.speciesId]);
                }
            }
        }
        expect(checked).toBeGreaterThan(0);
    });
});
