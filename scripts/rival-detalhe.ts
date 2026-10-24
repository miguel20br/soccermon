// rascunho: eventos em volta da evolução do rival numa seed (curta "O rival evoluiu")
import { FUTSAL_5 } from '../src/engine/config';
import { buildCupOpponents, cupRival } from '../src/engine/cup';
import { species } from '../src/engine/data';
import { runMatch } from '../src/engine/runners/batch-runner';
import { trailerTeam } from '../src/ui/trailer-scenes';

const seed = process.argv[2];
const home = trailerTeam('rival', seed, 'Pallet FC', 0xe8423f);
// como a partida de verdade (Lineup.tsx/Match.tsx): o líder do clube na beira da quadra muda a partida
const away = cupRival(buildCupOpponents(seed)[0], true);
const m = runMatch(FUTSAL_5, home, away, `${seed}-stage-0`, { snapshots: false });
const nm = (i: number) => species(m.roster[i].speciesId).name;
console.log(away.name, 'rival:', away.lineup.map((p) => species(p.speciesId).name).join(', '));
const evo = m.events.find((e) => e.type === 'evolve' && e.team === 1)!;
for (const e of m.events) {
    if (e.tick < evo.tick - 300 || e.tick > evo.tick + 1200) continue;
    if (!['goal', 'shot', 'evolve', 'move', 'save', 'halftime', 'kickoff'].includes(e.type)) continue;
    const by = 'by' in e ? nm(e.by as number) : '';
    console.log((e.tick / 20).toFixed(1), e.type, by, JSON.stringify(e).slice(0, 140));
}
