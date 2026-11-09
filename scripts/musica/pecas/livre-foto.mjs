// Vestiário do Pallet FC, EP 1 "A foto do time" (27 compassos, 54 s; roteiro em trailer/curtas/vestiario-foto/ROTEIRO.md).
// A trilha de verdade (08/11/2026), no molde da livre-ditto: funk animado, cada som uma piada que se vê.
// O TEMA DO VESTIÁRIO (`TEMA`, 2 compassos em Fá, a abertura de todo episódio): sitcom anos 70/80 com metais em terças,
// piano elétrico, baixo slap e clap 808. O motivo quica como as letras da logo: Dó-Fá-Lá sobe, vira (Sol-Fá) e salta
// uma sexta até o Ré ("Ves-ti-Á-rio... PA-llet"); o xilofone toca uma nota por letra, a bolinha do ponto é o BOING. A
// resposta sobe pelo cromático junto com o pulo do Magikarp e fecha no "ta-DÁ" com a TOALHA estalando (`toalha`, a
// assinatura sonora da série: o "fwip" do pano e o "TCHÁ" da ponta).
// Por baixo das entradas, o funk da casa (aplauso da plateia no 1); cada foto é breque com clique e risada. Cada um tem
// o seu som: o plof do Magikarp, o pícolo e os zaps do Pikachu, a frase de "descolado" do Squirtle no metal com surdina
// (que o Ditto copia no kazoo dele do EP 3, depois do BOING da transformação, e os dois discutem em pergunta e
// resposta), a cabeça latejando do Psyduck na tuba, e a canção de ninar do Jigglypuff na caixinha de música: a banda
// dorme junto (o baixo despenca, cada um cai num "fiuu" mais grave). Ninguém ouviu: ele incha de raiva (a bexiga
// enchendo, a canção de ninar em menor nos metais graves, a chaleira apitando) e bufa: HMPF! Os bips do timer sobem
// (Dó, Ré, Mi), a banda acorda num estalo; "NÃO TÁ FALTANDO NINGUÉM, NÉ?" tem a tuba do Slowpoke (o motivo dele do
// "O atrasado", um tempo atrasado) bem baixinho no fundo; NÃO!, o bip do 1 e o Ré7 sobem tudo um tom: a FOTO FINAL
// em Sol, quente (cordas), "awww" e aplauso; SOC-CER-MON na piscada do logo, o tema volta curto com a toalha, e
// silêncio: a tuba do Slowpoke entra devagar, para, grilo, "…JÁ TIRARAM?", risada, e a tuba termina o motivo atrasada.
// 120 BPM, 4/4, swing 0,12, compasso = 2 s. Fá (0–21) → Sol (22–26). Plateia, clique e grilo: gravações CC0 em
// scripts/musica/amostras/ (créditos no ROTEIRO); os gritos são clipes na cena.

import { aparece, bp, sobe as chiado, kazoo, mola, splash, svf } from '../curtas.mjs';
import { amostra, bass, drum, I, ins, MAJOR, mel, padChord, Song, SR, stabs, thirdBelow } from '../synth.mjs';
import { MOTIVO as SLOWPOKE } from './livre-atrasado.mjs';
import { barriga, bzzt, deslize, k12, ronco, som } from './livre-ginasio.mjs';

export const meta = { titulo: 'A foto do time', tela: 'Vestiário do Pallet FC (EP 1)' };

const TAU = Math.PI * 2;

/** O tema do Vestiário (2 compassos, Fá), na voz de cima dos metais; a de baixo é a terça diatônica. */
export const TEMA = [
    'F5+A5:2! C5:1 F5:1 A5:2! G5:1 F5:1 r:1 C6:1 D6:2! r:2 C6:1 A5:1',
    'Bb5:2! A5:1 G5:1 r:4 A5:1 Bb5:1 B5:1 C6:1 F5:1 r:1 F5+A5+C6:2!',
];
/** A frase de "descolado" do Squirtle (blues em Fá, 8 linhas). */
const SQUIRTLE = 'C5:1 Eb5:1 E5:1 F5:2 Eb5:1 C5:1 r:1';

