// Faixa 2, "Tema de abertura" (`abertura-gancho`, a Home até 30/10, hoje nos trailers). Os 4 compassos de
// introdução, duas voltas (a 2ª sem o gancho de volta pro A) e o final escrito: o gancho em sequência subindo (Dó,
// Ré menor, Mi menor, Sol7), com a torcida respondendo no ritmo dele, e o acorde de Dó com nona, a torcida batendo
// palma junto e o prato.
import abertura from '../pecas/abertura-gancho.mjs';
import { arp, bass, drum, GANCHO, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Tema de abertura', faixa: 2 };

export default function temaDeAbertura() {
    const { S, P, n } = estender(
        abertura,
        [
            [0, 53],
            [4, 52],
        ],
        { fim: 5, tail: 4 },
    );
    const C = MAJOR(0);
    const GROOVE = '0:2 8:1~ 0:1 r:1 5:1 8:2 0:1 r:1 8:1~ s:2 5:1 3:2';
    const groove = (b) => {
        drum(P('kick'), b, 1, 'X.....x.X..x....');
        drum(P('snare'), b, 1, '.o..X..o.o.oX.oo');
        drum(P('hat'), b, 1, 'xoxxoxoxxoxxoxox');
        drum(P('shaker'), b, 1, 'xoxoxoxoxoxoxoxo');
        drum(P('agogo'), b, 1, 'x...x.x.........');
    };
    // n a n+3 · o gancho subindo em sequência; a torcida responde no ritmo dele
    const SEQ = [
        [0, 'C'],
        [1, 'Dm7'],
        [2, 'Em7'],
        [4, 'G7'],
    ];
    SEQ.forEach(([g, c], i) => {
        const b = n + i;
        const call = GANCHO.em({ grau: g });
        mel(P('lead'), b, [call]);
        mel(P('harm'), b, [call], { harm: thirdBelow(C) });
        mel(P('metais'), b, [GANCHO.em({ grau: g, oitava: -1 })], { vel: 0.9 });
        drum(P('palmas'), b, 1, GANCHO.palmas);
        bass(P('bass'), b, c, GROOVE);
        stabs(P('stab'), b, c, [3, 6, [10, 2], 14]);
        arp(P('arp'), b, c, { low: 64, step: 1 });
        groove(b);
        if (i === 0) drum(P('crash'), b, 1, 'X...............');
    });
    drum(P('snare'), n + 3, 1, '............xxXX');
    drum(P('tom'), n + 3, 1, '..........x.x...', { pitch: 5 });
    // n+4 · Dó com nona: a torcida bate o 3-3-2, o prato, e o acorde fica
    mel(P('lead'), n + 4, ['C6:16']);
    mel(P('harm'), n + 4, ['G5:16']);
    mel(P('metais'), n + 4, ['E5:16']);
    mel(P('counter'), n + 4, ['C4:16']);
    bass(P('bass'), n + 4, 'C', '0:16');
    padChord(P('pad'), n + 4, 'Cadd9', 16, { low: 55, n: 4 });
    stabs(P('stab'), n + 4, 'Cadd9', [[0, 6]], { n: 4 });
    arp(P('arp'), n + 4, 'Cadd9', { low: 72, step: 1, vel: 0.6 });
    drum(P('palmas'), n + 4, 1, 'X..X..X.........', { vel: 1.2 });
    drum(P('crash'), n + 4, 1, 'X...............');
    drum(P('kick'), n + 4, 1, 'X..X..X.........');
    return S;
}
