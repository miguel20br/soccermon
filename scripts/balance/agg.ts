// Agrega exp-*.json. Uso: npx tsx agg.ts <tag> <exp-0.json> [exp-1.json...]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ABILITIES, MOVES } from '../../src/engine/data';
import { speciesProfile } from '../../src/engine/draft';
import { moveProfile } from '../../src/engine/moves';
import { createInstance, Rng, SPECIES, viewInstance } from './lib';

// grava as tabelas ao lado dos .json de entrada (ou em OUT=pasta)
const B = process.env.OUT ?? dirname(process.argv[3] ?? '.');
// biome-ignore lint: script
const recs: any[] = [];
const moves = new Map<string, any>();
const abEv = new Map<string, number>();
const itemEv = new Map<string, number>();
const shot = { normalShots: 0, normalGoals: 0, normalXg: 0 };
let matches = 0;
const TAG = process.argv[2];
const roleAgg = new Map<string, any>();
for (const f of process.argv.slice(3)) {
    const d = JSON.parse(readFileSync(f, 'utf8'));
    for (const [k, x] of Object.entries<any>(d.agg.roleAgg ?? {})) {
        const y = roleAgg.get(k) ?? { carriers: 0, uses: 0 };
        y.carriers += x.carriers;
        y.uses += x.uses;
        roleAgg.set(k, y);
    }
    recs.push(...d.recs);
    matches += d.agg.matches;
    for (const [id, x] of Object.entries<any>(d.agg.moves)) {
        const y = moves.get(id) ?? { carriers: 0, uses: 0, hits: 0, shots: 0, goals: 0, xg: 0, winsCarrier: 0 };
        for (const f of Object.keys(y)) y[f] += x[f];
        moves.set(id, y);
    }
    for (const f of Object.keys(shot)) (shot as any)[f] += d.agg.shotAgg[f];
    for (const [a, n] of Object.entries<number>(d.agg.abilityEv)) abEv.set(a, (abEv.get(a) ?? 0) + n);
    for (const [a, n] of Object.entries<number>(d.agg.itemEv)) itemEv.set(a, (itemEv.get(a) ?? 0) + n);
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const se = (xs: number[]) => {
    const m = mean(xs);
    return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)) / Math.max(1, xs.length));
};
const p = (x: number) => `${(x * 100).toFixed(0)}%`;
const lines: string[] = [];
const log = (...a: unknown[]) => {
    const s = a.join(' ');
    console.log(s);
    lines.push(s);
};
log(`matches=${matches}`);

// ---------- regressão: o que decide a partida ----------
const sp = recs.filter((r) => r.tag === 'sp');
{
    // OLS gd ~ dR + dMult(%) ; e logit-ish com win
    const X = sp.map((r) => [1, r.rA - r.rB, (r.mA.mult - r.mB.mult) * 100]);
    for (const yName of ['gd', 'win']) {
        const y = sp.map((r) => r[yName]);
        const XtX = [0, 1, 2].map((i) => [0, 1, 2].map((j) => X.reduce((s, x) => s + x[i] * x[j], 0)));
        const Xty = [0, 1, 2].map((i) => X.reduce((s, x, n) => s + x[i] * y[n], 0));
        // resolve 3x3
        const A = XtX.map((row, i) => [...row, Xty[i]]);
        for (let i = 0; i < 3; i++) {
            const piv = A[i][i];
            for (let j = i; j < 4; j++) A[i][j] /= piv;
            for (let k = 0; k < 3; k++)
                if (k !== i) {
                    const f = A[k][i];
                    for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j];
                }
        }
        log(`OLS ${yName} = ${A[0][3].toFixed(3)} + ${A[1][3].toFixed(4)}*Δnota + ${A[2][3].toFixed(4)}*Δmult%`);
    }
    // vitória por faixa de Δnota
    const buckets = new Map<number, number[]>();
    for (const r of sp) {
        const b = Math.max(-12, Math.min(12, Math.round((r.rA - r.rB) / 3) * 3));
        buckets.set(b, [...(buckets.get(b) ?? []), r.win]);
    }
    log(
        'vitória por Δnota média na vaga:',
        [...buckets]
            .sort((a, b) => a[0] - b[0])
            .map(([b, xs]) => `${b > 0 ? '+' : ''}${b}:${p(mean(xs))}(${xs.length})`)
            .join(' '),
    );
    log(`pênaltis: ${p(mean(sp.map((r) => (r.so ? 1 : 0))))}`);
}

