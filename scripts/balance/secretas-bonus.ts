/**
 * Proposta da fase 2 das sinergias secretas (docs/planos/sinergias-secretas-fase2.md): quanto cada secreta com bônus
 * mudaria a partida, SEM mexer no motor. O script põe as secretas em `LINKS` só na memória dele (o motor lê a lista na
 * hora) e compara as mesmas partidas (mesmas seeds) com e sem elas.
 *
 *   npx tsx scripts/balance/secretas-bonus.ts [N]          por secreta: time com os membros x time sorteado, N partidas
 *   npx tsx scripts/balance/secretas-bonus.ts [N] --geral  N partidas de draft da IA: gols, favorito, quantas ligam
 *
 * Números são PROPOSTA pro Miguel (skill soccermon-balanceamento).
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { SPECIES, species } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import { createInstance, viewInstance } from '../../src/engine/instance';
import { computeLinks, LINKS, type LinkDef } from '../../src/engine/links';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';

const args = process.argv.slice(2);
const N = Number(args[0]) || 100;
const GERAL = args.includes('--geral');

const def = (id: string, groups: number[][], need: number, bonus: number): LinkDef => ({
    id,
    name: id,
    desc: '',
    groups,
    need,
    bonus,
    combo: id,
});

// famílias da Gen 1 (base → final) pra Mestre e Aprendiz e Família Completa
const preOf = new Map<number, number>();
for (const sp of SPECIES) for (const e of sp.evolvesTo) if (e.id <= 151) preOf.set(e.id, sp.id);
const chains: number[][] = [];
for (const sp of SPECIES) {
    if (sp.id > 151 || preOf.has(sp.id) || !sp.evolvesTo.length) continue;
    // a linha principal (Eevee e companhia ficam de fora: já têm as delas)
    if (sp.id === 133) continue;
    const chain = [sp.id];
    while (species(chain.at(-1)!).evolvesTo.some((e) => e.id <= 151))
        chain.push(species(chain.at(-1)!).evolvesTo.find((e) => e.id <= 151)!.id);
    chains.push(chain);
}
const MESTRE = 1.03;
const FAMILIA = 1.04;

/** As secretas "motor" do catálogo (§3 da pesquisa) com o bônus proposto. */
const SECRETS: { id: string; defs: LinkDef[] }[] = [
    {
        id: 'turma',
        defs: [
            def(
                'turma',
                [
                    [25, 26],
                    [120, 121, 54, 55, 118, 119, 116, 117],
                    [95, 74, 75, 76, 37, 38, 41, 42],
                ],
                3,
                1.06,
            ),
        ],
    },
    { id: 'montePrateado', defs: [def('montePrateado', [[25], [143], [3, 6, 9]], 3, 1.08)] },
    {
        id: 'rivalAzul',
        defs: [
            def(
                'rivalAzul',
                [
                    [16, 17, 18],
                    [63, 64, 65],
                    [111, 112],
                    [58, 59],
                    [129, 130],
                    [102, 103],
                ],
                2,
                1.04,
            ),
        ],
    },
    { id: 'joyJenny', defs: [def('joyJenny', [[113], [58, 59]], 2, 1.05)] },
    { id: 'flauta', defs: [def('flauta', [[143], [39, 40, 35, 36]], 2, 1.05)] },
    { id: 'slowbro', defs: [def('slowbro', [[79], [90]], 2, 1.05)] },
    {
        id: 'mestreAprendiz',
        defs: chains.map((c) => def(`mestre${c[0]}`, [[c[0]], [c.at(-1)!]], 2, MESTRE)),
    },
    {
        id: 'familiaCompleta',
        defs: chains
            .filter((c) => c.length === 3)
            .map((c) => def(`familia${c[0]}`, [[c[0]], [c[1]], [c[2]]], 3, FAMILIA)),
    },
    { id: 'quatroPokebolas', defs: [def('quatroPokebolas', [[1], [4], [7], [25]], 4, 1.08)] },
    { id: 'irmaosEevee', defs: [def('irmaosEevee', [[133], [134], [135], [136]], 4, 1.08)] },
    { id: 'museuPewter', defs: [def('museuPewter', [[138, 139], [140, 141], [142]], 3, 1.08)] },
    { id: 'erika', defs: [def('erika', [[69, 70, 71], [114], [43, 44, 45]], 2, 1.05)] },
    {
        id: 'koga',
        defs: [
            def(
                'koga',
                [
                    [109, 110],
                    [88, 89],
                    [48, 49],
                ],
                2,
                1.05,
            ),
        ],
    },
    { id: 'sabrina', defs: [def('sabrina', [[63, 64, 65], [122], [48, 49]], 2, 1.05)] },
    { id: 'blaine', defs: [def('blaine', [[58, 59], [77, 78], [126]], 2, 1.05)] },
    { id: 'giovanni', defs: [def('giovanni', [[53], [31, 34], [51, 112]], 3, 1.06)] },
    { id: 'lorelei', defs: [def('lorelei', [[86, 87], [90, 91], [80], [124], [131]], 2, 1.05)] },
    { id: 'bruno', defs: [def('bruno', [[66, 67, 68], [106, 107], [95]], 3, 1.06)] },
    {
        id: 'torre',
        defs: [
            def(
                'torre',
                [
                    [92, 93, 94],
                    [41, 42],
                    [23, 24],
                    [104, 105],
                ],
                2,
                1.05,
            ),
        ],
    },
    {
        id: 'lance',
        defs: [
            def(
                'lance',
                [
                    [147, 148, 149],
                    [130, 142],
                ],
                2,
                1.05,
            ),
        ],
    },
    {
        id: 'caboLink',
        defs: [
            [[123], [127]],
            [
                [23, 24],
                [27, 28],
            ],
            [
                [43, 44, 45],
                [69, 70, 71],
            ],
            [
                [58, 59],
                [37, 38],
            ],
            [
                [56, 57],
                [52, 53],
            ],
        ].map((g, i) => def(`cabo${i}`, g, 2, 1.04)),
    },
];

