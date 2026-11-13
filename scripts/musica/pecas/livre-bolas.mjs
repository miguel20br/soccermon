// Vestiário do Pallet FC, EP 2 "Bola fora" (13 compassos, 26 s; o curta v3 usa do compasso 2 em diante; roteiro em trailer/curtas/vestiario-bolas/ROTEIRO.md).
// No molde da livre-foto: o tema do Vestiário abre (TEMA, a toalha no ta-DÁ) e o funk da casa embaixo. Sem plateia
// (13/11: o Vestiário virou mockumentary; a cena remonta com os talking heads e a trilha para durante eles).
// O Magikarp despeja o saco (as bolas quicando no xilofone, cada uma uma nota), o Pikachu chuta duas no armário (chute,
// rede, o pícolo comemorando ANTES), e a última bola é o Voltorb: breque, o tímpano rufando, o "ESSA NÃO!" do Psyduck
// na tuba; o chute, os olhos do Voltorb abrem (o sino sozinho, silêncio) e o KABOOM (o estrondo, o prato e a tremida).
// Fumaça, "…FOI GOL?" e o apito do Magikarp que só solta fumaça. Tela final em Fá: SOC-CER-MON, o tema
// curto e o "tan-tan-TAAN".
// 120 BPM, 4/4, swing 0,12, compasso = 2 s. Fá.
import { kazoo, mola, plim, sobe as chiado, splash } from '../curtas.mjs';
import { bass, drum, I, ins, MAJOR, mel, Song, SR, stabs, thirdBelow } from '../synth.mjs';
import { chute, deslize, k12, rede, ronco, som } from './livre-ginasio.mjs';
import { TEMA, toalha } from './livre-foto.mjs';

export const meta = { titulo: 'Bola fora', tela: 'Vestiário do Pallet FC (EP 2)' };

/** O KABOOM: o estalo, o grave que despenca e o ruído que vai abafando (a fumaça). */
const kaboom = som(
    2.2,
    (p, r) => {
        let ph = 0;
        let v = 0;
        let w = 0;
        return (t) => {
            ph += (2 * Math.PI * (70 * k12(p)) * Math.exp(-t / 0.35)) / SR;
            const n = r() * 2 - 1;
            const a = 0.02 + 0.5 * Math.exp(-t / 0.15);
            v += a * (n - v);
            w += 0.003 * (n - w);
            const estalo = t < 0.02 ? n * (1 - t / 0.02) : 0;
            return 1.2 * Math.sin(ph) * Math.exp(-t / 0.5) + 1.4 * v * Math.exp(-t / 0.6) + 6 * w * Math.exp(-t / 1.2) + 0.8 * estalo;
        };
    },
    { pk: 0.6 },
);
const XILO = { vol: 0.32, a: 0.001, r: 0.16, shape: 1, sv: 0.08, d: 0.06 };

