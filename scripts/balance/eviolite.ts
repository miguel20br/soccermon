/**
 * Eviolite: quanto ela ajuda um time de bronzes que ainda podem evoluir (o caminho do título Zé Ninguém: campeão com
 * 5 titulares bronze na final). Time A = 7 bronzes sorteados (nota ≤ 64, com evolução na Gen 1), escalação
 * automática; B = rival da copa em cada fase (dificuldade -2, 0, 2, 4). Mede a vitória de A sem item e com a Eviolite
 * nos 5 titulares, em cada fator.
 *
 * Uso: npx tsx scripts/balance/eviolite.ts [N=120] [fatores=1.10,1.15,1.20]
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { SPECIES } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import { evolutionTarget } from '../../src/engine/evolution';
import { createInstance, type PokemonInstance, viewInstance } from '../../src/engine/instance';
import { EVIOLITE } from '../../src/engine/items';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { autoLineup } from '../../src/net/duel-state';

const N = Number(process.argv[2]) || 120;
const FACTORS = (process.argv[3] ?? '1.10,1.15,1.20').split(',').map(Number);
const STAGES = [-2, 0, 2, 4];

const pool = SPECIES.map((s) => s.id).filter((id) => {
    const p = createInstance(id, new Rng('pool', String(id)));
    return evolutionTarget(id, p.uid) !== null && viewInstance(p).overall <= 64;
});

function bronzeTeam(i: number, eviolite: boolean): TeamSetup {
    const rng = new Rng(`evio-${i}`, 'A');
    const ids = new Set<number>();
    while (ids.size < 7) ids.add(rng.pick(pool));
    const picks = [...ids].map((id) => createInstance(id, rng));
    const { lineup, bench } = autoLineup(picks, '1-2-1', null);
    const hold = (p: PokemonInstance) => ({ ...p, item: eviolite ? 'eviolite' : null });
    return {
        name: 'A',
        lineup: lineup.map(hold),
        bench,
        captainUid: lineup.reduce((b, p) => (viewInstance(p).overall > viewInstance(b).overall ? p : b)).uid,
        tactic: 'balanced',
        color: 0,
        formation: '1-2-1',
    };
}

function rival(i: number, d: number): TeamSetup {
    return { name: 'B', ...aiDraftTeam(new Rng(`evio-${i}`, `B${d}`), d), tactic: 'balanced', color: 1 };
}

function winRate(eviolite: boolean, d: number) {
    let w = 0;
    for (let i = 0; i < N; i++) {
        const r = runMatch(FUTSAL_5, bronzeTeam(i, eviolite), rival(i, d), `evio-${i}-${d}`);
        if (r.score[0] > r.score[1]) w++;
        else if (r.score[0] === r.score[1]) w += 0.5;
    }
    return w / N;
}

console.log(`bronzes com evolução no sorteio: ${pool.length}; N=${N} por célula`);
console.log(['fator', ...STAGES.map((d) => `dif ${d}`), 'copa (4 vitórias)'].join('\t'));
for (const f of [1, ...FACTORS]) {
    EVIOLITE.factor = f;
    const rates = STAGES.map((d) => winRate(f !== 1, d));
    const cup = rates.reduce((a, b) => a * b, 1);
    console.log(
        [
            f === 1 ? 'sem item' : `x${f}`,
            ...rates.map((r) => `${Math.round(r * 100)}%`),
            `${(cup * 100).toFixed(1)}%`,
        ].join('\t'),
    );
}
