// A última partida (categoria livre, peça séria): um veterano da copa entra em quadra pela última vez. O vestiário
// vazio (só o relógio e o piano), uma lembrança da primeira partida (caixinha de música, o assovio do moleque que ele
// era, a primeira vez que a torcida cantou o SOC-CER-MON pra ele), o último tempo (cordas, metais, o coração, a torcida
// crescendo), o apito final (curto, curto, longo) e a homenagem: o ginásio inteiro bate palma no ritmo do SOC-CER-MON,
// o tema volta um tom acima com tudo, e no fim sobram uma bola quicando e dois tiques do relógio. Depois, silêncio.
// Ré♭ maior → Lá♭ (lembrança) → Ré♭ → Mi♭ maior. 72 BPM (vestiário), 100 (lembrança), 76 (último tempo e homenagem).
// Tema: sobe uma sexta na 1ª nota (Lá♭–Fá), desce devagar; 8 compassos que terminam suspensos (Lá♭7sus4).
// Forma: vestiário (8) | lembrança (8) | último tempo (8) | apito (1) | palmas (2) | homenagem (6) | fim (2).
// Sem loop (~1min50). Proposta: créditos, fim do modo carreira (aposentadoria de um Pokémon), faixa do álbum.
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow, transpose } from '../synth.mjs';
import { ASSOVIO, apito, quique, torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'A última partida', tela: 'Créditos / fim de carreira' };

const T = [
    'Ab4:4 F5:6 Eb5:2 Db5:4',
    'C5:4 Eb5:4 Ab4:8',
    'Bb4:4 Db5:4 Gb5:6 F5:2',
    'F5:4 Eb5:4 Db5:4 Eb5:4',
    'Ab4:4 F5:6 Eb5:2 Db5:4',
    'C5:4 Ab5:6 G5:2 F5:4',
    'Gb5:4 F5:2 Eb5:2 Db5:4 Bb4:4',
    'Db5:6 C5:2 Eb5:8',
];
const TCH = ['Db', 'Ab', 'Bbm7', 'Gbmaj7', 'Db', 'Fm7', 'Gbmaj7', 'Ab7sus4'];
// contracanto em notas longas (terças e sétimas), por baixo
const CONTRA = [
    'F4:8 Ab4:8',
    'Eb4:8 C4:8',
    'Db4:8 F4:8',
    'Bb3:8 Db4:8',
    'F4:16',
    'Eb4:8 C4:8',
    'Db4:8 Bb3:8',
    'Gb4:8 Eb4:8',
];

