/**
 * Auditoria "evolução sem perda" (09/11/2026, docs/planos/evolucao-sem-perda.md): pra cada par pré-evolução → evolução
 * dos 151, compara cada atributo e a nota por posição da forma base com a evoluída, em três camadas:
 *   1. espécie pura (a carta do pacote: Magikarp × Gyarados, sem bônus);
 *   2. carta que evoluiu em quadra (+EVOLUTION_BONUS em tudo, `evolveInstance`), sem habilidade;
 *   3. idem com a habilidade de cada um (a que `evolveInstance` mantém ou troca) e o Encanto da Fada.
 * E simula as regras de conserto (R1 herda o máximo, R2 piso pré+1, R3 habilidade passa) sem mexer no jogo.
 *
 * Uso: npx tsx scripts/balance/evo-audit.ts > <scratchpad>/evo-audit.md
 */
import {
    type Attributes,
    type AttrKey,
    computeAttributes,
    eligiblePositions,
    POSITIONS,
    type Position,
    positionFactor,
    positionRating,
} from '../../src/engine/attributes';
import { ABILITIES, SPECIES, type Species, species } from '../../src/engine/data';
import { evolveInstance } from '../../src/engine/evolution';
import {
    createInstance,
    EVOLUTION_BONUS,
    type PokemonInstance,
    slotRating,
    withBonus,
} from '../../src/engine/instance';
import { applyModifiers, attributeModifiers } from '../../src/engine/modifiers';
import { Rng } from '../../src/engine/rng';

const KEYS: AttrKey[] = [
    'pace',
    'shooting',
    'passing',
    'dribble',
    'tackling',
    'strength',
    'positioning',
    'stamina',
    'goalkeeping',
];
const SHORT: Record<AttrKey, string> = {
    pace: 'VEL',
    shooting: 'CHU',
    passing: 'PAS',
    dribble: 'DRI',
    tackling: 'DES',
    strength: 'FOR',
    positioning: 'LEI',
    stamina: 'FOL',
    goalkeeping: 'GOL',
};
const POS: Record<Position, string> = { GK: 'GOL', FIXO: 'FIX', ALA: 'ALA', PIVO: 'PIV' };
const L = 50;
const inGame = (id: number) => id <= SPECIES.length;

const pairs: [Species, Species][] = SPECIES.flatMap((sp) =>
    sp.evolvesTo.filter((e) => inGame(e.id)).map((e) => [sp, species(e.id)] as [Species, Species]),
);

const inst = (id: number, ability: string, evolved = 0): PokemonInstance => ({
    ...createInstance(id, new Rng(id)),
    uid: `audit-${id}`,
    ability,
    shiny: false,
    special: null,
    evolved,
});
const field = (p: PokemonInstance) =>
    applyModifiers(withBonus(computeAttributes(species(p.speciesId), L), 0), attributeModifiers(p));
type Drop = { k: AttrKey; a: number; b: number; d: number };
const worse = (a: Attributes, b: Attributes): Drop[] =>
    KEYS.map((k) => ({ k, a: Math.round(a[k]), b: Math.round(b[k]), d: Math.round(b[k]) - Math.round(a[k]) })).filter(
        (x) => x.d < 0,
    );
const fmtWorse = (w: Drop[]) => w.map((x) => `${SHORT[x.k]} ${x.a}→${x.b} (${x.d})`).join(', ');
const deficit = (w: Drop[]) => w.reduce((s, x) => s - x.d, 0);

// ---------------------------------------------------------------- 1 e 2: espécie pura e carta evoluída
const out: string[] = [];
const p = (s = '') => out.push(s);
let pureWorse = 0;
let cardWorse = 0;
const pureRows: string[] = [];
const byAttrPure: Record<string, number> = {};
const byAttrCard: Record<string, number> = {};
for (const [a, b] of pairs) {
    const A = computeAttributes(a, L);
    const B = computeAttributes(b, L);
    const wp = worse(A, B);
    const wc = worse(A, withBonus(B, EVOLUTION_BONUS));
    if (wp.length) pureWorse++;
    if (wc.length) cardWorse++;
    for (const x of wp) byAttrPure[x.k] = (byAttrPure[x.k] ?? 0) + 1;
    for (const x of wc) byAttrCard[x.k] = (byAttrCard[x.k] ?? 0) + 1;
    if (wp.length) pureRows.push(`| ${a.name} → ${b.name} | ${fmtWorse(wp)} | ${fmtWorse(wc) || '—'} |`);
}
p(
    `Pares: ${pairs.length}. Pioram em algum atributo: espécie pura ${pureWorse}; carta evoluída (+${EVOLUTION_BONUS}) ${cardWorse}.`,
);
p(`Por atributo (pura): ${KEYS.map((k) => `${SHORT[k]} ${byAttrPure[k] ?? 0}`).join(' · ')}`);
p(`Por atributo (carta +2): ${KEYS.map((k) => `${SHORT[k]} ${byAttrCard[k] ?? 0}`).join(' · ')}`);
p();
p('| Par | Espécie pura (pacote) | Carta evoluída (+2) |');
p('|---|---|---|');
for (const r of pureRows) p(r);

