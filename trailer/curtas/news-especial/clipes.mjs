// Edição especial: monta os clipes do jogo (quadros de capturar.mjs e do scripts/walkout-capture.mjs da v010) nos mp4 que o
// index.html toca. Pela fila: scripts/pesado.sh node trailer/curtas/news-especial/clipes.mjs
//   gancho.mp4: o Pacote Mini rasgando (quadros 12–41) e o clarão dourado do walkout (254–283, 18% maior: sai o Pular)
//   pacote.mp4: o pacote fechado em vai e volta (PAC_LEAD quadros) e a gravação até o leque abrir (0–27)
//   brock.mp4: o VERSUS contra o Pewter do Brock (15 em diante)
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { CLIPES, PAC_LEAD, SAIDA } from './linha.mjs';

const D = new URL('./midia/ut/', import.meta.url).pathname;
const q = (pasta, i) => `${D}${pasta}/${String(i).padStart(4, '0')}.png`;
const seq = (a, z) => Array.from({ length: z - a + 1 }, (_, k) => a + k);
function mp4(nome, quadros, vf = 'scale=1080:1920') {
    const lista = `${D}${nome}.txt`;
    writeFileSync(lista, quadros.map((f) => `file '${f}'\nduration ${1 / 30}`).join('\n') + `\nfile '${quadros.at(-1)}'\n`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-vf', `${vf},fps=30,format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-threads', '2', `${D}${nome}.mp4`]);
    console.log(`${nome}.mp4: ${quadros.length} quadros`);
}
const W = '.frames-ouro85-149';
const n = (id) => Math.round((CLIPES[id].z - CLIPES[id].s + SAIDA) * 30) + 2;
// o gancho: as duas metades com o mesmo tamanho (o walkout 10% maior, recortado no centro)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '30', '-start_number', '254', '-i', `${D}${W}/%04d.png`, '-frames:v', '30', '-vf', 'scale=1274:2266,crop=1080:1920', '-start_number', '0', `${D}wk-%04d.png`]);
mp4('gancho', [...seq(12, 41).map((i) => q('pacote', i)), ...seq(0, 29).map((i) => `${D}wk-${String(i).padStart(4, '0')}.png`)]);
const vai = [...seq(0, 17), ...seq(1, 16).reverse()];
const lead = Array.from({ length: PAC_LEAD }, (_, k) => vai[k % vai.length]);
mp4('pacote', [...lead, ...seq(0, Math.max(27, n('v-pacote') - PAC_LEAD))].map((i) => q('pacote', i)));
mp4('brock', seq(15, 15 + n('v-brock')).map((i) => q('brock', i)));

// v2: os retratos do Raichu, do Machoke e do Meowth com o gorro de Natal (o do jogo, gorro-pixel.ts da v010), pixel do
// gorro = pixel do retrato (40 x 40): <retrato>-g.png
const sharp = createRequire(import.meta.url)('sharp');
const COR = { K: [26, 16, 32], H: [240, 80, 90], R: [214, 40, 60], r: [140, 22, 44], W: [246, 246, 250], w: [184, 194, 214] };
const GORROS = {
    longo: ['.........KKK.', '........KWWwK', '......KKKwwK.', '....KKHRrKK..', '...KHRRRrK...', '..KHRRRRRrK..', '.KHRRRRRRRrK.', 'KWWWWWWWWWWWK', 'KwwwwwwwwwwwK', '.KKKKKKKKKKK.'],
    curto: ['......KKK.', '.....KWWwK', '....KKwwK.', '..KKHRrK..', '.KHRRRRrK.', 'KWWWWWWWWK', 'KwwwwwwwwK', '.KKKKKKKK.'],
};
// canto de cima à esquerda do gorro no retrato de referência (a base da aba no alto da cabeça, entre as orelhas do Raichu)
const NO_RETRATO = { 26: ['longo', 14, 1], 67: ['longo', 15, 0], 52: ['longo', 13, -1] };
// v3: a cabeça muda de lugar entre as expressões (o 52-sad tem a cabeça 5 px à direita do 52-joyous): o gorro do Meowth
// segue a moeda da testa e o do Machoke a crista (o centro e a 1ª linha dos pixels dourados nas 16 de cima), contados
// a partir do retrato de referência. Os retratos do Raichu têm o mesmo enquadramento: o gorro fica onde está.
const REF = { 67: '67.png', 52: '52-joyous.png' };
const M = new URL('./midia/', import.meta.url).pathname;
const ouro = async (f) => {
    const { data } = await sharp(`${M}${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let sx = 0, n = 0, top = 99;
    for (let y = 0; y < 16; y++)
        for (let x = 0; x < 40; x++) {
            const [r, g, b] = data.subarray((y * 40 + x) * 4);
            if (r > 170 && g > 120 && b < 110 && r - b > 90) [sx, n, top] = [sx + x, n + 1, Math.min(top, y)];
        }
    return [sx / n, top];
};
for (const f of readdirSync(M).filter((f) => /^(26|52|67)(-[a-z]+)?\.png$/.test(f) && !/-g\.png$/.test(f))) {
    const id = f.split(/[-.]/)[0];
    let [tipo, gx, gy] = NO_RETRATO[id];
    if (REF[id]) {
        const [[x0, y0], [x1, y1]] = [await ouro(REF[id]), await ouro(f)];
        if (Math.abs(x1 - x0) <= 6) [gx, gy] = [gx + Math.round(x1 - x0), gy + Math.max(-1, Math.min(2, y1 - y0))];
    }
    const g = GORROS[tipo];
    const { data, info } = await sharp(`${M}${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    g.forEach((l, y) => [...l].forEach((c, x) => {
        if (c === '.' || gy + y < 0) return;
        const i = ((gy + y) * info.width + gx + x) * 4;
        [data[i], data[i + 1], data[i + 2]] = COR[c];
        data[i + 3] = 255;
    }));
    await sharp(data, { raw: info }).png().toFile(`${M}${f.replace('.png', '-g.png')}`);
}
console.log('retratos com gorro: ok');
