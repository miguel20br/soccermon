// Faixa 14, "A prancheta (intervalo)" (`escalacao`, o Vestiário polido). Introdução e duas voltas (a 2ª termina no
// A' em Fá menor, sem a virada). É o intervalo da final: no fim da 2ª volta o tique do relógio vai ficando mais alto
// (o tempo do intervalo acabando), a banda para, sobra só o relógio, e o treinador bate a última peça magnética na
// prancheta. Emenda sem pausa no Segundo tempo.
// Rodada 2: o bumbo com corpo num barramento comprimido (o clap já é o 808 macio).
import escalacao from '../pecas/escalacao.mjs';
import { bass, drum, mel, padChord, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';
import { soco } from './kit.mjs';

export const meta = { titulo: 'A prancheta (intervalo)', faixa: 14, emenda: true, apara: false };

export default function aPrancheta() {
    const { S, P, n } = estender(
        escalacao,
        [
            [0, 35],
            [2, 34],
        ],
        { fim: 3, tail: 1.5, ...soco({ bumbo: 'bumbo', gBumbo: 0.7 }) },
    );
    // o relógio crescendo nos últimos 6 compassos
    for (let i = 0; i < 6; i++) drum(P('relógio'), n - 6 + i, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.2 + 0.12 * i });
    // n · Fá menor, a pergunta uma última vez, as cordas seguram
    mel(P('lead'), n, ['r:4 C5:2 F5:2 Ab5:3 G5:1 F5:2 Eb5:2']);
    bass(P('baixo'), n, 'Fm7', '0:2 8:2 0:2 8:2 0:2 8:2 0:1 8:1 s:2');
    stabs(P('clav'), n, 'Fm7', [3, 6, 11, 14], { low: 65, n: 3 });
    padChord(P('cordas'), n, 'Fm7', 16, { low: 56, n: 4, vel: 0.8 });
    drum(P('bumbo'), n, 1, 'x...x...x...x...');
    drum(P('relógio'), n, 1, 'x.x.x.x.x.x.x.x.', { vel: 1.1 });
    // n+1 · a banda para: só o relógio, alto
    mel(P('metais'), n + 1, ['F4:4 r:12']);
    drum(P('relógio'), n + 1, 1, 'x.x.x.x.x.x.x.x.', { vel: 1.3 });
    // n+2 · a peça na prancheta (e o último tique)
    drum(P('relógio'), n + 2, 1, 'x...............', { vel: 1.2 });
    drum(P('peça5'), n + 2, 1, '....X...........', { pitch: 7, vel: 1.4 });
    return S;
}
