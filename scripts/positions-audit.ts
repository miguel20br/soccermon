/**
 * Auditoria de posições e atributos dos 151 (balanceamento, 17/10/2026): aplica cada sugestão num "e se" (pontos
 * nos atributos e posições extras, como SPECIES_TUNING e POSITION_OVERRIDES fariam) e grava as notas de antes e
 * depois em src/ui/screens/position-review.ts, que a ferramenta ?lab=posicoes&revisao=1 mostra pro Miguel.
 * Nada aqui muda os dados do jogo.
 *
 * Uso: npx tsx scripts/positions-audit.ts && npx biome format --write src/ui/screens/position-review.ts
 */
import { writeFileSync } from 'node:fs';
import {
    type Attributes,
    type AttrKey,
    computeAttributes,
    eligiblePositions,
    POSITIONS,
    type Position,
    positionFactor,
    positionRating,
    sizePercentile,
} from '../src/engine/attributes';
import { SPECIES, type Species, species, type Tier } from '../src/engine/data';

type Category = 'posicao' | 'atributo' | 'evolucao' | 'sem-lugar';

interface Suggestion {
    id: number;
    cat: Category[];
    reason: string;
    change: string;
    delta?: Partial<Record<AttrKey, number>>;
    /** Posições extras (como POSITION_OVERRIDES). */
    add?: Position[];
    /** Linha evolutiva: quem joga em `pos` antes de evoluir (`from`) e depois (`to`). */
    evo?: { from: number; to: number; pos: Position };
}

// ---------------------------------------------------------------- avaliação

interface Eval {
    attrs: Attributes;
    eligible: Position[];
    /** Nota em cada vaga, a mesma da carta (fator de posição incluído). */
    slot: Record<Position, number>;
    overall: number;
}

function evaluate(sp: Species, s?: Pick<Suggestion, 'delta' | 'add'>): Eval {
    const attrs = computeAttributes(sp, 50);
    for (const [k, d] of Object.entries(s?.delta ?? {}) as [AttrKey, number][]) {
        attrs[k] = Math.min(99, Math.max(1, attrs[k] + d));
    }
    const eligible = eligiblePositions(attrs, sp.id);
    for (const p of s?.add ?? []) if (!eligible.includes(p)) eligible.push(p);
    const slot = Object.fromEntries(
        POSITIONS.map((p) => [p, Math.round(positionRating(attrs, p) * positionFactor(eligible, p, attrs))]),
    ) as Record<Position, number>;
    return { attrs, eligible, slot, overall: slot[eligible[0]] };
}

// ---------------------------------------------------------------- serpente (proposta de fórmula)

const W = SPECIES.map((s) => Math.log(s.weightkg + 1)).sort((a, b) => a - b);
/** Percentil do peso entre os 151 (o mesmo de attributes.ts, que não exporta o dele). */
function weightPct(sp: Species): number {
    const v = Math.log(sp.weightkg + 1);
    const n = W.length;
    if (v <= W[0]) return 0;
    if (v >= W[n - 1]) return 1;
    let lo = 0;
    while (W[lo + 1] <= v) lo++;
    return (lo + (v - W[lo]) / (W[lo + 1] - W[lo] || 1)) / (n - 1);
}
/** Pontos que a serpente ganha medindo o porte só pelo peso: drible, velocidade e goleiro (aprox. ±1). */
function snakeDelta(sp: Species): Partial<Record<AttrKey, number>> {
    const size = sizePercentile(sp);
    const size2 = weightPct(sp);
    const ag = (s: number) => 6 * (1 - 2 * Math.min(1, s));
    const d = ag(size2) - ag(size);
    return { dribble: Math.round(d), pace: Math.round(d / 2), goalkeeping: Math.round(75 * 0.2 * (size2 - size)) };
}

// ---------------------------------------------------------------- as sugestões

