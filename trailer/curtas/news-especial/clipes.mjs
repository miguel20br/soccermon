// Edição especial: monta os clipes do jogo (quadros de capturar.mjs e do scripts/walkout-capture.mjs da v010) nos mp4 que o
// index.html toca. Pela fila: scripts/pesado.sh node trailer/curtas/news-especial/clipes.mjs
//   gancho.mp4: o Pacote Mini rasgando (quadros 12–41) e o clarão dourado do walkout (254–283, 18% maior: sai o Pular)
//   pacote.mp4: o pacote fechado em vai e volta (PAC_LEAD quadros) e a gravação até o leque abrir (0–27)
//   brock.mp4: o VERSUS contra o Pewter do Brock (15 em diante)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
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
