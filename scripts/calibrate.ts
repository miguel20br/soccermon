/**
 * Calibração headless: roda N partidas entre times sorteados pelo draft da IA e imprime métricas.
 * Metas: 5–7 gols/jogo · time mais forte vence ~60–65% · nenhum tipo > 55% de vitórias.
 *
 * Uso: npm run calibrate -- --n 2000 [--csv out.csv]
 */
import { writeFileSync } from 'node:fs';
import { FUTSAL_5 } from '../src/engine/config';
import { species } from '../src/engine/data';
import { aiDraftTeam } from '../src/engine/draft';
import { FORMATIONS, type FormationId } from '../src/engine/formations';
import { viewInstance } from '../src/engine/instance';
import { Rng } from '../src/engine/rng';
import { runMatch } from '../src/engine/runners/batch-runner';
import type { MatchEventType, Tactic, TeamSetup } from '../src/engine/state';

const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || 500;
const csvPath = args.includes('--csv') ? args[args.indexOf('--csv') + 1] : null;
const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];

const rng = new Rng('calibrate');

// --formations: cada time é draftado para a própria formação; mede vitórias por formação
if (args.includes('--formations')) {
    const ids = Object.keys(FORMATIONS) as FormationId[];
    const rec = new Map<FormationId, { w: number; g: number }>(ids.map((f) => [f, { w: 0, g: 0 }]));
    for (let i = 0; i < N; i++) {
        for (const fa of ids) {
            for (const fb of ids) {
                if (fa === fb) continue;
                const home: TeamSetup = {
                    name: 'A',
                    ...aiDraftTeam(new Rng(`f-${i}`, 'A'), 1, [], fa),
                    tactic: 'balanced',
                    color: 0,
                    formation: fa,
                };
                const away: TeamSetup = {
                    name: 'B',
                    ...aiDraftTeam(new Rng(`f-${i}`, 'B'), 1, [], fb),
                    tactic: 'balanced',
                    color: 0,
                    formation: fb,
                };
                const r = runMatch(FUTSAL_5, home, away, `${i}-${fa}-${fb}`, { snapshots: false });
                for (const [f, won] of [
                    [fa, r.winner === 0],
                    [fb, r.winner === 1],
                ] as const) {
                    const x = rec.get(f)!;
                    x.g++;
                    if (won) x.w++;
                }
            }
        }
    }
    console.log(
        'vitórias por formação:',
        [...rec.entries()].map(([f, x]) => `${f}=${Math.round((x.w / x.g) * 100)}% (${x.g})`).join(' '),
    );
    process.exit(0);
}

// --tactics: mesmos times, só a tática muda (e os lados se invertem) → matriz de confrontos
if (args.includes('--tactics')) {
    const wins = new Map<string, { w: number; g: number }>();
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
        const a = aiDraftTeam(rng, 1);
        const b = aiDraftTeam(rng, 1);
        for (const ta of TACTICS) {
            for (const tb of TACTICS) {
                if (ta === tb) continue;
                for (const swap of [false, true]) {
                    const home: TeamSetup = { name: 'A', ...(swap ? b : a), tactic: ta, color: 0 };
                    const away: TeamSetup = { name: 'B', ...(swap ? a : b), tactic: tb, color: 0 };
                    const r = runMatch(FUTSAL_5, home, away, `${i}-${ta}-${tb}-${swap}`, { snapshots: false });
                    const key = `${ta} x ${tb}`;
                    const rec = wins.get(key) ?? { w: 0, g: 0 };
                    rec.g++;
                    if (r.winner === 0) rec.w++;
                    wins.set(key, rec);
                }
            }
        }
    }
    console.log(
        `matriz de táticas (${((performance.now() - t0) / 1000).toFixed(0)}s) — % de vitórias da tática da linha`,
    );
    console.log(['', ...TACTICS].map((t) => t.padEnd(11)).join(''));
    for (const ta of TACTICS) {
        const cells = TACTICS.map((tb) => {
            const r = wins.get(`${ta} x ${tb}`);
            return (r ? `${Math.round((r.w / r.g) * 100)}%` : '—').padEnd(11);
        });
        const total = TACTICS.filter((tb) => tb !== ta).reduce(
            (acc, tb) => {
                const r = wins.get(`${ta} x ${tb}`)!;
                return { w: acc.w + r.w, g: acc.g + r.g };
            },
            { w: 0, g: 0 },
        );
        console.log(`${ta.padEnd(11)}${cells.join('')} geral ${Math.round((total.w / total.g) * 100)}%`);
    }
    process.exit(0);
}
const strength = (t: TeamSetup) => t.lineup.reduce((sum, i) => sum + viewInstance(i).overall, 0) / t.lineup.length;

