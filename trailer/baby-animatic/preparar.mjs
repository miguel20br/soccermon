// Animatic da Rota de baby (conceitos A e C): monta trailer/baby-animatic/midia/ (fora do git) com o que os quadros
// usam, tudo do jogo: folhas PMD da quadra + sprites.js (quadros e o pé de cada animação), retratos PMD, logo, bola,
// fonte e efeitos. As quadras saem do quadras.mjs (dev server ligado) e as cartas da escolha de capitão da Rota de
// baby vêm da branch trailer-baby (CARTAS=<pasta com c-<id>.png>, gravadas com trailer/baby/passos.mjs).
//   node trailer/baby-animatic/preparar.mjs   (da raiz do worktree)
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'trailer/baby-animatic/midia';
const A = 'public/assets';
const CARTAS = process.env.CARTAS ?? '../trailer-baby/trailer/baby/midia';
// A: Charmander → Charizard, os grandes que riem (Rhydon, Nidoking, Snorlax) · C: a turma (Charmander, Squirtle,
// Machop, Abra, Magikarp) e a turma evoluída · torcida (a mesma dos curtas)
export const TORCIDA = [39, 52, 133, 35, 79, 104, 37, 16, 43, 60, 113, 132, 19, 25, 54, 1, 7, 50, 74, 81];
const ESPECIES = [4, 5, 6, 112, 34, 143, 7, 9, 66, 68, 63, 65, 129, 130, ...TORCIDA];
const RETRATOS = ['112-joyous', '34-joyous', '143-joyous', '4-determined', '4-teary', '6-joyous', '5-determined'];

mkdirSync(`${OUT}/sp`, { recursive: true });
const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'));
const pes = JSON.parse(readFileSync('src/data/sprite-feet.json', 'utf8'));
const SPR = {};
for (const id of new Set(ESPECIES)) {
    const json = JSON.parse(readFileSync(`${A}/field/${id}.json`, 'utf8'));
    copyFileSync(`${A}/field/${id}.png`, `${OUT}/sp/${id}.png`);
    const anims = {};
    for (const [nome, info] of Object.entries(pmd[id].anims))
        anims[nome] = {
            w: info.frameWidth,
            h: info.frameHeight,
            pe: pes[id]?.[nome] ?? 0.75,
            rects: Array.from({ length: info.rows }, (_, d) =>
                Array.from({ length: info.frames }, (_, i) => json.frames[`${nome}/${d}/${i}`].frame).map((f) => [f.x, f.y]),
            ),
        };
    SPR[id] = { folha: `midia/sp/${id}.png`, tam: [json.meta.size.w, json.meta.size.h], anims };
}
writeFileSync(`${OUT}/sprites.js`, `window.SPR = ${JSON.stringify(SPR)};\nwindow.TORCIDA = ${JSON.stringify(TORCIDA)};\n`);
for (const r of RETRATOS) copyFileSync(`${A}/portraits/${r}.png`, `${OUT}/retrato-${r}.png`);
copyFileSync(`${A}/ui/logo.svg`, `${OUT}/logo.svg`);
copyFileSync(`${A}/ui/ball.svg`, `${OUT}/ball.svg`);
copyFileSync(`${A}/fx/fireball.png`, `${OUT}/fireball.png`);
copyFileSync(`${A}/fx/impact.png`, `${OUT}/impact.png`);
copyFileSync('public/fonts/Galmuri11-Bold.woff2', `${OUT}/Galmuri11-Bold.woff2`);
for (const id of [4, 5, 6, 66, 67, 68, 129, 130])
    if (existsSync(`${CARTAS}/c-${id}.png`)) copyFileSync(`${CARTAS}/c-${id}.png`, `${OUT}/c-${id}.png`);
    else console.log('falta a carta', id);
if (!existsSync(`${OUT}/quadra-0.png`)) console.log('faltam as quadras: rode quadras.mjs com o dev server');
// as quadras de pé (o comprimento indo pro fundo da tela): Pewter (0), Cerulean (1) e Índigo (9)
else for (const n of [0, 1, 9]) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${OUT}/quadra-${n}.png`, '-vf', 'transpose=2', `${OUT}/quadra-${n}-v.png`]);
console.log('midia pronta');