const SUGGESTIONS: Suggestion[] = [
    // posição que não combina
    {
        id: 124,
        cat: ['posicao'],
        reason: 'Pergunta sua: Jynx de Ala faz sentido? Pelos números sim: passe 91 (o 6º maior do jogo) e velocidade 95 de base, é a armadora que dança pela ala. No gol seria 72 (tem mãos), mas lenta de corpo. O que faltava em campo era chute, e o Bloco 3 já deu +5.',
        change: 'Manter Ala (nenhuma mudança).',
    },
    {
        id: 122,
        cat: ['posicao'],
        reason: 'O Mr. Mime é o mestre da parede invisível (Barrier, Reflect, Light Screen) e tem mãos, mas o gol nem aparece como opção: lá ele joga 54 (fora de posição).',
        change: 'Adicionar Goleiro como posição secundária (como o Onix). Principal continua Ala 78.',
        add: ['GK'],
    },
    {
        id: 151,
        cat: ['posicao'],
        reason: 'Mew aprende todas as MTs e tem todos os stats 100: é o Pokémon que joga em qualquer lugar. Hoje só tem Ala; de Fixo joga 80, de Pivô 77 e de Goleiro 61 (fora de posição).',
        change: 'Adicionar Fixo, Pivô e Goleiro (como o Ditto). Principal continua Ala 92.',
        add: ['FIXO', 'PIVO', 'GK'],
    },
    {
        id: 78,
        cat: ['posicao'],
        reason: 'Rapidash é o cavalo de corrida (105 de velocidade), e a nota de Ala dele (82) é maior que a de Pivô (81). Só é Pivô principal pelo bônus de +2 que o Pivô tem na escolha da posição; na Ala a carta mostra 80.',
        change: 'Velocidade +3: Ala vira a principal (83). Pivô fica como secundária.',
        delta: { pace: 3 },
    },
    {
        id: 33,
        cat: ['posicao'],
        reason: 'Nidorino é o atacante de chifre que vira Nidoking (Pivô 79), mas joga de Ala. Na linha ♂ o Pivô combina mais (Horn Attack, Horn Drill).',
        change: 'Chute +3 e força +3: Pivô vira a principal (59 de Ala → 58 de Pivô); Ala fica secundária.',
        delta: { shooting: 3, strength: 3 },
        evo: { from: 33, to: 34, pos: 'PIVO' },
    },
    {
        id: 15,
        cat: ['posicao'],
        reason: 'Beedrill é o ataque da linha (90 de Ataque, Twineedle, ferrão), mas é Ala principal; o Pivô empata quase (60 na carta).',
        change: 'Chute +3: Pivô vira a principal (62); Ala fica secundária (62).',
        delta: { shooting: 3 },
    },
    // evolução que derruba a nota
    {
        id: 30,
        cat: ['evolucao'],
        reason: 'O caso do Bloco 2: Nidorina joga de Ala, mas evolui pra Nidoqueen (Goleiro/Fixo) e na Ala cai 57 → 54. A linha ♀ é a defensiva (Nidoqueen tem Fixo); Nidorina já tem Fixo 55.',
        change: 'Desarme +3 e posicionamento +2: Fixo vira a principal (58). Na Fixo ela evolui 58 → 78.',
        delta: { tackling: 3, positioning: 2 },
        evo: { from: 30, to: 31, pos: 'ALA' },
    },
    {
        id: 48,
        cat: ['evolucao', 'posicao'],
        reason: 'Venonat é Goleiro (a PokeAPI diz que o corpo é "humanoide"), mas evolui pra Venomoth, que é Ala e não joga no gol: no gol cai 61 → 47. Quem quisesse apostar na evolução não tinha como escalar ele na Ala.',
        change: 'Adicionar Ala como secundária. Na Ala ele joga 43 e evolui pra 80.',
        add: ['ALA'],
        evo: { from: 48, to: 49, pos: 'GK' },
    },
    {
        id: 11,
        cat: ['evolucao'],
        reason: 'Caterpie é Ala, mas o casulo não tem Ala: na mesma vaga cai 37 → 23. Depois o Butterfree volta pra Ala (70).',
        change: 'Adicionar Ala no Metapod: a linha inteira pode ficar na Ala (37 → 30 → 70).',
        add: ['ALA'],
        evo: { from: 10, to: 11, pos: 'ALA' },
    },
    {
        id: 14,
        cat: ['evolucao'],
        reason: 'Mesmo caso do Metapod: Weedle é Ala, o Kakuna não, e na vaga cai 39 → 30. O Beedrill volta pra Ala/Pivô.',
        change: 'Adicionar Ala no Kakuna (39 → 31 → 63).',
        add: ['ALA'],
        evo: { from: 13, to: 14, pos: 'ALA' },
    },
    {
        id: 62,
        cat: ['evolucao'],
        reason: 'Poliwhirl é Ala, mas o Poliwrath só é Goleiro: o Poliwhirl que evolui na Ala cai 69 → 53 (o fator de Goleiro jogando na linha é 0,75). A Pokédex diz que o Poliwrath nada melhor que atleta olímpico.',
        change: 'Adicionar Ala ao Poliwrath. Na Ala ele joga 70 (evolui 69 → 70) e no gol continua 91.',
        add: ['ALA'],
        evo: { from: 61, to: 62, pos: 'ALA' },
    },
    {
        id: 76,
        cat: ['evolucao'],
        reason: 'Graveler joga de Pivô (Rollout, Explosão), mas o Golem só é Goleiro e Fixo: no Pivô cai 67 → 58.',
        change: 'Adicionar Pivô ao Golem (a pedra rolando). No Pivô ele joga 75.',
        add: ['PIVO'],
        evo: { from: 75, to: 76, pos: 'PIVO' },
    },
    {
        id: 112,
        cat: ['evolucao', 'posicao'],
        reason: 'Rhydon, o rinoceronte de broca que atropela tudo, só é Goleiro (82). O Rhyhorn joga de Fixo e na evolução cai 63 → 56 (Pivô 58 → 55).',
        change: 'Adicionar Fixo e Pivô (o trombador). Principal continua Goleiro 82; Fixo 74 e Pivô 72.',
        add: ['FIXO', 'PIVO'],
        evo: { from: 111, to: 112, pos: 'FIXO' },
    },
    // atributo que não bate
    {
        id: 101,
        cat: ['atributo'],
        reason: 'Electrode tem a maior velocidade de base da Gen 1 (150), mas na carta tem 96: atrás de Jolteon (99), Persian e Aerodactyl (97). O tamanho dele tira um pouco.',
        change: 'Velocidade +3 (99, o teto). Ala 83 → 84.',
        delta: { pace: 3 },
    },
    {
        id: 143,
        cat: ['atributo'],
        reason: 'Snorlax é o mais pesado de Kanto (460 kg), mas tem força 83, abaixo de Golem, Rhydon, Kingler e Cloyster (a defesa 65 puxa pra baixo). E no gol rende acima da nota (+0,48 na auditoria).',
        change: 'Força +6 e goleiro −2: Goleiro 93 → 91, o corpo aparece na carta e o excesso no gol sai.',
        delta: { strength: 6, goalkeeping: -2 },
    },
    {
        id: 95,
        cat: ['atributo'],
        reason: 'Onix: 210 kg de pedra e 160 de Defesa, mas força 76 (o Ataque 45 puxa pra baixo). A muralha deveria trombar.',
        change: 'Força +8 (84): Fixo 63 → 65 (vira prata).',
        delta: { strength: 8 },
    },
    {
        id: 106,
        cat: ['atributo', 'sem-lugar'],
        reason: 'Hitmonlee é o chutador (Hi Jump Kick, as pernas esticam), mas tem chute 69: o chute usa 40% de Sp. Atk e ele tem 35. Raro com nota 70 (prata), e o melhor lugar dele é o gol. O time com ele vence 37%.',
        change: 'Chute +10 e força +4: Pivô 70 → 75 (ouro) e sai do gol.',
        delta: { shooting: 10, strength: 4 },
    },
    {
        id: 59,
        cat: ['atributo'],
        reason: 'Arcanine, o "lendário" que corre 10 mil km num dia (ExtremeSpeed), tem velocidade 85, a mesma do Ponyta e abaixo de Raticate e Fearow. O porte grande tira.',
        change: 'Velocidade +4 (89). Pivô continua 87 (o Pivô não conta velocidade); Ala 83 → 84.',
        delta: { pace: 4 },
    },
    // sem lugar bom
    {
        id: 113,
        cat: ['sem-lugar'],
        reason: 'Chansey é rara e tem 250 de HP, mas sai prata (73): a Defesa 5 derruba o goleiro.',
        change: 'Goleiro +3 (o ovo segura tudo): 73 → 76 (ouro).',
        delta: { goalkeeping: 3 },
    },
    {
        id: 28,
        cat: ['sem-lugar'],
        reason: 'Sandslash é raro e sai prata (Fixo 73): desarme 91, mas posicionamento 65 (Sp. Def 55).',
        change: 'Posicionamento +6 e força +2 (enrola e vira bola de espinhos): Fixo 73 → 75 (ouro).',
        delta: { positioning: 6, strength: 2 },
    },
    {
        id: 119,
        cat: ['sem-lugar'],
        reason: 'Seaking é raro e sai prata (Pivô 70), a menor nota entre os raros junto com o Hitmonlee.',
        change: 'Chute +4 e força +3 (Horn Attack): Pivô 70 → 72.',
        delta: { shooting: 4, strength: 3 },
    },
    {
        id: 40,
        cat: ['sem-lugar'],
        reason: 'Wigglytuff (forma final, 435 de BST) sai 66, abaixo de Persian 82, Fearow 76 e Arbok 74, que têm BST parecido. É o balão que infla e fecha o gol.',
        change: 'Goleiro +5: 66 → 71.',
        delta: { goalkeeping: 5 },
    },
    {
        id: 134,
        cat: ['sem-lugar'],
        reason: 'Vaporeon (525 de BST) sai 76, contra Jolteon 92 e Flareon 79. Passe 90 e fôlego 96, mas lenta na Ala.',
        change: 'Velocidade +4 e drible +4 (nada como peixe): Ala 76 → 79.',
        delta: { pace: 4, dribble: 4 },
    },
    {
        id: 23,
        cat: ['sem-lugar'],
        reason: 'Ekans (288 de BST) sai 43, a nota mais baixa pro BST entre os comuns. A altura de 2 m conta como porte de gigante e tira drible, mas é uma cobra de 7 kg.',
        change: 'Proposta da serpente (porte só pelo peso): drible +5, velocidade +2, goleiro −6. Pivô 43 → 44.',
        delta: snakeDelta(species(23)),
    },
    {
        id: 147,
        cat: ['sem-lugar'],
        reason: 'Dratini (300 de BST) sai 45: mesma coisa do Ekans, 1,8 m de comprimento contando como porte. Pivô sem chute.',
        change: 'Proposta da serpente: drible +5, velocidade +3, goleiro −6. Vira Ala 48 (a linha volta pro Pivô no Dragonite).',
        delta: snakeDelta(species(147)),
    },
    {
        id: 130,
        cat: ['sem-lugar'],
        reason: 'Gyarados é épico e sai 81, abaixo da média dos raros (81,2). E a maior nota dele é de Goleiro (84), escondida pelo bônus do Pivô.',
        change: 'Chute +6 (Hyper Beam): Pivô 81 → 83.',
        delta: { shooting: 6 },
    },
    {
        id: 131,
        cat: ['sem-lugar'],
        reason: 'Lapras é épica e sai 81, abaixo da média dos raros. É a balsa que carrega gente nas costas: força 82 pra 220 kg.',
        change: 'Força +5 e posicionamento +4: Fixo 81 → 83.',
        delta: { strength: 5, positioning: 4 },
    },
    {
        id: 103,
        cat: ['sem-lugar'],
        reason: 'Exeggutor é épico e sai 80, a menor nota entre os épicos (sem contar o Ditto).',
        change: 'Força +3 e chute +2: Pivô 80 → 82 (sai do gol, onde jogava 78).',
        delta: { strength: 3, shooting: 2 },
    },
];

