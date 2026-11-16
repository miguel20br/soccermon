// Faixa 4, "Pé na estrada" (Rota 1 v3, `extra-rota-1`: galope folk, Dó# menor que sobe, 120 BPM). Rodada 2
// (16/11/2026): mais variedade e desenvolvimento (antes eram duas voltas iguais). A 2ª metade vira uma viagem.
// Forma: a 1ª volta inteira (intro, A, A2, a ponte em Mi maior com o SOC-CER-MON, A' em Ré menor) | A FOGUEIRA (8,
// nova): a noite na estrada, meio-tempo, o violão dedilhado (corda de Karplus-Strong, limpa) e a flauta cantando o
// tema em RÉ MAIOR (o mesmo motivo, agora no modo maior: a transformação do leitmotiv) | o galope volta pelo Si♭ (o
// Lá7 resolve no ♭VI, cadência de engano), o A2 e a ponte um semitom acima (Ré menor, Fá maior) | o A' outra vez
// meio tom acima (Mi♭ menor) | final: a estrada continua, a banda vai saindo de um em um (o galope e o shaker ficam,
// a flauta lembra o começo do tema de longe) e um último pizzicato.
import rota1 from '../pecas/extra-rota-1.mjs';
import { arp, bass, drum, I, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, bumbo, guitarra } from './kit.mjs';

export const meta = { titulo: 'Pé na estrada', faixa: 4 };

// o tema em Ré MAIOR (a noite na fogueira)
const FOGO = [
    ['D', 'A4:4 D5:4 F#5:6 E5:2'],
    ['G', 'D5:6 C#5:2 B4:8'],
    ['F#m', 'C#5:4 F#5:4 A5:6 G5:2'],
    ['A7', 'G5:12 E5:4'],
    ['D', 'F#5:4 A5:4 D6:6 C#6:2'],
    ['G', 'B5:4 A5:2 G5:2 F#5:8'],
    ['Em7', 'G5:4 B5:4 D6:4 C#6:2 B5:2'],
    ['A7', 'A5:8 G5:4 E5:4'],
];

export default function peNaEstrada() {
    const { S, P, n, inicio } = estender(rota1, [[0, 34], 8, [10, 26, 1], [26, 34, 1]], {
        fim: 4,
        tail: 5,
        barramentos: { bateria: BATERIA },
        bus: { bumbo: 'bateria' },
        troca: { bumbo: { inst: bumbo, gain: 0.8 } },
    });
    const vi = guitarra(S, 'violao', { pan: 0.3, gain: 1.6, rev: 0.25 }, { sujo: 0.05 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.3, pan: 0.2 });

    // ---------- a fogueira: meio-tempo em Ré maior ----------
    const f0 = inicio[1];
    FOGO.forEach(([c, m], i) => {
        const b = f0 + i;
        mel(P('flauta'), b, [m], { vel: 0.9 });
        arp(vi, b, c, { low: 50, step: 2, pattern: [0, 1, 2, 3, 2, 1, 2, 3], vel: 0.8 });
        bass(P('baixo'), b, c, '0:6 5:2 0:8', { vel: 0.8 });
        padChord(P('cordas'), b, c, 16, { low: 57, n: 3, vel: 0.6 });
        drum(P('bumbo'), b, 1, 'X.......x.......', { vel: 0.6 });
        drum(P('aro'), b, 1, '........x.......', { vel: 0.6 });
    });
    // o piano responde nas notas longas, como na estrada
    mel(P('resposta'), f0 + 1, ['r:8 F#5:2 G5:2 A5:4']);
    mel(P('resposta'), f0 + 3, ['r:12 A5:2 C#6:2']);
    mel(P('resposta'), f0 + 5, ['r:8 D6:2 C#6:2 B5:4']);
    mel(
        P('terças'),
        f0 + 4,
        FOGO.slice(4).map(([, m]) => m),
        { vel: 0.5, harm: thirdBelow(MAJOR(2)) },
    );
    drum(P('tímpano'), f0 + 7, 1, '........x.x.xxxx');
    drum(P('shaker'), f0 + 7, 1, '........xoxoxoxo');

    // ---------- final em Mi♭ menor: a banda vai saindo, o galope continua ----------
    const GALOPE = '0:2 0:1 0:1 0:2 0:1 0:1 5:2 5:1 5:1 8:2 5:2';
    ['Ebm', 'Cb', 'Ebm', 'Ebm'].forEach((c, i) => {
        const b = n + i;
        const v = 1 - 0.22 * i;
        if (i < 3) bass(P('baixo'), b, c, GALOPE, { vel: v });
        if (i < 3) drum(P('shaker'), b, 1, 'xoxoxoxoxoxoxoxo', { vel: v });
        if (i < 2) drum(P('bumbo'), b, 1, 'x.......x.......', { vel: v });
        if (i < 1) {
            arp(P('pizz'), b, c, { low: 63, step: 2 });
            stabs(
                P('piano'),
                b,
                c,
                [
                    [0, 3],
                    [6, 2],
                    [10, 4],
                ],
                { low: 58, n: 3, vel: 0.6 },
            );
            padChord(P('cordas'), b, c, 32, { low: 58, n: 3, vel: 0.6 });
        }
    });
    // a flauta lembra o começo do tema, de longe
    mel(P('flauta'), n + 1, ['Bb4:4 Eb5:4 Gb5:6 F5:2', 'Eb5:6 Db5:2 r:8'], { vel: 0.55 });
    mel(P('resposta'), n + 2, ['r:8 Gb5:2 F5:2 Eb5:4'], { vel: 0.5 });
    mel(P('pizz'), n + 3, ['Eb4+Bb4+Eb5:2 r:14']);
    drum(cr, n + 3, 1, 'x...............', { vel: 0.4 });
    return S;
}
