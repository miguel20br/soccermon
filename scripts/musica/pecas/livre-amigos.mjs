// Trailerzinho da 0.9.25 "Amigos" (roteiro em trailer/curtas/amigos/ROTEIRO.md): "Quem é esse no ranking?", v2 (abre
// no gancho). O herói é o Pikachu, e o motivo é dele: "pi-ka-CHUUU" (C5 D5 F5, sobe pra terça e fecha na quinta lá em
// cima, Fá maior), no pulso elétrico. A assinatura é o PLIM do aviso de desafio (`plim`, dois sinos subindo uma quarta).
// Ordem: abre no Snorlax dormindo e no 1º plim (C0); "enquanto isso" o Pikachu acha o "zzz" no ranking e manda o
// convite (C1–2, o motivo dele e o grito respondendo); plim × ronco e os plins empilhando até a bolha estourar (C3–4);
// o Duelo com o BOING da barriga (o `barriga` do EP 1) e o gol do Snorlax nos metais "uón-uón-uóóón" (C5–8); um plim e
// ele se cobre (C9, breque); explicação em 3 compassos (C10–12, sobe um tom no 12 com SOC-CER-MON); fim no plim (C13).
// 100 BPM, 4/4, compasso = 2,4 s, 14 compassos (33,6 s). Fá → Sol (C12).
import { plim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { barriga, chute, deslize, rede, ronco, torcida, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Amigos (trailer 0.9.25)', tela: 'Trailer de versão' };

const BAR = 2.4;
const ROW = BAR / 16;
/** Silêncios do roteiro (s): a bolha estoura (C4.12–C4.14) e o Snorlax se cobre (C9.6–C9.8). */
export const SILENCIOS = [
    [4 * BAR + 12 * ROW + 0.08, 4 * BAR + 14 * ROW - 0.02],
    [9 * BAR + 6 * ROW, 9 * BAR + 8 * ROW],
];
/** O motivo do Pikachu (um compasso, Fá): "pi-ka-CHUUU", pergunta que fecha na quinta. */
export const MOTIVO = 'C5:1 r:1 D5:1 F5:3 A5:2 G5:2 F5:1 r:1 C6:4';

export default function amigos() {
    const masterAt = (t) => {
        let g = t < BAR ? 0.85 : t < 3 * BAR ? 0.9 : t < 5 * BAR ? 0.85 : 1;
        const f = 0.025;
        for (const [a, z] of SILENCIOS)
            if (t > a - f && t < z + f) g *= Math.min(1, Math.max(0, (a - t) / f, (t - z) / f));
        return g;
    };
    const S = new Song({ bpm: 100, bars: 14, swing: 0.12, tail: 3, masterAt });
    const ld = S.part('pikachu', I.pulse, {
        pan: -0.05,
        gain: 0.7,
        corte: 4200,
        rev: 0.15,
        echo: { rows: 3, fb: 0.2, mix: 0.12 },
    });
    const pl = S.part('plim', plim, {
        drum: true,
        pan: 0.15,
        gain: 0.9,
        rev: 0.3,
        echo: { rows: 2, fb: 0.25, mix: 0.2 },
    });
    const bar = S.part('barriga', barriga, { drum: true, gain: 1.2, rev: 0.2 });
    const zz = S.part('ronco', ronco, { drum: true, pan: 0.05, gain: 0.6, rev: 0.15 });
    const zp = S.part('zap', zap, { drum: true, pan: -0.1, gain: 0.6, rev: 0.2 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.8 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.7, rev: 0.3 });
    const sobe = S.part('envia', deslize(300, 1400, 0.5), { drum: true, pan: 0.2, gain: 0.45, rev: 0.3 });
    const volta = S.part('volta', deslize(1500, 380, 0.4), { drum: true, pan: -0.15, gain: 0.55, rev: 0.3 });
    const desce = S.part('viaja', deslize(1200, 260, 1.1), { drum: true, pan: -0.2, gain: 0.4, rev: 0.3 });
    const festa = S.part('festa', torcida(2.2, 0.15, 1.2), { drum: true, gain: 0.7, rev: 0.3 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.8, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.32, corte: 2500 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 1.5 });
    const cv = S.part('clav', I.clav, { pan: 0.35, gain: 0.5, corte: 2600 });
    const bl = S.part('toque', I.block, { drum: true, pan: 0.3, gain: 1.6 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), {
        drum: true,
        gain: 0.8,
        rev: 0.15,
    });
    const kk = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.32 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.45 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.25 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });

    const BASS = '0:2 8:1~ r:1 5:2 r:2 0:1 r:1 s:2 5:2 3:2';
    /** O funk da casa em Fá (`s` = semitons acima). */
    const groove = (b, c0, { s = 0, leve = false, partida = false } = {}) => {
        const c = transpose(c0, s);
        drum(kk, b, 1, partida ? 'X...x...X...x...' : leve ? 'X.........x.....' : 'X.....x...x..x..');
        drum(sn, b, 1, leve ? '....x.......x...' : '....X..o.o..X..o', { vel: leve ? 0.7 : 1 });
        drum(hh, b, 1, partida ? 'xxXxxxXxxxXxxxXx' : leve ? 'x.x.x.x.x.x.x.x.' : 'x.xx.x.xx.xx.x.x', {
            vel: leve ? 0.7 : 1,
        });
        bass(bs, b, c, leve ? '0:3 r:3 5:2 0:2 r:2 s:2 5:2' : BASS, { vel: leve ? 0.8 : 1 });
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3, vel: leve ? 0.7 : 1 });
        if (!leve) stabs(cv, b, c, [3, 7, 11], { low: 62, n: 3, vel: 0.7 });
    };
    const toque = (b, row, vel = 1) => drum(bl, b, 1, `${'.'.repeat(row)}x${'.'.repeat(15 - row)}`, { pitch: 12, vel });

    // 0 · o gancho: o Snorlax dormindo. Groove leve (Si♭), o ronco faz o baixo no 1 e o primeiro PLIM no 8 (1,2 s)
    groove(0, 'Bb', { leve: true });
    zz.note(0, 0, 0, 0.8);
    pl.note(8, 0, 0, 1);
    padChord(ep, 0, 'Bbmaj7', 16, { low: 53, n: 4, vel: 0.35 });
    // 1 · "enquanto isso": a volta no tempo (volta), o groove inteiro com o motivo do Pikachu; toca no "zzz" (6), o
    // perfil sobe (7) e o grito dele responde o motivo no 11 (o C6 do fim vira o grito)
    volta.note(16, 0, 0, 1);
    drum(cr, 1, 1, 'X...............');
    groove(1, 'F');
    mel(ld, 1, ['C5:1 r:1 D5:1 F5:3 A5:2 G5:2 F5:1 r:5']);
    toque(1, 6);
    sobe.note(16 + 7, 0, 0, 0.6);
    // 2 · Adicionar amigo (toque no 2, metais "ta-dá") e Desafiar quatro vezes, cada vez mais rápido (8, 11, 13, 14):
    // cada convite sobe (envia); virada de caixa pro corte
    groove(2, 'C7');
    toque(2, 2);
    mel(met2, 2, ['r:3 G4+C5:1 r:1 Bb4+E5:3 r:8'], { vel: 0.8 });
    mel(ld, 2, ['r:4 C5:1 r:1 E5:1 G5:1 r:8'], { vel: 0.7 });
    for (const [k, r] of [8, 11, 13, 14].entries()) {
        toque(2, r, 0.9);
        sobe.note(2 * 16 + r + 1, 2 * k, 0, 0.9 - 0.1 * k);
    }
    drum(sn, 2, 1, '............xxXX', { vel: 0.6 });
    // 3 · de volta no quarto: plim × ronco (ele ronca, os avisos respondem plim, plim-plim, cada um um degrau acima)
    groove(3, 'Bb', { leve: true });
    zz.note(3 * 16, 0, 0, 0.8);
    pl.note(3 * 16 + 8, 2, 0, 1);
    pl.note(3 * 16 + 12, 4, 0, 1);
    pl.note(3 * 16 + 14, 5, 0, 1);
    padChord(ep, 3, 'Gm7', 16, { low: 53, n: 4, vel: 0.35 });
    // 4 · os avisos empilham mais rápido e mais agudo, a caixa rufa, a bolha estoura no 12 (prato, silêncio: o grito
    // dele) e ele toca Entrar (toque + metais) no 14
    for (const [k, r] of [0, 2, 4, 6, 7, 8, 9, 10, 11].entries()) pl.note(4 * 16 + r, 5 + k, 0, 0.8 + 0.02 * k);
    drum(sn, 4, 1, 'x.x.x.x.xxxxxxx.', { vel: 0.6 });
    drum(kk, 4, 1, 'X...X...X...X...');
    bass(bs, 4, 'C7', '0:2 0:2 0:2 0:2 0:1 0:1 0:1 0:1 r:4');
    padChord(cor, 4, 'C7', 12, { low: 55, n: 4, vel: 0.5 });
    drum(cr, 4, 1, '............X...');
    drum(tp, 4, 1, '............X...');
    toque(4, 14);
    stabs(met, 4, 'F', [14], { low: 57, n: 4, len: 2 });

    // 5 · o Duelo na partida nova: groove de partida, o motivo do Pikachu atacando; chute no 6, BOING na barriga no 10
    drum(cr, 5, 1, 'X...............');
    groove(5, 'F', { partida: true });
    mel(ld, 5, ['C5:1 r:1 D5:1 F5:3 r:10']);
    ch.note(5 * 16 + 6, 0, 0, 1);
    bar.note(5 * 16 + 10, 0, 0, 1);
    mel(met2, 5, ['r:12 F4:1 r:1 C4:2'], { vel: 0.6 });
    // 6 · de novo, com choque (o grito dele no 0): zap no chute (4), BOING mais grave (8); o motivo sobe mais
    groove(6, 'Bb', { partida: true });
    mel(ld, 6, ['r:8 A5:1 r:1 C6:2 r:4'], { vel: 0.8 });
    zp.note(6 * 16 + 4, 0, 0, 1);
    ch.note(6 * 16 + 4, 0, 0, 1);
    bar.note(6 * 16 + 8, -3, 0, 1.1);
    zz.note(6 * 16 + 11, 4, 0, 0.5);
    // 7 · a bola volta da barriga e atravessa a quadra (viaja), entra no outro gol (rede, torcida) e os metais descem
    // "uón-uón-uóóón": 0 × 1
    groove(7, 'C7', { partida: true });
    desce.note(7 * 16, 0, 0, 1);
    rd.note(7 * 16 + 8, 0, 0, 1);
    festa.note(7 * 16 + 8, 0, 0, 0.8);
    drum(cr, 7, 1, '........X.......');
    mel(met2, 7, ['r:9 Ab4:2 G4:2 Gb4:3'], { vel: 0.8 });
    // 8 · o Snorlax volta a roncar; o Pikachu toca "Revanche?" (toque no 10) com o motivo perguntando
    groove(8, 'F', { leve: true });
    zz.note(8 * 16, 0, 0, 0.7);
    toque(8, 10);
    mel(ld, 8, ['r:10 C5:1 r:1 D5:1 F5:3'], { vel: 0.8 });
    // 9 · PLIM. Ele abre um olho (1) e se cobre (tuba "fom" no 4, breque no 6); volta o ronco no 8
    pl.note(9 * 16, 5, 0, 1.1);
    drum(kk, 9, 1, 'X...............');
    mel(tuba, 9, ['r:4 C2:2 r:10']);
    drum(tp, 9, 1, '....X...........', { vel: 0.7 });
    zz.note(9 * 16 + 8, 0, 0, 0.7);
    mel(bs, 9, ['r:8 F2:2 r:2 C2:2 F2:2']);
    drum(hh, 9, 1, '........x.x.x.xx', { vel: 0.6 });

    // 10 · explicação 1 (Toque no nome): o groove inteiro e o motivo com os metais em terças; toques no 6 e no 13
    drum(cr, 10, 1, 'X...............');
    groove(10, 'F');
    mel(ld, 10, [MOTIVO]);
    mel(met, 10, [MOTIVO], { shift: -12, harm: thirdBelow(MAJOR(5)), vel: 0.6 });
    padChord(cor, 10, 'F', 16, { low: 57, n: 4, vel: 0.5 });
    toque(10, 6, 0.8);
    toque(10, 13, 0.7);
    // 11 · explicação 2 (Peça amizade): Si♭, o motivo pergunta e os metais respondem; toque no 6; virada e o Ré7 no 14
    // preparando a subida
    groove(11, 'Bb');
    mel(ld, 11, ['D5:1 r:1 F5:1 Bb5:3 r:10'], { vel: 0.9 });
    mel(met2, 11, ['r:8 F4+Bb4:1 r:1 F4+Bb4:1 A4+C5:3 r:2'], { vel: 0.8 });
    padChord(cor, 11, 'Bb', 14, { low: 58, n: 4, vel: 0.45 });
    toque(11, 6, 0.8);
    stabs(met, 11, 'D7', [14], { low: 57, n: 4, len: 2 });
    drum(sn, 11, 1, '............xxXX', { vel: 0.5 });
    // 12 · explicação 3 (Desafie pro Duelo): sobe um tom (Sol), SOC-CER-MON com as palmas respondendo; toque no 6
    drum(cr, 12, 1, 'X...............');
    groove(12, 'F', { s: 2 });
    mel(ld, 12, [GANCHO.em({ tom: -5 })]);
    mel(met, 12, [GANCHO.em({ tom: -5, oitava: -1 })], { harm: thirdBelow(MAJOR(7)), vel: 0.7 });
    drum(cl, 12, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 12, 'G', 16, { low: 55, n: 4, vel: 0.6 });
    toque(12, 6, 0.7);
    // 13 · tela final: o acorde de Sol, as sílabas do logo (2, 4, 6) e o fim no PLIM (12)
    stabs(met, 13, 'G', [0], { low: 55, n: 4, len: 2 });
    drum(cl, 13, 1, '..x.x.x.........', { vel: 0.8 });
    mel(bs, 13, ['G2:2 r:10 G1:4']);
    drum(kk, 13, 1, 'X...........X...');
    pl.note(13 * 16 + 12, 7, 0, 1.1);
    stabs(met, 13, 'G', [12], { low: 55, n: 4, len: 4 });
    drum(cr, 13, 1, '............x...', { vel: 0.6 });
    return S;
}
