/**
 * Com que frequência uma rivalidade secreta (src/store/secret-links.ts) acontece numa partida em que os dois estão em
 * quadra: `npx tsx scripts/balance/freq-secretas.ts [N]`. Mede se a secreta dá pra ser descoberta (o lance entre os dois).
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { aiDraftTeam } from '../../src/engine/draft';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import type { TeamSetup } from '../../src/engine/state';
import { matchSecrets } from '../../src/store/secret-links';

const N = Number(process.argv[2]) || 30;
const team = (seed: string): TeamSetup => ({
    name: seed,
    ...aiDraftTeam(new Rng(seed, 'team'), 1),
    tactic: 'balanced',
    color: 0,
    manualSubs: true,
});
for (const [a, b] of [
    [25, 26],
    [94, 33],
    [52, 25],
]) {
    for (const slot of [0, 2, 4]) {
        let hit = 0;
        for (let i = 0; i < N; i++) {
            const A = team(`a${i}`);
            const B = team(`b${i}`);
            A.lineup[slot] = { ...A.lineup[slot], speciesId: a };
            B.lineup[(slot + 1) % 5] = { ...B.lineup[(slot + 1) % 5], speciesId: b };
            if (matchSecrets(runMatch(FUTSAL_5, A, B, `s${i}`, { snapshots: false })).length) hit++;
        }
        console.log(a, 'x', b, 'vaga', slot, `${hit}/${N}`);
    }
}
