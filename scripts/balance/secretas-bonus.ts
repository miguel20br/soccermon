/**
 * Fase 2 das sinergias secretas (docs/planos/sinergias-secretas-fase2.md): quanto as secretas com bônus mudam a partida.
 * As secretas moram em `LINKS` (src/engine/links.ts, `secret`); o script tira e põe de volta só na memória dele (o motor
 * lê a lista na hora) e compara as mesmas partidas (mesmas seeds) sem e com elas.
 *
 *   npx tsx scripts/balance/secretas-bonus.ts [N]          por secreta: time com os membros x time sorteado, N partidas
 *   npx tsx scripts/balance/secretas-bonus.ts [N] --geral  N partidas de draft da IA: gols, favorito, quantas ligam
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { aiDraftTeam } from '../../src/engine/draft';
import { createInstance, viewInstance } from '../../src/engine/instance';
import { computeLinks, LINKS, type LinkDef } from '../../src/engine/links';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';

const args = process.argv.slice(2);
const N = Number(args[0]) || 100;
const GERAL = args.includes('--geral');

/** As secretas do motor, agrupadas pelo id do Registro (Mestre e Aprendiz tem uma definição por família). */
const SECRETS: { id: string; defs: LinkDef[] }[] = [];
for (const l of LINKS.filter((x) => x.secret)) {
    const s = SECRETS.find((x) => x.id === l.secret);
    if (s) s.defs.push(l);
    else SECRETS.push({ id: l.secret!, defs: [l] });
}
const ALL = LINKS.slice();
const BASE = LINKS.filter((l) => !l.secret);
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
LINKS.splice(0, LINKS.length, ...ALL);
