/**
 * Caça de lances da 0.8.4 pro clipe de atualização: goleiro defendendo com golpe (move.save) e habilidade
 * segurando status (ability.blocked). Mesma montagem do scripts/trailer-hunt.ts (abre com ?demo=trailer).
 *
 *   npx tsx trailer/atualizacao/cacar.ts --n 300 [--cena golpe]
 */
import { FUTSAL_5 } from '../../src/engine/config';
import { buildCupOpponents } from '../../src/engine/cup';
import { species } from '../../src/engine/data';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { isTrailerScene, TRAILER_SCENES, trailerTeam } from '../../src/ui/trailer-scenes';

const args = process.argv.slice(2);
const arg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const N = Number(arg('--n')) || 200;
const scenes = (arg('--cena') ? [arg('--cena') as string] : Object.keys(TRAILER_SCENES)).filter(isTrailerScene);
const sec = (t: number) => (t / FUTSAL_5.tickRate).toFixed(1);

const defesas: string[] = [];
const habilidades: string[] = [];
for (const cena of scenes) {
    for (let i = 0; i < N; i++) {
        const seed = `trailer${i}`;
        const home = trailerTeam(cena, seed, 'Pallet FC', 0xe8423f);
        const away = buildCupOpponents(seed)[0];
        const m = runMatch(FUTSAL_5, home, away, `${seed}-stage-0`, { snapshots: false });
        const nome = (idx: number) => species(m.roster[idx].speciesId).name;
        for (const e of m.events) {
            if (e.type === 'move' && e.save) {
                // a defesa que veio logo depois (o golpe virou defesa de verdade?)
                const def = m.events.find((x) => x.type === 'save' && x.by === e.by && x.tick >= e.tick && x.tick <= e.tick + 30);
                const time = m.roster[e.by].team === 0 ? 'nosso' : 'rival';
                defesas.push(`${def ? '*' : ' '} ${cena} ${seed} ${sec(e.tick)}s ${time} ${nome(e.by)} ${e.moveId}${def ? ` defendeu${def.type === 'save' && def.caught ? ' (segurou)' : ''}` : ''}`);
            }
            if (e.type === 'ability' && e.blocked) {
                const time = m.roster[e.by].team === 0 ? 'nosso' : 'rival';
                habilidades.push(`  ${cena} ${seed} ${sec(e.tick)}s ${time} ${nome(e.by)} ${e.ability} (contra ${e.target == null ? '?' : nome(e.target)})`);
            }
        }
    }
}
console.log(`=== goleiro com golpe (${defesas.length}; * = defendeu em seguida) ===`);
console.log(defesas.filter((l) => l.startsWith("*") && (!arg("--quem") || l.includes(arg("--quem") as string))).slice(0, 60).join('\n'));
console.log(`=== habilidade segurou status (${habilidades.length}) ===`);
console.log(habilidades.slice(0, 60).join('\n'));
