// Pontes da troca de tela (22/10/2026, a C da demo A/B/C, que o Miguel preferiu): 1 compasso no andamento e no tom
// da faixa que ENTRA, com o som de assinatura dela, entre a virada (feita na hora no jogo, `src/game/virada.ts`) e a
// faixa nova. Entrar na partida (partida padrão ou tema do líder no VERSUS): + riser no compasso e prato no 1 da faixa.
//   scripts/pesado.sh node scripts/musica/pontes.mjs [id ...]   → public/music/ponte-<id>.webm/.mp3/.json + clap-808.wav
//   node scripts/musica/pontes.mjs --conferir                    → só confere (alinhamento e emenda ponte → faixa)
// O .json da ponte: um trecho `ponte` (sem loop) de 1 compasso; o arquivo tem o compasso + o rabo (soa por cima da
// entrada da faixa). Nível: RMS de 0,75 × o da faixa que entra nos 4 primeiros segundos, pico até 0,4 (como na demo).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FLIP } from './pecas/draft.mjs';
import { PECA } from './pecas/escalacao.mjs';
import { fogo } from './pecas/lider-blaine.mjs';
import { borrifo } from './pecas/lider-erika.mjs';
import { tremor } from './pecas/lider-giovanni.mjs';
import { bolha } from './pecas/lider-koga.mjs';
import { warp } from './pecas/lider-sabrina.mjs';
import { apito, zap } from './pecas/livre-ginasio.mjs';
import { arp, bass, drum, I, mel, padChord, Song, SR, stabs } from './synth.mjs';

const MUSIC = new URL('../../public/music/', import.meta.url).pathname;
const TMP = '/tmp/soccermon-musica/pontes';
const args = process.argv.slice(2);
const conferir = args.includes('--conferir');
const so = args.filter((a) => !a.startsWith('--'));

// ---------- pedaços comuns ----------
const clap = (o = {}) => I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3, ...o });
/** Uma nota de bateria numa linha (`drum` com padrão de uma batida só). */
const hit = (P, row, len, o) => drum(P, 0, 1, `${'.'.repeat(row)}x${'.'.repeat(len - 1 - row)}`, o);

/** Riser: ruído num passa-faixa que sobe (300 Hz → 5 kHz) e cresce até o 1 da faixa nova (o da demo). */
function riser(dur) {
    const n = Math.round(dur * SR);
    let s = 99;
    const rnd = () => {
        s = (s * 16807) % 2147483647;
        return (s / 2147483647) * 2 - 1;
    };
    const y = new Float32Array(n);
    let low = 0;
    let band = 0;
    for (let i = 0; i < n; i++) {
        const u = i / n;
        const f1 = 2 * Math.sin((Math.PI * 300 * (5000 / 300) ** u) / SR);
        const high = rnd() - low - 0.5 * band;
        band += f1 * high;
        low += f1 * band;
        y[i] = band * u * u * Math.min(1, (n - i) / (0.005 * SR));
    }
    let pk = 1e-9;
    for (const v of y) pk = Math.max(pk, Math.abs(v));
    return y.map((v) => (v * 0.55) / pk);
}
/** Entrar na partida: riser no compasso todo e prato com bumbo no 1 da faixa nova (linha 16 = o rabo da ponte). */
function partida(S) {
    const len = S.barLen;
    const r = riser((len * 15) / S.bpm);
    drum(
        S.part('riser', () => r, { drum: true, gain: 0.45 }),
        0,
        1,
        `x${'.'.repeat(len - 1)}`,
    );
    S.part('prato', I.crash, { drum: true, gain: 0.6, rev: 0.2 }).note(len, 0, 0, 1);
    S.part('bumbo1', I.kick, { drum: true, gain: 0.8 }).note(len, 0, 0, 1.1);
}

/**
 * Cada ponte: andamento e compasso da faixa que entra (o 1º trecho que toca), e o compasso: a dominante do tom dela
 * com o baixo andando até a tônica, mais a assinatura. `match`: entra na partida (riser e prato).
 */
