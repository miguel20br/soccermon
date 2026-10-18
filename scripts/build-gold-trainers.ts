/**
 * Treinadores dourados (recompensas lendárias): o sprite normal vira estátua de ouro pela luminância de cada
 * pixel; o contorno preto fica. Saída em public/assets/trainers/{id}Gold.png.
 *
 * Uso: npx tsx scripts/build-gold-trainers.ts
 */
import sharp from 'sharp';
import { GOLD_TRAINERS } from '../src/store/missions';

const DIR = 'public/assets/trainers';
// rampa 100% ouro: sombra âmbar → ouro → brilho amarelo (sem branco, pra não desbotar)
const RAMP = [
    [74, 40, 0],
    [160, 100, 0],
    [222, 158, 8],
    [255, 198, 34],
    [255, 228, 110],
];
function gold(l: number): number[] {
    const x = Math.min(0.999, Math.max(0, l)) * (RAMP.length - 1);
    const i = Math.floor(x);
    const t = x - i;
    return RAMP[i].map((c, k) => Math.round(c + (RAMP[i + 1][k] - c) * t));
}

for (const [base, id] of Object.entries(GOLD_TRAINERS)) {
    const { data, info } = await sharp(`${DIR}/${base}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const lum = (p: number) => (0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]) / 255;
    // estica a luminância de cada sprite (os claros, como o Prof. Carvalho, viravam ouro desbotado)
    const ls: number[] = [];
    for (let p = 0; p < data.length; p += 4) if (data[p + 3] && lum(p) >= 0.12) ls.push(lum(p));
    ls.sort((a, b) => a - b);
    const lo = ls[Math.floor(ls.length * 0.02)];
    const hi = ls[Math.floor(ls.length * 0.98)];
    for (let p = 0; p < data.length; p += 4) {
        if (!data[p + 3]) continue;
        const l = lum(p);
        if (l < 0.12) continue;
        const [r, g, b] = gold(0.12 + ((l - lo) / (hi - lo || 1)) * 0.8);
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ palette: true })
        .toFile(`${DIR}/${id}.png`);
    console.log(id);
}