/** A TOALHA estalando (assinatura do Vestiário): o "fwip" do pano girando e o "TCHÁ" da ponta. */
export const toalha = som(
    0.3,
    (p, r) => {
        const fl = svf(0.25);
        const [a, b] = [bp(2300 * k12(p), 3), bp(4200 * k12(p), 4)];
        return (t) => {
            const n = r() * 2 - 1;
            if (t < 0.075) {
                const x = t / 0.075;
                return fl(n, 500 * 8 ** x) * x * x * 0.7;
            }
            const u = t - 0.075;
            const tcha = n * Math.exp(-u / 0.006);
            return 1.4 * a(tcha) + 0.8 * b(tcha) + 0.5 * tcha + 0.3 * fl(n, 3000) * Math.exp(-u / 0.04);
        };
    },
    { pk: 0.5, corte: 9000 },
);
/** O Jigglypuff inchando de raiva (`dur` s): a bexiga enchendo (o tom sobe e treme cada vez mais rápido) e o sopro. */
const incha = (dur) =>
    som(
        dur + 0.06,
        (p, r) => {
            let ph = 0;
            let tr = 0;
            const fl = svf(0.3);
            const [a, b] = [bp(700, 3), bp(1600, 4)];
            return (t) => {
                const x = Math.min(1, t / dur);
                ph += (170 * 4.5 ** x * k12(p)) / SR;
                tr += (5 + 22 * x) / SR;
                const src = (ph % 1) * 2 - 1 + 0.35 * (r() * 2 - 1);
                const env = (0.2 + 0.8 * x) * Math.min(1, t / 0.05) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.06));
                const trem = 1 + 0.45 * Math.sin(TAU * tr);
                return (a(src) + 0.7 * b(src) + 0.2 * fl(r() * 2 - 1, 800 + 3000 * x)) * env * trem;
            };
        },
        { pk: 0.5, corte: 5000 },
    );
/** A chaleira apitando (a raiva no talo): assovio que sobe e cresce, com o vapor. */
const chaleira = som(
    0.62,
    (p, r) => {
        let ph = 0;
        const fl = svf(0.1);
        return (t) => {
            const x = Math.min(1, t / 0.5);
            ph += (TAU * (1700 + 450 * x) * k12(p) * (1 + 0.006 * Math.sin(TAU * 9 * t))) / SR;
            const env = x ** 1.5 * (t < 0.52 ? 1 : Math.max(0, 1 - (t - 0.52) / 0.08));
            return (0.8 * Math.sin(ph) + 0.3 * fl(r() * 2 - 1, 2100)) * env;
        };
    },
    { pk: 0.4 },
);
/** A bufada, "HMPF!": a boca fechada estourando (formante grave) e o ar saindo pelo nariz. */
const bufada = som(
    0.45,
    (p, r) => {
        let ph = 0;
        const [a, b] = [bp(450, 2.5), bp(1100, 3)];
        const fl = svf(0.4);
        return (t) => {
            ph += (TAU * 140 * k12(p) * (1 - 0.3 * Math.min(1, t / 0.2))) / SR;
            const voz = (Math.sin(ph) > 0 ? 1 : -1) * Math.exp(-t / 0.07);
            const ar = fl(r() * 2 - 1, 1500) * Math.min(1, t / 0.01) * Math.exp(-t / 0.15);
            return a(voz) + 0.5 * b(voz) + 1.2 * ar;
        };
    },
    { pk: 0.5, corte: 6000 },
);
/** Caindo no sono: "fiuu" de apito de êmbolo descendo uma oitava (`pitch` em semitons, Sol 6 = 0). */
const cai = som(
    0.28,
    (p) => {
        let ph = 0;
        return (t) => {
            const x = Math.min(1, t / 0.22);
            ph += (TAU * 1568 * k12(p) * 2 ** -x) / SR;
            return Math.sin(ph) * Math.min(1, t / 0.01) * (t < 0.22 ? 1 : Math.max(0, 1 - (t - 0.22) / 0.06));
        };
    },
    { pk: 0.4 },
);
/** A cabeça latejando do Psyduck: "TUM" grave e abafado. */
const lateja = som(
    0.45,
    (p, r) => {
        let ph = 0;
        let v = 0;
        return (t) => {
            ph += (TAU * 46 * k12(p) * (1 + 0.5 * Math.exp(-t / 0.03))) / SR;
            v += 0.02 * (r() * 2 - 1 - v);
            return (Math.sin(ph) + 3 * v) * Math.min(1, t / 0.012) * Math.exp(-t / 0.13);
        };
    },
    { pk: 0.55 },
);
/** Xilofone (as letras quicando): baqueta curta e redonda. */
const XILO = ins({ vol: 0.32, a: 0.001, r: 0.16, shape: 1, sv: 0.08, d: 0.06 });