// ---------- espécies ----------
const base = sp.filter((r) => r.s === 0);
const baseWin = mean(base.map((r) => r.win));
const baseGd = mean(base.map((r) => r.gd));
log(`base: win ${p(baseWin)} gd ${baseGd.toFixed(2)} n=${base.length}`);
const baseByI = new Map(base.map((r) => [r.i, r]));
const rows = SPECIES.map((s) => {
    const rs = sp.filter((r) => r.s === s.id);
    const inst = createInstance(s.id, new Rng('x'));
    const v = viewInstance({ ...inst, shiny: false });
    const prof = speciesProfile(s);
    const dGd = rs.map((r) => r.gd - (baseByI.get(r.i)?.gd ?? 0));
    const dWin = rs.map((r) => r.win - (baseByI.get(r.i)?.win ?? 0));
    return {
        id: s.id,
        name: s.name,
        tier: s.tier,
        pos: v.naturalPosition,
        positions: v.positions.join('/'),
        ovr: v.overall,
        ratings: prof.ratings,
        n: rs.length,
        win: mean(rs.map((r) => r.win)),
        dWin: mean(dWin),
        dWinSe: se(dWin),
        dGd: mean(dGd),
        dGdSe: se(dGd),
        rating: mean(rs.filter((r) => r.line).map((r) => r.line.rating)),
        goals: mean(rs.filter((r) => r.line).map((r) => r.line.g)),
        cap: mean(rs.map((r) => (r.cap ? 1 : 0))),
    };
});
writeFileSync(`${B}/${TAG}-species.json`, JSON.stringify(rows, null, 1));
// impacto esperado pela nota: regressão simples dGd ~ ovr por posição
const _fit = (xs: number[], ys: number[]) => {
    const mx = mean(xs);
    const my = mean(ys);
    const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    return { a: my - b * mx, b };
};
const byPos = new Map<string, typeof rows>();
for (const r of rows) if (r.id !== 132) byPos.set(r.pos, [...(byPos.get(r.pos) ?? []), r]);
const resid = new Map<number, number>();
for (const [pos, rs] of byPos) {
    const f = it(
        rs.map((r) => r.ovr),
        rs.map((r) => r.dGd),
    );
    log(`posição ${pos}: n=${rs.length} dGd = ${f.a.toFixed(2)} + ${f.b.toFixed(3)}*ovr`);
    for (const r of rs) resid.set(r.id, r.dGd - (f.a + f.b * r.ovr));
}
const tbl = (rs: typeof rows) =>
    rs.map(
        (r) =>
            `${r.name.padEnd(11)} ${r.tier.padEnd(9)} ${r.pos.padEnd(4)} ovr ${r.ovr}  win ${p(r.win)} Δwin ${(r.dWin * 100).toFixed(0)}±${(r.dWinSe * 100).toFixed(0)}  ΔGD ${r.dGd.toFixed(2)}±${r.dGdSe.toFixed(2)}  resid ${(resid.get(r.id) ?? 0).toFixed(2)}  nota-jogo ${r.rating.toFixed(2)} gols ${r.goals.toFixed(2)} cap ${p(r.cap)} n=${r.n}`,
    );