export default function ultimaPartida() {
    const S = new Song({
        bpm: 72,
        bars: 35,
        tail: 6,
        bpmAt: (b) => (b < 8 ? 72 : b < 15 ? 100 : 76),
    });
    const ep = S.part('piano', I.epiano, { pan: -0.1, gain: 1.3, rev: 0.35 });
    const cx = S.part('caixinha', I.bell, { pan: 0.15, gain: 1.6, echo: { rows: 3, fb: 0.2, mix: 0.2 }, rev: 0.35 });
    const asv = S.part('assovio', ASSOVIO, { pan: 0.35, gain: 1.1, rev: 0.35 });
    const pz = S.part('pizzicato', I.pizz, { pan: -0.3, gain: 1, rev: 0.2 });
    const str = S.part('cordas', I.strings, { gain: 2.2, rev: 0.4 });
    const pad = S.part('pad', I.strings, { gain: 0.8, rev: 0.4 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.6, corte: 2400, rev: 0.35 });
    const fl = S.part('flauta', I.counter, { pan: -0.25, gain: 0.6, rev: 0.35 });
    const fl2 = S.part('flauta2', I.counter, { pan: 0.35, gain: 0.5, rev: 0.35 });
    const bs = S.part('baixo', I.bass, { gain: 0.38, corte: 900 });
    const tique = S.part('relogio', I.block, { drum: true, pan: -0.45, gain: 0.7, rev: 0.2 });
    const cor = S.part('coracao', I.kick, { drum: true, gain: 0.35 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3, gain: 0.7 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.4 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.22, rev: 0.3 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45, rev: 0.3 });
    const tcLonga = S.part('torcida', torcida(28, 22, 3), { drum: true, gain: 0.5, rev: 0.3 });
    const tcGrande = S.part('ovacao', torcida(14, 0.8), { drum: true, gain: 0.55, rev: 0.4 });
    const apC = S.part('apito', apito(0.16), { drum: true, gain: 0.6, rev: 0.45 });
    const apL = S.part('apitoLongo', apito(1.3), { drum: true, gain: 0.55, rev: 0.45 });
    const memoria = S.part('palmasMemoria', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.6 }), {
        drum: true,
        gain: 0.9,
        rev: 0.45,
    });
    const pa1 = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.5 }), {
        drum: true,
        pan: -0.25,
        gain: 1,
        rev: 0.4,
    });
    const pa2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.6, atraso: 0.015, tom: -1 }), {
        drum: true,
        pan: 0.3,
        gain: 0.9,
        rev: 0.4,
    });
    const qq = S.part('bola', quique, { drum: true, pan: 0.2, gain: 0.6, rev: 0.45 });

    // vestiário: o relógio e o piano sozinhos; o baixo e as cordas chegam na 2ª metade
    mel(ep, 0, T);
    TCH.forEach((c, b) => {
        padChord(ep, b, c, 8, { low: 49, n: 3, vel: 0.4 });
        padChord(ep, b, c, 8, { low: 49, n: 3, vel: 0.3, at: 8 });
        drum(tique, b, 1, 'x...x...x...x...');
        if (b >= 4) {
            bass(bs, b, c, '0:8 5:8', { vel: 0.8 });
            padChord(pad, b, c, 16, { low: 53, n: 4, vel: 0.5 });
        }
    });

    // lembrança: a primeira partida, em Lá♭ e mais ligeira: caixinha de música, pizzicato, o assovio do moleque
    mel(cx, 8, T.slice(0, 6), { shift: 7 });
    mel(asv, 9, ['r:8 Bb5:2 C6:2 Eb6:4']);
    mel(asv, 11, ['r:12 Ab5:2 Bb5:2']);
    TCH.slice(0, 6).forEach((c0, i) => {
        const c = transpose(c0, 7);
        const b = 8 + i;
        bass(pz, b, c, '0:4 r:4 5:4 r:4', { oct: 12, vel: 0.9 });
        padChord(pz, b, c, 1, { low: 60, n: 3, vel: 0.5, at: 4 });
        padChord(pz, b, c, 1, { low: 60, n: 3, vel: 0.5, at: 12 });
        drum(sh, b, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.7 });
        drum(k, b, 1, 'x.......x.......');
    });
    // a primeira vez que a torcida cantou pra ele: o SOC-CER-MON no assovio e na caixinha, palmas ao longe
    mel(asv, 14, [GANCHO.em({ tom: 8, oitava: -1 })]);
    mel(cx, 14, [GANCHO.em({ tom: 8, oitava: -1 })]);
    bass(pz, 14, 'Ab', '0:4 r:4 5:4 r:4', { oct: 12, vel: 0.9 });
    drum(memoria, 14, 1, GANCHO.palmas);
    drum(sh, 14, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.6 });
    // a lembrança se desfaz (o andamento cai pra 76)
    mel(cx, 15, ['Eb6:4 C6:4 Ab5:8'], { vel: 0.6 });
    padChord(pad, 15, 'Ab', 16, { low: 56, n: 4, vel: 0.5 });

    // o último tempo: as cordas cantam o tema, os metais no contracanto, o coração e a torcida crescendo
    mel(str, 16, T);
    mel(met, 16, CONTRA);
    mel(fl, 20, T.slice(4), { shift: 12, vel: 0.8 });
    tcLonga.note(16 * 16, 0, 0, 1);
    TCH.forEach((c, i) => {
        const b = 16 + i;
        bass(bs, b, c, '0:6 0:2 5:8');
        padChord(pad, b, c, 16, { low: 53, n: 4, vel: 0.6 });
        drum(cor, b, 1, 'X..x............', { pitch: -4 });
        if (i >= 4) drum(tp, b, 1, 'x...............');
    });
    drum(tp, 23, 1, '........x.x.xxxx', { vel: 0.7 });

    // o apito final: curto, curto, longo; o ginásio levanta
    apC.note(24 * 16, 0, 0, 1);
    apC.note(24 * 16 + 3, 0, 0, 1);
    apL.note(24 * 16 + 6, 0, 0, 1);
    padChord(pad, 24, 'Ab7sus4', 16, { low: 53, n: 4, vel: 0.35 });
    tcGrande.note(24 * 16 + 10, 0, 0, 1);

    // a homenagem: palmas no ritmo do SOC-CER-MON, devagar; os metais cantam o gancho em Mi♭
    const PALMA = 'x.....x.....x...';
    for (let b = 25; b <= 32; b++) {
        drum(pa1, b, 1, PALMA, { vel: b < 27 ? 1 : 0.6 });
        drum(pa2, b, 1, PALMA, { vel: b < 27 ? 0.9 : 0.5 });
    }
    padChord(pad, 25, 'Eb', 32, { low: 51, n: 4, vel: 0.6 });
    bass(bs, 25, 'Eb', '0:16', { vel: 0.7 });
    bass(bs, 26, 'Eb', '0:16', { vel: 0.7 });
    drum(tp, 25, 1, 'x.....x.....x...', { vel: 0.6 });
    drum(tp, 26, 1, 'x.....x.....xxxx', { vel: 0.8 });
    mel(met, 26, [GANCHO.em({ tom: 3, oitava: -1, ritmo: [6, 6, 4, 0] })], { vel: 1.1 });

    // o tema um tom acima, com tudo
    const T2 = T.slice(0, 6);
    mel(str, 27, T2, { shift: 2 });
    mel(met, 27, T2, { shift: 2, vel: 0.8 });
    mel(fl, 27, T2, { shift: 14 });
    mel(fl2, 27, T2, { shift: 14, harm: thirdBelow(MAJOR(3)) });
    TCH.slice(0, 6).forEach((c0, i) => {
        const c = transpose(c0, 2);
        const b = 27 + i;
        bass(bs, b, c, '0:6 0:2 5:8');
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.7 });
        drum(tp, b, 1, 'x.......x.......', { vel: 0.7 });
    });
    drum(cr, 27, 1, 'X...............');
    // cadência: Lá♭maj7, Si♭7sus4 e o gancho bem devagar, resolvendo em Mi♭
    mel(str, 31, [T[6]], { shift: 2 });
    mel(str, 32, ['Eb5:6 D5:2 F5:8']);
    mel(fl, 31, ['Ab6:4 G6:2 F6:2 Eb6:4 C6:4', 'Eb6:6 D6:2 F6:8']);
    for (const [b, c] of [
        [31, 'Abmaj7'],
        [32, 'Bb7sus4'],
    ]) {
        bass(bs, b, c, '0:8 5:8');
        padChord(pad, b, c, 16, { low: 55, n: 4, vel: 0.75 });
        drum(tp, b, 1, 'x.......x.......', { vel: 0.8 });
    }
    drum(tp, 32, 1, '............xxxx', { vel: 0.9 });
    mel(met, 33, ['Bb4:4 G4:4 Eb5:8'], { vel: 1.1 });
    mel(str, 33, ['Bb5:4 G5:4 Eb6:8']);
    drum(pa1, 33, 1, 'x...x...x.......');
    drum(pa2, 33, 1, 'x...x...x.......');
    bass(bs, 33, 'Eb', '0:16');
    padChord(pad, 33, 'Eb', 16, { low: 51, n: 5, vel: 0.8 });
    drum(cr, 33, 1, '........X.......');
    drum(tp, 33, 1, '........X.......');
    // fim: o acorde segura, uma bola quica, o relógio dá dois tiques e para
    padChord(str, 34, 'Eb', 16, { low: 51, n: 5, vel: 0.6 });
    padChord(pad, 34, 'Eb', 16, { low: 51, n: 4, vel: 0.5 });
    cx.note(34 * 16, 87, 16, 0.6);
    bass(bs, 34, 'Eb', '0:16', { vel: 0.6 });
    qq.note(34 * 16 + 5, 0, 0, 0.7);
    drum(tique, 34, 1, '..........x...x.');
    return S;
}
