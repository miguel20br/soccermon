// Faixa 10, "Ladeira acima" (`estrada-da-vitoria`). A peça já sobe um tom a cada 8 compassos (Mi → Fá# → Sol#): três
// voltas dela, a última sem o compasso de volta pro Mi, e o fim lá em cima, em Sol# menor: o SOC-CER-MON nos metais
// com o taiko em 3-3-2 e a palma pesada, e o acorde no topo da ladeira com prato e tímpano.
import estrada from '../pecas/estrada-da-vitoria.mjs';
import { bass, drum, GANCHO, MINOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Ladeira acima', faixa: 10 };

export default function ladeiraAcima() {
    const { S, P, n } = estender(
        estrada,
        [
            [0, 24],
            [0, 24],
            [0, 24],
        ],
        { fim: 3 },
    );
    const gs = GANCHO.em({ menor: true, tom: 8, oitava: -1 }); // em Sol# menor
    // n · o último SOC-CER-MON, em Sol# menor
    mel(P('metais'), n, [gs]);
    mel(P('metais2'), n, [gs], { harm: thirdBelow(MINOR(8)) });
    bass(P('bass'), n, 'G#m', '0:3 0:3 8:2 0:2 0:2 5:2 8:2');
    stabs(P('pulso'), n, 'G#m', [0, 3, 6], { low: 64, n: 3 });
    padChord(P('cordas'), n, 'G#m', 16, { low: 56, n: 4 });
    drum(P('taiko'), n, 1, 'X..X..X.........', { pitch: -1 });
    drum(P('palmaPesada'), n, 1, '............x.x.');
    drum(P('kick'), n, 1, 'X..X..X.........');
    drum(P('snare'), n, 1, '............xxXX');
    // n+1 · E → D#7: a última força
    mel(P('metais'), n + 1, ['G#5:6 F#5:2 E5:4 D#5:4']);
    mel(P('metais2'), n + 1, ['E5:6 D#5:2 B4:4 A#4:4']);
    bass(P('bass'), n + 1, 'E', '0:2 0:2 0:2 8:2 r:8');
    bass(P('bass'), n + 1, 'D#7', 'r:8 0:2 0:2 5:2 8:2');
    padChord(P('cordas'), n + 1, 'E', 8, { low: 56, n: 4 });
    padChord(P('cordas'), n + 1, 'D#7', 8, { low: 55, n: 4, at: 8 });
    drum(P('kick'), n + 1, 1, 'X...X...X...X...');
    drum(P('timp'), n + 1, 1, '........X.X.XXXX');
    drum(P('tom'), n + 1, 1, '........x.x.x.xx', { vel: 0.7 });
    // n+2 · no topo: Sol# menor (com a terça dos metais lá em cima), prato, tímpano
    mel(P('metais'), n + 2, ['G#5:16']);
    mel(P('metais2'), n + 2, ['D#5:16']);
    bass(P('bass'), n + 2, 'G#m', '0:16');
    padChord(P('cordas'), n + 2, 'G#m', 16, { low: 56, n: 4 });
    drum(P('crash'), n + 2, 1, 'X...............');
    drum(P('timp'), n + 2, 1, 'X...............');
    drum(P('kick'), n + 2, 1, 'X...............');
    drum(P('taiko'), n + 2, 1, 'X...............', { pitch: -1 });
    return S;
}
