// Curtas 2: monta trailer/curtas-2/midia/ (fora do git) com o que as duas cenas usam, tudo tirado do jogo: folhas PMD
// da quadra + sprites.js (quadros, durações do AnimData e o pé de cada animação), logo, fonte, a música da categoria
// livre (o .ogg aprovado, sem mexer) e os eventos da partitura (eventos.mjs).
//   node trailer/curtas-2/preparar.mjs   (da raiz do worktree; MUSICA=<pasta dos .ogg>, padrão ~/Música/soccermon-amostras)
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';

const OUT = 'trailer/curtas-2/midia';
const A = 'public/assets';
const MUSICA = process.env.MUSICA ?? `${homedir()}/Música/soccermon-amostras`;
// ginásio: 66 Machop (o moleque), 67 Machoke (o zelador), 106 Hitmonlee (o zagueiro fantasma da final) e a torcida
// imaginada na arquibancada ·
// luzes: 25 Pikachu, 4 Charmander, 7 Squirtle, 1 Bulbasaur e 54 Psyduck (o atrasado)
export const TORCIDA = [39, 52, 133, 35, 79, 104, 37, 16, 43, 60, 113, 132, 19, 129];
const ESPECIES = [66, 67, 106, 25, 4, 7, 1, 54, ...TORCIDA];

mkdirSync(`${OUT}/sp`, { recursive: true });
mkdirSync(`${OUT}/som`, { recursive: true });
const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'));
const pes = JSON.parse(readFileSync('src/data/sprite-feet.json', 'utf8'));

const SPR = {};
for (const id of ESPECIES) {
    const json = JSON.parse(readFileSync(`${A}/field/${id}.json`, 'utf8'));
    copyFileSync(`${A}/field/${id}.png`, `${OUT}/sp/${id}.png`);
    const anims = {};
    for (const [nome, info] of Object.entries(pmd[id].anims))
        anims[nome] = {
            w: info.frameWidth,
            h: info.frameHeight,
            dur: info.durations,
            pe: pes[id]?.[nome] ?? 0.75,
            hit: info.hitFrame ?? 0,
            // rects[dir] = [[x, y], ...] na ordem dos quadros
            rects: Array.from({ length: info.rows }, (_, d) =>
                Array.from({ length: info.frames }, (_, i) => {
                    const f = json.frames[`${nome}/${d}/${i}`].frame;
                    return [f.x, f.y];
                }),
            ),
        };
    SPR[id] = { folha: `midia/sp/${id}.png`, tam: [json.meta.size.w, json.meta.size.h], sombra: pmd[id].shadowSize, anims };
}
writeFileSync(`${OUT}/sprites.js`, `window.SPR = ${JSON.stringify(SPR)};\nwindow.TORCIDA = ${JSON.stringify(TORCIDA)};\n`);

copyFileSync(`${A}/ui/logo.svg`, `${OUT}/logo-horizontal.svg`);
copyFileSync('public/fonts/Galmuri11-Bold.woff2', `${OUT}/Galmuri11-Bold.woff2`);
copyFileSync(`${MUSICA}/livre-ginasio.ogg`, `${OUT}/som/ginasio.ogg`);
copyFileSync(`${MUSICA}/livre-abertura-album.ogg`, `${OUT}/som/abertura.ogg`);
execFileSync('node', ['trailer/curtas-2/eventos.mjs', `${OUT}/som`], { stdio: 'inherit' });
// cada curta é uma pasta do HyperFrames (uma composição raiz por pasta) com midia/ e comum.js apontando pra cá
for (const c of ['ginasio', 'luzes']) {
    mkdirSync(`trailer/curtas-2/${c}`, { recursive: true });
    if (!existsSync(`trailer/curtas-2/${c}/midia`)) symlinkSync('../midia', `trailer/curtas-2/${c}/midia`);
    if (!existsSync(`trailer/curtas-2/${c}/comum.js`)) symlinkSync('../comum.js', `trailer/curtas-2/${c}/comum.js`);
}
console.log('midia pronta');
