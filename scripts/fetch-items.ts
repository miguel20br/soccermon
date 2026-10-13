/**
 * Sprites dos itens Pokémon (PokeAPI/sprites) usados nas recompensas da copa.
 * Uso: npm run assets:items
 */
import { ITEMS } from '../src/engine/items';
import { downloadAll } from './lib/download';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';
const jobs = Object.values(ITEMS).map((it) => ({
    url: `${BASE}/${it.sprite}.png`,
    dest: `public/assets/items/${it.sprite}.png`,
}));
const failed = await downloadAll(jobs);
console.log(`itens: ${jobs.length - failed.length}/${jobs.length}`);
if (failed.length) {
    console.error(
        'faltando:',
        failed.map((u) => u.split('/').pop()),
    );
    process.exit(1);
}
