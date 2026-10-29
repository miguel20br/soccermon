// Trailerzinho da 0.9.25 "Amigos" (roteiro em trailer/curtas/amigos/ROTEIRO.md): "Quem é esse no ranking?". O herói é o
// Pikachu, e o motivo é dele: "pi-ka-CHUUU" (C5 D5 F5, sobe pra terça e fecha na quinta lá em cima, Fá maior), no pulso
// elétrico. A assinatura é o PLIM do aviso de desafio (`plim`, dois sinos subindo uma quarta): um, depois em resposta
// ao ronco do Snorlax (plim × ronco), depois empilhando cada vez mais rápido e mais agudo até a bolha estourar. No Duelo
// o groove de partida, o motivo do Pikachu atacando e o BOING da barriga do Snorlax (o `barriga` do EP 1) defendendo.
// O gol do Snorlax: os metais descem "uón-uón-uóóón". Revanche? Um plim só, e o Snorlax cobre a cabeça (breque).
// Explicação no groove com o motivo; sobe um tom (Sol) com SOC-CER-MON e palmas; fim no plim.
// 100 BPM, 4/4, compasso = 2,4 s, 16 compassos (38,4 s). Fá → Sol (C14).
import { plim } from '../curtas.mjs';
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { barriga, chute, deslize, rede, ronco, torcida, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Amigos (trailer 0.9.25)', tela: 'Trailer de versão' };

const BAR = 2.4;
const ROW = BAR / 16;
/** Silêncios do roteiro (s): a bolha estoura (C7.12–C7.14) e o Snorlax cobre a cabeça (C12.6–C12.8). */
export const SILENCIOS = [
    [7 * BAR + 12 * ROW + 0.08, 7 * BAR + 14 * ROW - 0.02],
    [12 * BAR + 6 * ROW, 12 * BAR + 8 * ROW],
];
/** O motivo do Pikachu (um compasso, Fá): "pi-ka-CHUUU", pergunta que fecha na quinta. */
export const MOTIVO = 'C5:1 r:1 D5:1 F5:3 A5:2 G5:2 F5:1 r:1 C6:4';

export default function amigos() {
    const masterAt = (t) => {
        let g = t < 5 * BAR ? 0.9 : t < 8 * BAR ? 0.85 : 1;
        const f = 0.025;
        for (const [a, z] of SILENCIOS)
            if (t > a - f && t < z + f) g *= Math.min(1, Math.max(0, (a - t) / f, (t - z) / f));
        return g;
    };
    const S = new Song({ bpm: 100, bars: 16, swing: 0.12, tail: 3, masterAt });
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
    const desce = S.part('viaja', deslize(1200, 260, 1.1), { drum: true, pan: -0.2, gain: 0.4, rev: 0.3 });
    const festa = S.part('festa', torcida(2.2, 0.15, 1.2), { drum: true, gain: 0.4, rev: 0.3 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.42, corte: 3000, rev: 0.2 });
    const met2 = S.part('metais2', I.brass, { pan: -0.2, gain: 0.5, corte: 2600, rev: 0.2 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 1, rev: 0.2 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const cor = S.part('cordas', I.strings, { pan: -0.1, gain: 0.8, rev: 0.35 });
    const bs = S.part('baixo', I.slap, { gain: 0.38, corte: 2500 });
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

    // 0 · o ranking, o Pikachu em 2º: o groove entra no 1 com o motivo dele (gancho no primeiro segundo)
    drum(cr, 0, 1, 'X...............');
    groove(0, 'F');
    mel(ld, 0, [MOTIVO]);
    // 1 · a câmera sobe pro 1º: "zzz", um clube de Snorlax. Suspense: a banda sai, o baixo anda no Ré♭ e o pícolo pergunta
    drum(hh, 1, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    drum(kk, 1, 1, 'X.......X.......');
    bass(bs, 1, 'Db', '0:4 r:4 0:2 r:2 l:4');
    padChord(cor, 1, 'Db', 8, { low: 56, n: 4, vel: 0.5 });
    padChord(cor, 1, 'C7', 8, { low: 55, n: 4, vel: 0.55, at: 8 });
    mel(pc, 1, ['r:4 C6:1 r:1 Db6:2 r:4 C6:1 r:1 B5:2'], { vel: 0.7 });
    drum(tp, 1, 1, '............xxxX', { vel: 0.6 });
    // 2 · toca no nome (toque), o perfil sobe (envia), e a silhueta revela o Snorlax (prato + o "fom... fom" da tuba)
    toque(2, 0);
    sobe.note(2 * 16 + 1, 0, 0, 0.6);
    drum(cr, 2, 1, '....X...........');
    stabs(met, 2, 'F', [4], { low: 57, n: 4, len: 2 });
    mel(tuba, 2, ['r:4 F2:3 r:1 C2:4 r:4']);
    groove(2, 'F', { leve: true });
    // 3 · Adicionar amigo: toque, e os metais respondem "ta-dá"; o motivo do Pikachu responde
    groove(3, 'Bb');
    toque(3, 4);
    mel(met2, 3, ['r:5 A4+C5:1 r:1 C5+F5:3 r:6'], { vel: 0.8 });
    mel(ld, 3, ['r:10 C5:1 r:1 F5:2 A5:2'], { vel: 0.8 });
    // 4 · Desafiar: toque, o convite sobe e vai (envia), virada de caixa pro corte
    groove(4, 'C7');
    toque(4, 4);
    stabs(met, 4, 'C7', [5], { low: 55, n: 4, len: 2 });
    sobe.note(4 * 16 + 6, 0, 0, 1);
    drum(sn, 4, 1, '............xxXX', { vel: 0.7 });

    // 5 · corte: o Snorlax dormindo. Groove leve (Si♭), o ronco faz o baixo, e o primeiro PLIM no fim do sopro
    groove(5, 'Bb', { leve: true });
    zz.note(5 * 16, 0, 0, 0.8);
    pl.note(5 * 16 + 11, 0, 0, 1);
    padChord(ep, 5, 'Bbmaj7', 16, { low: 53, n: 4, vel: 0.35 });
    // 6 · plim × ronco: ele ronca, os avisos respondem (plim, plim-plim), cada um um degrau acima
    groove(6, 'Bb', { leve: true });
    zz.note(6 * 16, 0, 0, 0.8);
    pl.note(6 * 16 + 8, 2, 0, 1);
    pl.note(6 * 16 + 12, 4, 0, 1);
    pl.note(6 * 16 + 14, 5, 0, 1);
    padChord(ep, 6, 'Gm7', 16, { low: 53, n: 4, vel: 0.35 });
    // 7 · os avisos empilham mais rápido e mais agudo, a caixa rufa, a bolha estoura no 12 (prato, silêncio) e ele
    // toca Entrar (toque + metais) no 14
    for (const [k, r] of [0, 2, 4, 6, 7, 8, 9, 10, 11].entries()) pl.note(7 * 16 + r, 5 + k, 0, 0.8 + 0.02 * k);
    drum(sn, 7, 1, 'x.x.x.x.xxxxxxx.', { vel: 0.6 });
    drum(kk, 7, 1, 'X...X...X...X...');
    bass(bs, 7, 'C7', '0:2 0:2 0:2 0:2 0:1 0:1 0:1 0:1 r:4');
    padChord(cor, 7, 'C7', 12, { low: 55, n: 4, vel: 0.5 });
    drum(cr, 7, 1, '............X...');
    drum(tp, 7, 1, '............X...');
    toque(7, 14);
    stabs(met, 7, 'F', [14], { low: 57, n: 4, len: 2 });

    // 8 · o Duelo na partida nova: groove de partida, o motivo do Pikachu atacando; chute no 6, BOING na barriga no 10
    drum(cr, 8, 1, 'X...............');
    groove(8, 'F', { partida: true });
    mel(ld, 8, ['C5:1 r:1 D5:1 F5:3 r:10']);
    ch.note(8 * 16 + 6, 0, 0, 1);
    bar.note(8 * 16 + 10, 0, 0, 1);
    mel(met2, 8, ['r:12 F4:1 r:1 C4:2'], { vel: 0.6 });
    // 9 · de novo, com choque: zap no chute (4), BOING mais grave (8); o motivo sobe mais
    groove(9, 'Bb', { partida: true });
    mel(ld, 9, ['A5:1 r:1 C6:2 r:12']);
    zp.note(9 * 16 + 4, 0, 0, 1);
    ch.note(9 * 16 + 4, 0, 0, 1);
    bar.note(9 * 16 + 8, -3, 0, 1.1);
    zz.note(9 * 16 + 11, 4, 0, 0.5);
    // 10 · a bola volta da barriga e atravessa a quadra (viaja), entra no outro gol (rede, torcida) e os metais descem
    // "uón-uón-uóóón": 0 × 1
    groove(10, 'C7', { partida: true });
    desce.note(10 * 16, 0, 0, 1);
    rd.note(10 * 16 + 8, 0, 0, 1);
    festa.note(10 * 16 + 8, 0, 0, 0.8);
    drum(cr, 10, 1, '........X.......');
    mel(met2, 10, ['r:9 Ab4:2 G4:2 Gb4:3'], { vel: 0.8 });
    // 11 · o Snorlax volta a roncar; o Pikachu toca "Revanche?" (toque no 10) com o motivo perguntando
    groove(11, 'F', { leve: true });
    zz.note(11 * 16, 0, 0, 0.7);
    toque(11, 10);
    mel(ld, 11, ['r:10 C5:1 r:1 D5:1 F5:3'], { vel: 0.8 });
    // 12 · PLIM. Ele abre um olho e cobre a cabeça (tuba "fom" e breque no 6); volta o ronco no 8
    pl.note(12 * 16, 5, 0, 1.1);
    drum(kk, 12, 1, 'X...............');
    mel(tuba, 12, ['r:4 C2:2 r:10']);
    drum(tp, 12, 1, '....X...........', { vel: 0.7 });
    zz.note(12 * 16 + 8, 0, 0, 0.7);
    mel(bs, 12, ['r:8 F2:2 r:2 C2:2 F2:2']);
    drum(hh, 12, 1, '........x.x.x.xx', { vel: 0.6 });

    // 13 · explicação 1 (toque no nome): o groove inteiro e o motivo com os metais em terças
    drum(cr, 13, 1, 'X...............');
    groove(13, 'F');
    mel(ld, 13, [MOTIVO]);
    mel(met, 13, [MOTIVO], { shift: -12, harm: thirdBelow(MAJOR(5)), vel: 0.6 });
    padChord(cor, 13, 'F', 16, { low: 57, n: 4, vel: 0.5 });
    drum(sn, 13, 1, '............xxXX', { vel: 0.5 });
    // 14 · explicação 2 (amizade e Duelo): sobe um tom (Sol), SOC-CER-MON com as palmas respondendo
    drum(cr, 14, 1, 'X...............');
    groove(14, 'F', { s: 2 });
    mel(ld, 14, [GANCHO.em({ tom: -5 })]);
    mel(met, 14, [GANCHO.em({ tom: -5, oitava: -1 })], { harm: thirdBelow(MAJOR(7)), vel: 0.7 });
    drum(cl, 14, 1, GANCHO.palmas, { vel: 0.9 });
    padChord(cor, 14, 'G', 16, { low: 55, n: 4, vel: 0.6 });
    // 15 · tela final: o acorde de Sol, as sílabas do logo (2, 4, 6) e o fim no PLIM (12)
    stabs(met, 15, 'G', [0], { low: 55, n: 4, len: 2 });
    drum(cl, 15, 1, '..x.x.x.........', { vel: 0.8 });
    mel(bs, 15, ['G2:2 r:10 G1:4']);
    drum(kk, 15, 1, 'X...........X...');
    pl.note(15 * 16 + 12, 7, 0, 1.1);
    stabs(met, 15, 'G', [12], { low: 55, n: 4, len: 4 });
    drum(cr, 15, 1, '............x...', { vel: 0.6 });
    return S;
}