// ---------------------------------------------------------------- 3: com habilidade
p();
p('## Com habilidade (carta evoluída +2, habilidade que evolveInstance deixa)');
p();
p('| Par | Habilidade antes → depois | Pior em campo |');
p('|---|---|---|');
let abilityCases = 0;
for (const [a, b] of pairs) {
    for (const ab of a.abilities) {
        const pre = inst(a.id, ab);
        const post = evolveInstance(pre, b.id);
        const w = worse(field(pre), field(post));
        const wNoAb = worse(computeAttributes(a, L), withBonus(computeAttributes(b, L), EVOLUTION_BONUS));
        // só o que a habilidade (ou a perda dela) acrescenta à lista da carta sem habilidade
        if (w.length && fmtWorse(w) !== fmtWorse(wNoAb)) {
            abilityCases++;
            const an = (x: string) => ABILITIES[x]?.name ?? x;
            p(`| ${a.name} → ${b.name} | ${an(ab)} → ${an(post.ability)} | ${fmtWorse(w)} |`);
        }
    }
}
p();
p(`Casos em que a habilidade muda a lista: ${abilityCases}.`);

// ---------------------------------------------------------------- notas por posição
p();
p('## Nota por posição (carta evoluída na mesma vaga, herdando a vaga)');
p();
p('| Par | Vaga | Antes | Depois |');
p('|---|---|---|---|');
let ratingDrops = 0;
for (const [a, b] of pairs) {
    const pre = inst(a.id, a.abilities[0]);
    const elig = eligiblePositions(computeAttributes(a, L), a.id);
    for (const pos of elig) {
        const r0 = slotRating(pre, pos);
        const r1 = slotRating(evolveInstance(pre, b.id, pos), pos);
        if (r1 < r0) {
            ratingDrops++;
            p(`| ${a.name} → ${b.name} | ${POS[pos]} | ${r0} | ${r1} |`);
        }
    }
}
p();
p(`Vagas em que a nota cai ao evoluir: ${ratingDrops}.`);

// ---------------------------------------------------------------- regras
type Rule = 'R1' | 'R2';
const memo = new Map<string, Attributes>();
function ruled(sp: Species, rule: Rule): Attributes {
    const key = `${rule}-${sp.id}`;
    const hit = memo.get(key);
    if (hit) return hit;
    const own = computeAttributes(sp, L);
    let res = own;
    if (sp.prevo && inGame(sp.prevo)) {
        const pre = ruled(species(sp.prevo), rule);
        const floor = rule === 'R1' ? 0 : 1;
        res = { ...own };
        for (const k of KEYS) res[k] = Math.min(99, Math.max(own[k], pre[k] + floor));
    }
    memo.set(key, res);
    return res;
}
const natural = (a: Attributes, id: number) => {
    const pos = eligiblePositions(a, id);
    return { pos, r: positionRating(a, pos[0]) };
};
for (const rule of ['R1', 'R2'] as Rule[]) {
    p();
    p(`## ${rule}: ${rule === 'R1' ? 'evolução herda o máximo de cada atributo' : 'piso = atributo da pré + 1'}`);
    p();
    p(
        '| Espécie | Atributos que sobem | Posições antes → depois | Nota principal antes → depois | Notas por vaga (antes → depois) |',
    );
    p('|---|---|---|---|---|');
    let changed = 0;
    let points = 0;
    let ratingUp = 0;
    let maxUp = 0;
    let posChanges = 0;
    for (const sp of SPECIES) {
        const A = computeAttributes(sp, L);
        const R = ruled(sp, rule);
        const up = KEYS.map((k) => ({ k, d: R[k] - A[k] })).filter((x) => x.d > 0);
        if (!up.length) continue;
        changed++;
        points += up.reduce((s, x) => s + x.d, 0);
        const n0 = natural(A, sp.id);
        const n1 = natural(R, sp.id);
        if (n1.r > n0.r) ratingUp++;
        maxUp = Math.max(maxUp, n1.r - n0.r);
        const posText = (l: Position[]) => l.map((x) => POS[x]).join('/');
        if (posText(n0.pos) !== posText(n1.pos)) posChanges++;
        const slot = (a: Attributes, pos: Position[], x: Position) =>
            Math.round(positionRating(a, x) * positionFactor(pos, x, a));
        const slots = POSITIONS.map((x) => {
            const s0 = slot(A, n0.pos, x);
            const s1 = slot(R, n1.pos, x);
            return s0 === s1 ? `${POS[x]} ${s0}` : `${POS[x]} ${s0}→${s1}`;
        }).join(', ');
        p(
            `| ${sp.name} | ${up.map((x) => `${SHORT[x.k]} +${x.d}`).join(', ')} | ${posText(n0.pos)} → ${posText(n1.pos)} | ${n0.r} → ${n1.r} | ${slots} |`,
        );
    }
    p();
    p(
        `${rule}: ${changed} espécies mudam, ${points} pontos de atributo no total; nota principal sobe em ${ratingUp} (máx. +${maxUp}); posições mudam em ${posChanges}.`,
    );
}

