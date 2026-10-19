/**
 * Patch da fórmula (proposta, docs/planos/patch-formula.md): Ala contando chute e Pivô contando velocidade.
 * Não muda o código do motor: muta o `DEFAULT_FORMULAS` em memória antes de carregar o resto.
 *
 * Uso:
 *   npx tsx scripts/balance/formula-patch.ts table                  # tabelas antes ⇒ depois (A e B)
 *   npx tsx scripts/balance/formula-patch.ts calibrate <base|A|B>   # npm run calibrate -- --n 400 com a fórmula
 *   npx tsx scripts/balance/formula-patch.ts econ <base|A|B>        # economia do draft com a fórmula
 *
 * Só `attributes.ts` entra por import estático: o cache de perfil do draft (`speciesProfile`) e o resto só carregam
 * depois da mutação (import dinâmico).
 */
import {
    type AttrKey,
    computeAttributes,
    DEFAULT_FORMULAS,
    eligiblePositions,
    type Position,
    type PositionFormulas,
    positionRating,
} from '../../src/engine/attributes';
import { SPECIES } from '../../src/engine/data';

type W = Partial<Record<AttrKey, number>>;
const VARIANTS: Record<string, { ALA: W; PIVO: W }> = {
    // principal: chute entra com 15 na Ala, velocidade com 10 no Pivô (tirando um pouco de cada peso antigo)
    A: {
        ALA: { pace: 25, dribble: 25, passing: 20, shooting: 15, stamina: 15 },
        PIVO: { shooting: 30, strength: 30, dribble: 15, positioning: 15, pace: 10 },
    },
    // alternativa mais leve: 10 e 10
    B: {
        ALA: { pace: 27, dribble: 27, passing: 23, shooting: 10, stamina: 13 },
        PIVO: { shooting: 32, strength: 32, dribble: 13, positioning: 13, pace: 10 },
    },
};

const mode = process.argv[2] ?? 'table';
const variant = process.argv[3] ?? 'base';

function formulasOf(v: string): PositionFormulas {
    const x = VARIANTS[v];
    return x ? { ...DEFAULT_FORMULAS, ALA: x.ALA, PIVO: x.PIVO } : DEFAULT_FORMULAS;
}

if (mode === 'calibrate' || mode === 'econ') {
    const f = formulasOf(variant);
    DEFAULT_FORMULAS.ALA = f.ALA;
    DEFAULT_FORMULAS.PIVO = f.PIVO;
    console.log(`fórmula ${variant}: ALA ${JSON.stringify(f.ALA)} PIVO ${JSON.stringify(f.PIVO)}`);
    if (mode === 'calibrate') {
        process.argv = [process.argv[0], 'calibrate', '--n', process.argv[4] ?? '400'];
        await import('../calibrate');
    } else await import('./econ');
} else table();

