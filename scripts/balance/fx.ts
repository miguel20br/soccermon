// Itens em bloco: mesmo time sem item × com item (efeito somado). Uso: npx tsx fx.ts <out> [N]
import { writeFileSync } from 'node:fs';
import { MOVES } from '../../src/engine/data';
import { ITEMS } from '../../src/engine/items';
import { baseTeams, dumpAgg, play, SPECIES, type TeamSetup } from './lib';

const out = process.argv[2];
const N = Number(process.argv[3] ?? 1500);
const T1 = new Set(SPECIES.flatMap((s) => s.types));
const nonType = Object.values(ITEMS)
    .filter((it) => it.kind !== 'type')
    .map((it) => it.id);
const typed = Object.values(ITEMS).filter((it) => it.kind === 'type' && T1.has(it.type!));
const HOLDER: Record<string, number> = { focussash: 0, quickclaw: 1, choiceband: 4, scopelens: 4 };
const recs: object[] = [];
const go = (tag: string, A: TeamSetup, B: TeamSetup, i: number, item: string | null) => {
    const aHome = i % 2 === 0;
    const seed = `fx-${tag}-${i}`;
    const r = aHome ? play(A, B, seed) : play(B, A, seed);
    const gd = aHome ? r.score[0] - r.score[1] : r.score[1] - r.score[0];
    const win = r.winner === (aHome ? 0 : 1) ? 1 : 0;
    recs.push({ tag, i, item, gd, win });
};
for (let i = 1000; i < 1000 + N; i++) {
    const { A, B } = baseTeams(i);
    go('none', A, B, i, null);
    const it = nonType[i % nonType.length];
    const k = HOLDER[it] ?? 2;
    go('item', { ...A, lineup: A.lineup.map((p, j) => (j === k ? { ...p, item: it } : p)) }, B, i, it);
    const ty = typed[i % typed.length];
    const kt = A.lineup.findIndex((p) => p.moves.some((m) => MOVES[m]?.type === ty.type && MOVES[m].power > 0));
    if (kt >= 0)
        go('type', { ...A, lineup: A.lineup.map((p, j) => (j === kt ? { ...p, item: ty.id } : p)) }, B, i, ty.id);
    if (i % 250 === 0) console.error(i);
}
writeFileSync(out, JSON.stringify({ recs, agg: dumpAgg() }));
