// Snorlax na pequena área (categoria livre, peça engraçada): o time rival estaciona um Snorlax na frente do gol.
// Ele chega pisando (tuba e tímpano) e senta: BUUM. Tema preguiçoso de oom-pah (tuba, fagote). O atacante tenta: o
// pícolo sobe correndo, chute, BOING na barriga, a torcida "óóó" e o trombone triste "uá-uá". Tenta de novo, mais
// forte: BOING maior. O Snorlax boceja (trombone escorregando pra baixo) e dorme: o RONCO vira o baixo de uma canção
// de ninar na caixinha de música. O atacante vai na ponta do pé (o pizzicato cromático da "Na ponta do pé"), a bola
// rola entre os dedos dele... e entra. Comemoração cochichada (SOC-CER-MON no pícolo, palmas baixinho). "HÃ?" Silêncio.
// Ele vira pro lado (BUUM), volta a roncar, e o tema recomeça.
// Fá maior, 88 BPM com swing. Forma: chegada (1) | tema (4) | 1ª tentativa (2) | tema (1) | 2ª tentativa (2) |
// bocejo (1) | ronco (1) | ninar (4) | ponta do pé e o gol (2) | cochicho (1) | "HÃ?" (1) | vira e ronca (1).
// Loop do compasso 1 ao fim (~55 s). Proposta: cena do Modo história, vídeo engraçado, faixa do álbum.
import { bass, drum, GANCHO, I, ins, mel, padChord, Song, stabs } from '../synth.mjs';
import { barriga, chute, quique, rede, ronco, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Snorlax na pequena área', tela: 'Modo história (cena engraçada)' };

// bocejo: metal que escorrega pra baixo a nota inteira; "uá-uá": trombone com surdina (a altura cai e volta)
const BOCEJO = ins({ vol: 0.38, a: 0.08, r: 0.3, shape: 2, curve: 0.8, sv: 0.9, d: 0.1, slide: -0.12 });
export const UA = ins({
    vol: 0.38,
    a: 0.03,
    r: 0.12,
    shape: 2,
    curve: 0.8,
    sv: 0.85,
    d: 0.06,
    slide: -0.3,
    rep: 0.12,
    trem: 0.35,
});

export default function snorlax() {
    const S = new Song({ bpm: 88, bars: 21, swing: 0.15, tail: 3, loopFrom: 1 });
    const fag = S.part('fagote', I.bassoon, { pan: -0.1, gain: 1.5, rev: 0.15 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6 });
    const pah = S.part('pah', I.stab, { pan: 0.25, gain: 1.1, corte: 2500 });
    const pc = S.part('picolo', I.piccolo, { pan: 0.3, gain: 0.9, rev: 0.2 });
    const ua = S.part('trombone', UA, { pan: 0.2, gain: 0.8, corte: 2200, rev: 0.25 });
    const boc = S.part('bocejo', BOCEJO, { gain: 0.9, corte: 2000, rev: 0.3 });
    const cx = S.part('caixinha', I.bell, { pan: 0.2, gain: 2.6, echo: { rows: 3, fb: 0.25, mix: 0.25 }, rev: 0.4 });
    const ep = S.part('piano', I.epiano, { pan: -0.25, gain: 0.7, rev: 0.3 });
    const pz = S.part('pizzicato', I.pizz, { pan: -0.2, gain: 2, rev: 0.15 });
    const bl = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 0.5 });
    const bar = S.part('barriga', barriga, { drum: true, gain: 1.2, rev: 0.2 });
    const zz = S.part('ronco', ronco, { drum: true, gain: 0.7, rev: 0.15 });
    const ch = S.part('chute', chute, { drum: true, gain: 0.8 });
    const qq = S.part('bola', quique, { drum: true, pan: 0.3, gain: 0.5, rev: 0.2 });
    const rd = S.part('rede', rede, { drum: true, pan: 0.2, gain: 0.6, rev: 0.3 });
    const oh = S.part('torcida', torcida(1.8, 0.15, 1.2), { drum: true, gain: 0.5, rev: 0.3 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.45, corte: 6500, sala: 0.35 }), {
        drum: true,
        gain: 0.8,
        rev: 0.2,
    });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.35 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.5 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.35 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.4 });

    // chegada: três passos pesados e senta
    mel(tuba, 0, ['F2:4 C2:4 F2:4 r:4']);
    drum(tp, 0, 1, 'x...x...x.......', { pitch: -7 });
    bar.note(12, -12, 0, 1.2);

    const oompah = (b, c, cheio = true) => {
        bass(tuba, b, c, '0:4 r:4 5:4 r:4');
        stabs(pah, b, c, [4, 12], { low: 57, n: 3, len: 2 });
        if (cheio) {
            drum(sn, b, 1, '....x.......x...', { vel: 0.7 });
            drum(hh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        }
    };
    const TEMA = ['C4:4 F4:4 A4:6 G4:2', 'Bb4:4 G4:4 E4:8', 'A4:4 C5:4 F5:6 E5:2', 'D5:4 C5:2 Bb4:2 A4:4 G4:4'];
    mel(fag, 1, TEMA);
    for (const [i, c] of ['F', 'C7', 'F', 'Bb'].entries()) oompah(1 + i, c);

    // 1ª tentativa: corre, chuta, BOING, "óóó" e o trombone triste
    mel(fag, 5, ['C4:4 F4:4 r:8']);
    mel(pc, 5, ['r:8 C5:1 D5:1 E5:1 F5:1 G5:1 A5:1 Bb5:1 C6:1']);
    oompah(5, 'F');
    ch.note(6 * 16, 0, 0, 1);
    bar.note(6 * 16 + 1, 0, 0, 1);
    oh.note(6 * 16 + 4, -3, 0, 1);
    mel(ua, 6, ['r:4 C4:4 B3:4 Bb3:4']);
    oompah(6, 'C7', false);
    mel(fag, 7, [TEMA[2]]);
    oompah(7, 'F');
    // 2ª tentativa, mais forte
    mel(pc, 8, ['C5:1 D5:1 E5:1 F5:1 G5:1 A5:1 Bb5:1 C6:1 D6:1 E6:1 F6:1 G6:1 A6:1 Bb6:1 C7:2']);
    oompah(8, 'C7', false);
    drum(sn, 8, 1, '........xxxxXXXX', { vel: 0.8 });
    ch.note(9 * 16, 0, 0, 1.3);
    bar.note(9 * 16 + 1, -5, 0, 1.3);
    drum(cr, 9, 1, '.X..............');
    oh.note(9 * 16 + 4, -5, 0, 1.2);
    mel(ua, 9, ['r:4 Bb3:4 A3:4 Ab3:4']);
    oompah(9, 'F', false);

    // o bocejo, e ele dorme
    mel(boc, 10, ['F4:16']);
    padChord(ep, 10, 'Bb', 16, { low: 53, n: 3, vel: 0.5 });
    zz.note(11 * 16, 0, 0, 1);
    padChord(ep, 11, 'F', 16, { low: 53, n: 3, vel: 0.4 });
    mel(cx, 11, ['r:12 C6:2 r:2'], { vel: 0.6 });

    // canção de ninar: caixinha de música, o ronco fazendo o baixo
    const NINAR = ['A5:6 F5:2 C6:8', 'D6:6 C6:2 Bb5:8', 'A5:4 G5:4 F5:4 A5:4', 'G5:16'];
    mel(cx, 12, NINAR);
    ['F', 'Bb', 'F', 'C7'].forEach((c, i) => {
        zz.note((12 + i) * 16, 0, 0, 0.9);
        padChord(ep, 12 + i, c, 8, { low: 53, n: 3, vel: 0.45 });
        padChord(ep, 12 + i, c, 8, { low: 53, n: 3, vel: 0.35, at: 8 });
    });

    // na ponta do pé: o pizzicato sobe cromático, a bola rola entre os dedos... e entra
    mel(pz, 16, [
        'C4:1 r:1 C#4:1 r:1 D4:1 r:1 D#4:1 r:1 E4:1 r:1 F4:1 r:1 F#4:1 r:1 G4:1 r:1',
        'G#4:1 r:1 A4:1 r:1 A#4:1 r:1 B4:1 r:1 C5:1 r:3 r:4',
    ]);
    drum(bl, 16, 2, '..x...x...x...x.', { vel: 0.6 });
    zz.note(16 * 16, 0, 0, 0.8);
    drum(qq, 16, 1, '..x...x...x...x.', { pitch: 12, vel: 0.4 });
    drum(qq, 17, 1, '.........xxx....', { pitch: 14, vel: 0.35 });
    rd.note(17 * 16 + 12, 0, 0, 0.7);
    // comemoração cochichada
    mel(pc, 18, [GANCHO.em({ tom: 5 })], { vel: 0.45 });
    drum(cl, 18, 1, GANCHO.palmas, { vel: 0.4 });
    padChord(ep, 18, 'F', 16, { low: 53, n: 3, vel: 0.35 });
    // "HÃ?" ... e todo mundo congela
    bar.note(19 * 16, 4, 0, 1);
    mel(tuba, 19, ['C3:1 r:15']);
    // ele vira pro lado (BUUM) e volta a roncar; o tema recomeça
    bar.note(20 * 16, -12, 0, 1.2);
    zz.note(20 * 16 + 3, 0, 0, 0.9);
    mel(tuba, 20, ['r:12 C2:2 E2:2']);
    return S;
}