const PONTES = {
    // Draft (Fá maior, 108): C7 com o baixo subindo Dó-Ré-Mi até o Fá, e as três cartas em 3-3-2 (a C da demo)
    draft: {
        bpm: 108,
        swing: 0.1,
        som: 'as três cartas virando (sinos em 3-3-2)',
        f(S) {
            const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.8, rev: 0.15 });
            stabs(ep, 0, 'C7sus4', [[0, 3]], { low: 57, n: 4, vel: 0.8 });
            stabs(ep, 0, 'C7', [[6, 2]], { low: 57, n: 4, vel: 0.8 });
            bass(S.part('baixo', I.bass, { gain: 0.6 }), 0, 'C7', '0:4 2:4 3:6 r:2');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.7 }), 0, 1, 'X.......X.......');
            drum(S.part('shaker', I.shaker, { drum: true, pan: -0.3 }), 0, 1, 'xoxoxoxoxoxoxoxo');
            drum(S.part('clap', clap({ corte: 6000, sala: 0.35 }), { drum: true, rev: 0.1 }), 0, 1, '....x...........');
            ['C6', 'A5', 'F6'].forEach((n, i) => {
                const pan = [-0.6, 0, 0.6][i];
                const r = [8, 11, 14][i];
                mel(S.part('carta', I.bell, { pan, gain: 2, rev: 0.3 }), 0, [`r:${r} ${n}:2 r:${14 - r}`]);
                hit(S.part('flip', FLIP, { drum: true, pan, gain: 1.6 }), r, 16);
            });
        },
    },
    // Escalação (Mi menor, 116, disco): Si7b9 nos metais quentes, baixo até o Mi, e a prancheta (a C da demo)
    escalacao: {
        bpm: 116,
        swing: 0.04,
        som: 'a prancheta (cinco peças magnéticas)',
        f(S) {
            const met = S.part('metais', I.brass, { pan: 0.25, gain: 0.9, corte: 1800, rev: 0.15 });
            stabs(met, 0, 'B7b9', [
                [0, 6],
                [12, 4],
            ]);
            bass(S.part('baixo', I.slap, { gain: 0.5 }), 0, 'B7', '0:2 8:2 r:2 3:2 5:2 r:2 s:4');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.9 }), 0, 1, 'x...x...x...x...');
            drum(S.part('chimbal', I.ohat, { drum: true, pan: 0.3, gain: 0.6 }), 0, 1, '..x...x...x...x.');
            drum(S.part('clap', clap({ corte: 6500, sala: 0.25 }), { drum: true }), 0, 1, '....x.......x...');
            drum(S.part('tom', I.tom, { drum: true }), 0, 1, '..............xx', { pitch: 3 });
            [0, 3, 6, 10, 12].forEach((r, i) => {
                const P = S.part('peça', PECA, { drum: true, pan: -0.6 + 0.3 * i, gain: 1.4, rev: 0.12 });
                hit(P, r, 16, { pitch: [0, 2, 3, 5, 7][i] });
            });
        },
    },
    // Recompensa (Fá maior, 124): o baralho embaralha (flips em semicolcheia) e as três cartas, mais rápido que o Draft
    recompensa: {
        bpm: 124,
        swing: 0.1,
        som: 'o baralho embaralhando e as três cartas',
        f(S) {
            const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.15 });
            stabs(ep, 0, 'C7', [
                [2, 2],
                [6, 2],
            ]);
            bass(S.part('baixo', I.slap, { gain: 0.55 }), 0, 'C7', '0:2 8:1~ r:1 5:2 s:2 0:2 2:2 3:4');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.75 }), 0, 1, 'X.....x.X.......');
            drum(S.part('flips', FLIP, { drum: true, pan: 0.2, gain: 1.2 }), 0, 1, 'xoxoxoxo........');
            ['C6', 'A5', 'F6'].forEach((n, i) => {
                const pan = [-0.6, 0, 0.6][i];
                const r = [8, 11, 14][i];
                mel(S.part('carta', I.bell, { pan, gain: 2, rev: 0.3 }), 0, [`r:${r} ${n}:2 r:${14 - r}`]);
                hit(S.part('flip', FLIP, { drum: true, pan, gain: 1.6 }), r, 16);
            });
        },
    },
    // Mercado (Si♭ menor dórico, 104): Fá7 no clavinete, moedas caindo e o "plim" da caixa registradora
    'mercado-funk': {
        bpm: 104,
        swing: 0.14,
        som: 'as moedas caindo e o "plim" da caixa registradora',
        f(S) {
            stabs(S.part('clav', I.clav, { pan: -0.3, gain: 1.1 }), 0, 'F7', [
                [2, 1],
                [6, 1],
                [10, 1],
            ]);
            bass(S.part('baixo', I.slap, { gain: 0.55 }), 0, 'F7', '0:2 8:1~ r:1 5:2 s:2 0:2 3:2 5:2 7:2');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.7 }), 0, 1, 'X.....x.X.......');
            drum(S.part('clap', clap(), { drum: true }), 0, 1, '....x.......x...');
            const coin = S.part('moedas', I.coin, { drum: true, pan: -0.3, gain: 1.4, rev: 0.15 });
            for (const [j, p] of [0, 2, 4, 7].entries()) coin.note(4 + j, p, 0, 0.9);
            const plim = S.part('plim', I.bell, { pan: 0.4, gain: 5, rev: 0.2 });
            plim.note(12, 96, 2, 1);
            plim.note(12, 103, 2, 0.6);
        },
    },
    // Rota 1 (Dó# menor, 120): Sol#7 no piano elétrico, pizzicato subindo e o baixo a galope
    'rota-1': {
        bpm: 120,
        swing: 0.04,
        som: 'o baixo a galope e o pizzicato subindo',
        f(S) {
            padChord(S.part('piano', I.epiano, { pan: -0.2, gain: 0.7, rev: 0.2 }), 0, 'G#7', 8, { low: 56, n: 4 });
            mel(S.part('pizz', I.pizz, { pan: 0.35, gain: 0.8, rev: 0.2 }), 0, ['G#4:2 C5:2 D#5:2 F#5:2 G#5:4 B#4:4']);
            bass(S.part('baixo', I.counter, { gain: 0.9 }), 0, 'G#7', '0:2 0:1 0:1 0:2 0:1 0:1 5:2 5:1 5:1 s:4');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.6 }), 0, 1, 'X.......X.......');
            drum(S.part('shaker', I.shaker, { drum: true, pan: 0.3 }), 0, 1, 'x.xxx.xxx.xxx.xx');
        },
    },
    // Mt. Moon (Ré menor, 132): Lá7, baixo em colcheias e as gotas com eco da caverna (e um sininho de Clefairy)
    'mt-moon': {
        bpm: 132,
        swing: 0,
        som: 'as gotas com eco da caverna e o sininho de Clefairy',
        f(S) {
            arp(S.part('arpejo', I.thin, { pan: 0.3, gain: 0.5, corte: 3000 }), 0, 'A7', { low: 57 });
            bass(S.part('baixo', I.bass, { gain: 0.6 }), 0, 'A7', '0:2 0:2 0:2 0:2 8:2 8:2 s:2 5:2');
            const gota = S.part('gotas', I.bell, { pan: -0.4, gain: 1.6, echo: { rows: 3, fb: 0.45, mix: 0.5 } });
            mel(gota, 0, ['A6:2 r:4 E6:2 r:6 C#7:2']);
            mel(S.part('sininho', I.bell, { pan: 0.5, gain: 1.2, rev: 0.4 }), 0, ['r:12 A6:1 C#7:1 E7:2']);
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.6 }), 0, 1, 'X...X...X...X...');
        },
    },
    // Cerulean (Ré lídio em 6/8, 99): Lá7 na harpa em onda e as bolhas subindo
    cerulean: {
        bpm: 99,
        barLen: 12,
        swing: 0,
        som: 'a harpa em onda e as bolhas subindo',
        f(S) {
            mel(S.part('harpa', I.pizz, { pan: -0.3, gain: 0.8, rev: 0.35 }), 0, [
                'A4:1 C#5:1 E5:1 G5:1 A5:1 G5:1 E5:1 C#5:1 E5:1 G5:1 A5:2',
            ]);
            bass(S.part('baixo', I.counter, { gain: 0.8 }), 0, 'A7', '0:6 5:3 s:3');
            drum(S.part('bolhas', I.whistle, { drum: true, pan: 0.4, gain: 0.5, rev: 0.4 }), 0, 1, '......x.x.xx', {
                pitch: 12,
            });
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.5 }), 0, 1, 'X.....X.....');
        },
    },
    // Estrada da Vitória (Mi menor, 132): Si7 nos metais, taiko em 3-3-2 e o clap 808 seco com o aro
    'estrada-da-vitoria': {
        bpm: 132,
        swing: 0,
        som: 'o taiko em 3-3-2 e o clap 808 seco',
        f(S) {
            stabs(S.part('metais', I.brass, { pan: 0.2, gain: 0.85, corte: 2600, rev: 0.15 }), 0, 'B7', [
                [0, 3],
                [6, 2],
                [12, 4],
            ]);
            bass(S.part('baixo', I.slap, { gain: 0.55 }), 0, 'B7', '0:4 3:4 5:4 s:4');
            drum(S.part('taiko', I.timp, { drum: true, gain: 0.35, rev: 0.2 }), 0, 1, 'X..X..X...X.X...', {
                pitch: -7,
            });
            drum(
                S.part('clap', clap({ ganho: 0.45, corte: 7000, sala: 0.1 }), { drum: true }),
                0,
                1,
                '....x.......x...',
            );
            drum(S.part('caixa', I.snare, { drum: true, gain: 0.5 }), 0, 1, '..............xx');
        },
    },
    // Planalto Índigo (Si♭ maior, 108, marcha): Fá7 na fanfarra, rufo de caixa de banda crescendo e tímpano
    'planalto-indigo': {
        bpm: 108,
        swing: 0.18,
        swingUnit: 8,
        som: 'o rufo de caixa de banda e o tímpano',
        f(S) {
            stabs(S.part('metais', I.brass, { pan: -0.15, gain: 0.9, rev: 0.25 }), 0, 'F7', [
                [0, 6],
                [12, 4],
            ]);
            bass(S.part('tuba', I.tuba, { gain: 0.6 }), 0, 'F7', '0:4 5:4 0:4 s:4');
            const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
            for (let r = 8; r < 16; r++) sn.note(r, 0, 0, 0.3 + 0.08 * (r - 8));
            drum(S.part('tímpano', I.timp, { drum: true, gain: 0.4 }), 0, 1, 'X.......X...X.X.', { pitch: -5 });
        },
    },
    // Vitória (Dó maior, 122): rufar crescendo, Sol7 nos metais e o "hey" do clap
    'vitoria-gancho': {
        bpm: 122,
        swing: 0,
        som: 'o rufar crescendo e o "hey" do clap 808',
        f(S) {
            padChord(S.part('metais', I.brass, { pan: -0.15, gain: 0.7, rev: 0.25 }), 0, 'G7', 12, { low: 55, n: 4 });
            const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
            for (let r = 0; r < 14; r++) sn.note(r, 0, 0, 0.25 + 0.05 * r);
            drum(S.part('tímpano', I.timp, { drum: true, gain: 0.4 }), 0, 1, 'X.......X.......', { pitch: -5 });
            drum(
                S.part('clap', clap({ ganho: 0.55, corte: 7000 }), { drum: true, gain: 1.4 }),
                0,
                1,
                '............x.x.',
            );
        },
    },
    // Derrota (Lá menor, 132): Mi7 em terças, baixinho, e o "toc toc" de consolo no bloco
    derrota: {
        bpm: 132,
        swing: 0,
        som: 'o "toc toc" de consolo no bloco',
        f(S) {
            mel(S.part('pulso', I.pulse, { pan: -0.1, gain: 0.8 }), 0, ['G#4:4 B4:4 D5:6 r:2']);
            mel(S.part('terças', I.thin, { pan: 0.3, gain: 0.5 }), 0, ['E4:4 G#4:4 B4:6 r:2']);
            mel(S.part('baixo', I.counter, { gain: 0.9 }), 0, ['E3:8 r:8']);
            drum(S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 1.9 }), 0, 1, '............x.x.', {
                pitch: -5,
            });
        },
    },
    // Eliminado (Lá menor, 132): Mi7 descendo em terças no pulso, baixo triangular
    eliminado: {
        bpm: 132,
        swing: 0,
        som: 'o pulso em terças descendo (a família do Eliminado)',
        f(S) {
            const M = ['D5:2 C5:2 B4:4 G#4:4 r:4'];
            mel(S.part('pulso', I.pulse, { pan: -0.1, gain: 0.9, echo: { rows: 2, fb: 0.2, mix: 0.15 } }), 0, M);
            mel(S.part('terças', I.thin, { pan: 0.3, gain: 0.5 }), 0, ['B4:2 A4:2 G#4:4 E4:4 r:4']);
            bass(S.part('baixo', I.counter, { gain: 0.9 }), 0, 'E7', '0:8 5:4 r:4', { oct: 12 });
        },
    },
    // Campeão (Dó maior, 100): rufar e tímpanos Sol-Ré, Sol7 nos metais e a torcida no clap dobrado
    campeao: {
        bpm: 100,
        swing: 0,
        som: 'o rufar, os tímpanos e a torcida no clap dobrado',
        f(S) {
            padChord(S.part('metais', I.brass, { pan: -0.15, gain: 0.75, rev: 0.25 }), 0, 'G7', 14, { low: 55, n: 4 });
            const sn = S.part('caixa', I.snare, { drum: true, gain: 0.6 });
            for (let r = 0; r < 16; r += r < 8 ? 2 : 1) sn.note(r, 0, 0, 0.3 + 0.04 * r);
            const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.45, rev: 0.2 });
            drum(ti, 0, 1, 'X.......X.......', { pitch: -5 });
            drum(ti, 0, 1, '....X.......X.X.', { pitch: -12 });
            drum(
                S.part('clap', clap({ ganho: 0.45, corte: 6800 }), { drum: true, pan: -0.4 }),
                0,
                1,
                '........x..x..x.',
            );
            drum(
                S.part('clap2', clap({ ganho: 0.45, corte: 6800, tom: 0.5, atraso: 0.011 }), { drum: true, pan: 0.4 }),
                0,
                1,
                '........x..x..x.',
            );
        },
    },
    // Partida padrão (Lá menor dórico, 120): Mi7 no funk, baixo slap e o APITO do juiz; riser e prato no 1
    'partida-1t': {
        bpm: 120,
        swing: 0.06,
        match: true,
        som: 'o apito do juiz (com riser e prato)',
        f(S) {
            stabs(S.part('acordes', I.stab, { pan: -0.3, gain: 1.1, corte: 3000 }), 0, 'E7', [
                [2, 1],
                [6, 1],
                [10, 1],
            ]);
            bass(S.part('baixo', I.slap, { gain: 0.6 }), 0, 'E7', '0:2 8:1~ r:1 5:2 s:2 0:2 3:2 5:2 s:2');
            drum(S.part('bumbo', I.kick, { drum: true, gain: 0.7 }), 0, 1, 'X.....x.X.......');
            drum(S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.6 }), 0, 1, 'x.xx.x.xx.xx.x.x');
            hit(S.part('apito', apito(0.3), { drum: true, pan: 0.2, gain: 0.45, rev: 0.2 }), 12, 16);
        },
    },
    // Brock (Mi menor, 100): Si7 nos metais e na tuba, taiko em 3-3-2
    'tema-brock': {
        bpm: 100,
        swing: 0,
        match: true,
        som: 'o taiko em 3-3-2 e os metais (com riser e prato)',
        f(S) {
            stabs(S.part('metais', I.brass, { pan: 0.2, gain: 0.85, corte: 2600, rev: 0.2 }), 0, 'B7', [
                [0, 6],
                [12, 4],
            ]);
            bass(S.part('tuba', I.tuba, { gain: 0.6 }), 0, 'B7', '0:4 5:4 3:4 s:4');
            drum(S.part('taiko', I.timp, { drum: true, gain: 0.35, rev: 0.2 }), 0, 1, 'X..X..X...X.X...', {
                pitch: -7,
            });
        },
    },
    // Misty (Si menor em 12/8, 84): Fá#7 na harpa e as bolhas subindo
    'tema-misty': {
        bpm: 84,
        barLen: 12,
        swing: 0,
        match: true,
        som: 'a harpa e as bolhas subindo (com riser e prato)',
        f(S) {
            mel(S.part('harpa', I.pizz, { pan: -0.3, gain: 0.8, rev: 0.35 }), 0, [
                'F#4:1 A#4:1 C#5:1 E5:1 F#5:1 E5:1 C#5:1 A#4:1 C#5:1 E5:1 F#5:2',
            ]);
            bass(S.part('baixo', I.counter, { gain: 0.8 }), 0, 'F#7', '0:6 5:3 s:3');
            drum(S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.55, rev: 0.4 }), 0, 1, '...x..x.x.xx', {
                pitch: 12,
            });
        },
    },
    // Equipe Rocket (Dó menor, 112): baixo na ponta do pé e o TRIO (os três vilões) em Sol7b9
    'tema-rocket': {
        bpm: 112,
        swing: 0.12,
        match: true,
        som: 'o trio dos três vilões e o baixo na ponta do pé (com riser e prato)',
        f(S) {
            stabs(
                S.part('trio', I.stab, { pan: 0.1, gain: 1.4, rev: 0.15 }),
                0,
                'G7b9',
                [
                    [8, 1],
                    [10, 1],
                    [12, 2],
                ],
                { low: 59, n: 4 },
            );
            mel(S.part('baixo', I.bassoon, { gain: 0.8 }), 0, ['G2:2 r:2 B2:2 r:2 D3:2 r:2 F3:2 r:2']);
            drum(S.part('bloco', I.block, { drum: true, pan: -0.3, gain: 0.8 }), 0, 1, 'x..x..x...x..x..');
        },
    },
    // Lt. Surge (Fá# menor, 144): Dó#7 nos metais, arpejo de 16 avos, rufo de banda e o CHOQUE
    'tema-ltsurge': {
        bpm: 144,
        swing: 0.06,
        match: true,
        som: 'o choque elétrico e o rufo de banda (com riser e prato)',
        f(S) {
            stabs(S.part('metais', I.brass, { pan: 0.2, gain: 0.85, corte: 3000, rev: 0.2 }), 0, 'C#7', [[0, 6]]);
            arp(S.part('arpejo', I.thin, { pan: 0.4, gain: 0.55, corte: 2600 }), 0, 'C#7', { low: 61 });
            bass(S.part('baixo', I.slap, { gain: 0.6 }), 0, 'C#7', '0:2 8:2 0:2 8:2 5:2 s:2 5:2 3:2');
            const sn = S.part('caixa', I.snare, { drum: true, gain: 0.5 });
            for (let r = 8; r < 12; r++) sn.note(r, 0, 0, 0.4 + 0.1 * (r - 8));
            hit(
                S.part('choque', zap, { drum: true, pan: 0.35, gain: 0.7, echo: { rows: 3, fb: 0.3, mix: 0.3 } }),
                12,
                16,
            );
        },
    },
    // Erika (Ré mixolídio, 112, bossa): Lá7 na marimba, a flauta e o BORRIFO de perfume
    'tema-erika': {
        bpm: 112,
        swing: 0.06,
        match: true,
        som: 'o borrifo de perfume e a flauta (com riser e prato)',
        f(S) {
            stabs(S.part('marimba', I.pizz, { pan: -0.3, gain: 0.9, rev: 0.2 }), 0, 'A7', [
                [0, 2],
                [3, 2],
                [6, 2],
                [10, 2],
            ]);
            mel(S.part('flauta', I.counter, { pan: 0.25, gain: 0.8, rev: 0.25 }), 0, ['r:8 E5:2 G5:2 C#6:4']);
            bass(S.part('baixo', I.bass, { gain: 0.6 }), 0, 'A7', '0:3 5:3 8:2 0:3 5:3 s:2');
            drum(S.part('shaker', I.shaker, { drum: true, pan: 0.3 }), 0, 1, 'x.xxx.xxx.xxx.xx');
            hit(S.part('borrifo', borrifo, { drum: true, pan: 0.45, gain: 0.8, rev: 0.2 }), 13, 16);
        },
    },
    // Koga (Lá frígio, 120): a cadência frígia (Si♭ → Lá) no koto, taiko em 3-3-2 e as BOLHAS de veneno
    'tema-koga': {
        bpm: 120,
        swing: 0.05,
        match: true,
        som: 'as bolhas de veneno e o taiko em 3-3-2 (com riser e prato)',
        f(S) {
            stabs(S.part('koto', I.pizz, { pan: -0.3, gain: 0.9, rev: 0.25 }), 0, 'Bb', [
                [0, 2],
                [3, 2],
                [6, 2],
                [10, 4],
            ]);
            mel(S.part('baixo', I.bass, { gain: 0.6 }), 0, ['Bb2:3 Bb2:3 D3:2 Bb2:3 F2:3 Bb2:2']);
            drum(S.part('taiko', I.timp, { drum: true, gain: 0.15, rev: 0.2 }), 0, 1, 'X..X..X.X.X.XXXX', {
                pitch: -7,
            });
            drum(S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.7 }), 0, 1, '....x.......x...');
            const bo = S.part('bolhas', bolha, { drum: true, pan: 0.4, gain: 0.55, rev: 0.3 });
            for (const [r, p] of [
                [11, 0],
                [13, 3],
                [14, 7],
            ])
                hit(bo, r, 16, { pitch: p });
        },
    },
    // Sabrina (Si♭ lídio, 104, meio-tempo): Fá7sus4 na celesta em tons inteiros, o TELETRANSPORTE e o clap molhado no 3
    'tema-sabrina': {
        bpm: 104,
        swing: 0.04,
        match: true,
        som: 'o teletransporte e a celesta em tons inteiros (com riser e prato)',
        f(S) {
            mel(S.part('celesta', I.bell, { pan: 0.3, gain: 1.4, rev: 0.4, echo: { rows: 3, fb: 0.4, mix: 0.4 } }), 0, [
                'C6:2 D6:2 E6:2 F#6:2 G#6:2 A#6:6',
            ]);
            padChord(S.part('pad', I.pad, { gain: 1, rev: 0.3 }), 0, 'F7sus4', 16, { low: 53, n: 4 });
            mel(S.part('baixo', I.bass, { gain: 0.6 }), 0, ['F2:8 F2:4 E2:4']);
            drum(
                S.part('clap', clap({ sala: 0.6 }), { drum: true, rev: 0.3, echo: { rows: 3, fb: 0.35, mix: 0.4 } }),
                0,
                1,
                '........x.......',
            );
            hit(S.part('teleporte', warp, { drum: true, pan: 0.2, gain: 0.7, rev: 0.35 }), 12, 16);
        },
    },
    // Blaine (Dó menor, 116, mambo): Sol7 nos metais, clave 3-2 no cencerro e o FOGO
    'tema-blaine': {
        bpm: 116,
        swing: 0.04,
        match: true,
        som: 'o fogo e o cencerro na clave (com riser e prato)',
        f(S) {
            stabs(S.part('metais', I.brass, { pan: 0.2, gain: 0.85, corte: 3000, rev: 0.15 }), 0, 'G7', [
                [0, 2],
                [3, 2],
                [6, 4],
            ]);
            bass(S.part('baixo', I.bass, { gain: 0.6 }), 0, 'G7', '0:3 5:3 r:2 8:3 5:3 r:2');
            drum(S.part('cencerro', I.agogo, { drum: true, pan: -0.3, gain: 0.9 }), 0, 1, 'x..x..x...x.x...', {
                pitch: -5,
            });
            hit(S.part('fogo', fogo, { drum: true, pan: 0.3, gain: 0.6, rev: 0.15 }), 11, 16);
        },
    },
    // Giovanni (Fá# menor, 100, meio-tempo pesado): Dó#7 no órgão de igreja, tuba e o TREMOR
    'tema-giovanni': {
        bpm: 100,
        swing: 0.04,
        match: true,
        som: 'o tremor de terra e o órgão de igreja (com riser e prato)',
        f(S) {
            padChord(S.part('órgão', I.organ, { gain: 1.2, rev: 0.3 }), 0, 'C#7', 16, { low: 49, n: 4 });
            bass(S.part('tuba', I.tuba, { gain: 0.6 }), 0, 'C#7', '0:4 5:4 3:4 s:4');
            drum(S.part('caixa', I.snare, { drum: true, gain: 0.6 }), 0, 1, '........X.......');
            hit(S.part('tremor', tremor, { drum: true, gain: 0.9 }), 10, 16);
        },
    },
};

