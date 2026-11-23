/**
 * Escolher golpes (0.9.54, item 8): padrão de hoje x jogador que escolhe os golpes. Mede, nas mesmas sementes:
 *  - A escolhe, B padrão: vitória de A, gols/jogo (A e B), e "pareado" contra A padrão (quanto a escolha vale);
 *  - os dois escolhem: gols/jogo e vitória do favorito (nota maior) contra os dois padrão;
 *  - quais golpes viram obrigatórios (os mais escolhidos pela política "power", em % das espécies que os aprendem).
 * Políticas: base (hoje), power (assinatura + os 3 de maior força x precisão), random (3 do learnset ao acaso).
 *
 * Uso: npx tsx scripts/balance/escolher-golpes.ts [N=200]   (via scripts/pesado.sh)
 */
import { chooseMoves, pickableMoves } from '../../src/engine/choose-moves';
import { FUTSAL_5 } from '../../src/engine/config';
import { MOVES, SPECIES } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import { type PokemonInstance, viewInstance } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { SIGNATURE } from '../../src/engine/signature-moves';
import type { TeamSetup } from '../../src/engine/state';

const N = Number(process.argv[2]) || 200;
type Policy = 'base' | 'power' | 'random';

const score = (m: string) => MOVES[m].power * (MOVES[m].accuracy > 0 ? MOVES[m].accuracy / 100 : 1);

function pick(p: PokemonInstance, policy: Policy, rng: Rng): PokemonInstance {
    if (policy === 'base') return p;
    const sig = SIGNATURE[p.speciesId];
    const keep = p.moves.filter((m) => m === sig);
    const pool = pickableMoves(p).filter((m) => !keep.includes(m));
    const need = p.moves.length - keep.length;
    const chosen =
        policy === 'power'
            ? pool
                  .filter((m) => MOVES[m].power > 0)
                  .sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1))
                  .slice(0, need)
            : rng.shuffle([...pool]).slice(0, need);
    // sem golpes de dano suficientes, completa com o que já levava
    for (const m of p.moves) if (chosen.length < need && !keep.includes(m) && !chosen.includes(m)) chosen.push(m);
    return chooseMoves(p, [...keep, ...chosen]) ?? p;
}

const apply = (t: TeamSetup, policy: Policy, rng: Rng): TeamSetup => ({
    ...t,
    lineup: t.lineup.map((p) => pick(p, policy, rng)),
    bench: t.bench.map((p) => pick(p, policy, rng)),
});

const strength = (t: TeamSetup) => t.lineup.reduce((s, p) => s + viewInstance(p).overall, 0);

interface Acc {
    n: number;
    w: number;
    d: number;
    gf: number;
    ga: number;
    favW: number;
    favN: number;
}
const blank = (): Acc => ({ n: 0, w: 0, d: 0, gf: 0, ga: 0, favW: 0, favN: 0 });
const fmt = (a: Acc) =>
    `${((a.w / a.n) * 100).toFixed(1)}% vit | ${((a.d / a.n) * 100).toFixed(1)}% emp | gols/jogo ${((a.gf + a.ga) / a.n).toFixed(2)} (A ${(a.gf / a.n).toFixed(2)} x B ${(a.ga / a.n).toFixed(2)}) | favorito vence ${a.favN ? ((a.favW / a.favN) * 100).toFixed(1) : '-'}%`;

const rows: Record<string, Acc> = {};
const get = (k: string) => (rows[k] ??= blank());
const chosenBy = new Map<string, number>(); // golpe -> espécies que o escolhem na política power
const t0 = performance.now();

for (let i = 0; i < N; i++) {
    const a0: TeamSetup = { name: 'A', ...aiDraftTeam(new Rng(`eg-${i}`, 'A'), 1), tactic: 'balanced', color: 0 };
    const b0: TeamSetup = { name: 'B', ...aiDraftTeam(new Rng(`eg-${i}`, 'B'), 1), tactic: 'balanced', color: 1 };
    const cases: [string, Policy, Policy][] = [
        ['A padrão x B padrão', 'base', 'base'],
        ['A power x B padrão', 'power', 'base'],
        ['A random x B padrão', 'random', 'base'],
        ['A power x B power (os dois escolhem)', 'power', 'power'],
        ['A random x B random', 'random', 'random'],
    ];
    for (const [k, pa, pb] of cases) {
        const rng = new Rng(`eg-pick-${i}`, k);
        const a = apply(a0, pa, rng);
        const b = apply(b0, pb, rng);
        const r = runMatch(FUTSAL_5, a, b, `eg-${i}`, { snapshots: false });
        const acc = get(k);
        acc.n++;
        if (r.winner === 0) acc.w++;
        if (r.score[0] === r.score[1]) acc.d++;
        acc.gf += r.score[0];
        acc.ga += r.score[1];
        // favorito = time de nota maior (com os golpes padrão, a nota não muda com golpes)
        const sa = strength(a0);
        const sb = strength(b0);
        if (sa !== sb && r.score[0] !== r.score[1]) {
            acc.favN++;
            if (r.winner === (sa > sb ? 0 : 1)) acc.favW++;
        }
    }
}

for (const sp of SPECIES.filter((s) => s.id <= 151)) {
    const inst = { speciesId: sp.id, moves: [], level: 50 } as unknown as PokemonInstance;
    const pool = sp.learnset.filter((m) => MOVES[m] && MOVES[m].power > 0 && !(SIGNATURE[sp.id] === m));
    for (const m of pool.sort((x, y) => score(y) - score(x) || (x < y ? -1 : 1)).slice(0, 3)) {
        chosenBy.set(m, (chosenBy.get(m) ?? 0) + 1);
    }
    void inst;
}

console.log(`N=${N} (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
for (const [k, a] of Object.entries(rows)) console.log(`${k.padEnd(40)} ${fmt(a)}`);
const learners = (m: string) => SPECIES.filter((s) => s.id <= 151 && s.learnset.includes(m)).length;
console.log('\nGolpes mais escolhidos pela política power (espécies que o escolhem / espécies que o aprendem):');
for (const [m, n] of [...chosenBy].sort((x, y) => y[1] - x[1]).slice(0, 12))
    console.log(
        `${m.padEnd(14)} ${String(n).padStart(3)} / ${learners(m)} (${Math.round((n / learners(m)) * 100)}%)  poder ${MOVES[m].power} prec ${MOVES[m].accuracy}`,
    );
console.log(
    `\nGolpes diferentes escolhidos: ${chosenBy.size} de ${new Set(SPECIES.filter((s) => s.id <= 151).flatMap((s) => s.learnset)).size} no learnset da Gen 1`,
);
