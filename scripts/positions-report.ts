/**
 * Levantamento de posições: quantos Pokémon têm cada posição como principal/elegível, nota média,
 * quantos são de elite (≥ 80) e quais tipos puxam para cada posição. Rodar a cada geração nova.
 *
 * Uso: npx tsx scripts/positions-report.ts
 */
import {
    computeAttributes,
    eligiblePositions,
    POSITIONS,
    type Position,
    positionRating,
} from '../src/engine/attributes';
import { SPECIES } from '../src/engine/data';

const rows = SPECIES.map((sp) => {
    const a = computeAttributes(sp, 50);
    const eligible = eligiblePositions(a, sp.id);
    const ratings = Object.fromEntries(POSITIONS.map((p) => [p, positionRating(a, p)])) as Record<Position, number>;
    return { sp, eligible, ratings };
});

console.log(`\n${SPECIES.length} Pokémon\n`);
console.log('Posição   Principal  Elegíveis  Média  ≥80  Melhores');
for (const p of POSITIONS) {
    const main = rows.filter((r) => r.eligible[0] === p).length;
    const list = rows.filter((r) => r.eligible.includes(p)).sort((a, b) => b.ratings[p] - a.ratings[p]);
    const avg = Math.round(list.reduce((s, r) => s + r.ratings[p], 0) / Math.max(1, list.length));
    const elite = list.filter((r) => r.ratings[p] >= 80).length;
    const top = list
        .slice(0, 5)
        .map((r) => `${r.sp.name} ${r.ratings[p]}`)
        .join(', ');
    console.log(
        `${p.padEnd(9)} ${String(main).padStart(9)}  ${String(list.length).padStart(9)}  ${String(avg).padStart(5)}  ${String(elite).padStart(3)}  ${top}`,
    );
}

const counts = [1, 2, 3, 4].map((n) => rows.filter((r) => r.eligible.length === n).length);
console.log(`\nNº de posições por Pokémon: 1→${counts[0]} · 2→${counts[1]} · 3→${counts[2]} · 4→${counts[3]}`);

console.log('\nTipo → posição principal');
const byType = new Map<string, Record<Position, number>>();
for (const r of rows) {
    for (const t of r.sp.types) {
        const c = byType.get(t) ?? { GK: 0, FIXO: 0, ALA: 0, PIVO: 0 };
        c[r.eligible[0]]++;
        byType.set(t, c);
    }
}
for (const [t, c] of [...byType.entries()].sort()) {
    console.log(`  ${t.padEnd(9)} GK ${c.GK}  FIXO ${c.FIXO}  ALA ${c.ALA}  PIVO ${c.PIVO}`);
}
console.log(
    `\nGoleiros principais: ${rows
        .filter((r) => r.eligible[0] === 'GK')
        .map((r) => r.sp.name)
        .join(', ')}`,
);
