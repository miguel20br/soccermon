// Faixa 3, "Três cartas" (a suíte do draft), rodada 6 (23/11/2026). O Miguel: "ótima no jogo, mas como música falta
// algo"; ela abre a suíte do draft, com mais a dizer. Agora conta a escolha inteira, do baralho ao prêmio, e o tema
// do draft se transforma no tema da Recompensa (o mesmo A, primo: `recompensa` é a mesma melodia a 124 BPM).
// I. A MESA (`draft`, Fá maior, 108 BPM): a volta inteira do jogo, calma com expectativa: o baralho, o A (a flauta
//   pergunta, o pizzicato responde, as três cartas viram no 3-3-2), o B no vibrafone, o respiro nos emprestados (Ré♭ e
//   Mi♭) e o A' meio tom acima (Fá#).
// II. A ESCOLHA (5, nova): a mão passa por cima das três cartas, e cada uma mostra quem é: a da esquerda é um
//   trombone forte (o 3-3-2 no grave), a do meio o vibrafone macio, a da direita a flauta ligeira. Na dúvida, as três
//   viram e desviram cada vez mais rápido e o pizzicato sobe pelo cromático; tudo para... e a do meio é a escolhida
//   (o flip, o prato e o Ré7, o V do tom novo).
// III. O PRÊMIO (`recompensa`, um tom acima: Sol maior, 124 BPM): o tema virou festa, o groove funk cheio, e no B o
//   SOC-CER-MON sobe em sequência duas vezes. Fim: o gancho, as três cartas viram uma última vez e o Solmaj7.
// Os timbres de chip ganharam passa-baixa (lead, sino, cartas, chimbal, guizo) e o bumbo do kit no barramento.
// ~2:20.
import draft from '../pecas/draft.mjs';
import recompensa from '../pecas/recompensa.mjs';
import { bass, drum, GANCHO, MAJOR, mel, padChord, stabs, thirdBelow } from '../synth.mjs';
import { estender } from './estender.mjs';
import { BATERIA, bumbo, trombone } from './kit.mjs';
import { emendar, rms } from './kit-novas.mjs';

export const meta = { titulo: 'Três cartas', faixa: 3 };

function mesa() {
    const { S, P, n } = estender(draft, [[0, 34]], {
        fim: 5,
        tail: 4,
        barramentos: { bateria: BATERIA },
        bus: { bumbo: 'bateria', clap: 'bateria' },
        troca: { bumbo: { inst: bumbo, gain: 0.75 } },
    });
    const tb = trombone(S, 'trombone', { pan: -0.45, gain: 0.9, rev: 0.25 });
    // a escolha: cada carta mostra quem é
    drum(P('flip1'), n, 1, 'x...............');
    mel(tb, n, ['F#2:3 F#2:3 C#3:2 r:8']);
    drum(P('flip2'), n + 1, 1, 'x...............');
    mel(P('vibrafone'), n + 1, ['A#5:2 C#6:2 F6:4 r:8']);
    drum(P('flip3'), n + 2, 1, 'x...............');
    mel(P('flauta'), n + 2, ['F#6:1 F6:1 C#6:1 A#5:1 G#5:1 A#5:1 C#6:2 r:8']);
    for (let i = 0; i < 3; i++) {
        padChord(P('cordas'), n + i, 'F#maj7', 16, { low: 55, n: 4, vel: 0.4 });
        drum(P('shaker'), n + i, 1, 'x.o.x.o.x.o.x.o.', { vel: 0.6 });
        bass(P('baixo'), n + i, 'F#maj7', '0:8 5:8', { vel: 0.6 });
    }
    // na dúvida: as três viram e desviram, o pizzicato sobe pelo cromático
    drum(P('flip1'), n + 3, 1, 'x.....x.....x.x.');
    drum(P('flip2'), n + 3, 1, '..x.....x.....x.');
    drum(P('flip3'), n + 3, 1, '....x.....x...xx');
    mel(P('pizzicato'), n + 3, ['C#5:2 D5:2 D#5:2 E5:2 F5:1 F#5:1 G5:1 G#5:1 A5:1 A#5:1 B5:1 C6:1']);
    padChord(P('cordas'), n + 3, 'D7', 16, { low: 54, n: 4, vel: 0.5 });
    bass(P('baixo'), n + 3, 'D7', '0:2 0:2 0:2 0:2 0:1 0:1 0:1 0:1 0:1 0:1 0:1 0:1', { vel: 0.7 });
    drum(P('bumbo'), n + 3, 1, 'X...X...X.X.XXXX', { vel: 0.7 });
    // tudo para... e a do meio é a escolhida
    drum(P('flip2'), n + 4, 1, '........X.......');
    mel(P('carta2'), n + 4, ['r:8 D6:8']);
    stabs(P('piano'), n + 4, 'D7', [[8, 8]], { low: 57, n: 4 });
    padChord(P('cordas'), n + 4, 'D7', 8, { low: 54, n: 4, vel: 0.7, at: 8 });
    bass(P('baixo'), n + 4, 'D7', 'r:8 0:8');
    drum(P('bumbo'), n + 4, 1, '........X.......');
    drum(P('bloco'), n + 4, 1, '........X.......', { pitch: -12 });
    return { S, fim: S.timeOfBar(n + 5) };
}

