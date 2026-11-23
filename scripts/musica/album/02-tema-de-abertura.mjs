// Faixa 2, "Tema de abertura", rodada 2 (16/11/2026). Retorno do Miguel: "muito prejudicado por essas palmas
// agressivas, ele é tão legal"; o baixo pode ser um contracanto de verdade; numa faixa de 3 min, variedade (seções,
// desenvolvimento, ponte, modulação). Gênero: samba-funk com metais (o som da casa), agora com seções de outro clima.
// A melodia, a ponte e o refrão são os da `abertura-gancho` (a Home aprovada); o arranjo é novo e escrito aqui (a peça
// do jogo não muda).
// O que mudou: as palmas da torcida (I.palmas a +12 dB, no 2 e no 4 o tempo todo) saíram; o "hey hey" virou o clap
// 808 macio, só nas respostas do gancho. Bateria com corpo num barramento comprimido e o baixo abaixando a cada bumbo
// (punch). O baixo vira o "Paul": no A' e no A final ele canta por baixo, com notas de passagem e aproximação
// cromática (Si♭ de passagem no Dó, Dó# subindo pro Ré menor, Lá♭ e Ré♭ caindo de cima). Metais de verdade (trompete
// e trombone) respondendo.
// Forma (136 BPM, Dó maior): intro (4) | A (8) só com o aro e o chimbal | A' (8) com o baixo cantando e corte seco no
// fim | ponte (8): os emprestados (Si♭maj7, Lá♭maj7) com as cordas descendo as sétimas (Mi Ré Dó Si Lá Sol Sol Fá) |
// breque | refrão (8) | etiqueta do gancho (8) | MUDA O CLIMA: bossa em Mi♭ (8, o ♭III, sem aviso), meio-tempo,
// Rhodes e o trompete cantando o A em aumentação, com o Ré♭9 (o ♭VII do Mi♭) | batucada (4): surdo e tamborim
// crescendo no Sol (o V de Dó) | duelo (8): o chip e o trompete trocando de 2 em 2 compassos no Dó–Lá7–Rém7–Sol7, e
// o último vira Lá7 (o V de Ré) | refrão em Ré (8, sobe um tom) com o Fá#7 (dominante secundária, a 9ª aumentada no
// lead) | A final em Ré (8) com tudo | etiqueta (4) | final: o SOC-CER-MON da banda inteira em Si♭–Dó–Ré (♭VI–♭VII–I)
// e o Ré com nona. ~2:35.
// Rodada 3 (17/11/2026): "tá ótima", mas falta UM elemento que a destaque. Entrou O APITO DO MESTRE DE BATERIA (o
// apito de juiz da "Quadra vazia", com a bolinha trinando, afinado em Dó e Mi): ele chama a banda na introdução,
// comanda a batucada, e antes da subida de tom faz a PARADINHA de escola de samba (4 compassos novos no Lá7, o V do
// Ré): o mestre apita, a bateria responde no SOC-CER-MON, o apito de novo, a bateria dobra, a banda inteira some por
// meio compasso com o apito longo sozinho, e o SOC-CER-MON da banda joga o refrão em Ré. No fim, o apito fecha o
// desfile. O resto ficou como estava (só desceu 4 compassos). ~2:42.
// Rodada 5 (23/11/2026): "ficou melhor sem o clap, mas aí começou a faltar algo". O que faltava era quem segura o
// contratempo entre a caixa e o chimbal (o clap fazia isso). Sem voltar o clap, entra a COZINHA DO SAMBA: o PANDEIRO
// (a platinela em semicolcheias, acentuando os tempos, e o tapa no partido-alto: no 2, no "e" do 2 e no 4) em todo
// groove, e a CUÍCA, a voz da escola, que responde "uí-óm" no fim das frases do A seco, do refrão e da etiqueta e
// ri na paradinha. No A seco (sem caixa) o pandeiro é o que segura; na bossa ele sai.
import { apito } from '../pecas/livre-ginasio.mjs';
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import {
    aro,
    BATERIA,
    baixoDedo,
    bombeio,
    bumbo,
    caixa,
    clapMacio,
    rhodes,
    surdo,
    tamborim,
    trombone,
    trompete,
} from './kit.mjs';
import { cuica, pandeiro } from './kit-novas.mjs';

export const meta = { titulo: 'Tema de abertura', faixa: 2 };