export default function foto() {
    const S = new Song({ bpm: 120, bars: 27, swing: 0.12, tail: 2 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const mudo = S.part('surdina', I.brass, { pan: 0.1, gain: 0.55, corte: 1700, rev: 0.15 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.55, rev: 0.3 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.9, rev: 0.35 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1, rev: 0.2 });
    const xi = S.part('xilofone', XILO, { pan: 0.25, gain: 1.1, rev: 0.2, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const sino = S.part('sino', I.bell, { pan: 0.15, gain: 0.6, rev: 0.3 });
    const cx = S.part('caixinha', I.bell, { pan: 0.1, gain: 1.2, echo: { rows: 3, fb: 0.3, mix: 0.3 }, rev: 0.45 });
    const bs = S.part('baixo', I.slap, { gain: 0.4, corte: 2500 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.5, rev: 0.12 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.33 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.28 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.13 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.28 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.2, gain: 0.5 });
    const tl = S.part('toalha', toalha, { drum: true, pan: -0.1, gain: 1.3, rev: 0.12 });
    const bo = S.part('boing', mola(), { pan: 0.25, gain: 1.1, rev: 0.2 });
    const boP = S.part('boingPequeno', mola({ seg: 0.35, balanco: 18 }), { pan: -0.2, gain: 1.3, rev: 0.2 });
    const plof = S.part('plof', splash, { pan: 0.15, gain: 1, rev: 0.2 });
    const zap = S.part('zap', deslize(900, 2800, 0.07), { drum: true, pan: 0.2, gain: 0.6, rev: 0.1 });
    const choque = S.part('choque', bzzt, { drum: true, gain: 0.5 });
    const sobe = S.part('sobe', deslize(300, 1400, 0.3), { drum: true, gain: 0.45, rev: 0.2 });
    const desce = S.part('desce', deslize(1200, 300, 0.9), { drum: true, gain: 0.35, rev: 0.25 });
    const pulo = S.part('pulo', deslize(500, 1700, 0.6), { drum: true, pan: 0.3, gain: 0.3, rev: 0.2 });
    const despenca = S.part('despenca', deslize(110, 38, 0.6), { drum: true, gain: 0.3 });
    const vapor = S.part('vapor', chiado(0.35), { drum: true, pan: 0.2, gain: 0.5, rev: 0.2 });
    const dorme = S.part('dorme', cai, { drum: true, pan: 0.15, gain: 0.25, rev: 0.25 });
    const passo = S.part('barriga', barriga, { drum: true, gain: 0.55 });
    const tum = S.part('lateja', lateja, { drum: true, gain: 0.8, rev: 0.1 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.5, rev: 0.15 });
    const poof = S.part('poof', aparece, { drum: true, gain: 0.9, rev: 0.15 });
    const kz = S.part('kazoo', kazoo, { pan: -0.15, gain: 0.8, corte: 3200, rev: 0.18 });
    const bip = S.part('bip', I.pulse, { pan: 0.25, gain: 0.35, corte: 4000, rev: 0.1 });
    const inc = S.part('incha', incha(1.4), { drum: true, pan: -0.1, gain: 0.9, rev: 0.15 });
    const ch = S.part('chaleira', chaleira, { drum: true, pan: 0.15, gain: 1.2, rev: 0.2 });
    const hmpf = S.part('bufada', bufada, { drum: true, gain: 1.2, rev: 0.15 });
    const clique = S.part('clique', amostra('foto-clique.wav'), { drum: true, gain: 1, rev: 0.1 });
    const risoC = S.part('risoCurto', amostra('plateia-riso-curto.wav'), { drum: true, gain: 0.9 });
    const risoM = S.part('risoMedio', amostra('plateia-riso-medio.wav'), { drum: true, gain: 0.95 });
    const risoG = S.part('risoGrande', amostra('plateia-riso-grande.wav'), { drum: true, gain: 0.85 });
    const aplauso = S.part('aplauso', amostra('plateia-aplauso.wav'), { drum: true, gain: 0.8 });
    const aww = S.part('aww', amostra('plateia-aww.wav'), { drum: true, gain: 1 });
    const grilo = S.part('grilo', amostra('grilo.wav'), { drum: true, pan: 0.2, gain: 0.45, rev: 0.3 });

    const F = MAJOR(5);
    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    /** O funk da casa (o da livre-ditto). Leve: só o esqueleto. */
    const groove = (b, c, { leve = false } = {}) => {
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    /** Entrada: o prato e o aplauso da plateia no 1, e o groove. */
    const entra = (b, c, op) => {
        drum(cr, b, 1, 'X...............', { vel: 0.7 });
        groove(b, c, op);
        aplauso.note(b * 16, 0, 0, 0.8);
    };
    /** O clique (no 1), breque, e a plateia ri. */
    const foto = (b, acorde, riso, linha = 4) => {
        clique.note(b * 16, 0, 0, 1);
        drum(kk, b, 1, 'X...............');
        drum(cr, b, 1, 'X...............');
        stabs(met, b, acorde, [0], { low: 56, n: 4, len: 2 });
        mel(bs, b, [`${acorde.replace(/7$/, '')}2:2 r:14`]);
        riso.note(b * 16 + linha, 0, 0, 1);
    };
    /** O gancho SOC-CER-MON (5ª, 3ª, 8ª do tom) a partir da linha absoluta `t`. */
    const gancho = (p, t, base, vel = 1) => {
        for (const [dt, iv, len] of [
            [0, 7, 3],
            [3, 4, 3],
            [6, 12, 6],
        ])
            p.note(t + dt, base + iv, len, vel);
    };

    // ---------- 0–1 · A ABERTURA: o tema do Vestiário ----------
    // 0 · a placa carimba (o acorde da banda no 1) e a fita cai por cima (a TOALHA, linha 1); as letras de PALLET FC
    //     quicam (o xilofone, uma nota por letra, linhas 2 a 10; a bolinha é o BOING na 8); o Snorlax despenca na placa
    //     (12: a barriga, o tímpano e o Fá grave)
    mel(met, 0, [TEMA[0]]);
    mel(met2, 0, [TEMA[0]], { harm: thirdBelow(F), vel: 0.8 });
    mel(xi, 0, ['r:2 C6:1 F6:1 A6:1 C7:1 G6:1 F6:1 r:1 C7:1 D7:1 r:5'], { vel: 0.8 });
    tl.note(1, 0, 0, 1);
    bo.note(8, 10, 0, 0.8);
    drum(cr, 0, 1, 'X...............');
    drum(kk, 0, 1, 'X.....x...x.X...');
    drum(cl, 0, 1, '....X...........', { vel: 0.9 });
    drum(hh, 0, 1, 'x.x.x.x.x.x.....', { vel: 0.7 });
    drum(passo, 0, 1, '............x...', { pitch: -5 });
    drum(tp, 0, 1, '............X...');
    mel(bs, 0, ['F2:2 r:2 F2:1 F3:1 r:2 Bb1:2 r:1 Bb2:1 F1:4']);
    stabs(ep, 0, 'F', [0, 2, 6], { low: 57, n: 4, vel: 0.7 });
    stabs(ep, 0, 'Bb', [8, 10], { low: 58, n: 4, vel: 0.7 });
    stabs(ep, 0, 'F', [12], { low: 57, n: 4, len: 4, vel: 0.7 });
    // 1 · EPISÓDIO 1 carimba (o prato no 1), as orelhas do Pikachu espiam (o pícolo, 4), o Magikarp pula por cima de
    //     tudo (o apito de êmbolo sobe e desce, 5 a 15; as letras fazem a ola: o xilofone sobe com os metais) e o
    //     "ta-DÁ" com a toalha (12 e 14)
    mel(met, 1, [TEMA[1]]);
    mel(met2, 1, [TEMA[1]], { harm: thirdBelow(F), vel: 0.8 });
    mel(pc, 1, ['r:4 C7:1 A6:1 r:10'], { vel: 0.6 });
    pulo.note(16 + 5, 0, 0, 1);
    mel(xi, 1, ['r:7 F6:1 G6:1 A6:1 Bb6:1 B6:1 C7:1 r:3'], { vel: 0.6 });
    tl.note(16 + 14, 0, 0, 1.1);
    drum(cr, 1, 1, 'X.............X.');
    drum(kk, 1, 1, 'X...x...X...x.X.');
    drum(cl, 1, 1, '....X.......X...', { vel: 0.8 });
    drum(hh, 1, 1, 'x.x.x.x.xxxxx...', { vel: 0.7 });
    mel(bs, 1, ['G2:2 G1:1 r:1 C2:2 r:2 C2:1 D2:1 E2:1 r:1 F2:1 r:1 F1:2']);
    stabs(ep, 1, 'Gm7', [0, 2], { low: 55, n: 4, vel: 0.7 });
    stabs(ep, 1, 'C7', [4, 6, 8], { low: 55, n: 4, vel: 0.7 });
    stabs(ep, 1, 'F', [14], { low: 57, n: 4, len: 2, vel: 0.7 });

    // ---------- 2–18 · o dominó ----------
    // 2 · o vestiário: o Snorlax já dorme no banco (aplauso de abertura, o ronco, riso) e o Psyduck mexe no tripé
    entra(2, 'F7', { leve: true });
    zz.note(2 * 16 + 4, 0, 0, 1);
    risoC.note(2 * 16 + 7, 0, 0, 0.8);
    zz.note(2 * 16 + 12, 0, 0, 0.8);
    // 3 · FOTO DO TIME! (o grito do Psyduck no 1) e os metais respondem com a cabeça do tema
    groove(3, 'F7', { leve: true });
    mel(met, 3, ['r:8 C5:1 F5:1 A5:1 r:1 C6:4!']);
    mel(met2, 3, ['r:8 A4:1 C5:1 F5:1 r:1 A5:4']);
    drum(cr, 3, 1, '............x...', { vel: 0.5 });
    // 4 · o Magikarp pula na frente da lente (aplauso; o pícolo sobe, o PLOF no pouso, 6), estufa a medalha (8) e
    //     brilha (o sino, 10)
    entra(4, 'F7');
    mel(pc, 4, ['C6:1 D6:1 E6:1 F6:1 r:12'], { vel: 0.7 });
    plof.note(4 * 16 + 6, 72, 0, 1);
    sobe.note(4 * 16 + 8, 0, 0, 1);
    mel(sino, 4, ['r:10 C7:2 F7:4'], { vel: 0.8 });
    // 5 · foto 1: só a medalha
    foto(5, 'Bb7', risoC, 6);
    // 6 · o Psyduck segura a cabeça: a tuba desce meio tom por vez e a cabeça lateja junto
    drum(hh, 6, 1, 'x...x...x...x...', { vel: 0.5 });
    mel(tuba, 6, ['F2:4 E2:4 Eb2:4 D2:4'], { vel: 0.7 });
    drum(tum, 6, 1, 'x...x...x...x...');
    desce.note(6 * 16, 0, 0, 0.8);
    risoM.note(6 * 16 + 5, 0, 0, 1);
    // 7 · o Pikachu (aplauso, o pícolo) pula em cima do Magikarp (BOING e o plof amassado, 6) e o choquinho (zaps 10
    //     e 11) acerta a câmera (o bzzt e o tímpano, 12)
    entra(7, 'F7');
    sobe.note(7 * 16, 0, 0, 1);
    mel(pc, 7, ['r:2 F6:1 G6:1 A6:1 C7:1 r:10'], { vel: 0.7 });
    bo.note(7 * 16 + 6, 10, 0, 0.7);
    plof.note(7 * 16 + 6, 60, 0, 0.6);
    drum(zap, 7, 1, '..........xx....', { vel: 1 });
    choque.note(7 * 16 + 12, 0, 0, 1);
    drum(tp, 7, 1, '............X...');
    drum(cr, 7, 1, '............X...', { vel: 0.6 });
    // 8 · foto 2: queimada
    foto(8, 'Db7', risoM);
    drum(zap, 8, 1, '..x.....x.......', { vel: 0.5, pitch: -7 });
    // 9 · o Squirtle entra devagar, de óculos (aplauso; o meio-tempo e a frase dele na surdina, 0 a 7), apaga a câmera
    //     com o jato (7) e encharca o Pikachu; o vapor (9)
    drum(cr, 9, 1, 'X...............', { vel: 0.6 });
    aplauso.note(9 * 16, 0, 0, 0.8);
    drum(kk, 9, 1, 'X.......X.......');
    drum(sn, 9, 1, '....x.......x...', { vel: 0.6 });
    drum(hh, 9, 1, 'x...x...x...x...', { vel: 0.6 });
    mel(bs, 9, ['F2:4 r:3 Eb2:4 r:3 C2:2']);
    mel(mudo, 9, [`${SQUIRTLE} r:8`]);
    stabs(gt, 9, 'F7', [4, 12], { low: 60, n: 3, vel: 0.7 });
    mel(plof, 9, ['r:7 C5:2 G4:2 E4:2 C4:3']);
    vapor.note(9 * 16 + 9, 0, 0, 1);
    risoC.note(9 * 16 + 12, 0, 0, 0.9);
    // 10 · foto 3: o Pikachu encharcado, o Squirtle tranquilo
    foto(10, 'Bb7', risoG, 2);
    // 11 · a pose de descolado: os óculos descem (2, 6, 10; a surdina escorrega meio tom por vez) e o Ditto, no
    //      banco, se encanta (o sino, 12)
    drum(hh, 11, 1, 'x...x...x...x...', { vel: 0.5 });
    drum(cl, 11, 1, '....x.......x...', { vel: 0.5 });
    mel(mudo, 11, ['F5:2 E5:4 Eb5:4 D5:2 r:4'], { vel: 0.8 });
    mel(bs, 11, ['F2:2 E2:4 Eb2:4 D2:6'], { vel: 0.8 });
    mel(sino, 11, ['r:12 A6:1 C7:1 F7:2'], { vel: 0.8 });
    // 12 · EU TAMBÉM! (o grito no 1), o BOING do Ditto e o POOF (6): um Squirtle idêntico, e o kazoo copia a frase do
    //      Squirtle (7); o de verdade vira (10) e fica bravo (o metal grave, 13)
    groove(12, 'F7', { leve: true });
    bo.note(12 * 16 + 6, -2, 0, 1);
    poof.note(12 * 16 + 6, 0, 0, 0.9);
    mel(kz, 12, [`r:7 ${SQUIRTLE} r:1`]);
    mel(met2, 12, ['r:13 C3+Gb3:2 r:1'], { vel: 0.9 });
    risoC.note(12 * 16 + 10, 0, 0, 0.9);
    // 13 · a briga: os dois Squirtles discutem (a frase na surdina, o kazoo responde; o tímpano em cada empurrão), o
    //      Pikachu pula (8), o Magikarp vem (o plof, 10) e vira a nuvem de poeira (o prato e o rufo)
    groove(13, 'F7');
    mel(mudo, 13, ['r:2 C5:1 Eb5:1 r:2 F5:1 Eb5:1 r:8']);
    mel(kz, 13, ['r:4 C5:1 Eb5:1 r:2 F5:1 Eb5:1 r:6']);
    mel(pc, 13, ['r:8 C6:1 F6:1 A6:1 r:5'], { vel: 0.7 });
    plof.note(13 * 16 + 10, 67, 0, 0.9);
    drum(tp, 13, 1, '..X...X...X.X...');
    drum(cr, 13, 1, '..........X.....', { vel: 0.7 });
    drum(sn, 13, 1, '..........xxxxXX', { vel: 0.6 });
    risoM.note(13 * 16 + 11, 0, 0, 1);
    // 14 · foto 4: dois Squirtles se encarando
    foto(14, 'Db7', risoG);
    // 15 · CALMA, GENTE… (aplauso; o Jigglypuff pula no banco e pousa no BOING pequeno, 4; o grito, 5); a briga ainda
    //      bate na nuvem (2, 6, 10, 13); o piano doce, e a caixinha de música puxa a canção (12)
    drum(cr, 15, 1, 'X...............', { vel: 0.6 });
    aplauso.note(15 * 16, 0, 0, 0.8);
    boP.note(15 * 16 + 4, 10, 0, 0.9);
    drum(tp, 15, 1, '..x...x...x..x..', { vel: 0.5 });
    drum(sn, 15, 1, '..x...x...x..x..', { vel: 0.4 });
    drum(hh, 15, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.35 });
    mel(bs, 15, ['F2:4 r:4 C2:4 r:4'], { vel: 0.7 });
    stabs(ep, 15, 'F', [6], { low: 60, n: 4, len: 4, vel: 0.8 });
    stabs(ep, 15, 'Bbmaj7', [10], { low: 58, n: 4, len: 6, vel: 0.7 });
    mel(cx, 15, ['r:12 C5:2 F5:2']);
    // 16 · a canção de ninar (a caixinha, com o pícolo baixinho) e a banda dorme junto: o baixo despenca (1) e cada um
    //      cai no sono num "fiuu" mais grave (2 a 5); um ronco (6). Na 10 ele percebe que ninguém ouviu: o tímpano e o
    //      metal bravo
    mel(cx, 16, ['A5:3 G5:1 F5:2 C6:2 A5:2 r:6']);
    mel(pc, 16, ['A5:3 G5:1 F5:2 C6:2 A5:2 r:6'], { vel: 0.25 });
    stabs(ep, 16, 'F', [0], { low: 57, n: 4, len: 6, vel: 0.5 });
    stabs(ep, 16, 'Bbmaj7', [6], { low: 58, n: 4, len: 4, vel: 0.45 });
    drum(kk, 16, 1, 'x...............', { vel: 0.6 });
    despenca.note(16 * 16 + 1, 0, 0, 1);
    for (const [linha, tom] of [
        [2, 0],
        [3, -3],
        [4, -6],
        [5, -10],
    ])
        dorme.note(16 * 16 + linha, tom, 0, 1);
    zz.note(16 * 16 + 6, 0, 0, 0.7);
    drum(tp, 16, 1, '..........X.X...');
    stabs(met, 16, 'Db7', [10], { low: 55, n: 4, len: 3 });
    stabs(met2, 16, 'Db7', [12], { low: 52, n: 4, len: 3, vel: 0.8 });
    risoC.note(16 * 16 + 12, 0, 0, 0.9);
    // 17 · punch-in no Jigglypuff, que incha de raiva: a bexiga enchendo e tremendo (0 a 11), a canção de ninar em
    //      menor nos metais graves e o tímpano rufando; a chaleira apita (9) e ele bufa: HMPF! (12). Eles seguem
    //      roncando (13) e a plateia explode
    inc.note(17 * 16, 0, 0, 1);
    mel(met2, 17, ['Ab3:3 G3:1 F3:2 C4:2 Ab3:2 r:6'], { vel: 0.9 });
    mel(tuba, 17, ['F2:3 r:1 F2:2 F2:2 F2:2 r:6'], { vel: 0.45 });
    drum(tp, 17, 1, 'o.o.o.x.xxxX....', { vel: 0.5 });
    ch.note(17 * 16 + 9, 0, 0, 1);
    hmpf.note(17 * 16 + 12, 0, 0, 1);
    drum(kk, 17, 1, '............X...');
    drum(cr, 17, 1, '............x...', { vel: 0.6 });
    stabs(met, 17, 'Db7', [12], { low: 49, n: 3, len: 1 });
    zz.note(17 * 16 + 13, 0, 0, 0.6);
    risoG.note(17 * 16 + 13, 0, 0, 1);
    // 18 · foto 5: todo mundo dormindo, o Jigglypuff bravo
    foto(18, 'Db7', risoM);
    zz.note(18 * 16 + 8, 0, 0, 0.7);

    // ---------- 19–21 · o timer ----------
    // 19 · o Psyduck aperta (o bip, 2) e corre (o bloco a mil, 4 a 7); os bips do 3 (Dó, 4) e do 2 (Ré, 8) acordam
    //      todo mundo: a banda acorda num estalo (o prato, o apito subindo, o funk), e a caixa sobe até o 20
    mel(bip, 19, ['r:2 A5:1 r:1 C6:2 r:2 D6:2 r:6']);
    drum(bl, 19, 1, '....xxxx........', { vel: 0.7, pitch: 7 });
    drum(cr, 19, 1, '........X.......');
    sobe.note(19 * 16 + 8, 0, 0, 1);
    drum(kk, 19, 1, '........X.x..x..');
    drum(sn, 19, 1, '............xxXX', { vel: 0.8 });
    drum(hh, 19, 1, '........x.xx.x.x', { vel: 0.9 });
    mel(bs, 19, ['F2:2 r:6 F2:1 F3:1 r:1 C3:1 A2:1 F2:1 C2:2']);
    stabs(met, 19, 'F', [8], { low: 60, n: 3, len: 2 });
    stabs(gt, 19, 'F7', [10, 14], { low: 60, n: 3 });
    risoC.note(19 * 16 + 11, 0, 0, 0.7);
    // 20 · NÃO TÁ FALTANDO NINGUÉM, NÉ? (o grito do capitão no 1): o tímpano rufando baixinho, o Dó no baixo e, lá no
    //      fundo, a tuba do Slowpoke entrando atrasada (ninguém percebe)
    drum(tp, 20, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.4 });
    mel(bs, 20, ['C2:16'], { vel: 0.6 });
    padChord(ep, 20, 'C7', 16, { low: 55, n: 4, vel: 0.35 });
    mel(tuba, 20, [SLOWPOKE], { vel: 0.4 });
    // 21 · todos se olham (o bloco e o xilofone perguntando, 1, 3, 5), NÃO! (a banda inteira, 8), o bip do 1 (Mi, 12)
    //      e as poses: o Ré7 leva pra Sol
    drum(bl, 21, 1, '.x.x.x..........', { vel: 0.8 });
    mel(xi, 21, ['r:1 C6:1 r:1 E6:1 r:1 G6:1 r:10'], { vel: 0.7 });
    drum(cr, 21, 1, '........X.......');
    drum(kk, 21, 1, '........X.......');
    drum(sn, 21, 1, '........X...xxXX', { vel: 0.8 });
    stabs(met, 21, 'F', [8], { low: 60, n: 4, len: 2 });
    stabs(met2, 21, 'F', [8], { low: 53, n: 4, len: 2, vel: 0.8 });
    mel(bs, 21, ['r:8 F2:2 r:2 D2:2 A2:1 C3:1']);
    risoC.note(21 * 16 + 9, 0, 0, 0.8);
    mel(bip, 21, ['r:12 E6:2 r:2']);
    mel(met, 21, ['r:13 C5:1 D5:1 F#5:1']);
    mel(met2, 21, ['r:13 A4:1 A4:1 C5:1'], { vel: 0.8 });

    // ---------- 22–26 · a FOTO FINAL e a tela final (Sol) ----------
    // 22 · o clique (no 1), FLASH: o "tan-tan-TAAN" (a cabeça do tema) e as cordas abrem quentes; "awww" (6), o
    //      sininho, e o aplauso (12)
    clique.note(22 * 16, 0, 0, 1);
    drum(tp, 22, 1, 'x.x.X...........');
    drum(kk, 22, 1, 'X.X.X...........');
    drum(cr, 22, 1, '....X...........');
    mel(bs, 22, ['D2:1 r:1 D2:1 r:1 G1:8 r:4']);
    mel(met, 22, ['D5:1 r:1 G5:1 r:1 B5:8 r:4']);
    mel(met2, 22, ['B4:1 r:1 D5:1 r:1 G5:8 r:4'], { vel: 0.8 });
    stabs(ep, 22, 'G', [4], { low: 55, n: 4, len: 12, vel: 0.8 });
    padChord(cor, 22, 'Gmaj7', 12, { low: 55, n: 4, at: 4, vel: 0.7 });
    mel(sino, 22, ['r:8 D7:1 G7:1 B7:2 r:4'], { vel: 0.5 });
    aww.note(22 * 16 + 6, 0, 0, 1);
    aplauso.note(22 * 16 + 12, 0, 0, 1);
    padChord(cor, 23, 'Cmaj7', 8, { low: 55, n: 4, vel: 0.6 });
    padChord(ep, 23, 'Cmaj7', 8, { low: 55, n: 4, vel: 0.35 });
    // 23½ · a tela final: SOC-CER-MON em Sol na piscada do logo (8, 11, 14) e as palmas respondem (24: 4 e 6); o
    //       tema volta curto (a cabeça dele, 24: 0 a 4) e fecha no "DÁ" com a toalha (6)
    drum(cr, 23, 1, '........X.......');
    drum(kk, 23, 1, '........X...x...');
    drum(hh, 23, 1, '........x.x.x.x.', { vel: 0.8 });
    mel(bs, 23, ['r:8 G2:2 G3:2 D2:2 D3:2']);
    stabs(gt, 23, 'G', [10, 14], { low: 60, n: 3 });
    gancho(met, 23 * 16 + 8, 67);
    gancho(met2, 23 * 16 + 8, 67 - 12, 0.7);
    gancho(pc, 23 * 16 + 8, 79, 0.4);
    mel(met, 24, ['D5:1 G5:1 B5:2 A5:1 r:1 G5+B5+D6:2! r:8']);
    mel(xi, 24, ['D6:1 G6:1 B6:2 A6:1 r:1 G6:2 r:8'], { vel: 0.6 });
    drum(cl, 24, 1, '....x.x.........', { vel: 0.9 });
    drum(kk, 24, 1, 'X.....X.........');
    drum(hh, 24, 1, 'x.x.x...........', { vel: 0.8 });
    drum(cr, 24, 1, '......X.........', { vel: 0.7 });
    tl.note(24 * 16 + 6, 0, 0, 1.1);
    mel(bs, 24, ['G2:1 r:1 G2:1 r:1 D2:1 r:1 G1:2 r:8']);
    stabs(ep, 24, 'G', [6], { low: 55, n: 4, len: 2 });
    // 24½–26 · silêncio: o Slowpoke entra DEVAGAR (a tuba dele, atrasada: Sol, Si, Ré) e para no meio (25, 8); grilo.
    //          …JÁ TIRARAM? (26, 2), a plateia explode (5) e a tuba termina o motivo, atrasada (o Fá, 13); o vídeo acaba
    //          no meio da risada
    mel(tuba, 24, ['r:10 G2:4 r:2'], { vel: 0.35 });
    mel(tuba, 25, ['B2:4 D3:4 r:8'], { vel: 0.32 });
    grilo.note(25 * 16 + 8, 0, 0, 0.8);
    risoG.note(26 * 16 + 5, 0, 0, 1);
    mel(tuba, 26, ['r:13 F3:3'], { vel: 0.6 });

    // Os picos (bumbo, prato e clique juntos) ficavam 13,6 dB acima do volume e o loudnorm do preparar.mjs só fica
    // linear até 13: sem isto ele vira compressor e abaixa a abertura 1,7 dB. Joelho suave a −5 dB do pico (~−1 dB).
    const render = S.render.bind(S);
    S.render = (o) => {
        const out = render(o);
        let pk = 1e-9;
        for (const c of out) for (const v of c) pk = Math.max(pk, Math.abs(v));
        const th = 0.55 * pk;
        for (const c of out)
            for (let i = 0; i < c.length; i++) {
                const a = Math.abs(c[i]);
                if (a > th) c[i] = Math.sign(c[i]) * (th + (pk - th) * Math.tanh((a - th) / (pk - th)));
            }
        return out;
    };
    return S;
}
