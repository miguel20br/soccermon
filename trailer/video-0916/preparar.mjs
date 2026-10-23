// Vídeo da 0.9.16 (Charmander de capitão): monta trailer/video-0916/midia/ (fora do git) com tudo que a cena usa, tirado
// do jogo: folhas PMD + sprites.js (quadros, durações do AnimData e o pé de cada animação), retratos PMD da torcida e
// dos personagens, o Blue, as cartas da Rota de baby, as quadras dos ginásios, o logo, a fonte, o 1º quadro das
// cartas animadas (a tela de evolução) e os eventos da partitura (cada nota com o segundo dela, pra cena bater na música).
//   node trailer/video-0916/preparar.mjs   (da raiz do worktree)
// As cartas e as quadras de pé vêm da mídia do animatic (MIDIA_ANIMATIC=<pasta>, padrão o worktree video-baby-ac:
// as quadras saem do ?lab=quadras com o dev server, trailer/baby-animatic/quadras.mjs + preparar.mjs).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import peca from '../../scripts/musica/pecas/video-0916.mjs';
import { Song } from '../../scripts/musica/synth.mjs';

const OUT = 'trailer/video-0916/midia';
const A = 'public/assets';
const ANIMATIC = process.env.MIDIA_ANIMATIC ?? '../video-baby-ac/trailer/baby-animatic/midia';
// 4 5 6 a linha do Charmander · 112 34 143 os grandes que riem (o Snorlax volta de goleiro na final) · 95 o Onix de
// Pewter · a turma da foto: 66 68 Machop/Machamp, 129 130 Magikarp/Gyarados, 63 65 Abra/Alakazam, 7 9 Squirtle/Blastoise
const ESPECIES = [4, 5, 6, 112, 34, 143, 95, 66, 68, 129, 130, 63, 65, 7, 9];
// a torcida do começo (sprites pequenos na arquibancada vazia de Pewter)
const TORCIDA = [39, 52, 133, 35, 79, 104, 37, 16, 43, 60, 113, 132, 19, 25, 54, 1, 7, 50, 81];
// a torcida de retratos (3 fileiras de 8) e as caras que ela faz
export const FAS = [25, 7, 1, 39, 52, 54, 79, 92, 133, 26, 35, 16, 19, 60, 43, 104, 116, 123, 131, 113, 37, 58, 98, 147];
const CARAS = ['joyous', 'happy', 'sigh', 'surprised', 'shouting', 'determined', 'inspired'];
const RETRATOS = ['112-joyous', '34-joyous', '143-joyous', '143-determined', '143-dizzy', '4-teary', '4-determined', '95-surprised', '5-determined', '6-joyous'];

for (const d of ['sp', 'r', 'som']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'));
const pes = JSON.parse(readFileSync('src/data/sprite-feet.json', 'utf8'));
const SPR = {};
for (const id of new Set([...ESPECIES, ...TORCIDA])) {
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
            rects: Array.from({ length: info.rows }, (_, d) =>
                Array.from({ length: info.frames }, (_, i) => json.frames[`${nome}/${d}/${i}`].frame).map((f) => [f.x, f.y]),
            ),
        };
    SPR[id] = { folha: `midia/sp/${id}.png`, tam: [json.meta.size.w, json.meta.size.h], sombra: pmd[id].shadowSize, anims };
}
writeFileSync(`${OUT}/sprites.js`, `window.SPR = ${JSON.stringify(SPR)};\nwindow.TORCIDA = ${JSON.stringify(TORCIDA)};\nwindow.FAS = ${JSON.stringify(FAS)};\n`);

for (const id of FAS) for (const c of CARAS) copyFileSync(`${A}/portraits/${id}-${c}.png`, `${OUT}/r/${id}-${c}.png`);
for (const r of RETRATOS) copyFileSync(`${A}/portraits/${r}.png`, `${OUT}/r/${r}.png`);
copyFileSync(`${A}/trainers/blue.png`, `${OUT}/blue.png`);
copyFileSync(`${A}/ui/logo.svg`, `${OUT}/logo-horizontal.svg`);
copyFileSync(`${A}/ui/ball.svg`, `${OUT}/ball.svg`);
copyFileSync(`${A}/fx/impact.png`, `${OUT}/impact.png`);
for (const f of ['Galmuri11-Bold', 'Galmuri14']) copyFileSync(`public/fonts/${f}.woff2`, `${OUT}/${f}.woff2`);
// a tela de evolução usa a carta animada (gif): o 1º quadro, com transparência
for (const id of [5, 6])
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${A}/cards/${id}.gif`, '-vf', 'format=rgba', '-frames:v', '1', `${OUT}/evo-${id}.png`]);
for (const id of [4, 5, 6, 66, 68, 129, 130]) copyFileSync(`${ANIMATIC}/c-${id}.png`, `${OUT}/c-${id}.png`);
for (const n of [0, 1, 9]) {
    if (!existsSync(`${ANIMATIC}/quadra-${n}-v.png`)) throw new Error(`falta ${ANIMATIC}/quadra-${n}-v.png (trailer/baby-animatic/quadras.mjs)`);
    copyFileSync(`${ANIMATIC}/quadra-${n}-v.png`, `${OUT}/quadra-${n}-v.png`);
}

execFileSync('node', ['trailer/video-0916/planos.mjs'], { stdio: 'inherit' });

// a partitura vira eventos: cada nota com o segundo dela (o mesmo render determinístico do .wav)
const notas = [];
const partOrig = Song.prototype.part;
Song.prototype.part = function (nome, ...rest) {
    const p = partOrig.call(this, nome, ...rest);
    const note = p.note;
    p.note = (t, m, len = 1, vel = 1) => {
        notas.push([nome, Math.round(this.sec(t) * 1e4) / 1e4, m, len, Math.round(vel * 100) / 100]);
        note(t, m, len, vel);
    };
    return p;
};
const S = peca();
Song.prototype.part = partOrig;
notas.sort((a, b) => a[1] - b[1]);
const compassos = Array.from({ length: S.bars + 1 }, (_, b) => Math.round(S.timeOfBar(b) * 1e4) / 1e4);
writeFileSync(`${OUT}/som/eventos.js`, `window.EV = ${JSON.stringify({ swing: S.swing, compassos, notas })};\n`);
console.log('midia pronta ·', compassos.at(-1), 's de música,', notas.length, 'notas');
