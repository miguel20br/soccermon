// Faixa 17, "Sala dos troféus" (`extra-sala`, Sala v3, jazz). Duas voltas (tema, os dois choruses de improviso de 4
// em 4, o tema meio tom acima) e um final de jazz: o Ré7b9 resolve no Sol menor, o vibrafone cita o SOC-CER-MON em
// Sol menor, a "tag" Mi♭7 → Ré7b9 com a flauta descendo, e o Sol menor com sexta e nona parado na condução.
import sala from '../pecas/extra-sala.mjs';
import { bass, drum, GANCHO, mel, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Sala dos troféus', faixa: 17 };

export default function salaDosTrofeus() {
    const { S, P, n } = estender(
        sala,
        [
            [0, 41],
            [0, 41],
        ],
        { fim: 3, tail: 5 },
    );
    const charleston = (b, c) =>
        stabs(
            P('epiano'),
            b,
            c,
            [
                [0, 3],
                [6, 2],
            ],
            { low: 57, n: 4, vel: 0.8 },
        );
    // n · Sol menor: o vibrafone cita o gancho, a flauta responde
    mel(P('vibraSolo'), n, [GANCHO.em({ menor: true, tom: 7, oitava: -1 })]);
    mel(P('flauta'), n, ['r:12 D6:2 Bb5:2']);
    bass(P('baixo'), n, 'Gm9', '0:4 2:4 3:4 5:4');
    charleston(n, 'Gm9');
    // n+1 · a tag: Mi♭7 → Ré7b9
    bass(P('baixo'), n + 1, 'Eb7', '0:4 5:4 r:8');
    bass(P('baixo'), n + 1, 'D7b9', 'r:8 0:4 5:4');
    stabs(
        P('epiano'),
        n + 1,
        'Eb7',
        [
            [0, 3],
            [4, 4],
        ],
        { low: 57, n: 4, vel: 0.8 },
    );
    stabs(
        P('epiano'),
        n + 1,
        'D7b9',
        [
            [8, 3],
            [12, 4],
        ],
        { low: 57, n: 4, vel: 0.8 },
    );
    mel(P('flauta'), n + 1, ['G5:2 F5:2 Eb5:2 Db5:2 C5:2 Bb4:2 A4:2 F#4:2']);
    for (const b of [n, n + 1]) {
        drum(P('conducao'), b, 1, 'x...x.x.x...x.x.');
        drum(P('chimbal'), b, 1, '....x.......x...');
        drum(P('vassoura'), b, 1, 'o.o.o.o.o.o.o.o.');
        drum(P('bumbo'), b, 1, 'x.......x.......');
    }
    // n+2 · Sol menor com sexta e nona, longo; a flauta no Sol, o vibrafone no Lá (a nona)
    stabs(P('epiano'), n + 2, 'Gm6', [[0, 16]], { low: 55, n: 4, vel: 0.9 });
    mel(P('flauta'), n + 2, ['G5:16']);
    mel(P('vibra'), n + 2, ['r:2 A5:14'], { vel: 0.8 });
    bass(P('baixo'), n + 2, 'Gm', '0:16');
    drum(P('conducao'), n + 2, 1, 'X...............');
    drum(P('bumbo'), n + 2, 1, 'x...............');
    return S;
}
