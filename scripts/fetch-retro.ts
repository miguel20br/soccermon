/**
 * Sprites de Game Boy (Red/Blue) pra proposta da edição "Retrô" (galeria ?cards=1, fora do jogo): PokeAPI/sprites,
 * pasta `versions/generation-i/red-blue/gray` (repo CC0; imagens © The Pokémon Company). O original tem fundo branco
 * e 4 tons de cinza; aqui o branco de fora vira transparente (o de dentro, olho e brilho, continua) e todo sprite vai
 * pro mesmo quadro de 56×56, embaixo e no meio, como no jogo. A cor de Game Boy entra na tela (filtro SVG), então
 * uma imagem serve pra qualquer paleta.
 *
 * Saída: public/assets/retro/{id}.png
 * Uso: npx tsx scripts/fetch-retro.ts
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fetchBuffer, idsOf, pool } from './lib/download';

const BASE =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/gray';
const OUT = 'public/assets/retro';
const BOX = 56;

/** Pinta de transparente o branco ligado à borda (o fundo); o branco cercado pelo contorno fica. */
function clearBackground(px: Buffer, w: number, h: number) {
    const white = (i: number) => px[i * 4] > 250 && px[i * 4 + 1] > 250 && px[i * 4 + 2] > 250;
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
    while (stack.length) {
        const i = stack.pop()!;
        if (seen[i] || !white(i)) continue;
        seen[i] = 1;
        px[i * 4 + 3] = 0;
        const x = i % w;
        if (x > 0) stack.push(i - 1);
        if (x < w - 1) stack.push(i + 1);
        if (i >= w) stack.push(i - w);
        if (i < w * (h - 1)) stack.push(i + w);
    }
}

await mkdir(OUT, { recursive: true });
const failed: number[] = [];
await pool(idsOf(1), 8, async (id) => {
    const buf = await fetchBuffer(`${BASE}/${id}.png`);
    if (!buf) return failed.push(id);
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    clearBackground(data, info.width, info.height);
    await sharp({ create: { width: BOX, height: BOX, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([
            {
                input: await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
                    .png()
                    .toBuffer(),
                left: Math.floor((BOX - info.width) / 2),
                top: BOX - info.height,
            },
        ])
        .png({ compressionLevel: 9, palette: true })
        .toFile(`${OUT}/${id}.png`);
});
console.log(`retrô: ${151 - failed.length}/151${failed.length ? ` (falharam: ${failed.join(', ')})` : ''}`);
if (failed.length) process.exit(1);
