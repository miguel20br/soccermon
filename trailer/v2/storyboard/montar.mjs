/**
 * Monta o storyboard do trailer 2 em ~/Downloads/soccermon-trailer2-storyboard/: copia os prints do jogo (tirados
 * headless no scratchpad, fora do git) pra ref/, tira um PNG de cada quadro de quadros.html e copia o index.html.
 *
 *   PRINTS=<pasta dos prints> node trailer/v2/storyboard/montar.mjs
 *
 * PRINTS tem shots/ (recortes do DOM) e cap/ (quadros da partida, scripts/trailer-capture.mjs).
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const AQUI = dirname(fileURLToPath(import.meta.url));
const PRINTS = process.env.PRINTS;
if (!PRINTS) throw new Error('PRINTS=<pasta dos prints>');
const SAIDA = join(homedir(), 'Downloads/soccermon-trailer2-storyboard');
const PUB = join(AQUI, '../../../public');
mkdirSync(join(SAIDA, 'ref'), { recursive: true });
mkdirSync(join(SAIDA, 'quadros'), { recursive: true });

// nome em ref/ ← arquivo de origem
const REF = {
    'Galmuri11-Bold.woff2': join(PUB, 'fonts/Galmuri11-Bold.woff2'),
    'oak.png': join(PUB, 'assets/trainers/oak.png'),
    'ball.svg': join(PUB, 'assets/ui/ball.svg'),
    '6.png': join(PUB, 'assets/portraits/6.png'),
    'quadra.png': 'cap/quadra/00001.png',
    'golpe-1.png': 'cap/golpe/00001.png',
    'golpe-lanca.png': 'cap/golpe/00011.png',
    'golpe-gol.png': 'cap/golpe/00019.png',
    'evo-1.png': 'escolhidos/evo-1.png',
    'evo-2.png': 'escolhidos/evo-2.png',
    'gol-1.png': 'escolhidos/gol-1.png',
    'gol-2.png': 'escolhidos/gol-2.png',
    'p-vira.png': 'escolhidos/p-vira.png',
    'p-fechado.png': 'shots/p-fechado.png',
    'h-placar.png': 'shots/h-placar.png',
    'bronze.png': 'shots/s-mewtwo-1.png',
    'campeao.png': 'escolhidos/campeao.png',
    'dia.png': 'shots/d-dia.png',
    'nidorino.png': 'escolhidos/nidorino.png',
};
for (const n of ['s-draft-1', 's-draft-2', 's-draft-3', 's-edicao-1', 's-edicao-2', 's-edicao-3', 's-edicao-4', 's-edicao-5', 's-emote-1', 's-vitrine-1'])
    REF[`${n}.png`] = `shots/${n}.png`;
for (const [nome, de] of Object.entries(REF)) {
    try {
        copyFileSync(de.startsWith('/') ? de : join(PRINTS, de), join(SAIDA, 'ref', nome));
    } catch {
        console.log('faltando:', nome, '←', de);
    }
}
copyFileSync(join(AQUI, 'quadros.html'), join(SAIDA, 'quadros.html'));
copyFileSync(join(AQUI, 'index.html'), join(SAIDA, 'index.html'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.5 });
await page.goto(`file://${join(SAIDA, 'quadros.html')}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const id of await page.$$eval('section.q', (s) => s.map((x) => x.id))) {
    await (await page.$(`#${id}`)).screenshot({ path: join(SAIDA, 'quadros', `${id}.png`) });
}
console.log('pronto:', join(SAIDA, 'index.html'));
await browser.close();
