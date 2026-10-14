/**
 * Quanto cada posição produz por partida (base para os pesos da evolução no meio da partida).
 * Uso: npx tsx scripts/evo-report.ts [n]
 */
import { FUTSAL_5 } from '../src/engine/config';
import { species } from '../src/engine/data';
import { aiDraftTeam } from '../src/engine/draft';
import { Rng } from '../src/engine/rng';
import { runMatch } from '../src/engine/runners/batch-runner';
import type { PlayerStats } from '../src/engine/state';

const N = Number(process.argv[2]) || 150;
const keys: (keyof PlayerStats)[] = [
    'goals',
    'assists',
    'shotsOnTarget',
    'saves',
    'tacklesWon',
    'interceptions',
    'passesCompleted',
    'movesUsed',
];
const acc = new Map<string, { n: number; sum: Record<string, number> }>();
for (let i = 0; i < N; i++) {
    const t = (k: string) => ({
        name: k,
        ...aiDraftTeam(new Rng(`evo${i}${k}`, 'x'), i % 4),
        tactic: 'balanced' as const,
        color: 0,
    });
    const r = runMatch(FUTSAL_5, t('A'), t('B'), `evo${i}`, { snapshots: false });
    for (const p of [...r.finalRoster, ...r.subbedOut]) {
        const a = acc.get(p.role) ?? { n: 0, sum: {} };
        a.n++;
        for (const k of keys) a.sum[k] = (a.sum[k] ?? 0) + p.stats[k];
        acc.set(p.role, a);
    }
}
for (const [role, a] of acc) {
    console.log(role.padEnd(5), keys.map((k) => `${k}=${(a.sum[k] / a.n).toFixed(2)}`).join(' '));
}

// evoluções que aconteceram (por time/partida e por posição)
const evo = { total: 0, byRole: new Map<string, number>(), evolvable: new Map<string, number>() };
for (let i = 0; i < N; i++) {
    const t = (k: string) => ({
        name: k,
        ...aiDraftTeam(new Rng(`evo${i}${k}`, 'x'), i % 4),
        tactic: 'balanced' as const,
        color: 0,
    });
    const r = runMatch(FUTSAL_5, t('A'), t('B'), `evo${i}`, { snapshots: false });
    for (const p of r.roster) {
        if (species(p.speciesId).evolvesTo.some((e) => e.id <= 151)) {
            evo.evolvable.set(p.role, (evo.evolvable.get(p.role) ?? 0) + 1);
        }
    }
    for (const e of r.events) {
        if (e.type !== 'evolve') continue;
        evo.total++;
        const role = r.roster[e.by].role;
        evo.byRole.set(role, (evo.byRole.get(role) ?? 0) + 1);
    }
}
console.log(`evoluções por time por partida: ${(evo.total / (2 * N)).toFixed(2)}`);
for (const [role, n] of evo.evolvable) {
    console.log(`  ${role}: ${(((evo.byRole.get(role) ?? 0) / n) * 100).toFixed(0)}% dos que podem evoluir`);
}
