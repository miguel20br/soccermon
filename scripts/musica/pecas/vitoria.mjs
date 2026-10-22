// Vitória (rodada 4): a versão de ~5 s do Campeão v3 pra quando você ganha uma partida só. Mesma melodia de abertura
// da fanfarra ("pam pam-pam PAAM"), dois compassos a 108 BPM, termina em Dó com arpejo e prato.
import { arp, bass, drum, I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Vitória (partida)', tela: 'Resultado: vitória', lufs: -15 };

export default function vitoria() {
    const S = new Song({ bpm: 122, bars: 3, tail: 1.4 }); // rodada 5: um pouco mais curta (~4 s)
    const br = S.part('metais', I.brass, { pan: -0.15, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.25 });
    const br2 = S.part('metais2', I.brass, { pan: 0.25, gain: 0.75, rev: 0.25 });
    const tu = S.part('tuba', I.tuba, { gain: 0.6 });
    const pad = S.part('pad', I.pad, { gain: 1.1, rev: 0.3 });
    const ar = S.part('arp', I.arp, { pan: 0.5, gain: 1.4, echo: { rows: 1, fb: 0.4, mix: 0.4 }, rev: 0.3 });
    const sn = S.part('snare', I.snare, { drum: true });
    const k = S.part('kick', I.kick, { drum: true });
    const ti = S.part('timp', I.timp, { drum: true, gain: 0.5 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });

    const M = ['C5:2 C5:1 C5:1 G5:4 F5:2 E5:1 F5:1 G5:4', 'A5:2 A5:1 A5:1 B5:2 B5:1 B5:1 C6:8', 'C6:8 r:8'];
    mel(br, 0, M);
    mel(br2, 0, M, { harm: thirdBelow(MAJOR(0)) });
    bass(tu, 0, 'C', '0:4 5:4 0:4 5:4');
    bass(tu, 1, 'F', '0:4 r:12');
    bass(tu, 1, 'G', 'r:4 0:4 r:8');
    bass(tu, 1, 'C', 'r:8 0:8');
    bass(tu, 2, 'C', '0:8 r:8');
    padChord(pad, 0, 'C', 16, { vel: 0.7 });
    padChord(pad, 1, 'F', 4, { vel: 0.7 });
    padChord(pad, 1, 'G', 4, { at: 4, vel: 0.7 });
    padChord(pad, 1, 'Cadd9', 24, { at: 8, low: 60 });
    drum(sn, 0, 1, 'X.xxX.x.X.xxXXXX');
    drum(k, 0, 2, 'X...X...X...X...');
    drum(ti, 1, 1, 'X...X...X.......');
    drum(cr, 1, 1, '........X.......');
    arp(ar, 1, 'Cadd9', { low: 72, step: 1, rows: 8 });
    arp(ar, 2, 'Cadd9', { low: 72, step: 1, rows: 8, vel: 0.5 });
    return S;
}
