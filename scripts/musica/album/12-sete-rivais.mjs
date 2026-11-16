// Faixa 12, "Sete rivais": o medley dos temas de líder, na ordem da Rota. De cada um, o A (o motivo e o som de
// assinatura) e o B, que é a história do ginásio dele: Pedra firme (Brock), Moleca das ondas (Misty), Atchim no jardim
// (Erika), Paredes invisíveis (Koga), A colher entortou (Sabrina), Quiz do vulcão (Blaine) e Chão de setas (Giovanni).
// A costura é a do jogo: no fim de cada tema, a virada da casa (toms e o SOC-CER-MON de caixa e clap, no andamento do
// tema que sai), e a ponte do tema que entra (`public/music/ponte-tema-*`, 1 compasso no tom e no andamento dele, com
// riser e prato). O Giovanni, o mais pesado, fecha com o A' (o chefe e a turma da Rocket juntos) e um final em Sol
// menor. Vem colado no "Curto-circuito".
import { execFileSync } from 'node:child_process';
import blaine from '../pecas/lider-blaine.mjs';
import erika from '../pecas/lider-erika.mjs';
import giovanni from '../pecas/lider-giovanni.mjs';
import koga from '../pecas/lider-koga.mjs';
import sabrina from '../pecas/lider-sabrina.mjs';
import brock from '../pecas/tema-brock.mjs';
import misty from '../pecas/tema-misty.mjs';
import { bass, drum, I, mel, padChord, SR, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Sete rivais', faixa: 12, apara: false };

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

export default function seteRivais() {
    const ordem = [
        ['tema-brock', brock, [[2, 18]]],
        ['tema-misty', misty, [[2, 18]]],
        ['tema-erika', erika, [[2, 18]]],
        ['tema-koga', koga, [[2, 18]]],
        ['tema-sabrina', sabrina, [[2, 18]]],
        ['tema-blaine', blaine, [[2, 18]]],
    ];
    const temas = ordem.map(([id, p, t]) => ({ id, ...tema(p, t) }));
    // o Giovanni: A, B (as setas e a revelação), A' com a Rocket junto, e o final em Sol menor
    temas.push({
        id: 'tema-giovanni',
        ...tema(giovanni, [[2, 26]], {
            fim: 3,
            final: (_S, P, n) => {
                stabs(
                    P('trio'),
                    n,
                    'D7b9',
                    [
                        [0, 1],
                        [2, 1],
                        [4, 2],
                    ],
                    { low: 59, n: 4 },
                );
                mel(P('metais'), n, ['r:8 D4:3 Bb3:3 G3:2']);
                mel(P('tuba'), n, ['r:8 D3:3 Bb2:3 G2:2']);
                drum(P('caixa'), n, 1, '........xxXxXXXX', { vel: 0.8 });
                bass(P('baixo'), n, 'D7b9', '0:8 r:8');
                mel(P('metais'), n + 1, ['G4:16']);
                mel(P('terças'), n + 1, ['D4:16']);
                mel(P('tuba'), n + 1, ['G1:16']);
                padChord(P('cordas'), n + 1, 'Gm', 16, { low: 55, n: 4 });
                padChord(P('orgao'), n + 1, 'Gm', 16, { low: 43, n: 4, vel: 0.8 });
                bass(P('baixo'), n + 1, 'Gm', '0:16');
                drum(P('prato'), n + 1, 1, 'X...............');
                drum(P('bumbo'), n + 1, 1, 'X...............');
                drum(P('timpano'), n + 1, 1, 'X...............', { pitch: -8 });
                P('tremor').note((n + 1) * 16, 0, 0, 1);
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
