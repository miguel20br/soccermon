import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from './config';
import { aiDraftTeam } from './draft';
import { createMatch, deflectOut, step } from './match';
import { Rng } from './rng';
import type { TeamSetup } from './state';
import { v } from './vec';

function team(seed: string, name: string): TeamSetup {
    return { name, ...aiDraftTeam(new Rng(seed, 'team'), 0), tactic: 'balanced', color: 0 };
}

describe('espalmada pra escanteio', () => {
    const { width, goalWidth } = FUTSAL_5.pitch;
    const gy = width / 2;
    // goleiro do time 0 (gol em x = 0) e onde a bola bateu nele (sempre na frente dele, como na defesa)
    const cases = [
        { gk: v(1.0, gy + 0.6), at: v(1.4, gy + 0.1) }, // bola do lado do meio, goleiro perto da trave
        { gk: v(0.8, gy), at: v(1.2, gy + 0.4) },
        { gk: v(1.2, gy - 0.3), at: v(1.5, gy - 0.2) },
        { gk: v(2.5, gy + 1), at: v(2.8, gy + 0.2) },
        { gk: v(0.7, gy - 1.2), at: v(1.0, gy - 0.4) },
    ];

    it('a bola sai de lado: não passa por trás do goleiro nem rente à linha dentro do gol', () => {
        for (let seed = 0; seed < 40; seed++) {
            for (const c of cases) {
                const s = createMatch(FUTSAL_5, team('gk-a', 'A'), team('gk-b', 'B'), `espalmada-${seed}`);
                const gk = s.players.find((p) => p.team === 0 && p.role === 'GK')!;
                gk.pos = c.gk;
                expect(deflectOut(s, gk, c.at)).toBe(true);
                const d = s.ball.vel;
                // caminho reto da bola até a linha de fundo
                for (let x = c.at.x; x > 0; x -= 0.02) {
                    const y = c.at.y + ((x - c.at.x) * d.y) / d.x;
                    if (x < c.gk.x - 0.1) expect(Math.abs(y - c.gk.y)).toBeGreaterThanOrEqual(0.7 - 1e-6);
                    if (x < 0.6) expect(Math.abs(y - gy)).toBeGreaterThanOrEqual(goalWidth / 2 + 0.36);
                }
            }
        }
    });
});

describe('goleiro não fica preso no próprio golpe (playtester, 11/11)', () => {
    // Metronome sorteia qualquer golpe; Mirror Move e Mimic copiam o do rival. No goleiro, o sorteio ou a cópia
    // pulava a trava da IA (gkSaveMove) e ele carregava parado, sumia voando/cavando, desmaiava ou dormia no gol
    const stuck = (p: ReturnType<typeof createMatch>['players'][number]) =>
        !!p.fx.charging || !!p.fx.air || p.stun > 0 || p.status?.kind === 'slp';
    const play = (seed: string, moves: string[], rivalLast: string | null) => {
        const s = createMatch(FUTSAL_5, team('gk-a', 'A'), team('gk-b', 'B'), seed);
        s.phase = 'play';
        s.time = 10;
        const gk = s.players.find((p) => p.team === 0 && p.role === 'GK')!;
        gk.inst = { ...gk.inst, moves };
        gk.moveUses = moves.map(() => 5);
        gk.energy = 1;
        s.lastMove[1] = rivalLast;
        step(
            s,
            s.players.map((p) => (p === gk ? { type: 'useMove', slot: 0 } : { type: 'idle' })),
        );
        return gk;
    };

    it('Metronome no goleiro nunca sorteia golpe que trava', () => {
        for (let k = 0; k < 300; k++) expect(stuck(play(`metro-${k}`, ['metronome'], null))).toBe(false);
    });

    it('Mirror Move e Mimic no goleiro não copiam Fly, Dig, Solar Beam, Explosion, Hyper Beam nem Rest', () => {
        for (const m of ['fly', 'dig', 'solarbeam', 'skullbash', 'explosion', 'hyperbeam', 'rest'])
            for (const copy of ['mirrormove', 'mimic']) expect(stuck(play(`copy-${m}`, [copy], m))).toBe(false);
    });
});
