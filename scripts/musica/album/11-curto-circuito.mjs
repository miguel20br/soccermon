// Faixa 11, "Curto-circuito" (`livre-lt-surge`: o funk de marcha elétrico, Fá# menor, 144 BPM). A corneta, duas
// voltas com as latas e o blecaute e o fim: a força volta subindo, a corneta toca o toque, o último choque e o acorde.
// Emenda sem pausa no medley dos rivais.
// Rodada 2 (16/11/2026): "super criativa e bem legal"; mantenha a ideia e dê PUNCH. A ideia não muda; o que muda:
// - bateria com corpo (bumbo e caixa do kit) num barramento comprimido;
// - um SUB (baixo de dedo grave) dobrando a tônica, que abaixa a cada bumbo (o bombeio da música eletrônica): a
//   faixa vira de pista;
// - na 2ª volta o A e o A' ganham o bumbo em todos os tempos (quatro no chão) e o chimbal aberto no contratempo:
//   dá pra dançar. O blecaute continua vazio (o contraste é o punch);
// - a 2ª volta sobe mais meio tom (Sol → Sol# menor: a força voltou mais forte), e o fim fica em Sol# menor.
// Rodada 5 (23/11/2026): "bem melhor, mas não perfeita": polimento de mistura, a ideia e as notas não mudam.
// - o grave estava embolado: o baixo de chip e o sub somados passavam do lead (0,13 + 0,16 contra 0,27 de RMS); o sub
//   desceu pra 0,3;
// - os quatro no chão da 2ª volta empilhavam bumbo em cima do bumbo da peça (no 1 e no 3): o bumbo chegava ao nível
//   do lead (0,25), com pico acima de 1. Agora a 2ª volta só completa o 2 e o 4, e o bumbo do kit desceu um tico;
// - o chimbal, o sino e o prato do chip ganharam passa-baixa (7, 4,5 e 6 kHz): menos chiado em cima do lead.
import surge from '../pecas/livre-lt-surge.mjs';
import { arp, bass, drum, I, mel, stabs, transpose } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, baixoDedo, bombeio, bumbo, caixa } from './kit.mjs';

export const meta = { titulo: 'Curto-circuito', faixa: 11, emenda: true };

const CH = ['F#m', 'F#m', 'D', 'E', 'F#m', 'F#m', 'D', 'C#7'];

export default function curtoCircuito() {
    const { S, P, n, inicio } = estender(
        surge,
        [
            [0, 27],
            [2, 26, 1],
        ],
        {
            fim: 3,
            tail: 2.5,
            barramentos: { bateria: BATERIA },
            bus: { bumbo: 'bateria', caixa: 'bateria' },
            troca: { bumbo: { inst: bumbo, gain: 0.6 }, caixa: { inst: caixa, gain: 0.7 } },
            corte: { chimbal: 7000, sino: 4500, prato: 6000 },
        },
    );
    const duck = bombeio(S, P('bumbo'), { prof: 0.4, solta: 0.12 });
    const sub = baixoDedo(S, 'sub', { gain: 0.3, gainAt: duck });
    const oh = S.part('aberto', I.ohat, { drum: true, pan: 0.3, gain: 0.55 });

    // o sub nas partes cheias (A e A' das duas voltas): a tônica em colcheias
    const subA = (b0, s) =>
        CH.forEach((c, i) => {
            bass(sub, b0 + i, transpose(c, s), '0:2 0:2 0:2 0:2 0:2 0:2 0:2 0:2');
        });
    subA(2, 0);
    subA(18, 1);
    const v2 = inicio[1];
    subA(v2, 1);
    subA(v2 + 16, 2);
    // 2ª volta: quatro no chão e o chimbal aberto no contratempo nos A
    for (const b0 of [v2, v2 + 16]) {
        drum(P('bumbo'), b0, 8, '....X.......X...', { vel: 0.75 });
        drum(oh, b0, 8, '..x...x...x...x.', { vel: 0.7 });
    }

    // fim em Sol# menor: a força volta subindo e a corneta abre
    P('forcaVolta').note(n * 16, 0, 0, 1);
    mel(P('metais'), n, ['r:8 D#5:2 D#5:1 D#5:1 G#5:4']);
    drum(P('caixa'), n, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    arp(P('arpejo'), n, 'G#m', { low: 68, pattern: [0, 1, 2, 4, 2, 1, 0, 1], vel: 0.6 });
    mel(P('metais'), n + 1, ['D#5:2 G#5:2 B5:4 D#6:6 B5:2']);
    mel(P('lead'), n + 1, ['D#5:2 G#5:2 B5:4 D#6:6 B5:2'], { shift: 12, vel: 0.6 });
    bass(P('baixo'), n + 1, 'G#m', '0:2 8:1~ r:1 0:2 r:2 5:2 0:2 s:2 8:2');
    bass(sub, n + 1, 'G#m', '0:2 0:2 0:2 0:2 0:2 0:2 0:2 0:2');
    stabs(P('acordes'), n + 1, 'G#m', [2, 6, 10, 14], { low: 60, n: 3 });
    drum(P('bumbo'), n + 1, 1, 'X...X...X...X...');
    drum(P('caixa'), n + 1, 1, '..o.X..o.oo.X.o.');
    drum(P('prato'), n + 1, 1, 'X...............');
    P('choque').note((n + 1) * 16 + 14, 3, 0, 1);
    mel(P('metais'), n + 2, ['G#5:12 r:4']);
    mel(P('sino'), n + 2, ['G#6:8 r:8']);
    stabs(P('acordes'), n + 2, 'G#m', [[0, 10]], { low: 56, n: 4 });
    bass(P('baixo'), n + 2, 'G#m', '0:10 r:6');
    bass(sub, n + 2, 'G#m', '0:10 r:6');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    drum(P('prato'), n + 2, 1, 'X...............');
    P('choque').note((n + 2) * 16 + 12, -4, 0, 0.6);
    return S;
}
