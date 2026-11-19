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
    // o vento da bola no drible com nome (ruído que desce): aqui, mais agudo, é a carta virando no ar
    whoosh: [0.5, 0.05, 320, 0.04, 0.06, 0.16, 4, 1, -3, 0, 0, 0, 0, 1.2, 0, 0, 0, 0.6, 0.05],
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
// v3, mais presença no pacote: o rasgo é uma fileira de grãos de ruído do mesmo ZzFX (o papel cedendo aos poucos, do
// grave pro agudo, ~0,3 s) e a carta virando é o whoosh do jogo uma oitava acima, curto
const grao = (f, v) => ZZFX.buildSamples(v, 0, f, 0, 0.004, 0.018 + Math.random() * 0.01, 4, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0.5, 0);
const SR = ZZFX.sampleRate;
const rasgo = new Float32Array(Math.round(SR * 0.4));
for (let k = 0; k < 14; k++) {
    const g = grao(500 + k * 140, 0.5 + 0.5 * Math.sin((k / 13) * Math.PI));
    const at = Math.round(SR * (k * 0.021 + Math.random() * 0.006));
    for (let i = 0; i < g.length && at + i < rasgo.length; i++) rasgo[at + i] += g[i];
}
writeWav(`${dir}/rasgo.wav`, [rasgo, rasgo]);
const vira = [...SFX.whoosh];
vira[1] = 0;
vira[2] *= 2.2;
vira[5] = 0.09;
const v = ZZFX.buildSamples(...vira);
writeWav(`${dir}/carta-vira.wav`, [v, v]);
console.log(`${Object.keys(sons).length + 2} sons em ${dir}`);
