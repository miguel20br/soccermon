// Mt. Moon: caverna com cara de "8bit Dungeon Level" (MacLeod), mas nossa e com brilho de Clefairy (sininhos no
// alto). Ré menor, 132 BPM, baixo em colcheias insistente, arpejo rápido, melodia com eco; a última volta sobe meio tom.
import { arp, bass, drum, I, mel, midi, Song, transpose } from '../synth.mjs';

export const meta = { titulo: 'Mt. Moon', tela: 'Rota: Mt. Moon' };

export default function mtMoon() {
    const S = new Song({ bpm: 132, bars: 24, tail: 3, loopFrom: 0 });
    const lead = S.part('lead', I.counter, { pan: -0.1, gain: 1.1, echo: { rows: 3, fb: 0.4, mix: 0.3 }, rev: 0.2 });
    const ar = S.part('arp', I.thin, { pan: 0.4, gain: 0.5 });
    const bs = S.part('bass', I.bass, { gain: 0.6 });
    const bell = S.part('brilho', I.bell, { pan: 0.5, gain: 1.8, rev: 0.4 });
    const k = S.part('kick', I.kick, { drum: true });
    const sn = S.part('snare', I.snare, { drum: true, gain: 0.7 });
    const hh = S.part('hat', I.hat, { drum: true, pan: 0.3, gain: 0.7 });
    const tm = S.part('tom', I.tom, { drum: true });

    const A = [
        'D5:4 F5:4 A5:6 G5:2',
        'F5:4 D5:4 Bb4:8',
        'C5:2 E5:2 G5:4 F5:2 E5:2 C5:4',
        'C#5:8 E5:4 A4:4',
        'D5:4 F5:4 A5:4 D6:4',
        'C6:2 Bb5:2 A5:4 F5:4 D5:4',
        'E5:2 F5:2 G5:4 A5:2 Bb5:2 G5:4',
        'A5:8 G5:2 F5:2 E5:2 C#5:2',
    ];
    const B = [
        'G5:6 A5:2 Bb5:4 A5:4',
        'F5:6 E5:2 D5:8',
        'D5:4 F5:4 Bb5:4 A5:4',
        'G5:4 E5:4 C#5:8',
        'Bb5:6 C6:2 D6:4 C6:4',
        'A5:6 G5:2 F5:8',
        'G5:4 F5:4 E5:4 D5:4',
        'C#5:4 E5:4 A5:8',
    ];
    const ACH = ['Dm', 'Bb', 'C', 'A7', 'Dm', 'Bb', 'C', 'A7'];
    const BCH = ['Gm', 'Dm', 'Bb', 'A7', 'Gm', 'Dm', 'Bb', 'A7'];
    mel(lead, 0, A);
    mel(lead, 8, B);
    mel(lead, 16, A, { shift: 1 });
    const CH = [...ACH, ...BCH, ...ACH.map((c) => transpose(c, 1))];
    // sininhos em pentatônica, posições fixas (parece aleatório, sai sempre igual)
    const SPARK = ['A6', 'D7', 'F6', 'C7', 'G6', 'A6', 'D7', 'E6'];
    CH.forEach((c, b) => {
        bass(bs, b, c, '0:2 0:2 8:2 0:2 0:2 5:2 8:2 5:2');
        arp(ar, b, c, { low: 62, step: 1, pattern: [0, 1, 2, 4, 2, 1] });
        if (b % 2 === 1) bell.note(b * 16 + ((b * 5) % 12) + 2, midi(SPARK[b % 8]) + (b >= 16 ? 1 : 0), 2, 0.8);
    });
    drum(k, 0, 24, 'X.....x.X.......');
    drum(sn, 4, 20, '....x.......x...');
    drum(hh, 0, 24, 'x.x.x.x.x.x.x.x.');
    for (const b of [7, 15, 23]) drum(tm, b, 1, '........x.x.x.xx', { pitch: 2 });
    return S;
}
