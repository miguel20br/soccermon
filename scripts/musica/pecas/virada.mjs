// Virada (rodada 8): o time do jogador virou o placar (estava perdendo ou empatando e passou à frente). Vinheta de
// ~3 s que toca por cima (ou na entrada) do 2º tempo da partida: mesmo tom (Si dórico) e andamento do nível 2 (133).
// Triunfante e debochada: os metais sobem pela escala de blues de Si (com a nota blue, Fá) e batem "PAM, pa-PAM";
// o SOC-CER-MON vem em Si MAIOR (o placar virou: o menor da partida vira maior) com o clap 808 respondendo "hey hey";
// e o fim é um acorde de Si sem terça (Si, Fá#, Dó#), que senta tanto no Si maior quanto no Si menor da partida.
// Na pressão final (Dó dórico) basta `shift: 1` no mel e no baixo.
import { bass, drum, GANCHO, I, MAJOR, mel, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Virada', tela: 'Partida: virada no placar', lufs: -15 };

export default function virada() {
    const S = new Song({ bpm: 133, bars: 2, tail: 1.2 }); // o acorde final cai no rabo: o mapa termina na batida dele
    const br = S.part('metais', I.brass, { pan: -0.15, echo: { rows: 3, fb: 0.2, mix: 0.15 }, rev: 0.2 });
    const br2 = S.part('metais2', I.brass, { pan: 0.25, gain: 0.7, rev: 0.2 });
    const lead = S.part('lead', I.lead, { pan: 0.1, gain: 0.7 });
    const bs = S.part('baixo', I.slap, { gain: 0.8 });
    const k = S.part('bumbo', I.kick, { drum: true });
    const sn = S.part('caixa', I.snare, { drum: true });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.55, corte: 7000, sala: 0.25 }), { drum: true, gain: 1.6 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2 });

    const RUN = 'F#4:1 A4:1 B4:1 D5:1 E5:1 F5:1 F#5:1 A5:1 B5:2! r:2 B5:1 r:1 B5:2!';
    const HOOK = GANCHO.em({ tom: -1 }); // F#5 D#5 B5
    mel(br, 0, [RUN, HOOK, 'B4+F#5+C#6:4 r:12']);
    mel(br2, 0, ['r:8 F#5:2 r:2 F#5:1 r:1 F#5:2', HOOK, 'r:16'], { harm: thirdBelow(MAJOR(11)) });
    mel(lead, 0, ['r:16', 'r:12 B5:1 r:1 B5:1 r:1', 'F#6:2 r:14']);
    bass(bs, 0, 'Bm7', 'r:8 0:2 r:2 0:1 r:1 8:2');
    bass(bs, 1, 'B', '0:3 8:3 0:6 r:2 5:1 8:1');
    bass(bs, 2, 'B', '0:2 r:14');
    drum(sn, 0, 1, 'xxxxxxxX........');
    drum(k, 0, 1, '........X...X.X.');
    drum(cr, 0, 1, '........X.......');
    drum(k, 1, 1, 'X.....X.........');
    drum(sn, 1, 1, '......X.........');
    drum(cl, 1, 1, GANCHO.palmas);
    drum(k, 2, 1, 'X...............');
    drum(cr, 2, 1, 'X...............');
    return S;
}
