/**
 * Sprites dos cards/UI: GIFs animados de Black/White (frente + shiny) do PokeAPI/sprites + pokébola.
 * Uso: npm run assets:cards
 */
import { downloadAll, ids151 } from './lib/download';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';
const OUT = 'public/assets/cards';

const jobs = ids151.flatMap((id) => [
    { url: `${BASE}/pokemon/versions/generation-v/black-white/animated/${id}.gif`, dest: `${OUT}/${id}.gif` },
    {
        url: `${BASE}/pokemon/versions/generation-v/black-white/animated/shiny/${id}.gif`,
        dest: `${OUT}/shiny/${id}.gif`,
    },
]);
jobs.push({ url: `${BASE}/items/poke-ball.png`, dest: 'public/assets/ui/poke-ball.png' });

const failed = await downloadAll(jobs);
console.log(`cards: ${jobs.length - failed.length}/${jobs.length} ok`);
if (failed.length) {
    console.error('falharam:', failed);
    process.exit(1);
}
