// Curtas promocionais: monta trailer/curtas/midia/ (fora do git) com o que as duas cenas usam, tudo tirado do jogo:
// folhas PMD da quadra (public/assets/field) + sprites.js (quadros, durações do AnimData e o pé de cada animação),
// retratos, logo, fonte, a bola, e a música de cada curta (musica.mjs) já em −14 LUFS.
//   [JOGO=<checkout da main>] node trailer/curtas/preparar.mjs   (da raiz do repo; pela fila: scripts/pesado.sh na frente)
// JOGO: de onde vêm os assets (o atlas extra com o Sleep só existe da 0.9.x em diante; padrão: este checkout).
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';

const OUT = 'trailer/curtas/midia';
const JOGO = process.env.JOGO ?? '.';
const A = `${JOGO}/public/assets`;
// 143 Snorlax e 25 Pikachu (curta 1) · pênaltis: nossos 6 Charizard, 7 Squirtle, 54 Psyduck, 1 Bulbasaur, 25 Pikachu
// e o goleiro 107 Hitmonchan; deles 94 Gengar, 68 Machamp, 65 Alakazam, 124 Jynx, 150 Mewtwo e o goleiro 76 Golem ·
// torcida (de costas, embaixo da tela)
// EP 2: 129 Magikarp (e a roleta usa os retratos)
const ESPECIES = [143, 25, 6, 7, 54, 1, 107, 94, 68, 65, 124, 150, 76, 129, 132, 4];
export const TORCIDA = [39, 52, 133, 35, 79, 4, 104, 37, 16, 43, 60, 113, 132, 19];
const RETRATOS = ['143-surprised', '143', '25', '25-joyous', '150', '107', '129', '129-joyous', '129-surprised', '6', '7', '94', '1', '39', '54', '113', '132', '95', '79', '129-crying', '129-determined', '143-determined', '143-happy', '150-determined', '25-happy'];

mkdirSync(`${OUT}/sp`, { recursive: true });
mkdirSync(`${OUT}/som`, { recursive: true });
const pmd = JSON.parse(readFileSync(`${JOGO}/src/data/pmd-anims.json`, 'utf8'));
const pes = JSON.parse(readFileSync(`${JOGO}/src/data/sprite-feet.json`, 'utf8'));

/** Quadros de cada animação e direção, na ordem: rects[dir] = [[x, y], ...]. */
function quadros(json, nome, info) {
    const rects = [];
    for (let d = 0; d < info.rows; d++)
        rects.push(
            Array.from({ length: info.frames }, (_, i) => {
                const f = json.frames[`${nome}/${d}/${i}`].frame;
                return [f.x, f.y];
            }),
        );
    return rects;
}

const SPR = {};
for (const id of [...ESPECIES, ...TORCIDA]) {
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
            rects: quadros(json, nome, info),
        };
    SPR[id] = { folha: `midia/sp/${id}.png`, tam: [json.meta.size.w, json.meta.size.h], sombra: pmd[id].shadowSize, anims };
}
// Sleep do Snorlax (atlas extra, uma direção só)
{
    const json = JSON.parse(readFileSync(`${A}/field/extra/143.json`, 'utf8'));
    copyFileSync(`${A}/field/extra/143.png`, `${OUT}/sp/143x.png`);
    const info = json.anims.Sleep;
    SPR['143x'] = {
        folha: 'midia/sp/143x.png',
        tam: [json.meta.size.w, json.meta.size.h],
        sombra: 2,
        anims: { Sleep: { w: info.frameWidth, h: info.frameHeight, dur: info.durations, pe: info.foot, rects: quadros(json, 'Sleep', info) } },
    };
}
writeFileSync(`${OUT}/sprites.js`, `window.SPR = ${JSON.stringify(SPR)};\nwindow.TORCIDA = ${JSON.stringify(TORCIDA)};\n`);

for (const r of RETRATOS) copyFileSync(`${A}/portraits/${r}.png`, `${OUT}/${r}.png`);
copyFileSync(`${A}/ui/logo.svg`, `${OUT}/logo-horizontal.svg`);
copyFileSync(`${A}/ui/simbolo.svg`, `${OUT}/logo-simbolo.svg`);
copyFileSync(`${JOGO}/public/fonts/Galmuri11-Bold.woff2`, `${OUT}/Galmuri11-Bold.woff2`);

// música: a peça editada na partitura, normalizada pra −14 LUFS (2 passadas do loudnorm, ganho linear)
execFileSync('node', ['trailer/curtas/musica.mjs', `${OUT}/som`], { stdio: 'inherit' });
for (const nome of ['snorlax', 'penaltis', 'magikarp']) {
    const wav = `${OUT}/som/${nome}.wav`;
    const err = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], {
        encoding: 'utf8',
    }).stderr;
    const m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
    const ln = `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-af', `${ln},aresample=48000`, `${OUT}/som/${nome}-14.wav`]);
    console.log(nome, `medido ${m.input_i} LUFS → −14`);
}
// cada curta é uma pasta do HyperFrames (uma composição raiz por pasta) com midia/ apontando pra cá
for (const c of ['snorlax', 'penaltis', 'magikarp']) if (!existsSync(`trailer/curtas/${c}/midia`)) symlinkSync('../midia', `trailer/curtas/${c}/midia`);
console.log('midia pronta');
