// Os efeitos do Time Ultimate que o jogo sintetiza na hora (ZzFX), renderizados em WAV pro trailer, com os mesmos
// parâmetros de src/game/audio.ts (SFX) e as mesmas chamadas: pacote abrindo = kick ×1,7 (CardPack), cada carta =
// select no tom da posição (pitchOf: 0, +4, +7 semitons), carta do walkout = goal, toque = select ×1 e confirmar
// (Abrir todos, Resgatar) = select ×0,7 (src/ui/feedback.ts). Pico normalizado; o volume relativo vai na montagem.
//   node trailer/curtas/ut-trailer/v2/sons.mjs <pasta>
import { mkdirSync } from 'node:fs';
import { writeWav } from '../../../../scripts/musica/synth.mjs';

const { ZZFX } = await import('zzfx');
const [dir = 'sons'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const SFX = {
    kick: [0.9, 0.05, 140, 0, 0.01, 0.06, 4, 2.2, -8, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6, 0.02],
    goal: [1.4, 0, 523, 0.03, 0.35, 0.5, 1, 1.8, 0, 0, 262, 0.08, 0.12, 0, 0, 0, 0.05, 0.8, 0.1],
    select: [0.5, 0, 880, 0, 0.02, 0.05, 1, 1.5, 0, 0, 440, 0.03, 0, 0, 0, 0, 0, 0.6, 0],
};
const pitchOf = (i) => 2 ** ([0, 4, 7, 12][i] / 12);
const sons = {
    'abrir-pacote': ['kick', 1.7],
    'carta-1': ['select', pitchOf(0)],
    'carta-2': ['select', pitchOf(1)],
    'carta-3': ['select', pitchOf(2)],
    'carta-walkout': ['goal', 1],
    toque: ['select', 1],
    confirmar: ['select', 0.7],
};
for (const [nome, [sfx, pitch]] of Object.entries(sons)) {
    const p = [...SFX[sfx]];
    p[1] = 0; // sem a variação aleatória de tom: o mesmo som a cada render
    p[2] *= pitch;
    const s = ZZFX.buildSamples(...p);
    writeWav(`${dir}/${nome}.wav`, [s, s]);
}
console.log(`${Object.keys(sons).length} sons em ${dir}`);