// ---------------------------------------------------------------- saída

const byId = new Map(SUGGESTIONS.map((s) => [s.id, s]));
const evalOf = (id: number, after: boolean) => evaluate(species(id), after ? byId.get(id) : undefined);
const snap = (e: Eval) => ({ eligible: e.eligible, slot: e.slot, attrs: e.attrs });

const items = SUGGESTIONS.map((s) => {
    const sp = species(s.id);
    const before = evalOf(s.id, false);
    const after = evalOf(s.id, true);
    const evo = s.evo && {
        from: s.evo.from,
        to: s.evo.to,
        pos: s.evo.pos,
        before: [evalOf(s.evo.from, false).slot[s.evo.pos], evalOf(s.evo.to, false).slot[s.evo.pos]],
        after: [evalOf(s.evo.from, true).slot[s.evo.pos], evalOf(s.evo.to, true).slot[s.evo.pos]],
    };
    return {
        id: s.id,
        name: sp.name,
        tier: sp.tier,
        bst: sp.bst,
        cats: s.cat,
        reason: s.reason,
        change: s.change,
        delta: s.delta ?? {},
        add: s.add ?? [],
        before: snap(before),
        after: snap(after),
        ...(evo ? { evo } : {}),
    };
});

// distribuição da posição principal por raridade e metal, antes e depois de todas as sugestões
const metalOf = (o: number) => (o >= 75 ? 'ouro' : o >= 65 ? 'prata' : 'bronze');
function distribution(after: boolean) {
    const tiers: Record<string, Record<Position, number>> = {};
    const metals: Record<string, Record<Position, number>> = {};
    for (const sp of SPECIES) {
        const e = evalOf(sp.id, after);
        const main = e.eligible[0];
        for (const [table, key] of [
            [tiers, sp.tier],
            [metals, metalOf(e.overall)],
        ] as const) {
            table[key] ??= { GK: 0, FIXO: 0, ALA: 0, PIVO: 0 };
            table[key][main]++;
        }
    }
    return { tiers, metals };
}