const A_CH = ['C', 'Am7', 'Fmaj7', 'G7', 'C', 'Am7', 'Dm7', 'G7'];
const A_MEL = [
    'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
    'E5:3 C5:3 A4:2 r:2 C5:2 E5:2 G5:2',
    'A5:3 G5:3 F5:2 E5:2 C5:2 A4:2 C5:2',
    'D5:6 r:2 B4:2 C5:2 D5:2 F5:2',
    'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
    'E5:3 G5:3 A5:2 r:2 G5:2 E5:2 C5:2',
    'D5:3 F5:3 A5:2 G5:2 F5:2 E5:2 D5:2',
    'B4:2 C5:2 D5:2 G5:6 r:4',
];
const A_COUNTER = [
    'G4:6 E4:2 G4:8',
    'A4:6 G4:2 E4:8',
    'F4:6 A4:2 C5:8',
    'B4:8 G4:4 F4:4',
    'E4:6 G4:2 C5:8',
    'C5:6 A4:2 E4:8',
    'F4:6 A4:2 C5:8',
    'F4:8 G4:8',
];
// o baixo que canta (A' e A final): responde nas pausas da melodia, passagem e aproximação cromática
const A_BAIXO = [
    'C2:3 C3:1 r:2 G2:2 E2:2 G2:1 A2:1 B2:2 C3:2',
    'A1:3 A2:1 r:2 E2:2 G2:3 A2:1 C3:2 E3:2',
    'F2:3 F2:1 r:2 A2:2 C3:2 E3:2 D3:2 Ab2:2',
    'G2:3 G2:1 r:2 D3:2 F3:2 D3:2 B2:2 Db3:2',
    'C2:3 C3:1 r:2 G2:2 Bb2:2 A2:2 G2:2 E2:2',
    'A1:3 A2:1 r:2 E2:2 A2:2 B2:2 C3:2 C#3:2',
    'D2:3 D3:1 r:2 A2:2 F2:2 A2:2 C3:2 D3:2',
    'G2:3 G2:1 A2:2 B2:2 C3:2 D3:2 E3:2 F3:2',
];
const B_CH = ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Bbmaj7', 'Am7', 'Abmaj7', 'G7'];
const B_MEL = [
    'A5:6 G5:2 E5:8',
    'G5:6 F5:2 D5:8',
    'F5:6 E5:2 C5:8',
    'E5:4 D5:4 B4:8',
    'D5:6 F5:2 A5:8',
    'G5:4 E5:4 C5:4 E5:4',
    'Eb5:6 G5:2 C6:8',
    'B5:4 A5:2 G5:2 F5:2 E5:2 D5:2 B4:2',
];
const C_CH = ['F', 'G', 'Em7', 'Am7', 'Dm7', 'G7', 'C', 'C'];
const C_MEL = [
    'C6:2 C6:2 A5:2 C6:4 A5:2 G5:2 F5:2',
    'D6:2 D6:2 B5:2 D6:4 B5:2 A5:2 G5:2',
    'E6:3 D6:3 B5:2 G5:4 E5:4',
    'A5:3 G5:3 E5:2 C5:2 E5:2 G5:2 A5:2',
    'F5:2 F5:2 A5:2 C6:4 A5:2 F5:2 A5:2',
    'G5:2 G5:2 B5:2 D6:4 C6:2 B5:2 G5:2',
    'C6:8 G5:4 E5:4',
    'C5:4 r:4 G4:2 A4:2 B4:2 D5:2',
];
// o refrão por baixo: o groove, e uma escalada no fim de cada meia frase
const C_BAIXO = [
    'F2:3 F3:1 r:2 C3:2 F2:2 A2:2 C3:2 Eb3:2',
    'G2:3 G3:1 r:2 D3:2 G2:2 B2:2 D3:2 F3:2',
    'E2:3 E3:1 r:2 B2:2 E2:2 G2:2 B2:2 G#2:2',
    'A2:3 A1:1 r:2 E2:2 G2:2 A2:2 B2:2 C3:2',
    'D2:3 D3:1 r:2 A2:2 D2:2 F2:2 A2:2 B2:2',
    'G2:3 G3:1 r:2 D3:2 F3:2 E3:2 D3:2 B2:2',
    'C2:3 C3:1 r:2 G2:2 C3:2 E3:2 G3:2 E3:2',
    'C3:4 r:4 G2:2 A2:2 B2:2 D3:2',
];
const GROOVE = '0:2 8:1~ 0:1 r:1 5:1 8:2 0:1 r:1 8:1~ s:2 5:1 3:2';
const STAB = [3, 6, [10, 2], 14];

