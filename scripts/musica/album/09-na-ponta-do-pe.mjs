// Faixa 9, "Na ponta do pé" (`extra-cutscene-boba` v2: câmara de desenho animado, Lá menor, 108 BPM, pizzicato,
// fagote, clarinete). Rodada 2 (16/11/2026): "divertida; uma complexidade a mais, de maneira simples, agregaria".
// A 1ª volta fica inteira (A, A2, o B do tropeço e do "bonk", A' em Si♭ menor). A 2ª volta conta a revanche:
// - no A, o clarinete faz um CONTRACANTO em movimento contrário (quando o pizzicato sobe, ele desce), só nos tempos
//   fracos: duas vozes independentes, uma ideia simples;
// - B2 (novo): a mesma subida cromática na ponta do pé... e dessa vez NÃO tropeça: o apito sobe duas vezes, ele chega
//   lá em cima e dança a vitória em DÓ MAIOR (o relativo, o primeiro maior da faixa), pizzicato e clarinete em
//   terças, com o Lá7 (dominante secundária) de travessura; o SOC-CER-MON cochichado no Fá7 leva ao A' em Si♭ menor;
// - o fim: um último passinho que sobe, para no ar, o fagote espia, e o pizzicato pousa com o bloco. Silêncio.
import boba from '../pecas/extra-cutscene-boba.mjs';
import { bass, drum, GANCHO, MAJOR, mel, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Na ponta do pé', faixa: 9 };

const CONTRA = [
    'r:4 E5:2 r:2 r:4 C5:2 r:2',
    'r:4 D5:2 r:2 r:4 B4:2 r:2',
    'r:4 C5:2 r:2 r:4 A4:2 r:2',
    'r:4 B4:2 r:2 G#4:2 r:2 E4:4',
    'r:4 A4:2 r:2 r:4 F4:2 r:2',
    'r:4 E5:2 r:2 r:4 C5:2 r:2',
    'r:4 D#5:2 r:2 r:4 A4:2 r:2',
    'r:4 G#4:2 r:2 B4:2 r:6',
];
const SUBIDA1 = 'D4:1 r:1 D#4:1 r:1 E4:1 r:1 F4:1 r:1 F#4:1 r:1 G4:1 r:1 G#4:1 r:1 A4:1 r:1';
const SUBIDA2 = 'A4:1 r:1 A#4:1 r:1 B4:1 r:1 C5:1 r:1 C#5:1 r:1 D5:1 r:1 D#5:1 r:1 E5:1 r:1';
const VITORIA = [
    'E5:1 r:1 G5:1 r:1 C6:2 r:2 B5:1 r:1 C6:1 r:5',
    'D5:1 r:1 F5:1 r:1 B5:2 r:2 A5:1 r:1 B5:1 r:5',
    'E5:1 r:1 G5:1 r:1 C6:1 r:1 E6:2 r:2 C#6:1 r:1 A5:1 r:3',
];

export default function naPontaDoPe() {
    const { S, P, n, inicio } = estender(boba, [[0, 33], [0, 16], 8, [24, 32]], { fim: 2, tail: 3 });
    const base = (b, c) => {
        bass(P('fagote'), b, c, '0:1 r:3 5:1 r:3 0:1 r:3 5:1 r:3', { oct: 12 });
        stabs(
            P('stab'),
            b,
            c,
            [
                [6, 1],
                [14, 1],
            ],
            { low: 57, n: 3, vel: 0.6 },
        );
        drum(P('bloco'), b, 1, '..x...x...x...x.');
        drum(P('bumbo'), b, 1, 'x.......x.......');
    };

    // 2ª volta: o contracanto do clarinete no A
    mel(P('clarinete'), inicio[1], CONTRA, { vel: 0.75 });

    // B2: a mesma subida, e dessa vez dá certo
    const d0 = inicio[2];
    ['Dm', 'Dm', 'F', 'F', 'C', 'G7', 'C', 'F7'].forEach((c, i) => {
        if (i !== 6) base(d0 + i, c);
    });
    mel(P('pizz'), d0, [SUBIDA1, 'r:16', SUBIDA2]);
    mel(P('fagote2'), d0 + 1, ['D3:1 r:1 E3:1 r:1 F3:2 r:10']);
    // o momento do tropeço... não tropeça: o apito sobe duas vezes e ele pousa no Dó
    drum(P('apito'), d0 + 3, 1, 'x.......x.......');
    mel(P('pizz'), d0 + 3, ['r:12 C6:1 r:1 G5:1 r:1']);
    // a dança da vitória em Dó maior, pizzicato e clarinete em terças
    mel(P('pizz'), d0 + 4, VITORIA);
    mel(P('clarinete'), d0 + 4, VITORIA, { harm: thirdBelow(MAJOR(0)), vel: 0.7 });
    base(d0 + 6, 'C');
    stabs(
        P('stab'),
        d0 + 6,
        'A7',
        [
            [10, 1],
            [14, 1],
        ],
        { low: 57, n: 3, vel: 0.7 },
    );
    drum(P('bloco'), d0 + 6, 1, 'x.x.x.x.x.x.x.x.', { pitch: 5, vel: 0.5 });
    // o SOC-CER-MON cochichado no Fá7, o bloco responde "hey hey"
    mel(P('clarinete'), d0 + 7, [GANCHO.em({ menor: true, tom: -2 })], { vel: 0.7 });
    drum(P('bloco'), d0 + 7, 1, GANCHO.palmas, { pitch: 7, vel: 0.6 });

    // o fim: o último passinho que sobe, para no ar, e pousa
    mel(P('pizz'), n, ['Bb4:1 r:1 C5:1 r:1 Db5:1 r:1 F5:1 r:1 Bb5:1 r:7']);
    bass(P('fagote'), n, 'Bbm', '0:1 r:3 5:1 r:3 r:8', { oct: 12 });
    mel(P('fagote2'), n, ['r:12 F3:1 r:1 Bb2:1 r:1']);
    drum(P('bloco'), n, 1, '..x...x.........');
    drum(P('bumbo'), n, 1, 'x...............');
    mel(P('pizz'), n + 1, ['r:2 Bb4:1 r:13'], { vel: 0.8 });
    mel(P('clarinete'), n + 1, ['r:2 Bb5:1 r:13'], { vel: 0.4 });
    drum(P('bloco'), n + 1, 1, '..x.............', { vel: 0.7 });
    return S;
}
