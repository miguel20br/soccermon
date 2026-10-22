// Natal na Sala v2 (rodada 4): mais romântica e com melodia natalina de domínio público: "Noite Feliz" ("Stille
// Nacht", Franz Gruber, 1818), que já é valsa. Arranjo nosso: abre com a nossa valsa nos sinos, a "Noite Feliz" entra
// na flauta com cordas em terças e harpa (pizzicato em arpejo), e fecha com a nossa valsa. Sol maior, 84 BPM, 3/4.
import { arp, bass, drum, I, MAJOR, mel, padChord, Song, stabs, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Natal na Sala v2', tela: 'Sala de troféus em dezembro' };

export default function salaNatal() {
    const S = new Song({ bpm: 84, bars: 24, barLen: 12, tail: 5, loopFrom: 0 });
    const bell = S.part('sinos', I.bell, { pan: -0.1, gain: 3, rev: 0.45 });
    const fl = S.part('flauta', I.counter, { pan: -0.05, gain: 1.2, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.4 });
    const cel = S.part('cordas2', I.strings, { pan: 0.35, gain: 1.4, rev: 0.4 });
    const harpa = S.part('harpa', I.pizz, { pan: 0.3, gain: 1.1, rev: 0.4 });
    const bs = S.part('baixo', I.pizz, { gain: 1 });
    const valsa = S.part('valsa', I.epiano, { pan: 0.2, gain: 0.7, rev: 0.3 });
    const pad = S.part('cordas', I.strings, { gain: 0.9, rev: 0.45 });
    const sl = S.part('treno', I.sleigh, { drum: true, pan: 0.4, gain: 3.5 });

    // nossa valsa (rodada 3), metade
    const VALSA = [
        'D5:4 G5:4 B5:4',
        'A5:4 G5:4 D5:4',
        'E5:4 G5:4 C6:4',
        'B5:8 G5:4',
        'G5:4 B5:4 E6:4',
        'D6:4 C6:4 A5:4',
        'F#5:4 A5:4 C6:4',
        'B5:12',
    ];
    const VALSA_FIM = ['B5:4 D6:4 G5:4', 'A5:4 F#5:4 C6:4', 'B5:6 A5:2 G5:4', 'G5:12'];
    // "Noite Feliz" (domínio público), em Sol
    const NOITE = [
        'D5:3 E5:1 D5:2 B4:6',
        'D5:3 E5:1 D5:2 B4:6',
        'A5:4 A5:2 F#5:6',
        'G5:4 G5:2 D5:6',
        'E5:4 E5:2 G5:3 F#5:1 E5:2',
        'D5:3 E5:1 D5:2 B4:6',
        'E5:4 E5:2 G5:3 F#5:1 E5:2',
        'D5:3 E5:1 D5:2 B4:6',
        'A5:4 A5:2 C6:3 A5:1 F#5:2',
        'G5:6 B5:6',
        'G5:3 D5:1 B4:2 D5:3 C5:1 A4:2',
        'G4:12',
    ];
    const CH_VALSA = ['G', 'G', 'C', 'G', 'Em', 'Am', 'D7', 'G'];
    const CH_NOITE = ['G', 'G', 'D7', 'G', 'C', 'G', 'C', 'G', 'D7', 'G', 'D7', 'G'];
    const CH_FIM = ['G', 'D7', 'G', 'G'];
    mel(bell, 0, VALSA);
    mel(fl, 8, NOITE);
    mel(cel, 12, NOITE.slice(4), { harm: thirdBelow(MAJOR(7)) });
    mel(bell, 20, VALSA_FIM);
    [...CH_VALSA, ...CH_NOITE, ...CH_FIM].forEach((c, b) => {
        bass(bs, b, c, '0:4 r:8', { oct: 12 });
        if (b < 8 || b >= 20) stabs(valsa, b, c, [4, 8], { low: 59, n: 3, vel: 0.7 });
        else arp(harpa, b, c, { low: 55, step: 2, rows: 12, pattern: [0, 1, 2, 4, 5, 6] });
        if (b >= 8) padChord(pad, b, c, 12, { low: 52, n: 3, vel: 0.8 });
    });
    drum(sl, 0, 8, 'x.o.x.o.x.o.');
    drum(sl, 20, 4, 'x.o.x.o.x.o.');
    return S;
}
