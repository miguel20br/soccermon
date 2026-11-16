// Faixa 9, "Na ponta do pé" (`extra-cutscene-boba` v2). Duas voltas inteiras (o B do tropeço e do "bonk" nas duas;
// a 2ª termina no A' meio tom acima, Si♭ menor, sem a virada) e o fim: um último passinho na ponta do pé que sobe,
// para... o fagote espia embaixo, e o pizzicato pousa no Si♭ com o bloco. Silêncio.
import boba from '../pecas/extra-cutscene-boba.mjs';
import { bass, drum, mel } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Na ponta do pé', faixa: 9 };

export default function naPontaDoPe() {
    const { S, P, n } = estender(
        boba,
        [
            [0, 33],
            [0, 32],
        ],
        { fim: 2, tail: 3 },
    );
    // n · o último passinho: sobe na ponta do pé e para no ar
    mel(P('pizz'), n, ['Bb4:1 r:1 C5:1 r:1 Db5:1 r:1 F5:1 r:1 Bb5:1 r:7']);
    bass(P('fagote'), n, 'Bbm', '0:1 r:3 5:1 r:3 r:8', { oct: 12 });
    mel(P('fagote2'), n, ['r:12 F3:1 r:1 Bb2:1 r:1']);
    drum(P('bloco'), n, 1, '..x...x.........');
    drum(P('bumbo'), n, 1, 'x...............');
    // n+1 · pousa: a nota do pizzicato, o bloco, e mais nada
    mel(P('pizz'), n + 1, ['r:2 Bb4:1 r:13'], { vel: 0.8 });
    mel(P('clarinete'), n + 1, ['r:2 Bb5:1 r:13'], { vel: 0.4 });
    drum(P('bloco'), n + 1, 1, '..x.............', { vel: 0.7 });
    return S;
}
