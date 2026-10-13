/**
 * Ícones oficiais de tipo: só o símbolo (chama, gota, raio…), recortado do selo de Pokémon Champions
 * do acervo do PokeAPI/sprites, sem o nome em inglês. O nome em português vem do jogo (TYPE_PT).
 * Uso: npm run assets:types
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fetchBuffer } from './lib/download';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/champions';
// ids de tipo do PokeAPI → nome usado nos dados do jogo
const TYPES = [
    'Normal',
    'Fighting',
    'Flying',
    'Poison',
    'Ground',
    'Rock',
    'Bug',
    'Ghost',
    'Steel',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Ice',
    'Dragon',
    'Dark',
    'Fairy',
];
const OUT = 'public/assets/types';
const SYMBOL = 36; // o selo tem o símbolo num quadrado de 36×36 à esquerda

await mkdir(OUT, { recursive: true });
const failed: string[] = [];
await Promise.all(
    TYPES.map(async (type, i) => {
        const buf = await fetchBuffer(`${BASE}/${i + 1}.png`);
        if (!buf) {
            failed.push(type);
            return;
        }
        await sharp(buf)
            .extract({ left: 0, top: 0, width: SYMBOL, height: SYMBOL })
            .png()
            .toFile(`${OUT}/${type.toLowerCase()}.png`);
    }),
);
console.log(`tipos: ${TYPES.length - failed.length}/${TYPES.length}`);
if (failed.length) {
    console.error('faltando:', failed);
    process.exit(1);
}
