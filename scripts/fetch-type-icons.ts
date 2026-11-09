/**
 * Ícones de tipo em alta (256 px): o símbolo dos jogos atuais (chama, gota, laço…) em vetor, do conjunto MIT
 * partywhale/pokemon-type-icons, pintado sobre o quadrado do selo de Pokémon Champions (PokeAPI/sprites).
 * Do selo vêm a cor do fundo e onde/quanto o símbolo ocupa; do vetor, o desenho nítido. Sem texto: o nome
 * em português vem do jogo (TYPE_PT).
 * Uso: npm run assets:types
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fetchBuffer } from './lib/download';

const CHAMPIONS = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/champions';
const VECTOR = 'https://raw.githubusercontent.com/partywhale/pokemon-type-icons/main/icons';
// na ordem dos ids de tipo do PokeAPI
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
const N = 36; // no selo, o símbolo fica num quadrado de 36×36 à esquerda
const S = 256; // tamanho do ícone gerado
const K = S / N;

const hex = (c: number[]) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** Cor do fundo e caixa do símbolo (o que é mais branco que fundo) no quadrado de 36 px do selo. */
async function measure(badge: Buffer) {
    const { data, info } = await sharp(badge)
        .extract({ left: 0, top: 0, width: N, height: N })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => (y * N + x) * info.channels;
    const k0 = px(3, N / 2);
    const bg = [data[k0], data[k0 + 1], data[k0 + 2]];
    const base = bg[0] + bg[1] + bg[2];
    let [x0, y0, x1, y1] = [N, N, -1, -1];
    for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
            const k = px(x, y);
            const white = (data[k] + data[k + 1] + data[k + 2] - base) / (765 - base);
            if (white > 0.5 && data[k + 3] > 128) {
                x0 = Math.min(x0, x);
                y0 = Math.min(y0, y);
                x1 = Math.max(x1, x);
                y1 = Math.max(y1, y);
            }
        }
    return { bg, box: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } };
}

async function build(type: string, id: number) {
    const [badge, vector] = await Promise.all([
        fetchBuffer(`${CHAMPIONS}/${id}.png`),
        fetchBuffer(`${VECTOR}/${type.toLowerCase()}.svg`),
    ]);
    if (!badge || !vector) return false;
    const { bg, box } = await measure(badge);
    // tira o círculo de fundo do vetor; detalhes coloridos (nó do laço, olho do fantasma) ficam da cor do fundo
    const svg = vector
        .toString()
        .replace(/<circle[^>]*r="128"\s*\/>/, '')
        .replace(/fill:\s*#(?!fff\b|fbfdfd\b)[0-9a-f]{3,6}/gi, `fill: ${hex(bg)}`);
    const symbol = await sharp(Buffer.from(svg), { density: 288 })
        .trim({ threshold: 1 })
        .resize(Math.round(box.w * K), Math.round(box.h * K), { fit: 'contain', background: '#0000' })
        .png()
        .toBuffer();
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect width="${S}" height="${S}" rx="${S * 0.14}" fill="${hex(bg)}"/></svg>`;
    await sharp(Buffer.from(tile))
        .composite([{ input: symbol, left: Math.round(box.x * K), top: Math.round(box.y * K) }])
        .png({ compressionLevel: 9, palette: true })
        .toFile(`${OUT}/${type.toLowerCase()}.png`);
    return true;
}

await mkdir(OUT, { recursive: true });
const ok = await Promise.all(TYPES.map((type, i) => build(type, i + 1)));
const failed = TYPES.filter((_, i) => !ok[i]);
console.log(`tipos: ${TYPES.length - failed.length}/${TYPES.length}`);
if (failed.length) {
    console.error('faltando:', failed);
    process.exit(1);
}