function premio() {
    const { S, P, n } = estender(
        recompensa,
        [
            [0, 17, 2],
            [9, 17, 2],
        ],
        {
            fim: 3,
            tail: 5,
            barramentos: { bateria: BATERIA },
            bus: { bumbo: 'bateria', clap: 'bateria' },
            troca: { bumbo: { inst: bumbo, gain: 0.8 } },
            corte: {
                lead: 3500,
                terças: 3000,
                sino: 4500,
                carta1: 5000,
                carta2: 5000,
                carta3: 5000,
                chimbal: 7000,
                brilho: 6000,
                crash: 6000,
            },
        },
    );
    const virar = (b, notas) =>
        notas.forEach((x, i) => {
            const r = [8, 11, 14][i];
            mel(P(`carta${i + 1}`), b, [`r:${r} ${x}:2 r:${14 - r}`]);
            drum(P(`flip${i + 1}`), b, 1, `${'.'.repeat(r)}x${'.'.repeat(15 - r)}`);
        });
    // fim em Sol: o gancho, as cartas viram uma última vez, o Solmaj7
    const call = GANCHO.em({ tom: 7, oitava: -1 });
    mel(P('lead'), n, [call]);
    mel(P('terças'), n, [call], { harm: thirdBelow(MAJOR(7)) });
    drum(P('clap'), n, 1, GANCHO.palmas, { vel: 1.2 });
    bass(P('baixo'), n, 'Gmaj7', '0:1 r:1 8:1 r:1 0:2 5:1 r:1 0:1 r:1 s:1 8:1 r:2 5:1 3:1');
    stabs(P('piano'), n, 'Gmaj7', [2, 6, 10, 14], { low: 58, n: 4 });
    drum(P('bumbo'), n, 1, 'X.....x...X.....');
    drum(P('chimbal'), n, 1, 'x.x.x.x.x.x.x.x.');
    virar(n, ['D6', 'E6', 'G6']);
    bass(P('baixo'), n + 1, 'D7', '0:4 5:4 s:4 r:4');
    stabs(P('piano'), n + 1, 'D7', [0, 4, [8, 4]], { low: 57, n: 4 });
    for (const i of [1, 2, 3]) drum(P(`flip${i}`), n + 1, 1, i === 2 ? 'x.x.x.x.xxxx....' : '....x.x.x.xx....');
    drum(P('bumbo'), n + 1, 1, 'X.......X...X...');
    mel(P('sino'), n + 2, ['B5:16']);
    mel(P('lead'), n + 2, ['G5:12 r:4']);
    stabs(P('piano'), n + 2, 'Gmaj7', [[0, 16]], { low: 55, n: 4, vel: 0.8 });
    bass(P('baixo'), n + 2, 'G', '0:16');
    drum(P('bumbo'), n + 2, 1, 'X...............');
    drum(P('crash'), n + 2, 1, 'X...............');
    for (const [i, x] of ['G6', 'B6', 'D7'].entries())
        mel(P(`carta${i + 1}`), n + 2, [`r:${i * 2} ${x}:4 r:${12 - i * 2}`], { vel: 0.5 });
    return S;
}

export default function tresCartas() {
    const { S, fim } = mesa();
    const a = S.render();
    const b = premio().render();
    // o prêmio um tico mais alto que a mesa: é a festa
    return emendar([
        { som: a, em: 0 },
        { som: b, em: fim, ganho: (1.15 * rms(a)) / rms(b) },
    ]);
}