const BASE = [...LINKS];
const setLinks = (extra: LinkDef[]) => LINKS.splice(0, LINKS.length, ...BASE, ...extra);
const team = (seed: string): TeamSetup => ({
    name: seed,
    ...aiDraftTeam(new Rng(seed, 'team'), 1),
    tactic: 'balanced',
    color: 0,
    manualSubs: true,
});
const avg = (t: TeamSetup) => t.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / t.lineup.length;
const pct = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)}%`;

if (GERAL) {
    // draft da IA dos dois lados (a IA não conhece as secretas): o quanto o jogo todo mexe
    const all = SECRETS.flatMap((s) => s.defs);
    const out = [] as string[];
    for (const extra of [[], all]) {
        setLinks(extra);
        let goals = 0;
        let fav = 0;
        let favN = 0;
        let active = 0;
        for (let i = 0; i < N; i++) {
            const A = team(`ga${i}`);
            const B = team(`gb${i}`);
            const m = runMatch(FUTSAL_5, A, B, `g${i}`, { snapshots: false });
            goals += m.score[0] + m.score[1];
            const [a, b] = [avg(A), avg(B)];
            if (Math.abs(a - b) >= 1 && m.winner !== null) {
                favN++;
                if ((m.winner === 0) === a > b) fav++;
            }
            if (extra.length)
                for (const t of [A, B]) if (computeLinks(t.lineup).some((l) => !BASE.includes(l.def))) active++;
        }
        out.push(
            `${extra.length ? 'com as secretas' : 'hoje        '}: gols/jogo ${(goals / N).toFixed(2)} · favorito vence ${pct(fav, favN)}` +
                (extra.length ? ` · times com alguma secreta ligada: ${pct(active, 2 * N)}` : ''),
        );
    }
    console.log(out.join('\n'));
} else {
    // por secreta: o time A ganha os membros (no lugar dos titulares de linha), o B é sorteado; mesmas seeds com e sem
    console.log('secreta            bônus  vitórias A sem → com   saldo de gols A sem → com');
    for (const s of SECRETS) {
        const res = { off: { w: 0, gd: 0 }, on: { w: 0, gd: 0 } };
        for (let i = 0; i < N; i++) {
            const d = s.defs[i % s.defs.length];
            const rng = new Rng(`sb${s.id}${i}`, 'm');
            const A = team(`sa${s.id}${i}`);
            const B = team(`sbb${s.id}${i}`);
            const members = d.groups.slice(0, Math.min(d.groups.length, 4)).map((g) => g[g.length - 1]);
            members.forEach((id, k) => {
                A.lineup[k + 1] = createInstance(id, rng);
            });
            for (const [key, extra] of [
                ['off', []],
                ['on', s.defs],
            ] as const) {
                setLinks([...extra]);
                const m = runMatch(FUTSAL_5, A, B, `sm${s.id}${i}`, { snapshots: false });
                res[key].w += m.winner === 0 ? 1 : 0;
                res[key].gd += m.score[0] - m.score[1];
            }
        }
        const b = Math.round((s.defs[0].bonus - 1) * 100);
        console.log(
            `${s.id.padEnd(18)} +${b}%   ${pct(res.off.w, N).padStart(6)} → ${pct(res.on.w, N).padStart(6)}      ${(res.off.gd / N).toFixed(2).padStart(5)} → ${(res.on.gd / N).toFixed(2)}`,
        );
    }
}
setLinks([]);