export default function bolas() {
    const S = new Song({ bpm: 120, bars: 13, swing: 0.12, tail: 2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.55, rev: 0.3 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1, rev: 0.2 });
    const xi = S.part('xilofone', ins(XILO), { pan: 0.25, gain: 0.9, rev: 0.2 });
    const sino = S.part('sino', I.bell, { pan: 0.15, gain: 1.6, echo: { rows: 4, fb: 0.35, mix: 0.35 }, rev: 0.45 });
    const bs = S.part('baixo', I.slap, { gain: 0.4, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6, rev: 0.12 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 0.8, rev: 0.15 });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.33 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.28 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.2 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3 });
    const tl = S.part('toalha', toalha, { drum: true, pan: -0.1, gain: 1.3, rev: 0.12 });
    const bo = S.part('boing', mola(), { pan: 0.25, gain: 1, rev: 0.2 });
    const plof = S.part('plof', splash, { pan: 0.15, gain: 1, rev: 0.2 });
    const kz = S.part('kazoo', kazoo, { pan: -0.15, gain: 0.7, corte: 3200, rev: 0.18 });
    const ap = S.part('apito', I.whistle, { pan: 0.2, gain: 0.8 });
    const fumo = S.part('fumo', chiado(0.5), { drum: true, gain: 0.5, rev: 0.2 });
    const pl = S.part('plim', plim, { drum: true, pan: 0.1, gain: 0.8, rev: 0.3 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const zap = S.part('zap', deslize(900, 2800, 0.07), { drum: true, pan: 0.2, gain: 0.6, rev: 0.1 });
    const pulo = S.part('pulo', deslize(500, 1700, 0.6), { drum: true, pan: 0.3, gain: 0.3, rev: 0.2 });
    const arrasta = S.part('arrasta', deslize(180, 120, 0.4), { drum: true, gain: 0.3 });
    const boom = S.part('kaboom', kaboom, { drum: true, gain: 1.3, rev: 0.25 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.5, rev: 0.15 });

    const F = MAJOR(5);
    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    const groove = (b, c, { leve = false } = {}) => {
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    const entra = (b, c, op) => {
        drum(cr, b, 1, 'X...............', { vel: 0.7 });
        groove(b, c, op);
    };

    // 0–1 · ABERTURA: o tema do Vestiário (a placa, a toalha, as letras no xilofone, o ta-DÁ)
    mel(met, 0, [TEMA[0]]);
    mel(met2, 0, [TEMA[0]], { harm: thirdBelow(F), vel: 0.8 });
    mel(xi, 0, ['r:2 C6:1 F6:1 A6:1 C7:1 G6:1 F6:1 r:1 C7:1 D7:1 r:5'], { vel: 0.8 });
    tl.note(1, 0, 0, 1);
    bo.note(8, 10, 0, 0.8);
    drum(cr, 0, 1, 'X...............');
    drum(kk, 0, 1, 'X.....x...x.X...');
    drum(cl, 0, 1, '....X...........', { vel: 0.9 });
    drum(hh, 0, 1, 'x.x.x.x.x.x.....', { vel: 0.7 });
    drum(tp, 0, 1, '............X...');
    mel(bs, 0, ['F2:2 r:2 F2:1 F3:1 r:2 Bb1:2 r:1 Bb2:1 F1:4']);
    stabs(ep, 0, 'F', [0, 2, 6], { low: 57, n: 4, vel: 0.7 });
    stabs(ep, 0, 'Bb', [8, 10], { low: 58, n: 4, vel: 0.7 });
    stabs(ep, 0, 'F', [12], { low: 57, n: 4, len: 4, vel: 0.7 });
    mel(met, 1, [TEMA[1]]);
    mel(met2, 1, [TEMA[1]], { harm: thirdBelow(F), vel: 0.8 });
    mel(pc, 1, ['r:4 C7:1 A6:1 r:10'], { vel: 0.6 });
    pulo.note(16 + 5, 0, 0, 1);
    tl.note(16 + 14, 0, 0, 1.1);
    drum(cr, 1, 1, 'X.............X.');
    drum(kk, 1, 1, 'X...x...X...x.X.');
    drum(cl, 1, 1, '....X.......X...', { vel: 0.8 });
    drum(hh, 1, 1, 'x.x.x.x.xxxxx...', { vel: 0.7 });
    mel(bs, 1, ['G2:2 G1:1 r:1 C2:2 r:2 C2:1 D2:1 E2:1 r:1 F2:1 r:1 F1:2']);
    stabs(ep, 1, 'Gm7', [0, 2], { low: 55, n: 4, vel: 0.7 });
    stabs(ep, 1, 'C7', [4, 6, 8], { low: 55, n: 4, vel: 0.7 });
    stabs(ep, 1, 'F', [14], { low: 57, n: 4, len: 2, vel: 0.7 });

    // 2 · o Magikarp arrasta o saco (0–4) e despeja (6): as bolas quicam, uma nota cada (6 a 14); o Snorlax ronca
    entra(2, 'F7', { leve: true });
    drum(arrasta, 2, 1, 'x...x...........', { vel: 0.8 });
    plof.note(2 * 16 + 6, 72, 1, 0.8);
    mel(xi, 2, ['r:6 C7:1 A6:1 F6:1 C7:1 G6:1 D7:1 A6:1 F6:1 C6:2'], { vel: 0.7 });
    zz.note(2 * 16 + 12, -2, 0, 0.6);
    // 3 · o Pikachu entra (o pícolo) e comemora ANTES de chutar (8: zap)
    entra(3, 'Bb7');
    mel(pc, 3, ['C6:1 F6:1 A6:1 C7:2 r:3 F7:1 r:1 F7:1 r:5'], { vel: 0.7 });
    zap.note(3 * 16 + 8, 0, 0, 1);
    // 4 · chute 1 (2) no armário (5), comemora (6–8); chute 2 (10) e de novo (13)
    groove(4, 'F7');
    ch.note(4 * 16 + 2, 0, 0, 1);
    rd.note(4 * 16 + 5, 0, 0, 0.8);
    ch.note(4 * 16 + 10, 0, 0, 1);
    rd.note(4 * 16 + 13, 0, 0, 0.8);
    mel(pc, 4, ['r:6 A6:1 C7:1 r:6 A6:1 C7:1'], { vel: 0.7 });
    // 5 · breque: a última "bola" (punch-in) é o Voltorb dormindo; o tímpano rufa baixinho; o Psyduck (8): ESSA NÃO!, a tuba
    drum(kk, 5, 1, 'X...............');
    drum(cr, 5, 1, 'x...............', { vel: 0.5 });
    drum(tp, 5, 1, '....x.x.x.x.xxxx', { vel: 0.5 });
    mel(tuba, 5, ['r:8 C3:2 B2:2 Bb2:2 A2:2']);
    // 6 · o Pikachu corre (0–3) e chuta (4); punch-in (6): o Voltorb ABRE OS OLHOS no ar (8: o plim e silêncio)
    drum(sn, 6, 1, 'x.x.x...........', { vel: 0.8 });
    ch.note(6 * 16 + 4, 0, 0, 1.1);
    mel(pc, 6, ['F6:1 A6:1 C7:1 F7:1 r:12'], { vel: 0.8 });
    pl.note(6 * 16 + 8, 0, 0, 1);
    mel(kz, 6, ['r:11 F4:1 r:1 E4:3'], { vel: 0.5 });
    // 7 · KABOOM (0); a fumaça
    boom.note(7 * 16, 0, 0, 1);
    drum(cr, 7, 1, 'X...............');
    drum(tp, 7, 1, 'X...............');
    fumo.note(7 * 16 + 2, 0, 0, 0.7);
    // 8 · todos tostados; "…FOI GOL?" (6)
    mel(tuba, 8, ['F2:2 r:2 C2:2 r:10'], { vel: 0.6 });
    mel(met2, 8, ['r:4 C4:4 B3:4 Bb3:4'], { vel: 0.4 });
    // 9 · o Magikarp apita… e só sai fumaça (4); o funk volta (12)
    ap.note(9 * 16 + 2, 72, 1, 0.5);
    fumo.note(9 * 16 + 4, 4, 0, 0.8);
    groove(9, 'C7', { leve: true });

    // 10–12 · TELA FINAL: SOC-CER-MON (10: 8, 11, 14) e as palmas; o tema curto e a toalha (11); o Voltorb rola de volta pro
    //         saco (11, 8) e pisca (12, 2): "tan-tan-TAAN" (12: 4, 6, 8)
    groove(10, 'F', { leve: true });
    for (const [dt, iv, len] of [[8, 7, 3], [11, 4, 3], [14, 12, 2]]) {
        met.note(10 * 16 + dt, 65 + iv, len, 1);
        met2.note(10 * 16 + dt, 53 + iv, len, 0.7);
    }
    drum(cl, 11, 1, '....x.x.........', { vel: 0.9 });
    mel(met, 11, ['C5:1 F5:1 A5:2 G5:1 r:1 F5+A5+C6:2! r:8']);
    tl.note(11 * 16 + 6, 0, 0, 1.1);
    drum(kk, 11, 1, 'X.....X.........');
    mel(bs, 11, ['F2:1 r:1 F2:1 r:1 C2:1 r:1 F1:2 r:8']);
    mel(xi, 11, ['r:8 C7:1 A6:1 F6:1 C6:1 r:4'], { vel: 0.6 });
    pl.note(12 * 16 + 2, 2, 0, 0.8);
    mel(met, 12, ['r:4 C5+F5:1 r:1 C5+F5:1 r:1 F5+A5+C6:6! r:2']);
    mel(bs, 12, ['r:4 C2:1 r:1 C2:1 r:1 F1:6 r:2']);
    drum(kk, 12, 1, '....x.x.X.......');
    drum(cr, 12, 1, '........X.......');
    return S;
}
