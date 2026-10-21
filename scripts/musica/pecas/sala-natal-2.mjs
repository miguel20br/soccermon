// Natal na Sala, valsa 2 (rodada 5): o mesmo tratamento romântico da "Noite Feliz" agora com "We Wish You a Merry
// Christmas" (canção tradicional inglesa do séc. XVI, domínio público), que já é em 3/4. Arranjo nosso: introdução
// com harpa, a melodia nos sinos, a repetição na flauta com cordas em terças e celesta respondendo nas pausas.
// Sol maior, 88 BPM.
import { arp, bass, drum, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Natal na Sala, valsa 2', tela: 'Sala de troféus em dezembro' };

export default function salaNatal2() {
    const S = new Song({ bpm: 88, bars: 20, barLen: 12, tail: 5, loopFrom: 2 });
    const bell = S.part('sinos', I.bell, { pan: -0.1, gain: 3, rev: 0.45 });
    const fl = S.part('flauta', I.counter, { pan: -0.05, gain: 1.2, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.4 });
    const cordas2 = S.part('cordas2', I.strings, { pan: 0.35, gain: 1.4, rev: 0.4 });
    const cel = S.part('celesta', I.bell, { pan: 0.45, gain: 3.5, rev: 0.5 });
    const harpa = S.part('harpa', I.pizz, { pan: 0.3, gain: 1.1, rev: 0.4 });
    const bs = S.part('baixo', I.pizz, { gain: 1 });
    const valsa = S.part('valsa', I.epiano, { pan: 0.2, gain: 0.7, rev: 0.3 });
    const pad = S.part('cordas', I.strings, { gain: 0.9, rev: 0.45 });
    const sl = S.part('treno', I.sleigh, { drum: true, pan: 0.4, gain: 3.5 });

    // "We Wish You a Merry Christmas" (domínio público), em Sol, com a anacruse no fim do compasso anterior
    const WISH = [
        'G5:4 G5:2 A5:2 G5:2 F#5:2',
        'E5:4 E5:4 E5:4',
        'A5:4 A5:2 B5:2 A5:2 G5:2',
        'F#5:4 D5:4 D5:4',
        'B5:4 B5:2 C6:2 B5:2 A5:2',
        'G5:4 E5:4 D5:2 D5:2',
        'E5:4 A5:4 F#5:4',
        'G5:8 r:4',
    ];
    const CH = ['G', 'C', 'A7', 'D', 'B7', 'Em', 'D7', 'G'];
    // introdução (0-1): harpa e a anacruse
    for (const b of [0, 1]) arp(harpa, b, 'G', { low: 55, step: 2, rows: 12, pattern: [0, 1, 2, 4, 5, 6] });
    padChord(pad, 0, 'G', 24, { low: 52, n: 3, vel: 0.7 });
    mel(bell, 1, ['r:8 D5:4']);
    // 1ª vez (2-9): sinos; 2ª vez (10-17): flauta, cordas em terças, celesta respondendo nas pausas
    mel(bell, 2, WISH.slice(0, 7).concat(['G5:8 D5:4']));
    mel(fl, 10, WISH);
    mel(cordas2, 10, WISH, { harm: thirdBelow(MAJOR(7)) });
    mel(cel, 10, ['r:12', 'r:8 G6:2 B6:2', 'r:12', 'r:8 D6:2 F#6:2', 'r:12', 'r:12', 'r:12', 'r:8 D6:2 B5:2']);
    // final (18-19)
    mel(bell, 18, ['B5:4 A5:4 F#5:4', 'G5:12']);
    [...CH, ...CH, 'D7', 'G'].forEach((c, i) => {
        const b = i + 2;
        bass(bs, b, c, '0:4 r:8', { oct: 12 });
        if (b < 10) stabs(valsa, b, c, [4, 8], { low: 59, n: 3, vel: 0.7 });
        else arp(harpa, b, c, { low: 55, step: 2, rows: 12, pattern: [0, 1, 2, 4, 5, 6] });
        if (b >= 10) padChord(pad, b, c, 12, { low: 52, n: 3, vel: 0.8 });
    });
    drum(sl, 2, 8, 'x.o.x.o.x.o.');
    drum(sl, 18, 2, 'x.o.x.o.x.o.');
    return S;
}