function table() {
    const LEVEL = 50;
    const metal = (r: number) => (r >= 75 ? 'ouro' : r >= 65 ? 'prata' : 'bronze');
    const LBL: Record<Position, string> = { GK: 'GOL', FIXO: 'Fixo', ALA: 'Ala', PIVO: 'Pivô' };
    const rows = SPECIES.map((sp) => {
        const a = computeAttributes(sp, LEVEL);
        const of = (f: PositionFormulas) => {
            const el = eligiblePositions(a, sp.id, f);
            return {
                ala: positionRating(a, 'ALA', f),
                pivo: positionRating(a, 'PIVO', f),
                el,
                overall: positionRating(a, el[0], f),
            };
        };
        return { sp, a, base: of(DEFAULT_FORMULAS), A: of(formulasOf('A')), B: of(formulasOf('B')) };
    });
    const els = (el: Position[]) => el.map((p) => LBL[p]).join('/');

    const EX = [
        'Pikachu',
        'Jolteon',
        'Rapidash',
        'Alakazam',
        'Gengar',
        'Tauros',
        'Scyther',
        'Electrode',
        'Kingler',
        'Machamp',
        'Nidoking',
        'Snorlax',
        'Dragonite',
        'Aerodactyl',
        'Mewtwo',
        'Hitmonlee',
        'Primeape',
        'Arcanine',
        'Jynx',
        'Dragonair',
    ];
    console.log('\n## Exemplos (nível 50; Ala e Pivô: antes ⇒ A / B; posições: antes ⇒ A)\n');
    console.log('| Pokémon | Chute | Veloc. | Ala | Pivô | Posições | Nota da carta |');
    console.log('|---|---|---|---|---|---|---|');
    for (const name of EX) {
        const r = rows.find((x) => x.sp.name === name);
        if (!r) continue;
        const pos = els(r.base.el) === els(r.A.el) ? els(r.base.el) : `${els(r.base.el)} ⇒ ${els(r.A.el)}`;
        console.log(
            `| ${name} | ${r.a.shooting} | ${r.a.pace} | ${r.base.ala} ⇒ ${r.A.ala} / ${r.B.ala} | ${r.base.pivo} ⇒ ${r.A.pivo} / ${r.B.pivo} | ${pos} | ${r.base.overall} ⇒ ${r.A.overall} / ${r.B.overall} |`,
        );
    }

    for (const v of ['A', 'B'] as const) {
        console.log(`\n## Variante ${v}\n`);
        for (const pos of ['ala', 'pivo'] as const) {
            const d = rows
                .map((r) => ({ name: r.sp.name, b: r.base[pos], n: r[v][pos], d: r[v][pos] - r.base[pos] }))
                .sort((x, y) => y.d - x.d);
            const mean = (k: 'b' | 'n') => (d.reduce((s, x) => s + x[k], 0) / d.length).toFixed(1);
            const fmt = (x: (typeof d)[number]) => `${x.name} ${x.b}⇒${x.n}`;
            console.log(`${pos === 'ala' ? 'Ala' : 'Pivô'}: média ${mean('b')} ⇒ ${mean('n')}`);
            console.log(`  sobem: ${d.slice(0, 10).map(fmt).join(', ')}`);
            console.log(`  descem: ${d.slice(-10).reverse().map(fmt).join(', ')}`);
        }
        const mainChange = rows.filter((r) => r.base.el[0] !== r[v].el[0]);
        const elChange = rows.filter((r) => els(r.base.el) !== els(r[v].el));
        const metalChange = rows.filter((r) => metal(r.base.overall) !== metal(r[v].overall));
        const ovDiff = rows.map((r) => r[v].overall - r.base.overall);
        console.log(
            `posição principal muda: ${mainChange.length} (${mainChange.map((r) => `${r.sp.name} ${LBL[r.base.el[0]]}⇒${LBL[r[v].el[0]]}`).join(', ')})`,
        );
        console.log(
            `elegíveis mudam: ${elChange.length} (${elChange.map((r) => `${r.sp.name} ${els(r.base.el)}⇒${els(r[v].el)}`).join(', ')})`,
        );
        console.log(
            `metal da carta muda: ${metalChange.length} (${metalChange.map((r) => `${r.sp.name} ${r.base.overall}⇒${r[v].overall}`).join(', ')})`,
        );
        const count = (p: Position, k: 'base' | 'A' | 'B') => rows.filter((r) => r[k].el[0] === p).length;
        console.log(
            `principal por posição (antes ⇒ ${v}): ${(['GK', 'FIXO', 'ALA', 'PIVO'] as const).map((p) => `${LBL[p]} ${count(p, 'base')}⇒${count(p, v)}`).join(', ')}`,
        );
        console.log(
            `nota da carta: média Δ ${(ovDiff.reduce((s, x) => s + x, 0) / ovDiff.length).toFixed(2)}, maior +${Math.max(...ovDiff)}, menor ${Math.min(...ovDiff)}`,
        );
    }
}
