// Campeão v3: mais lenta que a v2 (100 BPM) e misturando as duas: a melodia da v1 ("pam pam-pam PAAM") com o
// rufar, os tímpanos, as terças e a subida de Dó pra Ré da v2. Final em Ré com nona, arpejo e prato.
// Rodada 5 (pergunta e resposta): a fanfarra pergunta, a torcida responde com SOC-CER-MON e palmas; no fim, o
// gancho em Ré no agudo e o "hey hey".
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Campeão v3', tela: 'Campeão', lufs: -15 };

export default function campeao() {
    const S = new Song({ bpm: 100, bars: 8, tail: 3 });
    const br = S.part('metais', I.brass, { pan: -0.15, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.25 });
    const br2 = S.part('metais2', I.brass, { pan: 0.25, gain: 0.75, rev: 0.25 });
    const lead = S.part('lead', I.lead, { pan: 0, gain: 0.5 });
    const tu = S.part('tuba', I.tuba, { gain: 0.6 });
    const pad = S.part('pad', I.pad, { gain: 1.1, rev: 0.3 });
    const ar = S.part('arp', I.arp, { pan: 0.5, gain: 1.4, echo: { rows: 1, fb: 0.4, mix: 0.4 }, rev: 0.3 });
    const sn = S.part('snare', I.snare, { drum: true });
    const k = S.part('kick', I.kick, { drum: true });
    const ti = S.part('timp', I.timp, { gain: 0.5, drum: true });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });
    const gang = S.part('palmas', I.palmas, { drum: true, gain: 4, rev: 0.2 });

    drum(sn, 0, 1, 'oooooooxxxxxXXXX');
    drum(ti, 0, 1, 'X.......X...X.X.');
    padChord(pad, 0, 'G', 16, { low: 55 });

    const C = MAJOR(0);
    const D = MAJOR(2);
    const M1 = [
        'C5:2 C5:1 C5:1 G5:4 F5:2 E5:1 F5:1 G5:4',
        'A5:2 A5:1 A5:1 B5:2 B5:1 B5:1 C6:8',
        GANCHO.bar, // a resposta: SOC-CER-MON
    ];
    const M2 = ['D5:2 D5:1 D5:1 A5:4 G5:2 F#5:1 G5:1 A5:4', 'B5:2 B5:1 B5:1 C#6:2 C#6:1 C#6:1 D6:8'];
    mel(br, 1, M1);
    mel(br2, 1, M1, { harm: thirdBelow(C) });
    mel(br, 4, M2);
    mel(br2, 4, M2, { harm: thirdBelow(D) });
    mel(br, 6, ['D6:16', 'D6:12 r:4']);
    mel(br2, 6, ['A5:16', 'A5:12 r:4']);
    mel(lead, 6, ['r:8 F#6:2 A6:2 D7:4', GANCHO.em({ tom: 2 })]);
    drum(gang, 3, 1, 'X..X..X.....X.X.');
    drum(gang, 7, 1, 'X..X..X.....X.X.');
    // acordes de meio em meio compasso
    const HALF = [null, ['C', 'C'], ['F', 'G'], ['C', 'G'], ['D', 'D'], ['G', 'A']];
    for (let b = 1; b <= 5; b++) {
        const [c1, c2] = HALF[b];
        bass(tu, b, c1, '0:4 5:4 r:8');
        bass(tu, b, c2, 'r:8 0:4 5:4');
        padChord(pad, b, c1, 8, { vel: 0.7 });
        padChord(pad, b, c2, 8, { at: 8, vel: 0.7 });
        drum(sn, b, 1, b === 3 ? 'X.xxX.x.X.xxXXXX' : 'X.xxX.x.X.xxX.x.');
        drum(k, b, 1, 'X...X...X...X...');
    }
    drum(ti, 3, 1, '........X.X.XXXX', { pitch: 5 });
    drum(cr, 1, 1, 'X...............');
    drum(cr, 4, 1, 'X...............');
    drum(cr, 6, 1, 'X.......X.......');
    drum(ti, 6, 1, 'X...............');
    drum(k, 6, 1, 'X...............');
    bass(tu, 6, 'D', '0:16');
    padChord(pad, 6, 'Dadd9', 32, { low: 62 });
    arp(ar, 6, 'Dadd9', { low: 74, step: 1 });
    arp(ar, 7, 'Dadd9', { low: 74, step: 1, vel: 0.6 });
    return S;
}
