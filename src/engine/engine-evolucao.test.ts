import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from './config';
import { species } from './data';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { createMatch, step } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import type { TeamSetup } from './state';
import { v } from './vec';

function team(seed: string, name: string): TeamSetup {
    const rng = new Rng(seed, 'team');
    return { name, ...aiDraftTeam(rng, 0), tactic: 'balanced', color: 0 };
}

describe('defesa do goleiro', () => {
    it('nunca acontece com a bola já dentro do gol', () => {
        const { length } = FUTSAL_5.pitch;
        let saves = 0;
        for (let i = 0; i < 6; i++) {
            const r = runMatch(FUTSAL_5, team(`gk-a${i}`, 'A'), team(`gk-b${i}`, 'B'), `gk-${i}`);
            for (const e of r.events) {
                if (e.type !== 'save') continue;
                saves++;
                const snap = r.snapshots.find((sn) => sn.tick >= e.tick);
                if (snap) {
                    expect(snap.bx).toBeGreaterThanOrEqual(-0.01);
                    expect(snap.bx).toBeLessThanOrEqual(length + 0.01);
                }
            }
        }
        expect(saves).toBeGreaterThan(10);
    });
});

describe('evolução no meio da partida', () => {
    it('evolui no máximo uma vez por jogador, com a forma certa, e a forma nova termina a partida', () => {
        let evolutions = 0;
        for (let i = 0; i < 25; i++) {
            const rng = new Rng(`evo-t${i}`, 'x');
            const lineup = [74, 7, 4, 1, 25].map((id) => createInstance(id, rng));
            const home: TeamSetup = { name: 'A', lineup, bench: [], tactic: 'balanced', color: 0, formation: '1-2-1' };
            const r = runMatch(FUTSAL_5, home, team(`evo-b${i}`, 'B'), `evo-${i}`, { snapshots: false });
            const evos = r.events.filter((e) => e.type === 'evolve');
            const per = new Map<string, number>();
            for (const e of evos) {
                if (e.type !== 'evolve') continue;
                evolutions++;
                per.set(e.uid, (per.get(e.uid) ?? 0) + 1);
                expect(species(e.from).evolvesTo.map((x) => x.id)).toContain(e.into);
                // (se depois ele saiu numa substituição, a vaga é de outro no fim)
                const subbedLater = r.events.some((x) => x.type === 'sub' && x.outIdx === e.by && x.tick > e.tick);
                if (!subbedLater) expect(r.finalRoster[e.by].speciesId).toBe(e.into);
            }
            expect([...per.values()].every((n) => n === 1)).toBe(true);
        }
        expect(evolutions).toBeGreaterThan(0);
    }, 90_000);
});

describe('escanteio (0.8.5)', () => {
    const home = team('esc-a', 'A');
    const away = team('esc-b', 'B');
    /** Bola rolando pela linha de fundo do time 1 (x = comprimento), fora das traves, tocada por último por `by`. */
    const ballOut = (by: number) => {
        const s = createMatch(FUTSAL_5, home, away, 'esc');
        s.phase = 'play';
        s.ball = { ...s.ball, owner: null, pos: v(39.8, 3), vel: v(8, 0), lastTouch: by, shot: null };
        step(s, []);
        return s;
    };

    it('último toque da defesa pela linha de fundo vira escanteio; do ataque, tiro de meta', () => {
        const defender = ballOut(7); // time 1 defende o gol em x = 40
        expect(defender.events.at(-1)).toMatchObject({ type: 'corner', team: 0 });
        expect(defender.phase).toBe('corner');
        const attacker = ballOut(2);
        expect(attacker.events.at(-1)).toMatchObject({ type: 'goalkick', team: 1 });
    });

    it('o relógio não corre enquanto monta a cobrança, e a cobrança sai sozinha', () => {
        const s = ballOut(7);
        const time = s.time;
        let ticks = 0;
        while (s.phase === 'corner' && ticks < 200) {
            step(s, []);
            ticks++;
        }
        expect(ticks).toBeGreaterThan(10);
        expect(s.phase).toBe('play');
        expect(s.time).toBe(time);
        expect(s.ball.owner).toBeNull();
    });

    it('acontece nas partidas, com o cobrador escolhido e a instrução trocada por ordem', () => {
        let corners = 0;
        let aerials = 0;
        for (let i = 0; i < 6; i++) {
            const a = team(`esc-a${i}`, 'A');
            const taker = a.lineup[2];
            const r = runMatch(
                FUTSAL_5,
                { ...a, cornerTakerUid: taker.uid, corner: 'area' },
                team(`esc-b${i}`, 'B'),
                i,
                {
                    snapshots: false,
                    orders: [{ tick: 3000, team: 0, kind: 'corner', corner: 'short' }],
                },
            );
            const mine = r.events.filter((e) => e.type === 'corner' && e.team === 0);
            for (const e of mine) if (e.type === 'corner') expect(r.roster[e.by].uid).toBe(taker.uid);
            corners += r.events.filter((e) => e.type === 'corner').length;
            aerials += r.events.filter((e) => e.type === 'aerial').length;
            expect(r.events.filter((e) => e.type === 'cornerPlan')).toMatchObject([{ team: 0, plan: 'short' }]);
        }
        expect(corners).toBeGreaterThan(6);
        expect(aerials).toBeGreaterThan(2);
    });
});
