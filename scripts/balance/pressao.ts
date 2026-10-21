/**
 * Acréscimos e Pressão final (docs/planos/pressao-final.md): os mesmos times do `npm run calibrate` em várias
 * regulagens, com o drama do fim (gol nos acréscimos, quem perdia no minuto 37 e empatou/virou).
 *
 * Uso: npx tsx scripts/balance/pressao.ts [N=400]
 */
import { FUTSAL_5, type MatchConfig, withConfig } from '../../src/engine/config';
import { aiDraftTeam } from '../../src/engine/draft';
import { FINAL_PRESSURE } from '../../src/engine/effective';
import { viewInstance } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { Tactic, TeamSetup } from '../../src/engine/state';

const N = Number(process.argv[2]) || 400;
const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];
const DEFAULT = structuredClone(FINAL_PRESSURE);
const OFF = { lastMinutes: 3, attrs: {}, attack: 0, defend: 0, pressBias: 0 };
const WEAK = {
    lastMinutes: 3,
    attrs: { shooting: 1.03, passing: 1.02, dribble: 1.02, pace: 1.015 },
    attack: 0.75,
    defend: 0.5,
    pressBias: 0.015,
};
const STRONG = {
    lastMinutes: 5,
    attrs: { shooting: 1.1, passing: 1.06, dribble: 1.06, pace: 1.05 },
    attack: 2.5,
    defend: 1.5,
    pressBias: 0.05,
};

const variants: { name: string; cfg: MatchConfig; fp: typeof DEFAULT }[] = [
    { name: 'antes (sem nada)', cfg: withConfig({ stoppage: undefined }), fp: OFF },
    { name: 'só acréscimos 1–3', cfg: FUTSAL_5, fp: OFF },
    { name: 'só pressão (padrão)', cfg: withConfig({ stoppage: undefined }), fp: DEFAULT },
    { name: 'acréscimos 1–3 + pressão (padrão)', cfg: FUTSAL_5, fp: DEFAULT },
    { name: 'acréscimos 1–3 + pressão fraca', cfg: FUTSAL_5, fp: WEAK },
    { name: 'acréscimos 1–3 + pressão forte', cfg: FUTSAL_5, fp: STRONG },
    { name: 'acréscimos 1–2 + pressão (padrão)', cfg: withConfig({ stoppage: { min: 1, max: 2 } }), fp: DEFAULT },
];

const strength = (t: TeamSetup) => t.lineup.reduce((sum, i) => sum + viewInstance(i).overall, 0) / t.lineup.length;
const LATE = FUTSAL_5.displayHalfMinutes * 2 - FINAL_PRESSURE.lastMinutes;
const pct = (a: number, b: number) => `${((a / Math.max(1, b)) * 100).toFixed(1)}%`;

console.log(
    '| regulagem | gols/jogo | empate no tempo normal | favorito vence | jogo com gol nos acréscimos | gols do 37 em diante | perdia no 37 e empatou/virou | perdia no 37 e virou | perdia por 1 no 37 e empatou/virou |',
);
console.log('|---|---|---|---|---|---|---|---|---|');
for (const v of variants) {
    Object.assign(FINAL_PRESSURE, structuredClone(v.fp));
    const rng = new Rng('calibrate');
    let goals = 0;
    let draws = 0;
    let decisive = 0;
    let fav = 0;
    let stopGoal = 0;
    let late = 0;
    let behind = 0;
    let back = 0;
    let turned = 0;
    let by1 = 0;
    let back1 = 0;
    for (let i = 0; i < N; i++) {
        const mk = (name: string): TeamSetup => {
            const d = aiDraftTeam(rng, rng.int(0, 1));
            return { name, ...d, tactic: rng.pick(TACTICS), color: 0 };
        };
        const home = mk('A');
        const away = mk('B');
        const r = runMatch(v.cfg, home, away, i, { snapshots: false });
        goals += r.score[0] + r.score[1];
        if (r.score[0] === r.score[1]) draws++;
        const sh = strength(home);
        const sa = strength(away);
        if (Math.abs(sh - sa) >= 3 && r.winner !== null) {
            decisive++;
            if ((sh > sa ? 0 : 1) === r.winner) fav++;
        }
        const gs = r.events.flatMap((e) => (e.type === 'goal' ? [e] : []));
        if (gs.some((e) => e.minute >= e.half * FUTSAL_5.displayHalfMinutes)) stopGoal++;
        late += gs.filter((e) => e.half === 2 && e.minute >= LATE).length;
        const at = [0, 0];
        for (const e of gs) if (e.half === 1 || e.minute < LATE) at[e.team]++;
        if (at[0] !== at[1]) {
            behind++;
            const lo = at[0] < at[1] ? 0 : 1;
            if (r.score[lo] >= r.score[1 - lo]) back++;
            if (r.score[lo] > r.score[1 - lo]) turned++;
            if (Math.abs(at[0] - at[1]) === 1) {
                by1++;
                if (r.score[lo] >= r.score[1 - lo]) back1++;
            }
        }
    }
    console.log(
        `| ${v.name} | ${(goals / N).toFixed(2)} | ${pct(draws, N)} | ${pct(fav, decisive)} (${decisive}) | ${pct(stopGoal, N)} | ${(late / N).toFixed(2)} | ${pct(back, behind)} (${behind}) | ${pct(turned, behind)} | ${pct(back1, by1)} (${by1}) |`,
    );
}
Object.assign(FINAL_PRESSURE, DEFAULT);
