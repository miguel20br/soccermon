/**
 * Golpes que cada Pokémon aprende por nível na sua geração (com o menor nível), a partir do @pkmn/data.
 * O moveset padrão prefere esses golpes (têm a "cara" da espécie) aos TMs que quase todo mundo aprende.
 * Inclui o que a pré-evolução aprende por nível (o Raichu herda o Thunderbolt do Pikachu).
 *
 * Saída: src/data/level-moves.json (Gen 1) e src/data/gen<N>/level-moves.json  { [id]: { [moveId]: nível } }
 * Uso: npx tsx scripts/build-level-moves.ts [--gen 1|2]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { dataDir, GENS, gensFromArgs } from './lib/download';

for (const gen of gensFromArgs()) {
    const g = new Generations(Dex).get(gen);
    const [lo, hi] = GENS[gen];
    const byLevel = new RegExp(`^${gen}L(\\d+)$`);
    const out: Record<number, Record<string, number>> = {};
    for (const sp of [...g.species].filter((s) => s.num >= lo && s.num <= hi).sort((a, b) => a.num - b.num)) {
        const learnable = (await g.learnsets.learnable(sp.id)) ?? {};
        const levels: Record<string, number> = {};
        for (const [move, sources] of Object.entries(learnable)) {
            for (const src of sources) {
                const m = byLevel.exec(src);
                if (m) levels[move] = Math.min(levels[move] ?? 99, Number(m[1]));
            }
        }
        out[sp.num] = levels;
    }
    mkdirSync(dataDir(gen), { recursive: true });
    writeFileSync(`${dataDir(gen)}/level-moves.json`, `${JSON.stringify(out)}\n`);
    console.log(`gen ${gen}: golpes por nível de ${Object.keys(out).length} espécies`);
}
