/**
 * Série "Simulei" (pauta 11): 5 Snorlax x 5 Pikachu, n partidas, placar médio e % de vitória.
 *   npx tsx scripts/simulei.ts --n 200 [--troca] [--lista]
 * --troca: Snorlax joga como visitante. --lista: mostra as seeds com mais gols/lances (abrir com ?demo=trailer&cena=snorpika&seed=).
 */
import { FUTSAL_5 } from '../src/engine/config';
import { runMatch } from '../src/engine/runners/batch-runner';
import { trailerRival, trailerTeam } from '../src/ui/trailer-scenes';

const args = process.argv.slice(2);
const arg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const N = Number(arg('--n')) || 200;
const troca = args.includes('--troca');
const w = [0, 0, 0]; // snorlax, pikachu, empate
const gols = [0, 0];
let pen = 0;
const rows: { seed: string; placar: string; total: number }[] = [];
for (let i = 0; i < N; i++) {
    const seed = `simulei${i}`;
    const sn = trailerTeam('snorpika', seed, 'Snorlax FC', 0xe8423f);
    const pk = trailerRival('snorpika', seed, 'Pikachu FC', 0xf2c53d);
    if (!pk) throw new Error('sem rival');
    const [home, away] = troca ? [pk, sn] : [sn, pk];
    const m = runMatch(FUTSAL_5, home, away, `${seed}-stage-0`, { snapshots: false });
    const [a, b] = troca ? [m.score[1], m.score[0]] : m.score;
    gols[0] += a;
    gols[1] += b;
    const win = m.winner === null ? 2 : (m.winner === 0) !== troca ? 0 : 1;
    w[win]++;
    if (m.shootout) pen++;
    rows.push({ seed, placar: `${m.score[0]}x${m.score[1]}`, total: a + b });
}
const pc = (x: number) => `${((100 * x) / N).toFixed(1)}%`;
console.log(
    `n=${N}${troca ? ' (Snorlax visitante)' : ''}: Snorlax ${w[0]} (${pc(w[0])}) · Pikachu ${w[1]} (${pc(w[1])}) · empate ${w[2]}; pênaltis ${pen}`,
);
console.log(`placar médio Snorlax ${(gols[0] / N).toFixed(2)} x ${(gols[1] / N).toFixed(2)} Pikachu`);
if (args.includes('--lista'))
    for (const r of rows.sort((x, y) => y.total - x.total).slice(0, 12)) console.log(r.seed, r.placar);