log('\n== top 15 por ΔGD ==');
tbl([...rows].sort((a, b) => b.dGd - a.dGd).slice(0, 15)).forEach((l) => log(l));
log('\n== bottom 15 por ΔGD ==');
tbl([...rows].sort((a, b) => a.dGd - b.dGd).slice(0, 15)).forEach((l) => log(l));
log('\n== joga acima da nota (resíduo +) ==');
tbl(
    [...rows]
        .filter((r) => resid.has(r.id))
        .sort((a, b) => resid.get(b.id)! - resid.get(a.id)!)
        .slice(0, 12),
).forEach((l) => log(l));
log('\n== joga abaixo da nota (resíduo −) ==');
tbl(
    [...rows]
        .filter((r) => resid.has(r.id))
        .sort((a, b) => resid.get(a.id)! - resid.get(b.id)!)
        .slice(0, 12),
).forEach((l) => log(l));
log('\n== Ditto ==');
tbl(rows.filter((r) => r.id === 132)).forEach((l) => log(l));
// por raridade
for (const t of ['common', 'uncommon', 'rare', 'epic', 'legendary']) {
    const rs = rows.filter((r) => r.tier === t);
    log(
        `tier ${t}: n=${rs.length} ovr ${mean(rs.map((r) => r.ovr)).toFixed(1)} ΔGD ${mean(rs.map((r) => r.dGd)).toFixed(2)} Δwin ${(mean(rs.map((r) => r.dWin)) * 100).toFixed(1)}pp`,
    );
}
// por posição
for (const [pos, rs] of byPos)
    log(
        `pos ${pos}: n=${rs.length} ovr ${mean(rs.map((r) => r.ovr)).toFixed(1)} ΔGD ${mean(rs.map((r) => r.dGd)).toFixed(2)}`,
    );
// por tipo
const types = new Map<string, number[]>();
for (const r of rows) for (const t of SPECIES[r.id - 1].types) types.set(t, [...(types.get(t) ?? []), r.dGd]);
log(
    'ΔGD médio por tipo:',
    [...types]
        .map(([t, xs]) => [t, mean(xs), xs.length] as const)
        .sort((a, b) => b[1] - a[1])
        .map(([t, m, n]) => `${t} ${m.toFixed(2)}(${n})`)
        .join(' '),
);

// ---------- itens ----------
log('\n== itens (Δ vs time base, mesmo confronto) ==');
const items = recs.filter((r) => r.tag === 'item');
const itemIds = [...new Set(items.map((r) => r.item))];
const itemRows = itemIds.map((id) => {
    const rs = items.filter((r) => r.item === id);
    const d = rs.map((r) => r.gd - (baseByI.get(r.i)?.gd ?? 0));
    const dw = rs.map((r) => r.win - (baseByI.get(r.i)?.win ?? 0));
    return { id, n: rs.length, dGd: mean(d), se: se(d), dWin: mean(dw) };
});
for (const r of itemRows.sort((a, b) => b.dGd - a.dGd))
    log(`${r.id.padEnd(14)} ΔGD ${r.dGd.toFixed(2)}±${r.se.toFixed(2)} Δwin ${(r.dWin * 100).toFixed(0)}pp n=${r.n}`);
log('eventos de item/partida:', [...itemEv].map(([k, n]) => `${k}=${(n / matches).toFixed(3)}`).join(' '));

// ---------- habilidades ----------
log('\n== habilidades (on − off, mesmo portador e confronto) ==');
const on = recs.filter((r) => r.tag === 'abOn');
const off = new Map(recs.filter((r) => r.tag === 'abOff').map((r) => [`${r.ab}-${r.i}`, r]));
const abRows = [...new Set(on.map((r) => r.ab))].map((a) => {
    const pairs = on.filter((r) => r.ab === a && off.has(`${a}-${r.i}`));
    const d = pairs.map((r) => r.gd - off.get(`${a}-${r.i}`).gd);
    const dw = pairs.map((r) => r.win - off.get(`${a}-${r.i}`).win);
    return { a, n: pairs.length, dGd: mean(d), se: se(d), dWin: mean(dw), ev: abEv.get(a) ?? 0 };
});
abRows.sort((x, y) => y.dGd - x.dGd);
for (const r of abRows)
    log(
        `${r.a.padEnd(14)} ΔGD ${r.dGd.toFixed(2)}±${r.se.toFixed(2)} Δwin ${(r.dWin * 100).toFixed(0)}pp n=${r.n} eventos=${r.ev}`,
    );