// proposta "evolução herda a vaga": todas as quedas de nota na evolução, hoje e com a regra
const evoDrops = SPECIES.flatMap((sp) =>
    sp.evolvesTo
        .filter((ev) => ev.id <= SPECIES.length)
        .flatMap((ev) => {
            const a = evaluate(sp);
            const to = species(ev.id);
            const b = evaluate(to);
            return a.eligible
                .filter((pos) => b.slot[pos] < a.slot[pos])
                .map((pos) => ({
                    from: sp.name,
                    to: to.name,
                    pos,
                    now: [a.slot[pos], b.slot[pos]],
                    inherit: [a.slot[pos], evaluate(to, { add: [pos] }).slot[pos]],
                }));
        }),
);

const snakes = SPECIES.filter((sp) => sp.shape === 'squiggle').map((sp) => {
    const a = evaluate(sp);
    const b = evaluate(sp, { delta: snakeDelta(sp) });
    return {
        name: sp.name,
        delta: snakeDelta(sp),
        before: [a.eligible[0], a.overall],
        after: [b.eligible[0], b.overall],
    };
});

const out = `// Gerado por scripts/positions-audit.ts (auditoria de posições, 17/10/2026). Não editar à mão: rode o script.
import type { Attributes, Position } from '../../engine/attributes';
import type { Tier } from '../../engine/data';

export type ReviewCategory = 'posicao' | 'atributo' | 'evolucao' | 'sem-lugar';

export interface ReviewSnapshot {
    eligible: Position[];
    /** Nota em cada vaga, a mesma da carta (fator de posição incluído). */
    slot: Record<Position, number>;
    attrs: Attributes;
}

export interface PositionReviewItem {
    id: number;
    name: string;
    tier: Tier;
    bst: number;
    cats: ReviewCategory[];
    reason: string;
    change: string;
    delta: Partial<Attributes>;
    add: Position[];
    before: ReviewSnapshot;
    after: ReviewSnapshot;
    /** Linha evolutiva: nota na vaga \`pos\` de \`from\` e da forma evoluída \`to\`, antes e depois da sugestão. */
    evo?: { from: number; to: number; pos: Position; before: number[]; after: number[] };
}

export const POSITION_REVIEW: PositionReviewItem[] = ${JSON.stringify(items, null, 4)};

/** Posição principal por raridade e por metal, hoje e com todas as sugestões aplicadas. */
export const REVIEW_DISTRIBUTION = ${JSON.stringify({ before: distribution(false), after: distribution(true) }, null, 4)};

/** Propostas de fórmula (separadas: mexem em mais de um Pokémon). */
export const REVIEW_EVO_DROPS = ${JSON.stringify(evoDrops, null, 4)};
export const REVIEW_SNAKES = ${JSON.stringify(snakes, null, 4)};
`;
writeFileSync(new URL('../src/ui/screens/position-review.ts', import.meta.url), out);

