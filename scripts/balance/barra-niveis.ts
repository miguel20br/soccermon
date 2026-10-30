// Pontos da barra do golpe máximo por partida, sem teto e sem a trava de "usado" (golpe-maximo-niveis.md): em que
// minuto cada limiar chega. Mesma conta do `maxCharge` (src/engine/agency.ts). Sem ordem nenhuma.
// Uso: npx tsx scripts/balance/barra-niveis.ts [partidas=100]
import { FUTSAL_5 } from '../../src/engine/config';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { baseTeams } from './lib';

const N = Number(process.argv[2]) || 100;
const P: Record<string, number> = { tackle: 1, interception: 0.5, save: 1, shot: 0.5, move: 0.5, goal: 1 };
const TH = (process.env.TH ?? "6,9,12,18,24,27,36").split(",").map(Number);
const hit: Record<number, number[]> = Object.fromEntries(TH.map((t) => [t, []]));
const totals: number[] = [];
const totalsRaw: number[] = [];
for (let i = 0; i < N; i++) {
    const { A, B } = baseTeams(i);
    const m = runMatch(FUTSAL_5, A, B, `barra-${i}`, { snapshots: false });
    for (const team of [0, 1]) {
        let pts = 0,
            raw = 0,
            behind = 0;
        const got = new Set<number>();
        const teamOf = (idx: number) => (idx < 5 ? 0 : 1);
        for (const e of m.events) {
            if (e.type === 'goal') behind = e.team === team ? behind - 1 : behind + 1;
            let p = 0;
            if (e.type === 'tackle' && e.success && teamOf(e.by) === team) p = P.tackle;
            else if (e.type === 'interception' && teamOf(e.by) === team) p = P.interception;
            else if (e.type === 'save' && teamOf(e.by) === team) p = P.save;
            else if (e.type === 'shot' && teamOf(e.by) === team) p = P.shot;
            else if (e.type === 'move' && e.hit && teamOf(e.by) === team) p = P.move;
            else if (e.type === 'goal' && e.team === team && !e.ownGoal) p = P.goal;
            if (!p) continue;
            raw += p;
            pts += p * [1, 1.5, 2][Math.min(2, Math.max(0, behind))];
            for (const t of TH)
                if (!got.has(t) && pts >= t) {
                    got.add(t);
                    hit[t].push(e.minute);
                }
        }
        totals.push(pts);
        totalsRaw.push(raw);
    }
}
const med = (a: number[]) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[Math.floor(s.length / 2)] : NaN;
};
const n = 2 * N;
console.log(
    `partidas ${N} (times ${n}); pontos/jogo mediana ${med(totals).toFixed(1)} (sem virada ${med(totalsRaw).toFixed(1)}); min ${Math.min(...totals).toFixed(1)} max ${Math.max(...totals).toFixed(1)}`,
);
console.log(`minutos de jogo: ${FUTSAL_5.displayHalfMinutes * 2}`);
for (const t of TH)
    console.log(
        `${t} pts: ${Math.round((hit[t].length / n) * 100)}% dos times, minuto mediano ${med(hit[t]).toFixed(1)}`,
    );