// ---------- áudio ----------
const decode = (file) => {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], {
        maxBuffer: 1 << 30,
    });
    const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const ch = [new Float32Array(x.length / 2), new Float32Array(x.length / 2)];
    for (let i = 0; i < ch[0].length; i++) [ch[0][i], ch[1][i]] = [x[2 * i], x[2 * i + 1]];
    return ch;
};
const rms = (ch, a, b) => {
    let e = 0;
    for (let i = a; i < b; i++) e += (ch[0][i] ** 2 + ch[1][i] ** 2) / 2;
    return Math.sqrt(e / Math.max(1, b - a));
};
const encode = (ch, out, codec) => {
    const n = ch[0].length;
    const pcm = new Float32Array(2 * n);
    for (let i = 0; i < n; i++) [pcm[2 * i], pcm[2 * i + 1]] = [ch[0][i], ch[1][i]];
    const c = codec === 'webm' ? ['-c:a', 'libopus', '-b:a', '64k'] : ['-c:a', 'libmp3lame', '-b:a', '80k'];
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', '-', ...c, out], {
        input: Buffer.from(pcm.buffer),
    });
};

// emenda (a medida do loops.mjs): erro de prever a amostra pela reta das duas anteriores, contra o percentil 99,9
const err = (x, i) => Math.abs(x[i] - (2 * x[i - 1] - x[i - 2]));
function seam(chs, at, a, b) {
    let worst = 0;
    for (const x of chs) {
        const e = [];
        for (let i = a + 2; i < b; i += 3) e.push(err(x, i));
        e.sort((u, v) => u - v);
        const p = e[Math.floor(e.length * 0.999)] || 1e-9;
        worst = Math.max(worst, Math.max(err(x, at), err(x, at + 1)) / p);
    }
    return worst;
}
/** O jogo: a ponte em 0, a faixa entra no fim do compasso subindo em 30 ms (IN_S do `music.ts`). */
function junction(ponte, faixa, bar) {
    const n = bar + Math.round(4 * SR);
    const out = [new Float32Array(n), new Float32Array(n)];
    const ramp = Math.round(0.03 * SR);
    for (let c = 0; c < 2; c++)
        for (let i = 0; i < n; i++) {
            const j = i - bar;
            out[c][i] = (ponte[c][i] ?? 0) + (j >= 0 ? (faixa[c][j] ?? 0) * Math.min(1, j / ramp) : 0);
        }
    return out;
}

