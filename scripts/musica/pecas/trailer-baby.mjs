// Trailerzinho da 0.9.15 (Rota de baby), 9:16. Mesma banda do trailer 2 v3 (trailer-abertura.mjs: bumbo, estalo,
// subidas, impactos, serras largas, clap 808), composta em cima do corte. 178 BPM, compasso 1,3483 s; o vídeo começa
// na linha 0 do compasso 0. A história é o SOC-CER-MON: o Magikarp pula o gancho fraquinho, evolui, e o Gyarados
// toca o mesmo gancho com a banda inteira.
// Compasso: plano do vídeo → música
//   0    Magikarp capitão entra pulando na quadra: um pulo em cada nota do gancho (linhas 0, 3, 6), a banda bate junto
//        no bumbo e no baixo, o lead é uma quadrada fininha (o Magikarp); na linha 8 o SPLASH!: a banda sai, um apito de
//        êmbolo sobe com o pulo, e ele cai de volta com uma bolha (nada aconteceu)
//   1    corte seco pra tela de evolução: Lá7sus4 → Lá7, rufar de colcheia pra semicolcheia, subida e o baixo subindo
//        pelo cromático; a última meia batida em silêncio (o clarão branco)
//   2    GYARADOS: impacto, prato, e o gancho em Ré com a banda inteira (metais, dupla larga, clap "hey hey")
//   3–4  ROTA DE BABY, as cartas: o refrão da Abertura em Ré, uma carta virando a cada 2 batidas (o FLIP do Draft)
// (rascunho de 23/10: só até o compasso 4; o resto do roteiro entra depois do ok do Miguel no tom)

import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';
import { FLIP } from './draft.mjs';
import { bolha } from './lider-koga.mjs';
import { bumbo, desafina, estalo, impacto, MEIO, SERRA, SUB, SUPER, subida } from './trailer-abertura.mjs';

export const meta = { titulo: 'Trailer da Rota de baby (rascunho)', tela: 'Trailer', lufs: -14 };

