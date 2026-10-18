// Partida curta do Duelo (metade do tempo) x normal: o que muda por partida. Mesmos times e seeds nos dois.
// Uso: npx tsx scripts/balance/duel-curta.ts [n]
import { duelConfig } from '../../src/net/duel-state';
import { aiDraftTeam, bestOverall, type MatchResult, Rng, runMatch, type TeamSetup } from './lib';

const N = Number(process.argv[2]) || 300;
const team = (i: number, k: string): TeamSetup => ({
    name: k,
    ...aiDraftTeam(new Rng(`curta${i}${k}`, 'x'), i % 4),
    tactic: 'balanced',
    color: 0,
    formation: '1-2-1',
    // no duelo os dois lados têm técnico (mesmo limiar de evolução)
    manualSubs: true,
});
const avg = (t: TeamSetup) => t.lineup.reduce((s, p) => s + bestOverall(p), 0) / t.lineup.length;

type Row = Record<string, number>;
function measure(r: MatchResult, fav: 0 | 1 | null): Row {
    const n = (type: string) => r.events.filter((e) => e.type === type).length;
    const all = [...r.finalRoster];
    return {
        gols: r.score[0] + r.score[1],
        chutes: n('shot'),
        golpes: n('move'),
        evolucoes: n('evolve'),
        'partidas com evolução': n('evolve') > 0 ? 1 : 0,
        escanteios: n('corner'),
        'pênaltis (empate)': r.shootout ? 1 : 0,
        'fôlego no fim': all.reduce((s, p) => s + p.energy, 0) / all.length,
        'favorito venceu': fav === null ? Number.NaN : r.winner === fav ? 1 : 0,
    };
}

const acc = { normal: [] as Row[], curta: [] as Row[] };
for (let i = 0; i < N; i++) {
    const A = team(i, 'A');
    const B = team(i, 'B');
    const d = avg(A) - avg(B);
    const fav = Math.abs(d) < 1 ? null : d > 0 ? 0 : 1;
    for (const k of ['normal', 'curta'] as const) {
        const cfg = duelConfig({ duration: k === 'curta' ? 'short' : 'normal' });
        acc[k].push(measure(runMatch(cfg, A, B, `curta${i}`, { snapshots: false }), fav));
    }
}
const mean = (rows: Row[], key: string) => {
    const v = rows.map((r) => r[key]).filter((x) => !Number.isNaN(x));
    return v.reduce((s, x) => s + x, 0) / v.length;
};
const pct = new Set(['partidas com evolução', 'pênaltis (empate)', 'favorito venceu']);
console.log(`| por partida (${N} partidas, mesmos times) | normal | curta |`);
console.log('|---|---|---|');
for (const key of Object.keys(acc.normal[0])) {
    const f = (x: number) => (pct.has(key) ? `${(x * 100).toFixed(0)}%` : x.toFixed(2));
    console.log(`| ${key} | ${f(mean(acc.normal, key))} | ${f(mean(acc.curta, key))} |`);
}