// R4: só a carta que evoluiu em quadra herda o máximo (a espécie do pacote fica como está)
p();
p('## R4: só a carta que evoluiu herda o máximo de cada atributo da pré (pacote intocado)');
p();
p('| Par | Atributos que sobem na carta evoluída | Nota na vaga herdada antes → depois | Principal antes → depois |');
p('|---|---|---|---|');
let r4Pairs = 0;
for (const [a, b] of pairs) {
    const A = computeAttributes(a, L);
    const B = computeAttributes(b, L);
    const up = KEYS.map((k) => ({ k, d: Math.max(0, A[k] - B[k]) })).filter((x) => x.d > 0);
    if (!up.length) continue;
    r4Pairs++;
    const F = { ...B };
    for (const k of KEYS) F[k] = Math.max(B[k], A[k]);
    const preElig = eligiblePositions(A, a.id);
    const vaga = preElig[0];
    const rate = (x: Attributes) => {
        const elig = eligiblePositions(x, b.id);
        if (!elig.includes(vaga)) elig.push(vaga);
        const c = withBonus(x, EVOLUTION_BONUS);
        return {
            slot: Math.round(positionRating(c, vaga) * positionFactor(elig, vaga, c)),
            main: `${POS[elig[0]]} ${positionRating(c, elig[0])}`,
        };
    };
    const r0 = rate(B);
    const r1 = rate(F);
    p(
        `| ${a.name} → ${b.name} | ${up.map((x) => `${SHORT[x.k]} +${x.d}`).join(', ')} | ${POS[vaga]} ${r0.slot} → ${r1.slot} | ${r0.main} → ${r1.main} |`,
    );
}
p();
p(`R4: ${r4Pairs} pares mudam (só a carta que evoluiu; a do pacote fica igual).`);

// R3: a habilidade da pré-evolução passa pra evolução (só a carta que evoluiu em quadra)
p();
p('## R3: a carta que evolui mantém a habilidade da pré (mesmo que a forma nova não tenha)');
p();
let fixed = 0;
const lost: string[] = [];
for (const [a, b] of pairs) {
    for (const ab of a.abilities) {
        const pre = inst(a.id, ab);
        const post = evolveInstance(pre, b.id);
        if (post.ability === ab) continue;
        const an = (x: string) => ABILITIES[x]?.name ?? x;
        lost.push(`${a.name} ${an(ab)} → ${b.name} ${an(post.ability)}`);
        const keep = { ...post, ability: ab };
        const w0 = worse(field(pre), field(post));
        const w1 = worse(field(pre), field(keep));
        if (deficit(w1) < deficit(w0)) {
            fixed++;
            p(`- ${a.name} (${an(ab)}) → ${b.name}: ${fmtWorse(w0)} ⇒ ${fmtWorse(w1) || 'nada pior'}`);
        }
    }
}
p();
p(`R3 melhora ${fixed} combinações espécie+habilidade.`);
p(`Toda troca de habilidade na evolução hoje (${lost.length}): ${lost.join('; ')}.`);

console.log(out.join('\n'));