mkdirSync(TMP, { recursive: true });
if (!conferir) {
    // o clap 808 da virada (receita 7b) no nível do synth: o jogo mistura com o ZzFX e ajusta tudo junto
    const c = clap()(0);
    const b = Buffer.alloc(44 + 2 * c.length);
    b.write('RIFF', 0);
    b.writeUInt32LE(36 + 2 * c.length, 4);
    b.write('WAVEfmt ', 8);
    b.writeUInt32LE(16, 16);
    b.writeUInt16LE(1, 20);
    b.writeUInt16LE(1, 22);
    b.writeUInt32LE(SR, 24);
    b.writeUInt32LE(2 * SR, 28);
    b.writeUInt16LE(2, 32);
    b.writeUInt16LE(16, 34);
    b.write('data', 36);
    b.writeUInt32LE(2 * c.length, 40);
    for (let i = 0; i < c.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c[i])) * 32767), 44 + 2 * i);
    writeFileSync(join(MUSIC, 'clap-808.wav'), b);
}
let fail = 0;
for (const [id, p] of Object.entries(PONTES)) {
    if (so.length && !so.includes(id)) continue;
    const faixa = decode(join(MUSIC, `${id}.webm`));
    const barLen = p.barLen ?? 16;
    const bar = Math.round(((barLen * 15) / p.bpm) * SR);
    const file = join(MUSIC, `ponte-${id}`);
    if (!conferir) {
        const S = new Song({ bpm: p.bpm, bars: 1, barLen, swing: p.swing, swingUnit: p.swingUnit ?? 16, tail: 2.5 });
        p.f(S);
        if (p.match) partida(S);
        const ch = S.render();
        // nível (a ponte pelo compasso; o prato do 1 fica no rabo) e corte do silêncio do rabo
        let pk = 1e-9;
        for (const c of ch) for (const v of c) pk = Math.max(pk, Math.abs(v));
        const k = Math.min((0.75 * rms(faixa, 0, 4 * SR)) / rms(ch, 0, bar), 0.4 / pk);
        let end = ch[0].length;
        while (end > bar && Math.max(Math.abs(ch[0][end - 1]), Math.abs(ch[1][end - 1])) * k < 1e-3) end--;
        const out = ch.map((c) => c.slice(0, end).map((v) => v * k));
        const f = Math.round(0.005 * SR);
        for (const c of out) for (let i = 0; i < f; i++) c[end - 1 - i] *= i / f;
        encode(out, `${file}.webm`, 'webm');
        encode(out, `${file}.mp3`, 'mp3');
        writeFileSync(join(TMP, `ponte-${id}.f32`), Buffer.from(Float32Array.from(out[0]).buffer));
        const meta = {
            faixa: `ponte-${id}`,
            titulo: `Ponte pra ${id}: ${p.som}`,
            sampleRate: SR,
            linhasPorCompasso: barLen,
            duracao: +(end / SR).toFixed(6),
            secoes: [
                {
                    nome: 'ponte',
                    loop: false,
                    inicio: 0,
                    fim: +(bar / SR).toFixed(6),
                    amostras: [0, bar],
                    bpm: p.bpm,
                    compassos: 1,
                },
            ],
        };
        writeFileSync(`${file}.json`, `${JSON.stringify(meta, null, 1)}\n`);
    }
    // confere: o .webm decodificado bate com a ponte sem atraso, e a emenda ponte → faixa no fim do compasso
    const dec = decode(`${file}.webm`);
    let al = true;
    try {
        const ref = new Float32Array(readFileSync(join(TMP, `ponte-${id}.f32`)).buffer.slice(0));
        const c = (d) => {
            let v = 0;
            for (let i = 2048; i < 2048 + 8192; i++) v += dec[0][i + d] * ref[i];
            return v;
        };
        let best = -Infinity;
        for (let d = -64; d <= 64; d++) best = Math.max(best, c(d));
        al = c(0) >= 0.995 * best;
    } catch {
        // sem o render desta rodada: só a emenda
    }
    const mix = junction(dec, faixa, bar);
    const nota = seam(mix, bar, bar, bar + 2 * SR);
    const ok = nota < 1 && al;
    if (!ok) fail++;
    console.log(
        `${ok ? 'ok   ' : 'FALHA'} ponte-${id.padEnd(20)} ${p.bpm} BPM, compasso ${(bar / SR).toFixed(3)} s, arquivo ${(dec[0].length / SR).toFixed(2)} s, emenda ${nota.toFixed(2)}${al ? '' : '  .webm desalinhado'}  · ${p.som}`,
    );
}
console.log(`${fail} falha(s)`);
process.exit(fail ? 1 : 0);
