// Resíduo nota × impacto para um subconjunto (ONLY), usando a reta por posição do run completo.
// Uso: npx tsx prec.ts <fit-species.json> <run.json>...
import { readFileSync } from 'node:fs';
import { createInstance, Rng, SPECIES, viewInstance } from './lib';

const fitRows = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const se = (xs: number[]) => {
    const m = mean(xs);
    return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)) / Math.max(1, xs.length));
};
const fits = new Map<string, { a: number; b: number }>();
for (const pos of ['GK', 'FIXO', 'ALA', 'PIVO']) {
    const rs = fitRows.filter((r: any) => r.pos === pos && r.id !== 132);
    const mx = mean(rs.map((r: any) => r.ovr)),
        my = mean(rs.map((r: any) => r.dGd));
    const b =
        rs.reduce((s: number, r: any) => s + (r.ovr - mx) * (r.dGd - my), 0) /
        rs.reduce((s: number, r: any) => s + (r.ovr - mx) ** 2, 0);
    fits.set(pos, { a: my - b * mx, b });
}
const recs: any[] = [];
for (const f of process.argv.slice(3))
    recs.push(...JSON.parse(readFileSync(f, 'utf8')).recs.filter((r: any) => r.tag === 'sp'));
const base = new Map(recs.filter((r) => r.s === 0).map((r) => [r.i, r]));
for (const id of [...new Set(recs.map((r) => r.s))].filter((x) => x !== 0)) {
    const rs = recs.filter((r) => r.s === id && base.has(r.i));
    const v = viewInstance({ ...createInstance(id, new Rng('x')), shiny: false });
    const d = rs.map((r) => r.gd - base.get(r.i).gd);
    const f = fits.get(v.naturalPosition)!;
    const exp = f.a + f.b * v.overall;
    console.log(
        `${SPECIES[id - 1].name.padEnd(11)} ${v.naturalPosition.padEnd(4)} ovr ${v.overall} ΔGD ${mean(d).toFixed(2)}±${se(d).toFixed(2)} resid ${(mean(d) - exp).toFixed(2)} win ${(mean(rs.map((r) => r.win)) * 100).toFixed(0)}% n=${rs.length}`,
    );
}
