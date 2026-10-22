// Tema da Equipe Rocket (rodada 6): o tema próprio dos vilões, pra tela deles; a Partida: Equipe Rocket cita o
// motivo. Vilões trapalhões: espionagem com balanço, cromático, mais malandro que assustador. Dó menor, 112 BPM, swing.
// MOTIVO (2 compassos, Cm7 | G7b9): sobe pelo Fá# cromático até o Sol, escorrega de volta e cai no Sol7b9.
// Assinatura: o "trio" (três acordes curtos: os três vilões) no fim das frases.
// Forma: intro (2): baixo na ponta do pé e o trio | A (8): o órgão pergunta, os metais respondem embaixo; no fim,
// SOC-CER-MON em menor, debochado, com três palmas | B (8): "o plano", Lá♭ lídio, órgão e lead trocando de compasso em
// compasso | A' (8) meio tom acima (Dó# menor) | virada (1) em Sol7b9. Loop do compasso 2 ao fim.
// Rodada 7: as três palmas do SOC-CER-MON viraram o clap clássico do 808 (I.clap808); o resto igual.
// Rodada 7b: só o clap mudou: −5 dB, passa-baixa em 6,5 kHz, sala mais molhada e 1 semitom abaixo (debochado).
import { bass, drum, GANCHO, I, MINOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Tema da Equipe Rocket', tela: 'Equipe Rocket' };

export const MOTIVO = {
    mel: ['G4:1 r:1 C5:1 r:1 Eb5:2 F#5:1 G5:3 r:2 F#5:1 F5:1 Eb5:2', 'C5:2 Eb5:1 Ab5:3 G5:2 r:2 B4:2 D5:2 F5:2'],
    acordes: ['Cm7', 'G7b9'],
};

export default function temaRocket() {
    const S = new Song({ bpm: 112, bars: 27, swing: 0.12, tail: 3, loopFrom: 2 });
    const org = S.part('orgao', I.organ, { pan: -0.2, gain: 1.6, echo: { rows: 3, fb: 0.2, mix: 0.15 } });
    const lead = S.part('lead', I.thin, { pan: 0.15, gain: 1.3, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const metais = S.part('metais', I.brass, { pan: 0.25, gain: 0.8, rev: 0.15 });
    const harm = S.part('terças', I.pulse, { pan: 0.35, gain: 0.45 });
    const trio = S.part('trio', I.stab, { pan: 0.1, gain: 1.4, rev: 0.15 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const ch = S.part('guitarra', I.chank, { pan: -0.35, gain: 3 });
    const str = S.part('cordas', I.strings, { gain: 0.8, rev: 0.3 });
    const k = S.part('bumbo', I.kick, { drum: true });
    const sn = S.part('caixa', I.snare, { drum: true });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 1.4 });
    const bl = S.part('bloco', I.block, { drum: true, pan: -0.3, gain: 1.2 });
    const gang = S.part('palmas', I.clap808.com({ ganho: 0.56, corte: 6500, sala: 0.5, tom: -1 }), {
        drum: true,
        gain: 1.6,
        rev: 0.25,
    });
    const cr = S.part('crash', I.crash, { drum: true });

    const BASS = '0:1 r:1 8:1 r:1 3:1 r:1 4:1 5:2 r:1 s:1 5:1 4:1 3:1 r:2';
    const TRIO = [
        [8, 1],
        [10, 1],
        [12, 2],
    ];
    const groove = (b, cheio) => {
        drum(k, b, 1, cheio ? 'X..x....X.x...x.' : 'X.....x.X.......');
        drum(sn, b, 1, '....X..o.o..X..o');
        drum(hh, b, 1, cheio ? 'xxXxxxXxxxXxxxXx' : 'x.x.x.x.x.x.x.x.');
        drum(bl, b, 1, 'x..x..x...x..x..');
    };
    // intro: na ponta do pé (baixo e bloco), e o trio
    bass(bs, 0, 'Cm7', BASS);
    bass(bs, 1, 'G7b9', BASS);
    drum(bl, 0, 2, 'x..x..x...x..x..');
    drum(hh, 1, 1, 'x.x.x.x.........');
    stabs(trio, 1, 'G7b9', TRIO, { low: 59, n: 4 });

    const A_CH = ['Cm7', 'G7b9', 'Cm7', 'Ab7', 'Fm7', 'Db7', 'Cm7', 'G7b9'];
    const A_ORG = [
        ...MOTIVO.mel,
        'r:16',
        'r:16',
        'F5:2 Ab5:1 C6:3 B5:2 r:2 Ab5:2 F5:2 C5:2',
        'Db5:2 F5:1 Ab5:3 Cb6:2 r:2 Ab5:2 F5:2 Db5:2',
        GANCHO.em({ menor: true }),
        'r:16',
    ];
    const A_RESP = [
        'r:16',
        'r:16',
        'G3:1 r:1 C4:1 r:1 Eb4:2 F#4:1 G4:3 r:2 F#4:1 F4:1 Eb4:2',
        'Eb4:2 Gb4:1 Ab4:3 Gb4:2 r:2 Eb4:2 C4:2 Eb4:2',
        'r:16',
        'r:16',
        'r:16',
        'r:8 B3:2 D4:2 F4:2 Ab4:2',
    ];
    const B_CH = ['Abmaj7', 'G7', 'Abmaj7', 'G7b9', 'Fm7', 'Bb7', 'Ebmaj7', 'G#7'];
    const B_LEAD = [
        'C6:4 Bb5:2 Ab5:2 G5:8',
        'r:16',
        'Eb6:4 D6:2 C6:2 G5:8',
        'r:16',
        'F5:3 Ab5:3 C6:2 Eb6:4 D6:2 C6:2',
        'r:16',
        'G5:3 Bb5:3 D6:2 G6:8',
        'r:16',
    ];
    const B_ORG = [
        'r:16',
        'r:4 F5:2 Ab5:2 B5:4 D6:4',
        'r:16',
        'r:4 Ab5:2 B5:2 D6:2 F6:2 Ab6:4',
        'r:16',
        'D6:3 Bb5:3 F5:2 Ab5:8',
        'r:16',
        'G#5:2 B#5:2 D#6:2 F#6:2 G#6:8',
    ];
    const parts = [
        [2, A_CH, A_ORG, A_RESP, 0],
        [10, B_CH, B_ORG, null, 0],
        [18, A_CH, A_ORG, A_RESP, 1],
    ];
    for (const [b0, CH, O, R, s] of parts) {
        mel(org, b0, O, { shift: s });
        if (R) mel(metais, b0, R, { shift: s });
        else mel(lead, b0, B_LEAD);
        if (s) mel(harm, b0, O, { shift: s, harm: thirdBelow(MINOR(s)) });
        CH.forEach((c0, i) => {
            const c = transpose(c0, s);
            const b = b0 + i;
            groove(b, s > 0 || (b0 === 10 && i >= 4));
            bass(bs, b, c, BASS);
            stabs(ch, b, c, [2, 6, 9, 14], { low: 60, n: 3 });
            if (b0 === 10 || s) padChord(str, b, c, 16, { low: 58, n: 4, vel: 0.8 });
            if (i % 4 === 3) stabs(trio, b, c, TRIO, { low: 59, n: 4 });
        });
        drum(cr, b0, 1, 'X...............');
    }
    // SOC-CER-MON debochado (compasso 8 de cada A): três palmas secas respondem
    drum(gang, 9, 1, 'X...X...X.......');
    drum(gang, 25, 1, 'X...X...X.......');
    // virada: Sol7b9, o trio e a caixa, de volta pro Dó menor
    bass(bs, 26, 'G7b9', BASS);
    stabs(trio, 26, 'G7b9', [[0, 1], [2, 1], [4, 2], ...TRIO], { low: 59, n: 4 });
    mel(org, 26, ['r:8 B4:2 D5:2 F5:2 Ab5:2']);
    groove(26, true);
    drum(sn, 26, 1, '........xxXxXXXX');
    return S;
}
