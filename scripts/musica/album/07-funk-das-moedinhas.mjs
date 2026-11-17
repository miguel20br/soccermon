// Faixa 7, "Funk das moedinhas" (Mercado funk, `mercado-funk`). Duas voltas e o fim: o SOC-CER-MON nos metais com as
// palmas, e a caixa registradora fechando: as moedas caem todas, a gaveta bate (tom grave e bloco), o "plim" no agudo
// e o Si♭ menor com nona.
// Rodada 2 (16/11/2026): "uma obra de arte", "o acorde final é belíssimo", o mais importante é o groove; poucos
// ajustes. Mudou só a bateria: o bumbo e a caixa com corpo do kit (os fantasmas da caixa continuam) num barramento
// comprimido, e as palmas da torcida (I.palmas a +10 dB) viraram o clap 808 macio. Notas, groove e final iguais.
// O nome muda (não é funk brasileiro): propostas na página de escuta.
// Rodada 3 (17/11/2026): "curti a versão nova", mas a bateria pode ser mais leve. O bumbo cai pra ~60% (era o mais
// pesado da mistura depois do lead), a caixa e o tom um pouco, e o barramento comprime menos (o corpo fica, o soco
// sai). Notas, groove e final continuam iguais.
import mercado from '../pecas/mercado-funk.mjs';
import { bass, drum, GANCHO, I, mel, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, bumbo, caixa, clapMacio } from './kit.mjs';

export const meta = { titulo: 'Funk das moedinhas', faixa: 7 };

/** O barramento da casa, mais leve: menos ganho e menos sinal comprimido por baixo. */
const LEVE = { ...BATERIA, ganho: 2, paralelo: 0.35 };

export default function funkDasMoedinhas() {
    const { S, P, n } = estender(
        mercado,
        [
            [0, 24],
            [0, 24],
        ],
        {
            fim: 3,
            barramentos: { bateria: LEVE },
            bus: { kick: 'bateria', snare: 'bateria', tom: 'bateria' },
            troca: {
                kick: { inst: bumbo, gain: 0.55 },
                snare: { inst: caixa, gain: 0.65 },
                tom: { inst: I.tom, gain: 0.7 },
                palmas: { inst: clapMacio, gain: 1.4 },
            },
        },
    );
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.45, pan: 0.2 });
    const gaveta = S.part('gaveta', I.block, { drum: true, gain: 1.1, pan: -0.1 });
    // n · Si♭m7 com o groove inteiro; o SOC-CER-MON nos metais e as palmas respondem
    bass(P('slap'), n, 'Bbm7', '0:2 8:1~ 0:1 r:2 5:1 8:1 r:2 0:1 8:1 s:2 5:2');
    stabs(P('clav'), n, 'Bbm7', [0, 3, 6, 8, 11, 14], { low: 63, n: 3, vel: 0.8 });
    mel(P('metais'), n, [GANCHO.em({ tom: -2, menor: true })], { vel: 1.2 });
    mel(P('lead'), n, [GANCHO.em({ tom: -2, menor: true })]);
    drum(P('palmas'), n, 1, GANCHO.palmas);
    drum(P('kick'), n, 1, 'X.....x...X..x..');
    drum(P('snare'), n, 1, '....X..o.o..X..o');
    drum(P('hat'), n, 1, 'xoxoxoxoxoxoxoxo');
    drum(P('cowbell'), n, 1, 'x...x.x...x.x...', { pitch: -7 });
    // n+1 · a caixa registradora fecha: as moedas caem todas (subindo), o órgão segura o Fá7, a gaveta bate no 4
    stabs(P('organ'), n + 1, 'F7b9', [[0, 12]], { low: 56, n: 4 });
    bass(P('slap'), n + 1, 'F7b9', '0:2 r:2 0:2 r:2 5:2 r:2 r:4');
    for (let j = 0; j < 12; j++)
        P('moedas').note((n + 1) * 16 + j, [0, 2, 4, 7, 9, 12][j % 6] + (j > 5 ? 2 : 0), 0, 0.7);
    drum(P('tom'), n + 1, 1, '..........x.x.x.', { pitch: 4 });
    drum(gaveta, n + 1, 1, '............X...', { pitch: -14 });
    drum(P('kick'), n + 1, 1, 'X...........X...');
    // n+2 · "plim!" e o Si♭ menor com nona, com prato e sala
    P('plim').note((n + 2) * 16, 96, 4, 1);
    P('plim').note((n + 2) * 16, 103, 4, 0.6);
    stabs(P('organ'), n + 2, 'Bbm9', [[0, 16]], { low: 56, n: 5 });
    stabs(P('metais'), n + 2, 'Bbm7', [[0, 6]], { low: 61, n: 3 });
    mel(P('lead'), n + 2, ['Bb5:8 r:8']);
    bass(P('slap'), n + 2, 'Bbm7', '0:8 r:8');
    drum(P('kick'), n + 2, 1, 'X...............');
    drum(cr, n + 2, 1, 'X...............');
    P('moedas').note((n + 2) * 16 + 6, 12, 0, 0.5);
    return S;
}