export default function temaDeAbertura() {
    const S = new Song({ bpm: 136, bars: 90, swing: 0.15, tail: 4, barramentos: { bateria: BATERIA } });
    const k = S.part('bumbo', bumbo, { drum: true, bus: 'bateria', gain: 0.95 });
    const duck = bombeio(S, k, { prof: 0.28 });
    const sn = S.part('caixa', caixa, { drum: true, bus: 'bateria', gain: 0.75, rev: 0.06 });
    const tm = S.part('tom', I.tom, { drum: true, bus: 'bateria', gain: 0.8 });
    const ar = S.part('aro', aro, { drum: true, bus: 'bateria', pan: -0.15, gain: 0.45 });
    const su = S.part('surdo', surdo, { drum: true, bus: 'bateria', gain: 0.8 });
    const lead = S.part('lead', I.lead, { pan: -0.1, gain: 0.95, echo: { rows: 3, fb: 0.3, mix: 0.2 } });
    const harm = S.part('harm', I.pulse, { pan: 0.25, gain: 0.55 });
    const counter = S.part('counter', I.counter, { pan: -0.35, gain: 0.6 });
    const bs = baixoDedo(S, 'baixo', { gain: 0.55, gainAt: duck });
    const st = S.part('stab', I.stab, { pan: 0.3, gain: 0.8, corte: 3200, gainAt: duck });
    const arpe = S.part('arp', I.arp, { pan: 0.55, gain: 0.6, echo: { rows: 2, fb: 0.25, mix: 0.3 } });
    const pad = S.part('pad', I.pad, { gain: 0.7, gainAt: duck });
    const rh = rhodes(S, 'rhodes', { pan: 0.2, gain: 0.6, rev: 0.2, gainAt: duck });
    const tp = trompete(S, 'trompete', { pan: 0.2, gain: 0.75, rev: 0.18 });
    const tb = trombone(S, 'trombone', { pan: -0.2, gain: 0.7, rev: 0.15 });
    const cordas = S.part('cordas', I.strings, { pan: -0.25, gain: 0.8, rev: 0.25 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.7 });
    const oh = S.part('chimbalAberto', I.ohat, { drum: true, pan: 0.35, gain: 0.7 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.45, gain: 0.8 });
    const ag = S.part('agogo', I.agogo, { drum: true, pan: -0.25, gain: 0.8 });
    const tam = S.part('tamborim', tamborim, { drum: true, pan: 0.4, gain: 0.5 });
    const cr = S.part('prato', I.crash, { drum: true, pan: 0.2, gain: 0.75 });
    const cl = S.part('clap', clapMacio, { drum: true, pan: 0.1, gain: 0.9, rev: 0.1 });
    // a cozinha do samba (rodada 5): o pandeiro segura o contratempo, a cuíca responde
    const pl = S.part('platinela', pandeiro.platinela, { drum: true, pan: -0.3, gain: 0.9, rev: 0.08 });
    const tap = S.part('tapa', pandeiro.tapa, { drum: true, pan: -0.3, gain: 1, rev: 0.1 });
    const cu = S.part('cuica', cuica, { drum: true, pan: 0.45, gain: 0.8, rev: 0.18 });
    const pand = (b, n = 1, vel = 1) => {
        drum(pl, b, n, 'XoxoXoxoXoxoXoxo', { vel: 0.7 * vel });
        drum(tap, b, n, '....x..x....x...', { vel: 0.8 * vel });
    };
    /** A cuíca no fim do compasso: "uí-óm" (sobe e cai), na altura do acorde. */
    const uiOm = (b, p = 0, vel = 1) => {
        cu.note(b * 16 + 12, p + 3, 0, vel);
        cu.note(b * 16 + 14, p - 2, 0, 0.8 * vel);
    };
    // o apito do mestre (pitch 0 = Mi7; −4 = Dó7, −3 = Dó#7): curto e longo
    const fi = S.part('apito', apito(0.07), { drum: true, pan: 0.3, gain: 0.5, rev: 0.25 });
    const fiii = S.part('apitoLongo', apito(0.5), { drum: true, pan: 0.3, gain: 0.42, rev: 0.25 });

    const KICK = 'X.....x.X..x....';
    const SNARE = '.o..X..o.o.oX.oo';
    const HATS = 'xoxxoxoxxoxxoxox';
    const groove = (b, n, { hats = true, agogo = true, caixaCheia = true } = {}) => {
        drum(k, b, n, KICK);
        if (caixaCheia) drum(sn, b, n, SNARE);
        else drum(ar, b, n, '....x.......x...');
        if (hats) drum(hh, b, n, HATS);
        pand(b, n, caixaCheia ? 0.85 : 1);
        drum(sh, b, n, 'xoxoxoxoxoxoxoxo', { vel: hats ? 1 : 0.7 });
        if (agogo) {
            drum(ag, b, n, 'x...x.x.........');
            drum(ag, b, n, '..x.....x.x.x...', { pitch: -5 });
        }
    };
    const virada = (b, { forte = true } = {}) => {
        drum(sn, b, 1, forte ? '....X..o..xxXxXX' : '..........xxXx..');
        drum(tm, b, 1, '..........x.x...', { pitch: 5 });
        drum(tm, b, 1, '..............x.', { pitch: -2 });
    };
    const harmonia = (b, c, { arpejo = false, low = 64 } = {}) => {
        stabs(st, b, c, STAB);
        if (arpejo) arp(arpe, b, c, { low, step: 1 });
    };

    // ---------- intro (0-3): agogô, shaker e acordes; o gancho chama e o clap responde ----------
    ['C', 'C', 'Fmaj7', 'G7'].forEach((c, i) => {
        stabs(st, i, c, STAB, { vel: 0.8 });
        padChord(pad, i, c, 16, { vel: 0.6 });
    });
    drum(sh, 0, 4, 'xoxoxoxoxoxoxoxo');
    drum(ag, 0, 4, 'x...x.x.........');
    drum(ag, 0, 4, '..x.....x.x.x...', { pitch: -5 });
    mel(lead, 0, [GANCHO.bar, GANCHO.bar]);
    mel(tb, 0, [GANCHO.em({ oitava: -2 }), GANCHO.em({ oitava: -2 })], { vel: 0.8 });
    drum(cl, 0, 2, GANCHO.palmas, { vel: 0.8 });
    drum(k, 2, 2, 'X.......X.......');
    // o baixo entra subindo cromático (Mi, Fá, Fá#, Sol) pro A
    mel(bs, 3, ['G2:2 r:6 E2:2 F2:2 F#2:2 G2:2']);
    virada(3);
    // o mestre chama a banda: fi, fi, fiii (o 3-3-2 do SOC-CER-MON)
    drum(fi, 3, 1, 'X..X............', { pitch: -4 });
    drum(fiii, 3, 1, '......X.........');
    mel(lead, 3, ['r:8 G4:2 A4:2 B4:2 D5:2']);

    // ---------- A (4-11): seco, aro no lugar da caixa; A' (12-19): o baixo canta, contracanto e arpejo ----------
    for (const [b0, cheio] of [
        [4, false],
        [12, true],
    ]) {
        mel(lead, b0, A_MEL);
        A_CH.forEach((c, i) => {
            harmonia(b0 + i, c, { arpejo: cheio });
        });
        if (cheio) {
            mel(bs, b0, A_BAIXO);
            mel(counter, b0, A_COUNTER);
            groove(b0, 7);
            drum(cr, b0, 1, 'X...............');
        } else {
            for (const [i, c] of A_CH.entries()) bass(bs, b0 + i, c, GROOVE);
            groove(b0, 7, { caixaCheia: false, agogo: false });
            for (const [i, p] of [
                [1, 0],
                [3, -2],
                [5, 0],
            ])
                uiOm(b0 + i, p);
        }
        drum(oh, b0, 7, '..............x.');
    }
    drum(k, 11, 1, KICK);
    drum(ar, 11, 1, '....x.......x...');
    drum(sh, 11, 1, 'xoxoxoxoxoxoxoxo');
    pand(11);
    virada(11, { forte: false });
    // respostas dos metais nas pausas da melodia (o trompete em cima, o trombone uma oitava abaixo)
    for (const b0 of [12, 76]) {
        for (const [P, o] of [
            [tp, 0],
            [tb, -12],
        ]) {
            mel(P, b0 + 3, ['r:6 B5:1 D6:1 r:8'], { shift: o + (b0 === 76 ? 2 : 0) });
            mel(P, b0 + 7, ['r:12 G5:1 E5:1 C6:2'], { shift: o + (b0 === 76 ? 2 : 0) });
        }
    }
    // fim do A': corte seco no 4 (a banda inteira bate e para), só a caixa fala
    drum(k, 19, 1, 'X.....x.X...X...');
    drum(sn, 19, 1, '....X.......X.xx');
    drum(hh, 19, 1, 'xoxxoxoxxoxx....');
    stabs(st, 19, 'G7', [[12, 1]], { vel: 1.2 });
    drum(cr, 19, 1, '............X...');

    // ---------- ponte (20-27): os emprestados, meio-tempo, as cordas descendo pelas sétimas ----------
    B_CH.forEach((c, i) => {
        const b = 20 + i;
        bass(bs, b, c, i < 4 ? '0:8 5:4 8:4' : '0:3 8:1 r:2 5:2 0:1 r:1 8:2 s:2 5:2');
        padChord(rh, b, c, 16, { low: 55, n: 4, vel: 0.5 });
        if (i >= 4) arp(arpe, b, c, { low: 62, step: 2 });
        stabs(
            st,
            b,
            c,
            i < 4
                ? [
                      [0, 6],
                      [8, 6],
                  ]
                : STAB,
            { vel: i < 4 ? 0.5 : 0.9 },
        );
    });
    mel(lead, 20, B_MEL);
    mel(cordas, 20, ['E5:16', 'D5:16', 'C5:16', 'B4:16', 'A4:16', 'G4:16', 'G4:16', 'F4:8 G4:8']);
    mel(counter, 20, ['C4:16', 'B3:16', 'A3:16', 'G3:16', 'F3:16', 'E3:16', 'Eb3:16', 'D3:8 F3:8']);
    drum(k, 20, 4, 'X.......x.......');
    drum(ar, 20, 4, '........x.......');
    drum(sh, 20, 4, 'x.o.x.o.x.o.x.o.');
    groove(24, 3);
    for (const [b, m] of [
        [20, 'r:10 A4:2 G4:2 E4:2'],
        [22, 'r:10 F4:2 E4:2 C4:2'],
        [24, 'r:10 D4:2 F4:2 A4:2'],
    ])
        mel(tb, b, [m]);
    // breque: a banda para no 3; só o gancho de caixa e o tom chamam o refrão
    drum(k, 27, 1, 'X.......X.......');
    drum(sn, 27, 1, '........X..X..X.');
    drum(tm, 27, 1, '..........X..X..', { pitch: 3 });
    stabs(st, 27, 'G7', [[8, 1]], { vel: 1.2 });

    // ---------- refrão (28-35) ----------
    const refrao = (b0, s) => {
        C_CH.forEach((c0, i) => {
            const c = s && i === 2 ? transpose('E7', s) : transpose(c0, s);
            harmonia(b0 + i, c, { arpejo: true, low: 67 + s });
            padChord(pad, b0 + i, c, 16, { vel: 0.5 });
        });
        mel(bs, b0, C_BAIXO, { shift: s });
        groove(b0, 8);
        drum(oh, b0, 8, '......x.......x.');
        drum(cr, b0, 1, 'X...............');
        drum(cr, b0 + 4, 1, 'X...............');
        mel(lead, b0, C_MEL, { shift: s });
        mel(harm, b0, C_MEL.slice(0, 7).concat(['r:16']), { shift: s, harm: thirdBelow(MAJOR(s)) });
        // os metais seguram a guia por baixo do refrão
        mel(tb, b0, ['A3:16', 'B3:16', 'G3:16', 'C4:16', 'A3:16', 'B3:8 D4:8', 'E4:16', 'r:16'], {
            shift: s,
            vel: 0.7,
        });
        drum(cl, b0 + 2, 1, GANCHO.palmas, { vel: 0.8 });
        drum(cl, b0 + 6, 1, GANCHO.palmas, { vel: 0.8 });
        uiOm(b0 + 3, s - 2, 0.8);
        uiOm(b0 + 7, s, 0.9);
    };
    refrao(28, 0);

    // ---------- etiqueta do gancho (36-43): pergunta e resposta, subindo em sequência ----------
    const TAG_CH = ['C', 'C', 'Dm7', 'Dm7', 'Em7', 'Em7', 'Fmaj7', 'G7'];
    TAG_CH.forEach((c, i) => {
        bass(bs, 36 + i, c, GROOVE);
        stabs(st, 36 + i, c, STAB);
        padChord(pad, 36 + i, c, 16, { vel: 0.5 });
    });
    groove(36, 7);
    drum(cr, 36, 1, 'X...............');
    for (let g = 0; g < 3; g++) {
        const call = GANCHO.em({ grau: g });
        mel(lead, 36 + 2 * g, [call, 'r:16']);
        mel(harm, 36 + 2 * g, [call, 'r:16'], { harm: thirdBelow(MAJOR(0)) });
        mel(tp, 37 + 2 * g, [GANCHO.em({ grau: g })], { vel: 0.9 });
        mel(tb, 37 + 2 * g, [GANCHO.em({ grau: g, oitava: -1 })], { vel: 0.9 });
        drum(cl, 36 + 2 * g, 1, GANCHO.palmas, { vel: 0.8 });
    }
    mel(lead, 42, [GANCHO.em({ grau: 3 }), 'B5:3 G5:3 D6:2 F6:8']);
    mel(tp, 43, ['B5:3 G5:3 D6:2 F6:8']);
    mel(tb, 43, ['G4:3 B4:3 D5:2 F5:8']);
    // corte: a banda inteira some no meio do Sol7 (o Fá fica soando no trompete) e entra a bossa em Mi♭
    drum(k, 43, 1, 'X.....x.........');
    drum(sn, 43, 1, '....X...........');
    drum(hh, 43, 1, 'xoxxoxox........');

    // ---------- MUDA O CLIMA: bossa em Mi♭ (44-51), meio-tempo, o trompete canta o A em aumentação ----------
    const BOSSA_CH = ['Ebmaj7', 'Ebmaj7', 'Abmaj7', 'Db9', 'Gm7', 'C7b9', 'Fm9', 'Bb7sus4'];
    const BOSSA_TP = [
        'G5:4 G5:2 Bb5:6 G5:2 F5:2',
        'G5:12 r:4',
        'C6:4 C6:2 Eb6:6 C6:2 Bb5:2',
        'Ab5:8 F5:4 Eb5:4',
        'D5:3 F5:3 Bb5:2 A5:8',
        'Bb5:4 G5:4 E5:4 Db5:4',
        'C5:3 Eb5:3 Ab5:2 G5:8',
        'F5:4 Eb5:4 r:8',
    ];
    BOSSA_CH.forEach((c, i) => {
        const b = 44 + i;
        padChord(rh, b, c, 6, { low: 55, n: 4, vel: 0.6 });
        padChord(rh, b, c, 10, { low: 55, n: 4, vel: 0.42, at: 6 });
        bass(bs, b, c, '0:6 5:2 0:6 5:2', { vel: 0.8 });
        drum(ar, b, 1, 'x..x..x...x..x..', { vel: 0.7 });
        drum(sh, b, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.6 });
        drum(k, b, 1, 'X......x........', { vel: 0.7 });
    });
    mel(tp, 44, BOSSA_TP, { vel: 0.85 });
    mel(counter, 48, ['Bb4:16', 'Bb4:8 A4:8', 'Ab4:16', 'Ab4:8 G4:8']);
    mel(cordas, 44, ['Bb4:16', 'Bb4:16', 'C5:16', 'Cb5:16'], { vel: 0.7 });

    // ---------- batucada (52-55): surdo e tamborim crescendo no Sol (o V de Dó) ----------
    for (let i = 0; i < 4; i++) {
        const b = 52 + i;
        drum(su, b, 1, i < 2 ? 'X.......X.......' : 'X...X...X...X...', { vel: 0.7 + 0.1 * i });
        drum(tam, b, 1, i < 1 ? 'x.x..x.x.x..x.x.' : 'x.xx.x.xx.xx.x.x', { vel: 0.6 + 0.12 * i });
        drum(ag, b, 1, 'x...x.x...x.x...');
        if (i >= 1) drum(sh, b, 1, 'xoxoxoxoxoxoxoxo', { vel: 0.5 + 0.15 * i });
        if (i >= 2) pand(b, 1, 0.6 + 0.2 * (i - 2));
        if (i === 3) uiOm(b, -2);
        bass(bs, b, 'G7', i < 2 ? '0:6 0:2 r:8' : '0:3 0:3 0:2 5:2 8:2 5:2 s:2', { vel: 0.8 });
    }
    padChord(cordas, 54, 'G7', 32, { low: 53, n: 4, vel: 0.6 });
    // o mestre comanda a batucada: o apito longo abre, o curto conta a entrada de cada naipe
    drum(fiii, 52, 1, 'X...............', { pitch: -4 });
    drum(fi, 53, 1, '........X.X.X...', { pitch: -4 });
    drum(fi, 54, 1, 'X..X..X.........');
    drum(fiii, 55, 1, 'X...............');
    mel(lead, 55, ['r:8 G4:2 A4:2 B4:2 D5:2']);
    virada(55);

    // ---------- duelo (56-63): o chip e o trompete de 2 em 2; o último acorde vira Lá7 (V de Ré) ----------
    const DUELO_CH = ['C', 'A7', 'Dm7', 'G7', 'C', 'A7b9', 'Dm7', 'A7'];
    DUELO_CH.forEach((c, i) => {
        bass(bs, 56 + i, c, GROOVE);
        harmonia(56 + i, c, { arpejo: i >= 4, low: 64 });
    });
    groove(56, 7);
    drum(cr, 56, 1, 'X...............');
    drum(cr, 60, 1, 'X...............');
    mel(lead, 56, [
        'r:2 G5:1 A5:1 C6:2 D6:1 Eb6:1 E6:4 C6:2 A5:2',
        'C#6:2 E6:2 G6:3 F6:1 E6:2 C#6:2 A5:4',
        'r:16',
        'r:16',
        'E6:1 G6:1 C7:2 r:2 B6:1 A6:1 G6:2 E6:2 D6:2 C6:2',
        'Bb6:3 A6:3 G6:2 E6:2 C#6:2 Bb5:2 A5:2',
    ]);
    mel(tp, 58, [
        'r:2 F5:2 A5:2 C6:3 A5:1 D6:6',
        'B5:2 C6:1 B5:1 G5:2 F5:2 D5:2 B4:2 G4:4',
        'r:16',
        'r:16',
        'A5:2 C6:2 F6:4 E6:2 D6:2 C6:2 A5:2',
        'B5:3 D6:3 F6:2 G6:8',
    ]);
    // o baixo e o trombone respondem o duelo nas pausas
    mel(tb, 57, ['r:12 A3:1 C#4:1 E4:2']);
    mel(tb, 61, ['r:12 A3:1 C#4:1 E4:2']);
    drum(k, 63, 1, 'X.....x.X.......');
    virada(63);
    drum(cr, 63, 1, '............X...');

    // ---------- PARADINHA (64-67), no Lá7 (o V do Ré): o mestre apita, a bateria responde ----------
    // 64: a banda bate o Lá7 e para; o apito longo e o SOC-CER-MON no apito
    stabs(st, 64, 'A7', [[0, 2]], { vel: 1.2 });
    stabs(tp, 64, 'A7', [[0, 2]], { low: 61, n: 3 });
    stabs(tb, 64, 'A7', [[0, 2]], { low: 45, n: 3 });
    bs.note(64 * 16, 33, 2, 1.1);
    drum(k, 64, 1, 'X...............');
    drum(cr, 64, 1, 'X...............');
    drum(fiii, 64, 1, '....X...........');
    drum(fi, 64, 1, '........X..X..X.', { pitch: -3 });
    // 65: a bateria responde no SOC-CER-MON (surdo, caixa, tamborim e o clap), e o apito pede de novo, mais rápido
    drum(su, 65, 1, 'X..X..X.........');
    drum(sn, 65, 1, 'X..X..X.........');
    drum(tam, 65, 1, 'X..X..X.........');
    drum(cl, 65, 1, 'x..x..x.........', { vel: 0.8 });
    bs.note(65 * 16, 33, 1, 1);
    bs.note(65 * 16 + 3, 33, 1, 1);
    bs.note(65 * 16 + 6, 45, 1, 1);
    drum(fi, 65, 1, '........X.X.X.X.', { pitch: -3 });
    for (const [r, p] of [
        [9, 5],
        [11, 3],
        [13, 1],
    ])
        cu.note(65 * 16 + r, p, 0, 0.7);
    // 66: a bateria dobra (tamborim e caixa em semicolcheias, o surdo marcando), as cordas e o trombone crescem no Lá7
    drum(su, 66, 1, 'X...X...........');
    drum(tam, 66, 1, 'x.xXx.xX........');
    drum(sn, 66, 1, '..o...o.xxxxXXXX', { vel: 0.8 });
    drum(ag, 66, 1, 'x.x.x.x.........');
    padChord(cordas, 66, 'A7', 24, { low: 55, n: 4, vel: 0.5, at: 8 });
    mel(tb, 66, ['r:8 A3:8'], { vel: 0.6 });
    // 67: a banda some por meio compasso, só o apito longo; o SOC-CER-MON da banda inteira joga o refrão em Ré
    drum(fiii, 67, 1, 'X...............');
    for (const r of [8, 11, 14]) {
        stabs(st, 67, 'A7', [[r, 1]], { vel: 1.2 });
        stabs(tp, 67, 'A7', [[r, 1]], { low: 64, n: 3 });
        bs.note(67 * 16 + r, r === 14 ? 45 : 33, 1, 1.1);
    }
    drum(k, 67, 1, '........X..X..X.');
    drum(sn, 67, 1, '........X..X..XX');
    drum(tm, 67, 1, '........x..x..x.', { pitch: 3 });
    drum(cl, 67, 1, '........x..x..x.', { vel: 0.9 });

    // ---------- refrão em Ré (68-75), sobe um tom; A final em Ré (76-83) com tudo ----------
    refrao(68, 2);
    A_CH.forEach((c, i) => {
        harmonia(76 + i, transpose(c, 2), { arpejo: true, low: 66 });
    });
    mel(lead, 76, A_MEL.slice(0, 4), { shift: 2 });
    mel(lead, 80, A_MEL.slice(4), { shift: 14 });
    mel(harm, 80, A_MEL.slice(4), { shift: 2, vel: 0.7 });
    mel(counter, 76, A_COUNTER, { shift: 2 });
    mel(bs, 76, A_BAIXO, { shift: 2 });
    mel(cordas, 76, ['F#5:16', 'F#5:16', 'F#5:16', 'E5:16', 'F#5:16', 'D5:16', 'G5:16', 'G5:8 E5:8'], { vel: 0.6 });
    groove(76, 7);
    drum(oh, 76, 8, '......x.......x.');
    drum(cr, 76, 1, 'X...............');
    drum(cr, 80, 1, 'X...............');
    virada(83);

    // ---------- etiqueta em Ré (84-87): o gancho subindo, a torcida no clap ----------
    const TAG_D = ['D', 'Em7', 'F#m7', 'A7'];
    TAG_D.forEach((c, i) => {
        const b = 84 + i;
        bass(bs, b, c, GROOVE);
        stabs(st, b, c, STAB);
        padChord(pad, b, c, 16, { vel: 0.5 });
        if (i < 3) {
            const call = GANCHO.em({ grau: i, tom: 2 });
            mel(lead, b, [call]);
            mel(harm, b, [call], { harm: thirdBelow(MAJOR(2)) });
            mel(tp, b, [GANCHO.em({ grau: i, tom: 2, oitava: -1 })], { vel: 0.85 });
            drum(cl, b, 1, GANCHO.palmas, { vel: 0.85 });
        }
    });
    groove(84, 3);
    uiOm(86, 2);
    drum(cr, 84, 1, 'X...............');
    mel(lead, 87, ['C#6:3 E6:3 A6:2 G6:8']);
    mel(tp, 87, ['A5:3 C#6:3 E6:2 E6:8']);
    mel(tb, 87, ['E4:3 G4:3 A4:2 C#4:8']);
    drum(k, 87, 1, 'X.....x.X.......');
    drum(sn, 87, 1, '........X.xxXXXX');
    drum(tm, 87, 1, '..........x.x.x.', { pitch: 4 });

    // ---------- final (88-89): o SOC-CER-MON da banda inteira em Si♭–Dó–Ré (♭VI–♭VII–I) e o Ré com nona ----------
    const FIM = [
        ['Bb', 0, 'D6', 'F5'],
        ['C', 3, 'E6', 'G5'],
        ['D', 6, 'F#6', 'A5'],
    ];
    for (const [c, r, top, mid] of FIM) {
        const len = r === 6 ? 10 : 3;
        stabs(st, 88, c, [[r, len]], { n: 4, vel: 1.2 });
        stabs(tp, 88, c, [[r, len]], { low: 62, n: 3 });
        stabs(tb, 88, c, [[r, len]], { low: 46, n: 3 });
        mel(lead, 88, [`${r ? `r:${r} ` : ''}${top}:${len}${r === 6 ? '' : ` r:${16 - r - len}`}`]);
        mel(harm, 88, [`${r ? `r:${r} ` : ''}${mid}:${len}${r === 6 ? '' : ` r:${16 - r - len}`}`]);
        bs.note(88 * 16 + r, r === 6 ? 38 : r === 3 ? 36 : 34, len, 1.1);
    }
    drum(k, 88, 1, 'X..X..X.........');
    drum(sn, 88, 1, 'X..X..X.........');
    drum(cr, 88, 1, '......X.........');
    drum(cl, 88, 1, '............x.x.', { vel: 0.9 });
    padChord(rh, 89, 'D', 16, { low: 54, n: 4, vel: 0.9 });
    mel(lead, 89, ['E6:16']);
    mel(cordas, 89, ['D5+F#5+A5+E6:16']);
    bs.note(89 * 16, 38, 16, 0.9);
    drum(su, 89, 1, 'X...............', { vel: 0.6 });
    // o mestre fecha o desfile
    drum(fi, 89, 1, '........X..X....', { pitch: -4, vel: 0.8 });
    drum(fiii, 89, 1, '..............X.', { vel: 0.8 });
    return S;
}
