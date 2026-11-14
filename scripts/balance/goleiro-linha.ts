// Goleiro-linha (beira da quadra): quanto vale ligar em cada situação. Mesma partida com e sem a ordem (pareado).
// Uso: npx tsx scripts/balance/goleiro-linha.ts <partidas> [out.json]
// Pra cada partida: no minuto M (33 e 37 do 2º tempo) olha o placar. Quem está perdendo (ou o time 0 no empate) liga
// o goleiro-linha ali e deixa ligado até o fim; aos 37, quem está ganhando por 1 também liga ("à toa").
// Mede gols a favor e contra depois do minuto M e a vitória (com pênaltis, como na Copa).
// Variantes: AG_emptyNetRange=22 etc. mexem só nesta rodada.
import { writeFileSync } from 'node:fs';
import { AGENCY } from '../../src/engine/agency';
import { minuteOf } from '../../src/engine/match';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchOrder, TeamSetup } from '../../src/engine/state';
import { baseTeams, FUTSAL_5 } from './lib';

const N = Number(process.argv[2]) || 200;
const OUT = process.argv[3];
for (const [k, v] of Object.entries(process.env))
    if (k.startsWith('AG_') && v) (AGENCY as unknown as Record<string, number>)[k.slice(3)] = Number(v);

interface Row {
    sit: string;
    gf: number;
    ga: number;
    win: number;
    gf0: number;
    ga0: number;
    win0: number;
}

const MINUTES = [33, 37];

function run(A: TeamSetup, B: TeamSetup, seed: string, orders: MatchOrder[], marks: number[]) {
    const r = new LiveRunner(FUTSAL_5, A, B, seed, orders);
    const s = r.state;
    const at: { tick: number; score: [number, number] }[] = [];
    while (!r.finished) {
        while (at.length < marks.length && s.half === 2 && minuteOf(s) >= marks[at.length])
            at.push({ tick: s.tick, score: [s.score[0], s.score[1]] });
        r.step();
    }
    return { at, score: [s.score[0], s.score[1]] as [number, number], winner: s.winner };
}

const rows: Row[] = [];
const t0 = Date.now();
for (let i = 0; i < N; i++) {
    const { A, B } = baseTeams(i);
    const seed = `gl-${i}`;
    const base = run(A, B, seed, [], MINUTES);
    MINUTES.forEach((m, k) => {
        const mark = base.at[k];
        if (!mark) return;
        const d = mark.score[0] - mark.score[1];
        const try1 = (team: 0 | 1, sit: string) => {
            const v = run(A, B, seed, [{ tick: mark.tick + 1, team, kind: 'flyGk', on: true }], []);
            const opp = team === 0 ? 1 : 0;
            rows.push({
                sit: `${m}' ${sit}`,
                gf: v.score[team] - mark.score[team],
                ga: v.score[opp] - mark.score[opp],
                win: Number(v.winner === team),
                gf0: base.score[team] - mark.score[team],
                ga0: base.score[opp] - mark.score[opp],
                win0: Number(base.winner === team),
            });
        };
        const diffOf = (team: 0 | 1) => (team === 0 ? d : -d);
        const behind: 0 | 1 = d <= 0 ? 0 : 1;
        const db = diffOf(behind);
        if (db >= -2) try1(behind, db === 0 ? 'empatado' : `perdendo por ${-db}`);
        if (m === 37 && Math.abs(d) === 1) try1(d > 0 ? 0 : 1, 'ganhando por 1');
    });
    if ((i + 1) % 50 === 0) console.error(`${i + 1}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
if (OUT) writeFileSync(OUT, JSON.stringify(rows));

const order = [
    "33' perdendo por 1",
    "33' perdendo por 2",
    "33' empatado",
    "37' perdendo por 1",
    "37' perdendo por 2",
    "37' empatado",
    "37' ganhando por 1",
];
console.log(
    '\n| Situação | n | Gols pró (sem → com) | Gols contra (sem → com) | Vitória (sem → com) | Δ vitória (pp) | ± |',
);
console.log('|---|---:|---|---|---|---:|---:|');
for (const sit of order) {
    const r = rows.filter((x) => x.sit === sit);
    if (!r.length) continue;
    const avg = (f: (x: Row) => number) => r.reduce((a, x) => a + f(x), 0) / r.length;
    const dw = r.map((x) => x.win - x.win0);
    const mean = avg((x) => x.win - x.win0);
    const sd = Math.sqrt(dw.reduce((a, x) => a + (x - mean) ** 2, 0) / Math.max(1, r.length - 1) / r.length);
    console.log(
        `| ${sit} | ${r.length} | ${avg((x) => x.gf0).toFixed(2)} → ${avg((x) => x.gf).toFixed(2)} | ${avg((x) => x.ga0).toFixed(2)} → ${avg((x) => x.ga).toFixed(2)} | ${(avg((x) => x.win0) * 100).toFixed(0)}% → ${(avg((x) => x.win) * 100).toFixed(0)}% | ${mean >= 0 ? '+' : ''}${(mean * 100).toFixed(1)} | ${(sd * 100).toFixed(1)} |`,
    );
}
