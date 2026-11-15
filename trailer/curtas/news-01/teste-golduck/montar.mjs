// Monta o projeto do teste da dupla Raichu e Golduck (News #1, 15/11) a partir do news-01/index.html: o mesmo estúdio,
// sem os vídeos, com a música do estúdio (news-14.wav a partir dos 4 s, onde a bancada abre no vídeo), o voz.wav dos
// blips e a cena.js no lugar da linha do tempo. Sai em news-01/render/teste-golduck (fora do git).
//   node trailer/curtas/news-01/teste-golduck/montar.mjs
//   cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01/render/teste-golduck -q high -w 1 --no-browser-gpu -o <mp4>
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const D = new URL('./', import.meta.url).pathname;
const OUT = `${D}../render/teste-golduck/`;
// cópias, não links: o render do HyperFrames não segue link pra fora da pasta (404 no sprites.js e no comum.js)
rmSync(OUT, { recursive: true, force: true });
const M = `${D}../../midia/`;
const RETRATOS = ['26-happy', '26-joyous', '55-determined'];
for (const f of ['sprites.js', 'som/news.js', 'som/news-14.wav', 'sp/26.png', 'sp/55.png', 'logo-simbolo.svg', 'Galmuri11-Bold.woff2',
    'news/recompensa.png', 'news/ultimate-fatia.png', 'news/cartas/95.png', ...RETRATOS.map((r) => `${r}.png`)]) {
    mkdirSync(dirname(`${OUT}midia/${f}`), { recursive: true });
    copyFileSync(M + f, `${OUT}midia/${f}`);
}
copyFileSync(`${D}../../comum.js`, `${OUT}comum.js`);
execFileSync('node', [`${D}voz.mjs`, OUT], { stdio: 'inherit' });
const FIM = Number(/window\.FIM = ([\d.]+)/.exec(readFileSync(`${OUT}falas.js`, 'utf8'))[1]);

let h = readFileSync(`${D}../index.html`, 'utf8');
h = h.replaceAll('data-duration="75.6"', `data-duration="${FIM}"`);
h = h.replace(/\n\s*<video [^\n]*<\/video>/g, '');
h = h.replace(/<audio id="a-musica"[^\n]*<\/audio>/, `<audio id="a-musica" class="clip" src="midia/som/news-14.wav" data-start="0" data-duration="${FIM}" data-media-start="4" data-fade-out="0.6"></audio>
  <audio id="a-voz" class="clip" src="voz.wav" data-start="0" data-duration="${FIM}" data-media-start="0"></audio>`);
const ini = h.indexOf('<script>\n    const { T, div, ator');
const fim = h.indexOf('</script>', ini);
if (ini < 0 || fim < 0) throw new Error('não achei a linha do tempo no index.html');
h = `${h.slice(0, ini)}<script src="falas.js"></script>\n  <script>\n${readFileSync(`${D}cena.js`, 'utf8')}  ${h.slice(fim)}`;
writeFileSync(`${OUT}index.html`, h);
console.log(`ok: ${OUT} (${FIM} s)`);
