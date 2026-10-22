// Cerulean: água e cidade azul. No lugar de "Barque sur le lac" (Komiku), que o Miguel gostou mas destoava do resto.
// Ré lídio em 6/8 (barco balançando), 99 BPM na semínima. Arpejo em onda, bolhas subindo, percussão leve.
import { arp, bass, drum, I, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Cerulean', tela: 'Rota: Cerulean' };

export default function cerulean() {
    const S = new Song({ bpm: 99, bars: 16, barLen: 12, tail: 4, loopFrom: 0 });
    const lead = S.part('lead', I.counter, { pan: -0.1, gain: 1.1, echo: { rows: 4, fb: 0.35, mix: 0.25 }, rev: 0.35 });
    const harm = S.part('harm', I.pulse, { pan: 0.35, gain: 0.45, rev: 0.3 });
    const ar = S.part('ondas', I.bell, { pan: 0.4, gain: 0.9, rev: 0.4 });
    const pad = S.part('pad', I.pad, { gain: 0.9, rev: 0.3 });
    const bs = S.part('bass', I.bass, { gain: 0.5 });
    const bub = S.part('bolhas', I.whistle, { drum: true, pan: -0.4, gain: 0.35, rev: 0.4 }); // apito curtinho e agudo
    const sh = S.part('shaker', I.shaker, { drum: true, pan: 0.3 });
    const k = S.part('kick', I.kick, { drum: true, gain: 0.5 });
    const blk = S.part('bloco', I.block, { drum: true, gain: 0.4, pan: -0.2 });

    const M = [
        'F#5:6 A5:2 G#5:2 F#5:2',
        'E5:6 B4:6',
        'F#5:2 A5:2 C#6:2 B5:4 A5:2',
        'G#5:6 E5:6',
        'D5:2 F#5:2 A5:2 F#5:6',
        'B5:6 A5:2 F#5:2 D5:2',
        'E5:2 G5:2 B5:2 D6:4 C#6:2',
        'A5:12',
    ];
    const CH = ['Dmaj7', 'E', 'Dmaj7', 'E', 'Bm7', 'Gmaj7', 'Em7', 'A'];
    mel(lead, 0, [...M, ...M.slice(0, 7), 'D6:12']);
    mel(harm, 8, M, { harm: thirdBelow([2, 4, 6, 8, 9, 11, 1]) });
    [...CH, ...CH].forEach((c, b) => {
        arp(ar, b, c, { low: 62, step: 2, rows: 12, pattern: [0, 1, 2, 3, 2, 1] });
        padChord(pad, b, c, 12, { low: 54, n: 3, vel: 0.8 });
        bass(bs, b, c, '0:6 5:6');
        if (b % 2 === 0) bub.note(b * 12 + 9, 12, 0, 0.8);
    });
    drum(sh, 0, 16, 'x.o.o.x.o.o.');
    drum(k, 0, 16, 'x.....x.....');
    drum(blk, 4, 12, '......x.....');
    return S;
}