const fmt = (e: Eval) =>
    POSITIONS.map((p) => `${p}${e.eligible[0] === p ? '*' : e.eligible.includes(p) ? '+' : ''} ${e.slot[p]}`).join(
        '  ',
    );
for (const s of SUGGESTIONS) {
    console.log(
        `\n${species(s.id).name}: ${s.change}\n  antes  ${fmt(evalOf(s.id, false))}\n  depois ${fmt(evalOf(s.id, true))}`,
    );
}
console.log(`\n${items.length} suspeitos gravados em src/ui/screens/position-review.ts`);
console.log('\nQuedas na evolução (hoje → herdando a vaga):');
for (const d of evoDrops)
    console.log(`  ${d.from} → ${d.to} ${d.pos}: ${d.now.join(' → ')} | ${d.inherit.join(' → ')}`);
console.log('\nSerpente:');
for (const s of snakes) console.log(`  ${s.name} ${s.before.join(' ')} → ${s.after.join(' ')}`);
const t: Tier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const dist = { before: distribution(false), after: distribution(true) };
for (const k of t) console.log(k, JSON.stringify(dist.before.tiers[k]), '→', JSON.stringify(dist.after.tiers[k]));
for (const k of ['bronze', 'prata', 'ouro'])
    console.log(k, JSON.stringify(dist.before.metals[k]), '→', JSON.stringify(dist.after.metals[k]));
