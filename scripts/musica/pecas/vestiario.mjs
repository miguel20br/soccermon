// Vestiário (rodada 3): mais tenso, hora de estrategizar. Disco em Mi menor, 116 BPM, na pegada de "Disco Cat"
// (Komiku) mas composto por nós: bumbo em todo tempo, chimbal aberto no contratempo, baixo de oitava, clavinete
// insistente, cordas, e um tique de relógio. Frases que não resolvem (B7b9) e um trecho meio tom acima.
import { bass, drum, I, mel, padChord, Song, stabs, transpose } from '../synth.mjs';

export const meta = { titulo: 'Vestiário (disco tenso)', tela: 'Intervalo' };

export default function vestiario() {
    const S = new Song({ bpm: 116, bars: 24, swing: 0.04, tail: 3, loopFrom: 4 });
    const lead = S.part('lead', I.thin, { pan: -0.1, gain: 1.2, echo: { rows: 3, fb: 0.3, mix: 0.25 }, rev: 0.15 });
    const bs = S.part('bass', I.slap, { gain: 0.9 });
    const clav = S.part('clav', I.clav, { pan: 0.4, gain: 0.6 });
    const str = S.part('strings', I.strings, { gain: 1.1, rev: 0.25 });
    const k = S.part('kick', I.kick, { drum: true });
    const cl = S.part('clap', I.clap, { drum: true });
    const oh = S.part('ohat', I.ohat, { drum: true, pan: 0.3 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.4 });
    const tick = S.part('tick', I.block, { drum: true, pan: -0.25, gain: 1.6 });
    const tm = S.part('tom', I.tom, { drum: true });
    const cr = S.part('crash', I.crash, { drum: true });

    const A_CH = ['Em7', 'Cmaj7', 'Am7', 'B7b9', 'Em7', 'Cmaj7', 'Am7', 'B7b9'];
    const B_CH = ['Cmaj7', 'B7b9', 'Em7', 'Em7', 'Am7', 'B7sus4', 'B7b9', 'B7b9'];
    const A = [
        'r:4 B4:2 E5:2 G5:3 F#5:1 E5:2 D5:2',
        'E5:6 r:2 G5:2 F#5:2 E5:2 B4:2',
        'C5:3 E5:3 A5:2 G5:2 E5:2 C5:2 A4:2',
        'B4:4 C5:2 D#5:2 F#5:4 A5:4',
        'r:4 B4:2 E5:2 G5:3 F#5:1 E5:2 D5:2',
        'E5:6 r:2 B5:2 A5:2 G5:2 E5:2',
        'A5:3 G5:3 E5:2 C5:2 D5:2 E5:2 F#5:2',
        'D#5:4 r:2 C5:2 B4:8',
    ];
    const B = [
        'G5:2 G5:2 E5:2 G5:2 B5:4 A5:2 G5:2',
        'F#5:2 F#5:2 D#5:2 F#5:2 A5:4 G5:2 F#5:2',
        'G5:4 E5:4 B4:4 E5:4',
        'F#5:2 G5:2 A5:2 B5:2 D6:4 B5:4',
        'C6:3 B5:3 A5:2 G5:2 E5:2 C5:2 E5:2',
        'E5:4 F#5:4 A5:4 B5:4',
        'C6:4 B5:2 A5:2 F#5:4 D#5:4',
        'B4:8 r:8',
    ];
    const CH = ['Em7', 'Em7', 'Em7', 'B7b9', ...A_CH, ...B_CH, ...A_CH.slice(0, 4).map((c) => transpose(c, 1))];
    mel(lead, 4, A);
    mel(lead, 12, B);
    mel(lead, 20, A.slice(0, 4), { shift: 1 });
    CH.forEach((c, b) => {
        bass(bs, b, c, '0:2 8:2 0:2 8:2 0:2 8:2 0:1 8:1 s:2', { vel: b < 2 ? 0.7 : 1 });
        drum(tick, b, 1, 'x.x.x.x.x.x.x.x.', { vel: b < 4 ? 1.2 : 0.8 });
        if (b >= 2) stabs(clav, b, c, [0, 3, 6, 8, 11, 14], { low: 64, n: 3 });
        if (b >= 4) padChord(str, b, c, 16, { low: 55, n: 4, vel: 0.9 });
    });
    drum(k, 2, 22, 'x...x...x...x...');
    drum(cl, 4, 20, '....x.......x...');
    drum(oh, 4, 20, '..x...x...x...x.');
    drum(sh, 0, 24, 'xoxoxoxoxoxoxoxo');
    for (const b of [11, 19, 23]) drum(tm, b, 1, '........x.x.xxxx', { pitch: 5 });
    for (const b of [4, 12, 20]) drum(cr, b, 1, 'X...............');
    return S;
}
