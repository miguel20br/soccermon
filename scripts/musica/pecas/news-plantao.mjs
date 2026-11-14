// Soccermon News #1 (pauta 21, 20/11/2026; roteiro em docs/marketing/news-01.md e trailer/curtas/news-01/ROTEIRO.md).
// Vinheta de plantão própria, no molde do livre-ditto: funk animado, um motivo que conta a história e cada personagem
// com a voz dele na banda. O motivo do jornal ("plan-tão, NO-tí-cia, já!"): Dó Dó Sol↑ Fá Mi♭ Fá, Si♭ Dó, Dó dórico.
// Vozes: o Alakazam é o teremim (a colher que entorta: o "ting" de sino), o Meowth é o "mi-áu" (`miau`) com as moedas,
// o Porygon é o bipe digital (`bit`). A história na música: o gol em câmera lenta sobe (riser e tímpano) até a vinheta;
// o Alakazam canta "Boa noite"; no plantão cada gomo da barra de N é um degrau (Mi♭, Sol, Dó), o Duelo tem o plim do
// aviso, a bola na trave dá o "dong" afinado e a banda breca; o Meowth canta o quadro dele, o 40% é a caixa
// registradora, o ₽ sobe moeda por moeda e o "Pay Day!" vira chuva de moedas descendo a escala; no Porygon a banda
// inteira fica BORRADA (passa-baixa em 650 Hz) e abre de uma vez no "agora eu tenho quina" (o zap); ele gira (deslize)
// e a virada leva pra Ré (sobe um tom) no Vem aí; uma nota de sino por semana do calendário; o Time Ultimate cresce em
// Si♭7 e a carta vira em Mi♭ maior (mais meio tom), com as 7 notas do "faltam 7 dias" descendo; na tela final os três
// cantam o SOC-CER-MON juntos (teremim, mi-áu e bipe) com as palmas, e acaba no "ting" da colher.
// 120 BPM, 4/4, compasso = 2 s, 21 compassos (o vídeo usa 41 s). Dó dórico → Ré dórico (C15) → Mi♭ maior (C18).
import { bit, miau, plim, sobe, teremim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { chute, deslize, rede, torcida, trave, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Soccermon News: plantão', tela: 'Soccermon News #1 (vídeo)' };

/** O borrado do Porygon (s): a banda passa por um passa-baixa até ele dizer que agora tem quina. */
export const BORRADO = [21, 24];
/** A banda breca (linhas absolutas): da bola na trave (C6, 3) até o Meowth (C6, 8). */
const BRECA = [[6 * 16 + 3, 6 * 16 + 8]];
/** O motivo do jornal (um compasso, Dó dórico). */
export const MOTIVO = 'C5:2 C5:1 G5:3 F5:1 Eb5:1 F5:2 r:2 Bb4:2 C5:2';

export default function news() {
    const S = new Song({ bpm: 120, bars: 21, swing: 0.1, tail: 2.5 });
    const [b0, b1] = BORRADO;
    const borr = (t) => Math.min(1, Math.max(0, (t - b0) / 0.03)) * Math.min(1, Math.max(0, (b1 - t) / 0.04));
    /** Uma faixa em dobro: a limpa e a borrada, trocando no BORRADO. Nota que cai no BRECA não toca (a banda para). */
    const duo = (nome, inst, o = {}) => {
        const a = S.part(nome, inst, { ...o, gainAt: (t) => 1 - borr(t) });
        const b = S.part(`${nome}-borrado`, inst, { ...o, corte: 650, gainAt: borr });
        return {
            song: S,
            note: (r, ...x) => {
                if (BRECA.some(([de, ate]) => r >= de && r < ate)) return;
                a.note(r, ...x);
                b.note(r, ...x);
            },
        };
    };

    const ter = S.part('teremim', teremim, { pan: -0.1, gain: 0.6, rev: 0.25, echo: { rows: 3, fb: 0.25, mix: 0.15 } });
    const mia = S.part('miau', miau, { pan: 0.12, gain: 1.05, corte: 4200, rev: 0.18 });
    const bip = duo('bit', bit, { pan: 0.05, gain: 0.55, rev: 0.12, echo: { rows: 3, fb: 0.2, mix: 0.12 } });
    const colher = S.part('colher', I.bell, { pan: -0.2, gain: 1.6, rev: 0.4, echo: { rows: 4, fb: 0.3, mix: 0.3 } });
    const sino = S.part('sino', I.bell, { pan: 0.2, gain: 1.4, rev: 0.3 });
    const met = duo('metais', I.brass, { pan: 0.2, gain: 0.45, corte: 3000, rev: 0.2 });
    const met2 = duo('metais2', I.brass, { pan: -0.2, gain: 0.4, corte: 2600, rev: 0.2 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.85, rev: 0.35 });
    const pulso = duo('pulso', I.pulse, { pan: 0.3, gain: 0.35, corte: 3600, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const bs = duo('baixo', I.slap, { gain: 0.5, corte: 2500 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.55 });
    const gt = duo('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = duo('clav', I.clav, { pan: 0.35, gain: 0.45, corte: 2600 });
    const moeda = S.part('moedas', I.coin, { drum: true, pan: 0.25, gain: 1.1, rev: 0.15 });
    const pl = S.part('plim', plim, { drum: true, pan: 0.15, gain: 0.9, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.9 });
    const tv = S.part('trave', trave, { drum: true, pan: -0.15, gain: 0.9, rev: 0.2 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.1, gain: 0.8, rev: 0.3 });
    const fundo = S.part('estadio', torcida(2.2, 0.9, 0.9), { drum: true, gain: 0.45, rev: 0.4 });
    const ris = S.part('riser', sobe(2), { drum: true, gain: 0.45 });
    const ris2 = S.part('riser2', sobe(4), { drum: true, gain: 0.4 });
    const zp = S.part('zap', zap, { drum: true, gain: 0.7, rev: 0.2 });
    const gira = S.part('gira', deslize(260, 1500, 0.55), { drum: true, pan: 0.1, gain: 0.55, rev: 0.25 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = duo('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = duo('caixa', I.snare, { drum: true, gain: 0.3 });
    const hh = duo('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.42 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.2 });
    const tom = S.part('tons', I.tom, { drum: true, gain: 0.35 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.38 });

    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    /** O funk do jornal (`s` = semitons acima). `leve`: só o esqueleto. */
    const groove = (b, c0, { s = 0, leve = false } = {}) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', { vel: leve ? 0.7 : 1 });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    const bb = MAJOR(10); // Dó dórico = as notas de Si♭ maior

    // 0 · o gol em câmera lenta: cordas abrindo, riser, tímpano rufando e a torcida subindo até a vinheta
    padChord(cor, 0, 'Cm9', 16, { low: 55, n: 4, vel: 0.55 });
    ris.note(0, 0, 0, 1);
    mel(tuba, 0, ['C2:16'], { vel: 0.6 });
    fundo.note(2, 0, 0, 0.9);
    rd.note(5, 0, 0, 0.9);
    drum(tp, 0, 1, '........x.x.xxXX', { vel: 0.7 });
    // 1 · VINHETA: prato, a cabeça do motivo nos metais (em terças), e no 8 a bancada: o "ting" da colher e o Alakazam
    // canta "Bo-a noi-te" no teremim; o groove entra leve
    drum(cr, 1, 1, 'X...............');
    drum(kk, 1, 1, 'X.....X.........');
    drum(tp, 1, 1, 'X.....X.........', { vel: 0.8 });
    mel(met, 1, ['C5:2 C5:1 G5:3 F5:1 Eb5:1 r:8']);
    mel(met2, 1, ['C5:2 C5:1 G5:3 F5:1 Eb5:1 r:8'], { shift: -12, harm: thirdBelow(bb), vel: 0.8 });
    stabs(met, 1, 'Cm7', [[6, 2]], { low: 55, n: 4, vel: 0.7 });
    colher.note(16 + 8, 96, 4, 1);
    mel(ter, 1, ['r:8 G4:2 Bb4:1 C5:3 G4:2']);
    drum(hh, 1, 1, '........x.xx.x.x', { vel: 0.7 });
    bass(bs, 1, 'Cm7', 'r:8 0:3 r:1 5:2 s:2', { vel: 0.8 });

    // 2–3 · PLANTÃO, a barra de N: o motivo inteiro nos metais; cada gomo aceso é um degrau de sino (Mi♭, Sol, Dó) com um
    // acorde curto; o N3 (C3, linha 2) tem prato e o acorde cheio
    groove(2, 'Cm7');
    mel(met, 2, [MOTIVO], { vel: 0.85 });
    mel(met2, 2, [MOTIVO], { shift: -12, harm: thirdBelow(bb), vel: 0.6 });
    sino.note(2 * 16 + 6, 87, 2, 0.9);
    stabs(pulso, 2, 'Ebmaj7', [6], { low: 63, n: 3, vel: 0.8 });
    sino.note(2 * 16 + 11, 91, 2, 0.95);
    stabs(pulso, 2, 'Gm7', [11], { low: 67, n: 3, vel: 0.85 });
    groove(3, 'F7');
    sino.note(3 * 16 + 1, 96, 4, 1);
    stabs(met, 3, 'F9', [[1, 3]], { low: 60, n: 4 });
    drum(cr, 3, 1, '.X..............');
    // o Duelo (C3, 8): o plim do aviso, e os metais respondem
    pl.note(3 * 16 + 10, 0, 0, 1);
    mel(met2, 3, ['r:12 Eb4:1 F4:1 G4:2'], { vel: 0.7 });
    groove(4, 'Cm7');
    pl.note(4 * 16 + 4, 2, 0, 0.8);
    mel(met, 4, ['r:8 G4:2 Bb4:2 C5:2 Eb5:2'], { vel: 0.7 });
    // 5–6 · a bola amassa: o chute (C5, 4), a câmera lenta e a trave (C6, 3, o "dong" em Dó); a banda breca até o Meowth
    groove(5, 'F7');
    ch.note(5 * 16 + 4, 0, 0, 1);
    mel(met2, 5, ['r:8 C4:2 Db4:2 D4:2 Eb4:2'], { vel: 0.6 });
    tv.note(6 * 16 + 3, -10, 0, 1.1);
    drum(cr, 6, 1, '...x............', { vel: 0.5 });

    // 6 · NÚMERO DA SEMANA: o Meowth canta "Es-se qua-dro é meu" (8); as moedas entram no contratempo
    groove(6, 'Cm7');
    mel(mia, 6, ['r:8 G4:1 G4:1 Bb4:2 G4:1 C5:1 Eb5:2']);
    drum(moeda, 6, 1, '..............x.', { pitch: 0, vel: 0.5 });
    // 7 · o 40%: a caixa registradora (moedas em acorde) e o acorde dos metais no 1; o 1 de 3 com o Patrocínio no 8
    groove(7, 'F7');
    drum(cr, 7, 1, 'X...............');
    stabs(met, 7, 'F9', [[0, 3]], { low: 60, n: 4 });
    for (const [k, p] of [0, 4, 7, 12].entries()) moeda.note(7 * 16 + k, p, 0, 0.9);
    drum(moeda, 7, 1, '......x.......x.', { vel: 0.5 });
    mel(met2, 7, ['r:8 C5:2 Bb4:2 G4:4'], { vel: 0.6 });
    groove(8, 'Cm7');
    drum(moeda, 8, 1, '......x.........', { vel: 0.5 });
    // 8–9 · a Rota (C8, 8): o ₽ sobe moeda por moeda, as 9 do +₽9 (pentatônica de Dó subindo, uma por linha)
    for (const [k, p] of [0, 3, 5, 7, 10, 12, 15, 17, 19].entries()) moeda.note(8 * 16 + 10 + k, p - 5, 0, 0.75);
    groove(9, 'F7');
    // 9 · PAY DAY! (8): o Meowth canta alto, os metais batem, e chovem moedas descendo a escala até o Porygon
    mel(mia, 9, ['r:8 C6:3 G5:5']);
    stabs(met, 9, 'F9', [8, [11, 3]], { low: 60, n: 4 });
    drum(cr, 9, 1, '........X.......');
    for (let k = 0; k < 22; k++) moeda.note(9 * 16 + 10 + k, 31 - Math.round(k * 1.5), 0, 0.85 - k * 0.02);
    groove(10, 'Cm7');

    // 10–11 · CONVIDADO: o Porygon chega (C10, 8) e a banda inteira fica borrada (BORRADO); ele canta "An-tes eu e-ra
    // bor-ra-do" no bipe, abafado
    mel(bip, 10, ['r:12 G5:1 G5:1 Bb5:1 G5:1']);
    groove(11, 'F7');
    mel(bip, 11, ['F5:1 Eb5:1 F5:2 G5:2 C5:4 r:6']);
    // 12 · ABRE: prato e zap, e "A-go-ra eu te-nho qui-na" nítido; o pulso digital em semicolcheias
    groove(12, 'Cm7');
    drum(cr, 12, 1, 'X...............');
    zp.note(12 * 16, 0, 0, 1);
    mel(bip, 12, ['r:4 C6:1 C6:1 Bb5:1 C6:1 Eb6:2 F6:1 G6:5']);
    groove(13, 'F7');
    for (let r = 0; r < 16; r++)
        pulso.note(13 * 16 + r, [65, 69, 72, 75][r % 4] + (r >= 8 ? 12 : 0), 1, r % 4 ? 0.6 : 0.85);
    mel(met, 13, ['r:8 Eb5:2 F5:2 G5:4'], { vel: 0.7 });
    // 14 · o Porygon gira na cadeira (o deslize subindo) e o bipe ri; virada e Lá7 levam pra Ré
    groove(14, 'Cm7', { leve: true });
    gira.note(14 * 16, 0, 0, 1);
    mel(bip, 14, ['r:4 C6:1 G6:1 C7:2 r:8']);
    drum(sn, 14, 1, '........x.x.xxXX', { vel: 0.8 });
    drum(tom, 14, 1, '........x...x.x.', { pitch: 0, vel: 0.8 });
    stabs(met, 14, 'A7', [[14, 2]], { low: 57, n: 4 });
    bass(bs, 14, 'A7', 'r:14 0:2');

    // 15 · VEM AÍ (Ré dórico): o Alakazam com o motivo no teremim; uma nota de sino por semana do calendário (4, 8, 12 e o
    // 1 do C16), subindo
    groove(15, 'Cm7', { s: 2 });
    drum(cr, 15, 1, 'X...............');
    mel(ter, 15, [MOTIVO], { shift: 2, vel: 0.9 });
    for (const [r, m] of [
        [15 * 16 + 4, 86],
        [15 * 16 + 8, 89],
        [15 * 16 + 12, 93],
        [16 * 16, 98],
    ])
        sino.note(r, m, 2, 0.9);
    groove(16, 'F7', { s: 2 });
    mel(met, 16, ['r:2 A4:2 C5:2 D5:2 r:8'], { vel: 0.6 });
    // 16, 8 · o Time Ultimate: rufo crescendo, cordas subindo, riser de 4 s até a carta virar; o Alakazam canta
    // "Sex-ta que vem" no teremim
    ris2.note(16 * 16 + 8, 0, 0, 1);
    drum(sn, 16, 1, '........x.x.x.x.', { vel: 0.6 });
    mel(ter, 16, ['r:8 A4:1 A4:1 C5:2 D5:4']);
    // 17 · Si♭7 (o V de Mi♭): "Time Ul-ti-ma-te" e a carta girando
    drum(kk, 17, 1, 'X...X...X...X...');
    drum(sn, 17, 1, 'x.x.x.x.xxxxxxxx', { vel: 0.7 });
    drum(sn, 17, 1, '............xxXX', { vel: 0.5 });
    drum(tp, 17, 1, 'x.......x...xxXX', { vel: 0.7 });
    bass(bs, 17, 'Bb7', '0:2 0:2 r:2 0:2 5:2 r:2 s:2 8:2');
    padChord(cor, 17, 'Bb7', 16, { low: 56, n: 4, vel: 0.7 });
    mel(ter, 17, ['F5:2 Eb5:1 D5:1 C5:2 Bb4:2 C5:4 D5:4']);
    for (let r = 0; r < 16; r += 2)
        pulso.note(17 * 16 + r, [58, 62, 65, 68][(r / 2) % 4] + 12 * Math.floor(r / 8), 2, 0.7);

    // 18 · Mi♭ maior: a carta ouro aparece (prato); os metais em fanfarra e as 7 notas do "faltam 7 dias" descendo no sino
    const eb = MAJOR(3);
    drum(cr, 18, 1, 'X...............');
    groove(18, 'Ebmaj7');
    mel(met, 18, ['Eb5:2 G5:2 Bb5:4 r:8'], { harm: thirdBelow(eb) });
    for (const [k, m] of [94, 92, 91, 89, 87, 86, 84].entries()) sino.note(18 * 16 + 2 + k * 2, m, 1, 0.75);
    // 19 · TELA FINAL: os três cantam o SOC-CER-MON em Mi♭ (teremim, mi-áu e bipe) e as palmas respondem
    groove(19, 'Ab', { s: 0 });
    drum(cr, 19, 1, 'X...............');
    mel(ter, 19, [GANCHO.em({ tom: 3, oitava: -1 })]);
    mel(mia, 19, [GANCHO.em({ tom: 3, oitava: -1 })], { vel: 0.8 });
    mel(bip, 19, [GANCHO.em({ tom: 3 })], { vel: 0.7 });
    mel(met, 19, [GANCHO.em({ tom: 3, oitava: -1 })], { harm: thirdBelow(eb), vel: 0.6 });
    drum(cl, 19, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 19, 'Ab', 16, { low: 56, n: 4, vel: 0.6 });
    // 20 · fim: Mi♭ no 1 e o "ting" da colher
    drum(cr, 20, 1, 'X...............');
    drum(kk, 20, 1, 'X...............');
    stabs(met, 20, 'Eb', [[0, 4]], { low: 58, n: 4 });
    bass(bs, 20, 'Eb', '0:4 r:12');
    mel(tuba, 20, ['Eb2:6 r:10'], { vel: 0.8 });
    colher.note(20 * 16 + 2, 99, 6, 1);
    return S;
}
