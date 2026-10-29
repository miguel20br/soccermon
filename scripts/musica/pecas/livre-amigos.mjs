// Trailerzinho da 0.9.25 "Amigos" (roteiro em trailer/curtas/amigos/ROTEIRO.md): "Quem é esse no ranking?", v4 (o
// ritmo: cada ideia com o seu compasso; o chute 2 ganhou um compasso: carga e chute no C8, BOING no C9). O herói é
// o Pikachu, e o motivo é dele: "pi-ka-CHUUU" (C5 D5 F5, sobe pra terça e fecha na quinta lá em cima, Fá maior), no
// pulso elétrico. A assinatura é o PLIM do aviso de desafio (`plim`, dois sinos subindo uma quarta).
// Ordem (19 compassos): o Snorlax dormindo e o 1º plim (C0); "enquanto isso" o ranking com o toque no nome (C1), o
// perfil sobe, o grito dele e Adicionar amigo (C2), Desafiar quatro vezes, cada vez mais insistente (C3); plim × ronco
// (C4) e os plins empilhando até a bolha estourar (C5); ele bravo pisando forte até tocar Entrar (C6); o Duelo com o
// BOING da barriga (o `barriga` do EP 1) em dois chutes (C7; o 2º com a carga no C8 e o BOING no 9), a bola voltando
// pela quadra inteira (C10) e o gol com os metais "uón-uón-uóóón" (C11); FIM DE JOGO e Revanche? (C12); o plim e o
// olho bravo (C13); o cobertor e o breque (C14); explicação em 3 compassos (C15–17, sobe um tom no 17 com
// SOC-CER-MON); fim no plim (C18).
// 100 BPM, 4/4, compasso = 2,4 s, 19 compassos (45,6 s). Fá → Sol (C17).
import { plim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { barriga, chute, deslize, rede, ronco, torcida, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Amigos (trailer 0.9.25)', tela: 'Trailer de versão' };

const BAR = 2.4;
const ROW = BAR / 16;
/** Silêncios do roteiro (s): a bolha estoura (C5.12–C6.0, o grito do Snorlax) e o Pikachu murcha (C14.6–C14.8). */
export const SILENCIOS = [
    [5 * BAR + 12 * ROW + 0.08, 6 * BAR - 0.02],
    [14 * BAR + 6 * ROW, 14 * BAR + 8 * ROW],
];
/** O motivo do Pikachu (um compasso, Fá): "pi-ka-CHUUU", pergunta que fecha na quinta. */
export const MOTIVO = 'C5:1 r:1 D5:1 F5:3 A5:2 G5:2 F5:1 r:1 C6:4';

export default function amigos() {
    const masterAt = (t) => {
        let g = t < BAR ? 0.85 : t < 4 * BAR ? 0.9 : t < 7 * BAR ? 0.85 : 1;
        const f = 0.025;
        for (const [a, z] of SILENCIOS)
            if (t > a - f && t < z + f) g *= Math.min(1, Math.max(0, (a - t) / f, (t - z) / f));
        return g;
    };
    const S = new Song({ bpm: 100, bars: 19, swing: 0.12, tail: 3, masterAt });
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
    // a bola voltando pela quadra inteira (C9): um assobio que desce o compasso todo
    // a carga do choque (C8, até o chute no 8) e o pulo que não alcança (C9)
    const carga = S.part('carga', deslize(220, 1700, 1.15), { drum: true, pan: -0.1, gain: 0.4, rev: 0.25 });
    const pulo = S.part('pulo', deslize(500, 1150, 0.25), { drum: true, pan: -0.1, gain: 0.4, rev: 0.2 });
    const desce = S.part('viaja', deslize(1300, 240, 2.3), { drum: true, pan: -0.2, gain: 0.32, rev: 0.3 });
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
    // 1 · "enquanto isso": a volta no tempo (volta), o groove inteiro e o motivo perguntando ("?" no 2); toca no "zzz"
    // (8) e os metais respondem
    volta.note(16, 0, 0, 1);
    drum(cr, 1, 1, 'X...............');
    groove(1, 'F');
    mel(ld, 1, ['C5:1 r:1 D5:1 F5:3 r:10']);
    toque(1, 8);
    mel(met2, 1, ['r:9 A4+C5:1 r:1 G4+Bb4:1 F4+A4:2 r:2'], { vel: 0.6 });
    // 2 · a gaveta do perfil sobe (envia no 0); "!" e o grito dele no 4 (o motivo fica quieto); toca Adicionar amigo
    // (10) e os metais "ta-dá" (11, 13)
    sobe.note(2 * 16, 0, 0, 0.6);
    groove(2, 'Bb');
    padChord(cor, 2, 'Bb', 8, { low: 58, n: 4, vel: 0.35 });
    toque(2, 10);
    mel(met2, 2, ['r:11 F4+Bb4:1 r:1 A4+D5:3'], { vel: 0.8 });
    // 3 · Desafiar quatro vezes, cada vez mais insistente (2, 7, 11, 14): cada convite sobe um degrau acima; o motivo
    // cutuca no fim e a virada de caixa leva pro corte
    groove(3, 'C7');
    for (const [k, r] of [2, 7, 11, 14].entries()) {
        toque(3, r, 0.85 + 0.05 * k);
        sobe.note(3 * 16 + r + 1, 2 * k, 0, 0.7 + 0.08 * k);
    }
    mel(ld, 3, ['r:4 C5:1 r:1 E5:1 G5:1 r:8'], { vel: 0.6 });
    drum(sn, 3, 1, '............xxXX', { vel: 0.6 });
    // 4 · de volta no quarto: plim × ronco (ele ronca, os avisos respondem plim, plim-plim, cada um um degrau acima)
    volta.note(4 * 16, 0, 0, 0.7);
    groove(4, 'Bb', { leve: true });
    zz.note(4 * 16, 0, 0, 0.8);
    pl.note(4 * 16 + 8, 2, 0, 1);
    pl.note(4 * 16 + 12, 4, 0, 1);
    pl.note(4 * 16 + 14, 5, 0, 1);
    padChord(ep, 4, 'Gm7', 16, { low: 53, n: 4, vel: 0.35 });
    // 5 · os avisos empilham mais rápido e mais agudo, a caixa rufa, a bolha estoura no 12 (prato e silêncio: o grito
    // dele)
    for (const [k, r] of [0, 2, 4, 6, 7, 8, 9, 10, 11].entries()) pl.note(5 * 16 + r, 5 + k, 0, 0.8 + 0.02 * k);
    drum(sn, 5, 1, 'x.x.x.x.xxxxxxx.', { vel: 0.6 });
    drum(kk, 5, 1, 'X...X...X...X...');
    bass(bs, 5, 'C7', '0:2 0:2 0:2 0:2 0:1 0:1 0:1 0:1 r:4');
    padChord(cor, 5, 'C7', 12, { low: 55, n: 4, vel: 0.5 });
    drum(cr, 5, 1, '............X...');
    drum(tp, 5, 1, '............X...');
    // 6 · ele bravo, de pé: três pisadas (bumbo, tímpano e tuba no 0, 4, 8, a tuba subindo cromático), cordas
    // tremendo; toca Entrar no 11 (toque) e os metais abrem a partida no 12; virada pro Duelo
    drum(kk, 6, 1, 'X...X...X.......');
    drum(tp, 6, 1, 'X...X...X.......', { vel: 0.9 });
    mel(tuba, 6, ['C2:2 r:2 Db2:2 r:2 D2:3 r:5']);
    padChord(cor, 6, 'C7', 11, { low: 48, n: 4, vel: 0.45 });
    drum(hh, 6, 1, '..x...x...x.....', { vel: 0.5 });
    toque(6, 11);
    stabs(met, 6, 'F', [12], { low: 57, n: 4, len: 2 });
    drum(sn, 6, 1, '............xxXX', { vel: 0.55 });

    // 7 · o Duelo na partida nova: groove de partida, o motivo do Pikachu atacando; chute no 6, BOING na barriga no 10
    drum(cr, 7, 1, 'X...............');
    groove(7, 'F', { partida: true });
    mel(ld, 7, ['C5:1 r:1 D5:1 F5:3 r:10']);
    ch.note(7 * 16 + 6, 0, 0, 1);
    bar.note(7 * 16 + 10, 0, 0, 1);
    mel(met2, 7, ['r:12 F4:1 r:1 C4:2'], { vel: 0.6 });
    // 8 · de novo, com choque: o grito dele no 0 e a carga (o zap subindo e a caixa rufando a cada tempo até o chute no
    // 8, zap); a bola afunda na barriga no 11 e a barriga segura (tímpano rufando)
    groove(8, 'Bb', { partida: true });
    carga.note(8 * 16, 0, 0, 0.9);
    drum(sn, 8, 1, 'x.x.x.X.........', { vel: 0.5 });
    zp.note(8 * 16 + 8, 0, 0, 1);
    ch.note(8 * 16 + 8, 0, 0, 1);
    drum(kk, 8, 1, '...........X....', { vel: 0.8 });
    drum(tp, 8, 1, '...........x.xxx', { vel: 0.55 });
    // 9 · BOING mais grave no 0 (prato) e a bola sobe por cima dele: o motivo sobe junto; ele pula no 4 e não alcança
    drum(cr, 9, 1, 'X...............');
    bar.note(9 * 16, -3, 0, 1.1);
    groove(9, 'Bb', { partida: true });
    mel(ld, 9, ['r:1 A5:1 r:1 C6:2 r:11'], { vel: 0.8 });
    pulo.note(9 * 16 + 4, 0, 0, 0.8);
    // 10 · a bola volta pela quadra inteira (viaja) e a câmera vai junto: rufo crescendo, o motivo nos metais subindo
    groove(10, 'C7', { partida: true });
    desce.note(10 * 16, 0, 0, 1);
    drum(sn, 10, 1, '........x.x.xxxx', { vel: 0.55 });
    drum(tp, 10, 1, '............xxxx', { vel: 0.6 });
    mel(met, 10, ['C4:2 r:2 D4:2 r:2 E4:2 r:2 G4:4'], { vel: 0.55 });
    // 11 · GOL: rede, prato e torcida no 0; um respiro e os metais descem "uón-uón-uóóón" no 8 (o placar vira)
    drum(cr, 11, 1, 'X...............');
    rd.note(11 * 16, 0, 0, 1);
    festa.note(11 * 16, 0, 0, 0.8);
    drum(kk, 11, 1, 'X.......X.......');
    mel(bs, 11, ['F2:2 r:6 Db2:2 r:2 C2:4']);
    mel(met2, 11, ['r:8 Ab4:2 G4:2 Gb4:4'], { vel: 0.8 });
    // 12 · FIM DE JOGO: o Snorlax volta a roncar; o Pikachu toca "Revanche?" (toque no 12) com o motivo perguntando
    groove(12, 'F', { leve: true });
    zz.note(12 * 16, 0, 0, 0.7);
    toque(12, 12);
    mel(ld, 12, ['r:12 C5:1 r:1 D5:1 F5:1'], { vel: 0.8 });
    // 13 · PLIM. A câmera chega nele; ele abre um olho, bravo (tuba grave e tímpano no 6); o chimbal conta o respiro
    pl.note(13 * 16, 5, 0, 1.1);
    drum(kk, 13, 1, 'X...............');
    mel(tuba, 13, ['r:6 Gb2:3 r:7']);
    drum(tp, 13, 1, '......X.........', { vel: 0.7 });
    drum(hh, 13, 1, '..........x...x.', { vel: 0.45 });
    // 14 · ele puxa o cobertor (tuba "fom" no 0), o Pikachu murcha no breque (6); volta o ronco no 8
    mel(tuba, 14, ['C2:2 r:14']);
    drum(tp, 14, 1, 'X...............', { vel: 0.7 });
    zz.note(14 * 16 + 8, 0, 0, 0.7);
    mel(bs, 14, ['r:8 F2:2 r:2 C2:2 F2:2']);
    drum(hh, 14, 1, '........x.x.x.xx', { vel: 0.6 });

    // 15 · explicação 1 (Toque no nome): o groove inteiro e o motivo com os metais em terças; toques no 6 e no 13
    drum(cr, 15, 1, 'X...............');
    groove(15, 'F');
    mel(ld, 15, [MOTIVO]);
    mel(met, 15, [MOTIVO], { shift: -12, harm: thirdBelow(MAJOR(5)), vel: 0.6 });
    padChord(cor, 15, 'F', 16, { low: 57, n: 4, vel: 0.5 });
    toque(15, 6, 0.8);
    toque(15, 13, 0.7);
    // 16 · explicação 2 (Peça amizade): Si♭, o motivo pergunta e os metais respondem; toque no 6; virada e o Ré7 no 14
    // preparando a subida
    groove(16, 'Bb');
    mel(ld, 16, ['D5:1 r:1 F5:1 Bb5:3 r:10'], { vel: 0.9 });
    mel(met2, 16, ['r:8 F4+Bb4:1 r:1 F4+Bb4:1 A4+C5:3 r:2'], { vel: 0.8 });
    padChord(cor, 16, 'Bb', 14, { low: 58, n: 4, vel: 0.45 });
    toque(16, 6, 0.8);
    stabs(met, 16, 'D7', [14], { low: 57, n: 4, len: 2 });
    drum(sn, 16, 1, '............xxXX', { vel: 0.5 });
    // 17 · explicação 3 (Desafie pro Duelo): sobe um tom (Sol), SOC-CER-MON com as palmas respondendo; toque no 6
    drum(cr, 17, 1, 'X...............');
    groove(17, 'F', { s: 2 });
    mel(ld, 17, [GANCHO.em({ tom: -5 })]);
    mel(met, 17, [GANCHO.em({ tom: -5, oitava: -1 })], { harm: thirdBelow(MAJOR(7)), vel: 0.7 });
    drum(cl, 17, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 17, 'G', 16, { low: 55, n: 4, vel: 0.6 });
    toque(17, 6, 0.7);
    // 18 · tela final: o acorde de Sol, as sílabas do logo (2, 4, 6) e o fim no PLIM (12)
    stabs(met, 18, 'G', [0], { low: 55, n: 4, len: 2 });
    drum(cl, 18, 1, '..x.x.x.........', { vel: 0.8 });
    mel(bs, 18, ['G2:2 r:10 G1:4']);
    drum(kk, 18, 1, 'X...........X...');
    pl.note(18 * 16 + 12, 7, 0, 1.1);
    stabs(met, 18, 'G', [12], { low: 55, n: 4, len: 4 });
    drum(cr, 18, 1, '............x...', { vel: 0.6 });
    return S;
}
