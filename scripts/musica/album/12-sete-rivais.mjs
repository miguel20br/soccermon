// Faixa 12, "Sete rivais": o medley dos temas de líder, na ordem da Rota. De cada um, o A (o motivo e o som de
// assinatura) e o B, que é a história do ginásio dele: Pedra firme (Brock), Moleca das ondas (Misty), Atchim no jardim
// (Erika), Paredes invisíveis (Koga), A colher entortou (Sabrina), Quiz do vulcão (Blaine) e Chão de setas (Giovanni).
// A costura é a do jogo: no fim de cada tema, a virada da casa (toms e o SOC-CER-MON de caixa e clap, no andamento do
// tema que sai), e a ponte do tema que entra (`public/music/ponte-tema-*`, 1 compasso no tom e no andamento dele, com
// riser e prato). O Giovanni, o mais pesado, fecha com o A' (o chefe e a turma da Rocket juntos) e um final em Sol
// menor. Vem colado no "Curto-circuito".
// Rodada 2 (16/11/2026): "uma obra de arte", mas "ideias ótimas afundadas em muito tempo de música" (4:45). Agora fica
// o melhor de cada um, à moda do medley do Abbey Road: o motivo (2 compassos do A), a história do ginásio inteira (o
// B, 8) e o motivo de novo já no tom de cima (2 do A'), costurados pela virada da casa (o SOC-CER-MON de caixa e clap,
// o fio que volta em toda costura) e pela ponte do próximo. O Blaine fecha com o SOC-CER-MON da plateia e o "cha-cha"
// final em Ré menor. O Giovanni saiu (ganhou faixa própria, "Sala do chefe"): no fim sobra a SOMBRA dele, a tuba
// tocando o motivo do chefe em cima do chão que ronca, sem resolver, e a faixa emenda na sala dele. ~3:15.
import { execFileSync } from 'node:child_process';
import blaine from '../pecas/lider-blaine.mjs';
import erika from '../pecas/lider-erika.mjs';
import { MOTIVO as GIOVANNI, tremor } from '../pecas/lider-giovanni.mjs';
import koga from '../pecas/lider-koga.mjs';
import sabrina from '../pecas/lider-sabrina.mjs';
import brock from '../pecas/tema-brock.mjs';
import misty from '../pecas/tema-misty.mjs';
import { bass, drum, I, mel, padChord, Song, SR, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';
import { bumbo, clapMolhado, orgao, tuba } from './kit.mjs';

export const meta = { titulo: 'Sete rivais', faixa: 12, apara: false, emenda: true };

const MUSIC = new URL('../../../public/music/', import.meta.url).pathname;
const ALVO = 0.1; // RMS de cada tema antes do master (o master acerta o integrado do medley inteiro)

/** A virada da casa num compasso: toms descendo e o SOC-CER-MON (3-3-2) de caixa e clap. */
function virada(S, b) {
    const L = S.barLen;
    const tom = S.part('viradaTom', I.tom, { drum: true, gain: 0.6 });
    const cx = S.part('viradaCaixa', I.snare, { drum: true, gain: 0.5 });
    const cl = S.part('viradaClap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 1 });
    const g = L === 12 ? [4, 7, 10] : [8, 11, 14];
    const toms = L === 12 ? [0, 1, 2, 3] : [0, 2, 4, 6];
    for (const [i, r] of toms.entries()) tom.note(b * L + r, 6 - 3 * i, 0, 0.7 + 0.1 * i);
    for (const r of g) {
        cx.note(b * L + r, 0, 0, 1);
        cl.note(b * L + r, 0, 0, 1);
    }
}

/** O render de um tema como [L, R], no RMS do alvo, e onde acaba a virada (segundos). */
function tema(peca, trechos, { final = null, fim = 1 } = {}) {
    const { S, P, n } = estender(peca, trechos, { fim, tail: 4 });
    if (final) final(S, P, n);
    else virada(S, n);
    const [L, R] = S.render();
    let e = 0;
    for (let i = 0; i < L.length; i++) e += L[i] * L[i] + R[i] * R[i];
    const g = ALVO / Math.sqrt(e / (2 * L.length));
    for (let i = 0; i < L.length; i++) {
        L[i] *= g;
        R[i] *= g;
    }
    return { L, R, fim: S.timeOfBar(n + (final ? fim : 1)) };
}

/** A ponte do jogo, decodificada, no nível do pontes.mjs: 0,75 × o RMS dos 4 primeiros segundos do tema que entra. */
function ponte(id, depois) {
    const raw = execFileSync(
        'ffmpeg',
        ['-v', 'error', '-i', `${MUSIC}ponte-${id}.webm`, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'],
        {
            maxBuffer: 1 << 28,
        },
    );
    const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    const L = new Float32Array(x.length / 2);
    const R = new Float32Array(x.length / 2);
    for (let i = 0; i < L.length; i++) {
        L[i] = x[2 * i];
        R[i] = x[2 * i + 1];
    }
    const json = JSON.parse(execFileSync('cat', [`${MUSIC}ponte-${id}.json`], { encoding: 'utf8' }));
    const barra = json.secoes[0].amostras[1];
    const rms = (a, b, A, B) => {
        let e = 0;
        for (let i = a; i < b; i++) e += A[i] * A[i] + B[i] * B[i];
        return Math.sqrt(e / (2 * (b - a)));
    };
    const g = (0.75 * rms(0, 4 * SR, depois.L, depois.R)) / rms(0, barra, L, R);
    for (let i = 0; i < L.length; i++) {
        L[i] *= g;
        R[i] *= g;
    }
    return { L, R, fim: barra / SR };
}

/** A sombra do Giovanni (3 compassos a 96 BPM, o andamento da "Sala do chefe"): a tuba toca o motivo do chefe em
 * cima do órgão grave e do chão roncando, um clap molhado no 3, e para no Dó#7 sem resolver. */
function sombra() {
    const S = new Song({ bpm: 96, bars: 3, tail: 5 });
    const tu = tuba(S, 'tuba', { gain: 1, rev: 0.25 });
    const og = orgao(S, 'orgao', { gain: 0.45, rev: 0.4 });
    const tr = S.part('tremor', tremor, { drum: true, gain: 0.8 });
    const cl = S.part('claps', clapMolhado, { drum: true, gain: 1.3, rev: 0.3 });
    const k = S.part('bumbo', bumbo, { drum: true, gain: 0.8 });
    mel(tu, 0, GIOVANNI.mel, { shift: -24 });
    padChord(og, 0, 'F#m', 16, { low: 42, n: 3, vel: 0.6 });
    padChord(og, 1, 'C#7', 32, { low: 41, n: 4, vel: 0.6 });
    drum(k, 0, 2, 'X.........x.....');
    drum(cl, 1, 1, '........X.......');
    tr.note(16 + 8, 0, 0, 1);
    const [L, R] = S.render();
    let e = 0;
    for (let i = 0; i < L.length; i++) e += L[i] * L[i] + R[i] * R[i];
    const g = (0.8 * ALVO) / Math.sqrt(e / (2 * L.length));
    for (let i = 0; i < L.length; i++) {
        L[i] *= g;
        R[i] *= g;
    }
    return { L, R, fim: S.timeOfBar(3) };
}

export default function seteRivais() {
    // de cada um: o motivo (2 do A), a história (o B, 8) e o motivo no tom de cima (2 do A')
    const MELHOR = [
        [2, 4],
        [10, 20],
    ];
    const ordem = [
        ['tema-brock', brock],
        ['tema-misty', misty],
        ['tema-erika', erika],
        ['tema-koga', koga],
        ['tema-sabrina', sabrina],
    ];
    const temas = ordem.map(([id, p]) => ({ id, ...tema(p, MELHOR) }));
    // o Blaine fecha: o SOC-CER-MON da plateia (o compasso 25 do A') e o "cha-cha" em Ré menor
    temas.push({
        id: 'tema-blaine',
        ...tema(blaine, [...MELHOR, [25, 26]], {
            fim: 3,
            final: (_S, P, n) => {
                stabs(
                    P('metais'),
                    n,
                    'A7b9',
                    [
                        [0, 2],
                        [3, 2],
                        [6, 2],
                        [10, 1],
                        [12, 2],
                    ],
                    { low: 57, n: 4 },
                );
                stabs(
                    P('montuno'),
                    n,
                    'A7b9',
                    [
                        [0, 2],
                        [3, 2],
                        [6, 2],
                        [10, 1],
                        [12, 2],
                    ],
                    { low: 57, n: 4 },
                );
                bass(P('baixo'), n, 'A7b9', '0:3 0:3 0:4 0:2 0:4');
                drum(P('timbal'), n, 1, '........xxxxXXXX', { pitch: 5 });
                drum(P('bumbo'), n, 1, 'X..X..X...X.X...');
                stabs(
                    P('metais'),
                    n + 1,
                    'Dm',
                    [
                        [0, 2],
                        [3, 10],
                    ],
                    { low: 57, n: 4 },
                );
                stabs(
                    P('montuno'),
                    n + 1,
                    'Dm',
                    [
                        [0, 2],
                        [3, 10],
                    ],
                    { low: 57, n: 4 },
                );
                mel(P('lead'), n + 1, ['A5:2 r:1 D6:13']);
                bass(P('baixo'), n + 1, 'Dm', '0:2 r:1 0:13');
                drum(P('prato'), n + 1, 1, '...X............');
                drum(P('bumbo'), n + 1, 1, 'X..X............');
                drum(P('palmas'), n + 1, 1, 'X..X............');
            },
        }),
    });
    // a linha do tempo: tema, (virada já dentro dele), ponte do próximo, próximo tema
    const pedacos = [];
    let t = 0;
    temas.forEach((x, i) => {
        pedacos.push([t, x]);
        t += x.fim;
        const prox = temas[i + 1];
        if (!prox) return;
        const p = ponte(prox.id, prox);
        pedacos.push([t, p]);
        t += p.fim;
    });
    pedacos.push([t, sombra()]);
    const total = Math.ceil(Math.max(...pedacos.map(([a, x]) => a * SR + x.L.length)));
    const L = new Float32Array(total);
    const R = new Float32Array(total);
    for (const [a, x] of pedacos) {
        const o = Math.round(a * SR);
        for (let i = 0; i < x.L.length; i++) {
            L[o + i] += x.L[i];
            R[o + i] += x.R[i];
        }
    }
    return [L, R];
}
