// Derrota (rodada 8): perdeu uma partida, mas a copa segue. ~3 s, leve, sem drama: o SOC-CER-MON murcho (o ritmo
// 3-3-2 do gancho descendo em Lá menor), um "toc toc" de consolo no bloco, e a resposta sobe e para no Mi maior (a
// dominante, sem resolver): bola pra frente. Mesma família do Eliminado (pulso em terças, baixo triangular).
// Pro "eliminado da copa" fica o Eliminado v4, que o Miguel já aprovou.
import { arp, drum, I, MINOR, mel, Song, thirdBelow } from '../synth.mjs';

export const meta = { titulo: 'Derrota (bola pra frente)', tela: 'Resultado: derrota', lufs: -15 };

export default function derrota() {
    const S = new Song({ bpm: 132, bars: 2, tail: 1.6 }); // o Mi maior final cai no rabo: o mapa termina na batida dele
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.2, echo: { rows: 2, fb: 0.2, mix: 0.15 } });
    const harm = S.part('terças', I.thin, { pan: 0.3, gain: 0.6 });
    const bs = S.part('baixo', I.counter, { gain: 1 });
    const ar = S.part('arp', I.arp, { pan: 0.4, gain: 1.2 });
    const bl = S.part('bloco', I.block, { drum: true, pan: 0.3, gain: 1.2 });

    const M = ['E5:3 C5:3 A4:6 r:4', 'r:4 D5:2 E5:2 F5:4 E5:4', 'G#4+B4+E5:6 r:10'];
    mel(lead, 0, M);
    mel(harm, 0, [M[0], M[1], 'r:16'], { harm: thirdBelow(MINOR(9)) });
    mel(bs, 0, ['A3:6 r:2 E3:6 r:2', 'D3:6 r:2 E3:8', 'E3:6 r:10']);
    drum(bl, 0, 1, '............x.x.', { pitch: -5 });
    arp(ar, 2, 'E', { low: 64, step: 1, rows: 5 });
    return S;
}
