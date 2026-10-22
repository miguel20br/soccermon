// Vitória v2 (rodada 8): a Vitória (aprovada, ~4 s) com a regra geral da rodada 5. A fanfarra pergunta
// ("pam pam-pam PAAM", a mesma frase do Campeão) e o SOC-CER-MON responde com o clap 808 ("hey hey"); fecha num Dó
// com prato e arpejo. Mesmo tamanho da v1: o 2º compasso, que subia pro Dó, virou o gancho. Dó maior, 122 BPM.
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Vitória v2 (com gancho)', tela: 'Resultado: vitória', lufs: -15 };

export default function vitoriaGancho() {
    const S = new Song({ bpm: 122, bars: 3, tail: 1.4 });
    const br = S.part('metais', I.brass, { pan: -0.15, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.25 });
    const br2 = S.part('metais2', I.brass, { pan: 0.25, gain: 0.75, rev: 0.25 });
    const tu = S.part('tuba', I.tuba, { gain: 0.6 });
    const pad = S.part('pad', I.pad, { gain: 1.1, rev: 0.3 });
    const ar = S.part('arp', I.arp, { pan: 0.5, gain: 1.4, echo: { rows: 1, fb: 0.4, mix: 0.4 }, rev: 0.3 });
    const sn = S.part('caixa', I.snare, { drum: true });
    const k = S.part('bumbo', I.kick, { drum: true });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.4 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.55, corte: 7000, sala: 0.3 }), { drum: true, gain: 1.6 });

    const M = ['C5:2 C5:1 C5:1 G5:4 F5:2 E5:1 F5:1 G5:4', GANCHO.em(), 'C6:8 r:8'];
    mel(br, 0, M);
    mel(br2, 0, M, { harm: thirdBelow(MAJOR(0)) });
    bass(tu, 0, 'C', '0:4 5:4 0:4 5:4');
    bass(tu, 1, 'G', '0:6 r:10');
    bass(tu, 1, 'C', 'r:6 0:6 r:4');
    bass(tu, 2, 'C', '0:8 r:8');
    padChord(pad, 0, 'C', 16, { vel: 0.7 });
    padChord(pad, 1, 'G7', 6, { vel: 0.7 });
    padChord(pad, 1, 'Cadd9', 26, { at: 6, low: 60 });
    drum(sn, 0, 1, 'X.xxX.x.X.xxXXXX');
    drum(k, 0, 1, 'X...X...X...X...');
    drum(k, 1, 1, 'X.....X.........');
    drum(ti, 1, 1, 'X.....X.........');
    drum(cl, 1, 1, GANCHO.palmas);
    drum(cr, 1, 1, '......X.........');
    drum(cr, 2, 1, 'X...............');
    drum(k, 2, 1, 'X...............');
    arp(ar, 1, 'Cadd9', { low: 72, step: 1, rows: 16, vel: 0.6 });
    arp(ar, 2, 'Cadd9', { low: 72, step: 1, rows: 8, vel: 0.5 });
    return S;
}