log(
    `média geral das habilidades: ΔGD ${mean(abRows.map((r) => r.dGd)).toFixed(3)}; |z|>2: ${abRows
        .filter((r) => Math.abs(r.dGd / r.se) > 2)
        .map((r) => r.a)
        .join(', ')}`,
);

// ---------- golpes ----------
log('\n== golpes ==');
const normConv = shot.normalGoals / shot.normalShots;
log(
    `chute normal: ${shot.normalShots} chutes, conversão ${p(normConv)}, xG médio ${(shot.normalXg / shot.normalShots).toFixed(3)}`,
);
const mv = [...moves].map(([id, x]) => ({
    id,
    kind: moveProfile(id).kind,
    ...x,
    usePerCarrier: x.uses / Math.max(1, x.carriers),
    conv: x.shots ? x.goals / x.shots : NaN,
    goalsPerCarrier: x.goals / Math.max(1, x.carriers),
    hitRate: x.uses ? x.hits / x.uses : NaN,
    winC: x.winsCarrier / Math.max(1, x.carriers),
}));
writeFileSync(`${B}/${TAG}-moves.json`, JSON.stringify(mv, null, 1));
const big = mv.filter((m) => m.carriers >= 200);
log(`golpes vistos: ${mv.length}; com 200+ portadores-partida: ${big.length}`);
const mtbl = (ms: typeof mv) =>
    ms.forEach((m) =>
        log(
            `${m.id.padEnd(13)} ${m.kind.padEnd(7)} portadores ${m.carriers} usos/portador ${m.usePerCarrier.toFixed(2)} acerto ${p(m.hitRate)} chutes ${m.shots} conv ${Number.isNaN(m.conv) ? '-' : p(m.conv)} gols/portador ${m.goalsPerCarrier.toFixed(3)} vit.portador ${p(m.winC)}`,
        ),
    );
log('-- quase nunca usados (usos/portador < 0.3) --');
mtbl(
    big
        .filter((m) => m.usePerCarrier < 0.3)
        .sort((a, b) => a.usePerCarrier - b.usePerCarrier)
        .slice(0, 15),
);
log('-- mais gols por portador --');
mtbl([...big].sort((a, b) => b.goalsPerCarrier - a.goalsPerCarrier).slice(0, 12));
log('-- maior conversão de chute (20+ chutes) --');
mtbl(
    big
        .filter((m) => m.shots >= 20)
        .sort((a, b) => b.conv - a.conv)
        .slice(0, 10),
);
log('-- menor conversão de chute (20+ chutes) --');
mtbl(
    big
        .filter((m) => m.shots >= 20)
        .sort((a, b) => a.conv - b.conv)
        .slice(0, 8),
);
log('-- maior vitória do time do portador --');
mtbl([...big].sort((a, b) => b.winC - a.winC).slice(0, 10));
log('-- menor vitória do time do portador --');
mtbl([...big].sort((a, b) => a.winC - b.winC).slice(0, 10));
const kinds = new Map<string, any[]>();
for (const m of big) kinds.set(m.kind, [...(kinds.get(m.kind) ?? []), m]);
for (const [k, ms] of kinds)
    log(
        `tipo ${k}: ${ms.length} golpes, usos/portador ${mean(ms.map((m) => m.usePerCarrier)).toFixed(2)}, gols/portador ${mean(ms.map((m) => m.goalsPerCarrier)).toFixed(3)}`,
    );
writeFileSync(`${B}/${TAG}-roles.json`, JSON.stringify(Object.fromEntries(roleAgg)));
writeFileSync(`${B}/${TAG}-report.txt`, lines.join('\n'));
void ABILITIES;
void MOVES;
