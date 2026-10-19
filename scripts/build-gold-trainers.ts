/**
 * Treinadores dourados (recompensas lendárias): o sprite normal vira estátua de ouro pela luminância de cada
 * pixel; o contorno preto fica. Saída em public/assets/trainers/{id}Gold.png.
 * Holográficos (platina de cada geração): o mesmo sprite com um arco-íris pastel na diagonal (como a carta
 * holo), o brilho vem da luminância; no jogo o CSS gira as cores (.trainer-holo). Saída em {id}Holo.png.
 *
 * Uso: npx tsx scripts/build-gold-trainers.ts
 */
import sharp from 'sharp';
import { GOLD_TRAINERS, HOLO_TRAINERS } from '../src/store/missions';

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

/** HSL (0..1) → RGB 0..255. */
function hsl(h: number, s: number, l: number): number[] {
    const k = (n: number) => (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))));
}

for (const holo of Object.values(HOLO_TRAINERS)) {
    const base = holo.replace(/Holo$/, '');
    const { data, info } = await sharp(`${DIR}/${base}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const lum = (p: number) => (0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]) / 255;
    for (let p = 0; p < data.length; p += 4) {
        if (!data[p + 3]) continue;
        const l = lum(p);
        if (l < 0.12) continue;
        const i = p / 4;
        const x = i % info.width;
        const y = Math.floor(i / info.width);
        // faixas na diagonal (2 voltas no arco-íris de canto a canto) + um pouco de luminância no tom
        const hue = (((x + y) / (info.width + info.height)) * 2 + l * 0.15) % 1;
        const [r, g, b] = hsl(hue, 0.6, 0.22 + l * 0.66);
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ palette: true })
        .toFile(`${DIR}/${holo}.png`);
    console.log(holo);
}
