/**
 * Golpes que cada Pokémon aprende por nível na Gen 1 (com o menor nível), a partir do @pkmn/data.
 * O moveset padrão prefere esses golpes (têm a "cara" da espécie) aos TMs que quase todo mundo aprende.
 * Inclui o que a pré-evolução aprende por nível (o Raichu herda o Thunderbolt do Pikachu).
 *
 * Saída: src/data/level-moves.json  { [id]: { [moveId]: nível } }
 * Uso: npx tsx scripts/build-level-moves.ts
 */
import { writeFileSync } from 'node:fs';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';

const g1 = new Generations(Dex).get(1);
const out: Record<number, Record<string, number>> = {};
for (const sp of g1.species) {
    const learnable = (await g1.learnsets.learnable(sp.id)) ?? {};
    const levels: Record<string, number> = {};
    for (const [move, sources] of Object.entries(learnable)) {
        for (const src of sources) {
            const m = /^1L(\d+)$/.exec(src);
            if (m) levels[move] = Math.min(levels[move] ?? 99, Number(m[1]));
        }
    }
    out[sp.num] = levels;
}
writeFileSync('src/data/level-moves.json', `${JSON.stringify(out)}\n`);
console.log(`golpes por nível: ${Object.keys(out).length} espécies`);