export default function trailerBaby() {
    const S = new Song({ bpm: 178, bars: 5, swing: 0.06, tail: 1.2 });
    const BATIDA = 60 / 178;
    const BOMBA = new Set([2, 3, 4]);
    const bomba =
        (fundo = 0.3) =>
        (t) =>
            BOMBA.has(Math.floor(t / S.barSec))
                ? 1 - fundo * (1 - Math.exp(-(t % BATIDA) / 0.004)) * Math.exp(-(t % BATIDA) / 0.07)
                : 1;
    const par = (nome, inst, { abre = 1, cents = 0.08, ...o }) =>
        [-1, 1].map((l) =>
            desafina(
                S.part(`${nome} ${l < 0 ? 'E' : 'D'}`, inst, { ...o, pan: abre * l }),
                cents * l,
                l > 0 ? 0.12 : 0,
            ),
        );
    const nos = (pr, fn) => {
        for (const P of pr) fn(P);
    };

    const lead = S.part('lead', I.lead, {
        pan: -0.1,
        gain: 0.9,
        echo: { rows: 3, fb: 0.25, mix: 0.18 },
        rev: 0.08,
        corte: 8000,
    });
    const fino = S.part('magikarp', I.thin, {
        gain: 0.55,
        echo: { rows: 3, fb: 0.2, mix: 0.2 },
        rev: 0.15,
        corte: 7000,
    });
    const largo = par('lead largo', SERRA, { gain: 1.4, cents: 0.07, rev: 0.12, corte: 9000 });
    const brilho = S.part('brilho', I.pulse, { gain: 0.35, rev: 0.15, corte: 9000 });
    const harm = S.part('terças', I.pulse, { pan: 0.25, gain: 0.5, corte: 7000 });
    const counter = S.part('contracanto', I.counter, { pan: -0.35, gain: 0.7 });
    const bs = S.part('baixo', I.slap, { gain: 0.75 });
    const sub = S.part('sub', SUB, { gain: 0.45, gainAt: bomba(0.35) });
    const st = S.part('acordes', I.stab, { pan: 0.3, gain: 0.85 });
    const meio = par('meio', MEIO, { gain: 1.3, cents: 0.1, rev: 0.1, corte: 6500 });
    const meioAc = (bar, sym, rows, vel = 1) => nos(meio, (P) => stabs(P, bar, sym, rows, { low: 72, len: 2, vel }));
    const ar = S.part('arpejo', I.arp, { pan: 0.55, gain: 0.7, echo: { rows: 2, fb: 0.2, mix: 0.25 }, corte: 7000 });
    const pad = S.part('pad', I.pad, { gain: 0.6 });
    const sup = par('pad largo', SUPER, { gain: 0.6, cents: 0.12, rev: 0.2, corte: 8000, gainAt: bomba() });
    const horns = S.part('metais', I.brass, { pan: 0.2, gain: 0.8, rev: 0.15 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 2, rev: 0.25 });
    const flip = S.part('carta', FLIP, { drum: true, pan: -0.2, gain: 1.4 });
    const bo = S.part('bolha', bolha, { drum: true, pan: -0.15, gain: 0.9, rev: 0.3 });
    const apito = S.part('apito', I.whistle, { gain: 0.5, rev: 0.25 });
    const k = S.part('bumbo', bumbo(), { drum: true, gain: 1.4 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const est = S.part('estalo', estalo(), { drum: true, gain: 2.8, rev: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 1.3 });
    const oh = S.part('chimbal aberto', I.ohat, { drum: true, pan: -0.3, gain: 1 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.45, gain: 0.8 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2, gain: 0.8 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.8 });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const imp = S.part('impacto', impacto(), { drum: true, gain: 1.1, rev: 0.25 });
    const sobe = S.part('subida', subida(BATIDA * 3.5), { drum: true, gain: 0.6, rev: 0.2 });
    const clap = I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 });
    const cl = S.part('clap', clap, { drum: true, gain: 1.2 });
    const cl2 = S.part('clap2', clap.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.4, gain: 0.9 });
    const hey = (bar, pat = GANCHO.palmas, vel = 1.2) => {
        drum(cl, bar, 1, pat, { vel });
        drum(cl2, bar, 1, pat, { vel });
    };
    const em = (P, bar, row, vel = 1) => P.note(bar * 16 + row, 0, 0, vel);
    const REMAJ = thirdBelow(MAJOR(2));
    const FUNK = '0:2 8:1~ 0:1 r:1 5:1 8:2 0:1 r:1 8:1~ s:2 5:1 3:2';
    const STAB = [3, 6, [10, 2], 14];
    const kit = (bar, n, kick = 'X...X...X...X...') => {
        drum(k, bar, n, kick);
        drum(sn, bar, n, '....X..o.o..X..o');
        drum(est, bar, n, '....X.......X...');
        drum(cl, bar, n, '....x.......x...', { vel: 0.85 });
        drum(hh, bar, n, 'x.xxx.xxx.xxx.xx', { vel: 0.9 });
        drum(oh, bar, n, '..x...x...x...x.');
        drum(sh, bar, n, 'x.o.x.o.x.o.x.o.');
    };

    // 0: o Magikarp pula o SOC-CER-MON (linhas 0, 3, 6); a banda bate junto. SPLASH! na linha 8
    const hookRe = GANCHO.em({ tom: 2 }); // A5 F#5 D6
    mel(fino, 0, ['A5:3 F#5:3 D6:2 r:8']);
    for (const [r, p] of [
        [0, 0],
        [3, -3],
        [6, 5],
    ])
        bo.note(r, p, 0, 0.9);
    drum(k, 0, 1, 'X..X..X.........');
    drum(est, 0, 1, 'x..x..X.........', { vel: 0.7 });
    drum(ti, 0, 1, 'X..x..X.........');
    bass(bs, 0, 'D', '0:3 0:3 8:2 r:8');
    bass(sub, 0, 'D', '0:3 0:3 0:2 r:8');
    stabs(
        st,
        0,
        'D',
        [
            [0, 1],
            [3, 1],
            [6, 2],
        ],
        { vel: 0.9 },
    );
    drum(cr, 0, 1, 'x...............', { vel: 0.4 });
    // SPLASH!: o pulo grande (apito subindo), e ele cai de volta na linha 14 com uma bolha grave; silêncio depois
    apito.note(8, 74, 4, 0.9);
    bo.note(14, -10, 0, 1);
    drum(tm, 0, 1, '..............x.', { pitch: -6 });

    // 1: a tela de evolução. Lá7sus4 → Lá7; o rufar acelera e a subida leva até o clarão (linha 14); 14–15 em silêncio
    em(imp, 1, 0, 0.45);
    padChord(pad, 1, 'A7sus4', 8, { vel: 0.9 });
    padChord(pad, 1, 'A7', 6, { at: 8, vel: 1.1 });
    nos(sup, (P) => {
        padChord(P, 1, 'A7sus4', 8, { low: 57, n: 4, vel: 0.8 });
        padChord(P, 1, 'A7', 6, { at: 8, low: 57, n: 4 });
    });
    bass(bs, 1, 'A7', '0:2 0:2 0:2 0:2 3:1 3:1 5:1 5:1 s:1 s:1 r:2');
    bass(sub, 1, 'A7', '0:14 r:2');
    mel(lead, 1, ['r:4 A4:2 B4:2 C#5:2 D5:2 E5:1 F#5:1 r:2']);
    mel(horns, 1, ['r:8 A4+C#5+E5+G5:6 r:2'], { vel: 0.8 });
    drum(sn, 1, 1, 'x.x.x.x.xxxxXX..', { vel: 0.85 });
    drum(est, 1, 1, '........x.x.xX..', { vel: 0.7 });
    drum(ti, 1, 1, 'X.......x.x.xx..');
    drum(k, 1, 1, 'X...........X...');
    em(sobe, 1, 0, 0.8); // 3,5 batidas: acaba na linha 14

    // 2: GYARADOS. O gancho em Ré com a banda inteira; a torcida responde "hey hey"
    em(imp, 2, 0);
    drum(cr, 2, 1, 'X.....X.........');
    mel(lead, 2, [hookRe]);
    nos(largo, (P) => mel(P, 2, [hookRe], { vel: 0.8 }));
    mel(brilho, 2, [hookRe], { shift: 12, vel: 0.5 });
    mel(harm, 2, [hookRe], { harm: REMAJ, vel: 0.7 });
    mel(horns, 2, [GANCHO.em({ tom: 2, oitava: -1 })], { vel: 0.9 });
    stabs(
        st,
        2,
        'D',
        [
            [0, 2],
            [3, 2],
            [6, 6],
        ],
        { vel: 1.1 },
    );
    meioAc(2, 'D', [0, 3, 6], 1.1);
    bass(bs, 2, 'D', '0:3 0:3 8:6 5:2 s:2');
    bass(sub, 2, 'D', '0:3 0:3 0:10');
    nos(sup, (P) => padChord(P, 2, 'D', 16, { low: 57, n: 4 }));
    drum(k, 2, 1, 'X..X..X...X.X.X.');
    drum(ti, 2, 1, 'X..x..X.........');
    drum(sn, 2, 1, '............xxXX', { vel: 0.9 });
    hey(2);

    // 3–4: ROTA DE BABY. O refrão da Abertura em Ré; uma carta virando a cada 2 batidas (linhas 0 e 8)
    const REFRAO = ['C6:2 C6:2 A5:2 C6:4 A5:2 G5:2 F5:2', 'D6:2 D6:2 B5:2 D6:4 B5:2 A5:2 G5:2'];
    mel(lead, 3, REFRAO, { shift: 2 });
    nos(largo, (P) => mel(P, 3, REFRAO, { shift: 2 }));
    mel(brilho, 3, REFRAO, { shift: 14, vel: 0.6 });
    mel(harm, 3, REFRAO, { shift: 2, harm: REMAJ });
    mel(horns, 3, ['r:12 F#5:1 A5:1 D6:2', 'r:12 G5:1 B5:1 E6:2']);
    mel(counter, 3, ['B4:8 D5:8', 'C#5:8 E5:8'], { vel: 0.8 });
    ['G', 'A'].forEach((c, i) => {
        bass(bs, 3 + i, c, FUNK);
        bass(sub, 3 + i, c, '0:16');
        stabs(st, 3 + i, c, STAB);
        meioAc(3 + i, c, STAB);
        arp(ar, 3 + i, c, { low: 67, step: 1 });
        padChord(pad, 3 + i, c, 16, { vel: 0.6 });
        nos(sup, (P) => padChord(P, 3 + i, c, 16, { low: 59, n: 4 }));
    });
    kit(3, 2);
    drum(cr, 3, 1, 'X...............');
    drum(flip, 3, 2, 'x.......x.......');
    mel(sino, 3, ['D7:8 B6:8', 'C#7:8 E7:8'], { vel: 0.6 });
    hey(4);
    return S;
}