let goals = 0;
let draws = 0;
let strongerWins = 0;
let decisive = 0;
const scoreDist = new Map<number, number>();
const eventCounts = new Map<MatchEventType, number>();
const typeRecord = new Map<string, { w: number; g: number }>();
const tacticRecord = new Map<Tactic, { w: number; g: number }>();
const moveKinds = new Map<string, number>();
const rows: string[] = ['seed,home,away,strHome,strAway,tactHome,tactAway,shootout'];
const t0 = performance.now();

for (let i = 0; i < N; i++) {
    const mk = (name: string): TeamSetup => {
        const d = aiDraftTeam(rng, rng.int(0, 1));
        return { name, ...d, tactic: rng.pick(TACTICS), color: 0 };
    };
    const home = mk('A');
    const away = mk('B');
    const r = runMatch(FUTSAL_5, home, away, i, { snapshots: false });
    const total = r.score[0] + r.score[1];
    goals += total;
    scoreDist.set(total, (scoreDist.get(total) ?? 0) + 1);
    if (r.score[0] === r.score[1]) draws++;
    for (const e of r.events) {
        eventCounts.set(e.type, (eventCounts.get(e.type) ?? 0) + 1);
        if (e.type === 'move') moveKinds.set(e.kind, (moveKinds.get(e.kind) ?? 0) + 1);
    }

    const sh = strength(home);
    const sa = strength(away);
    if (Math.abs(sh - sa) >= 3 && r.winner !== null) {
        decisive++;
        if ((sh > sa ? 0 : 1) === r.winner) strongerWins++;
    }
    [home, away].forEach((team, ti) => {
        const won = r.winner === ti;
        const types = new Set(team.lineup.flatMap((inst) => species(inst.speciesId).types));
        for (const t of types) {
            const rec = typeRecord.get(t) ?? { w: 0, g: 0 };
            rec.g++;
            if (won) rec.w++;
            typeRecord.set(t, rec);
        }
        const tr = tacticRecord.get(team.tactic) ?? { w: 0, g: 0 };
        tr.g++;
        if (won) tr.w++;
        tacticRecord.set(team.tactic, tr);
    });
    rows.push(
        [
            i,
            r.score[0],
            r.score[1],
            sh.toFixed(1),
            sa.toFixed(1),
            home.tactic,
            away.tactic,
            r.shootout?.join('-') ?? '',
        ].join(','),
    );
}

const ms = performance.now() - t0;
const per = (n: number) => (n / N).toFixed(2);
console.log(`\n=== ${N} partidas em ${(ms / 1000).toFixed(1)}s (${(ms / N).toFixed(1)} ms/partida) ===`);
console.log(`gols/jogo: ${(goals / N).toFixed(2)}   (meta 5–7)`);
console.log(`empates no tempo normal: ${((draws / N) * 100).toFixed(1)}%`);
console.log(
    `mais forte (Δ≥3) vence: ${((strongerWins / Math.max(1, decisive)) * 100).toFixed(1)}% de ${decisive}   (meta 60–65%)`,
);
console.log(
    'distribuição de gols:',
    [...scoreDist.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([g, c]) => `${g}:${c}`)
        .join(' '),
);
console.log(
    'eventos/jogo:',
    [...eventCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([t, c]) => `${t}=${per(c)}`)
        .join(' '),
);
console.log('golpes/jogo por tipo:', [...moveKinds.entries()].map(([k, c]) => `${k}=${per(c)}`).join(' '));
console.log(
    'vitórias por tática:',
    [...tacticRecord.entries()].map(([t, r]) => `${t}=${((r.w / r.g) * 100).toFixed(0)}%`).join(' '),
);
console.log(
    'vitórias por tipo (time com o tipo):',
    [...typeRecord.entries()]
        .sort((a, b) => b[1].w / b[1].g - a[1].w / a[1].g)
        .map(([t, r]) => `${t}=${((r.w / r.g) * 100).toFixed(0)}%(${r.g})`)
        .join(' '),
);
if (csvPath) writeFileSync(csvPath, rows.join('\n'));
