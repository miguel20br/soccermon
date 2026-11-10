// Insígnia batendo (animacoes-novas.md, A5; 10/11/2026): 2 s na 1ª vitória contra cada líder (8 por save). A cena:
// a insígnia entra girando (o sino sobe em arpejo, como ela girando), BATE no meio da tela (bumbo, tímpano, prato e o
// som de assinatura: o "tlim" de metal da insígnia, a moeda do Mercado uma oitava acima com o sino), e os metais
// respondem com o SOC-CER-MON em meio compasso (3-3-2) fechando no Dó. Dó maior, 160 BPM, 1 compasso + rabo.
import { drum, I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Insígnia (jingle de 2 s)', tela: 'Insígnia batendo', lufs: -15 };

export default function insignia() {
    const S = new Song({ bpm: 160, bars: 1, tail: 0.55 });
    const sino = S.part('sino', I.bell, { pan: 0.2, gain: 1.3, echo: { rows: 1, fb: 0.3, mix: 0.25 }, rev: 0.3 });
    const br = S.part('metais', I.brass, { pan: -0.15, rev: 0.25 });
    const br2 = S.part('metais2', I.brass, { pan: 0.25, gain: 0.7, rev: 0.25 });
    const tu = S.part('tuba', I.tuba, { gain: 0.45 });
    const pad = S.part('pad', I.pad, { gain: 1, rev: 0.35 });
    const tlim = S.part('tlim', I.coin, { drum: true, gain: 1.3, rev: 0.3, echo: { rows: 1, fb: 0.25, mix: 0.2 } });
    const k = S.part('bumbo', I.kick, { drum: true });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.3 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2, gain: 0.8 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.3 }), { drum: true, gain: 1.3 });

    // o giro: sobe em arpejo até a batida
    mel(sino, 0, ['G4:1 C5:1 E5:1 G5:1 C6:1 E6:1 G6:2! r:8']);
    // a batida (passo 6) e o tlim de metal logo em cima
    drum(k, 0, 1, '......X.........');
    drum(ti, 0, 1, '......X.........');
    drum(cr, 0, 1, '......X.........');
    drum(tlim, 0, 1, '......X.x.......', { pitch: 2 });
    // a resposta: SOC-CER-MON em meio compasso, com as palmas no mesmo 3-3-2
    const M = ['r:8 G5:3 E5:3 C6:2'];
    mel(br, 0, M);
    mel(br2, 0, M, { harm: thirdBelow(MAJOR(0)) });
    drum(cl, 0, 1, '........X..X..X.');
    mel(tu, 0, ['r:6 C3:2 r:2 G2:2 r:2 C3:2']);
    padChord(pad, 0, 'Cadd9', 10, { at: 6, vel: 0.7 });
    return S;
}
