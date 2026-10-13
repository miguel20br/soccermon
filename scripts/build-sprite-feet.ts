/**
 * Onde fica o "pé" de cada sprite de campo (PMD), em fração da altura do quadro, por animação
 * (e o topo da cabeça no Idle, chave `top`).
 * Os voadores são desenhados no alto do quadro (pairando); com isso a cena apoia todo mundo perto do chão.
 * Uso: npx tsx scripts/build-sprite-feet.ts (rodar de novo se o atlas de campo mudar)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const DIR = 'public/assets/field';
const out: Record<number, Record<string, number>> = {};

for (let id = 1; id <= 151; id++) {
    const atlas = JSON.parse(readFileSync(`${DIR}/${id}.json`, 'utf8')) as {
        frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
    };
    const png = sharp(`${DIR}/${id}.png`).ensureAlpha();
    const { data, info } = await png.raw().toBuffer({ resolveWithObject: true });
    const perAnim: Record<string, number> = {};
    // pega o 1º quadro de cada animação (direção 0); o pé é a última linha com pixel visível
    for (const [key, { frame: f }] of Object.entries(atlas.frames)) {
        const [anim, dir, idx] = key.split('/');
        if (dir !== '0' || idx !== '0' || anim in perAnim) continue;
        let first = -1;
        let last = 0;
        for (let y = 0; y < f.h; y++) {
            for (let x = 0; x < f.w; x++) {
                if (data[((f.y + y) * info.width + f.x + x) * 4 + 3] > 20) {
                    if (first < 0) first = y;
                    last = y;
                }
            }
        }
        perAnim[anim] = Number(((last + 1) / f.h).toFixed(3));
        // topo da cabeça (só do Idle): pra setinha do seu time
        if (anim === 'Idle') perAnim.top = Number((Math.max(0, first) / f.h).toFixed(3));
    }
    out[id] = perAnim;
}
writeFileSync('src/data/sprite-feet.json', `${JSON.stringify(out)}\n`);
const idle = Object.values(out)
    .map((a) => a.Idle ?? Object.values(a)[0])
    .sort((a, b) => a - b);
console.log(`pés: min ${idle[0]} · mediana ${idle[75]} · max ${idle[150]}`);
