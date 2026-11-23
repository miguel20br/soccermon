// Trailer v5 do Time Ultimate (23/11/2026): a v4 (trailer-ut-v4.mjs) esticada pro Miguel conseguir LER as manchetes. Mesma
// peça a 150 BPM (batida = 0,4 s; compasso = 1,6 s), mas cada cartela de feature fica um compasso inteiro (4 batidas)
// em vez de meio. 23 compassos; o vídeo tem 36,4 s (22¾). Walkout, revelar e fecho iguais aos da v4, só mais tarde.
// Mapa (compasso → plano):
//   0 gancho (clarão do walkout, SOC-CER-MON, rasgo) · 1 NO CLÁSSICO, ACABA (a melodia cai) · 2 NO ULTIMATE, É SEU (sobe) ·
//   3 ABRA PACOTES (o rasgo e o Dratini pousando) · 4 ESCOLHA SEU CRAQUE · 5 QUÍMICA · 6 ESCOLHA A DIFICULDADE ·
//   7-8 BATALHAS DE TREINADOR (GOL em 8.12) · 9 8 GINÁSIOS · 10 METAS E PASSE · 11 EVENTO DE NATAL (guizos) ·
//   12 SHINY. ÍCONE. EVENTO. (uma batida, uma batida, duas) · 13 Abrir todos e o 2º pacote: sobe pelo cromático e corta
//   seco · 14-17 silêncio (walkout) · 18 o revelar da carta, Si dórico, o motivo do Dratini nos metais graves ·
//   19 MONTE SEU TIME · 20 E VAI TER MAIS · 21 SOC-CER-MON em Si · 22 o acorde de Si maior.
import { bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';

export const meta = { titulo: 'Trailer UT v5: Do zero ao time (150, legível)', tela: 'Trailer v5 do Time Ultimate' };

const semDC = (inst) => [...inst.slice(0, -1), 40];

export default function trailerUtV5() {
    const S = new Song({ bpm: 150, bars: 23, swing: 0.06, tail: 2.5 });
    const lead = S.part('synth', semDC(I.pulse), {
        pan: -0.1,
        gain: 1.3,
        echo: { rows: 3, fb: 0.2, mix: 0.18 },
        rev: 0.2,
        corte: 2800,
    });
    const pic = S.part('pícolo (Dratini)', I.piccolo, {
        pan: 0.1,
        gain: 1.6,
        echo: { rows: 3, fb: 0.3, mix: 0.25 },
        rev: 0.25,
    });
    const vib = S.part('vibrafone (Dragonair)', I.bell, {
        pan: 0.3,
        gain: 2.1,
        echo: { rows: 3, fb: 0.2, mix: 0.2 },
        rev: 0.35,
    });
    const metais = S.part('metais', I.brass, { gain: 0.8, rev: 0.2 });
    // o stab do slam: metais curtos, mais brilhantes que os do tema
    const slam = S.part('stab dos slams', I.brass, { gain: 0.62, rev: 0.15, corte: 4200 });
    const tuba = S.part('tuba', I.tuba, { gain: 0.6, corte: 900 });
    const clav = S.part('clavinete', semDC(I.clav), { pan: 0.3, gain: 0.8, corte: 2200 });
    const gt = S.part('guitarra', I.chank, { pan: -0.35, gain: 0.9 });
    const org = S.part('órgão', semDC(I.organ), { gain: 0.4, corte: 1800, rev: 0.2 });
    const cordas = S.part('cordas', I.strings, { gain: 1.1, rev: 0.25 });
    const bs = S.part('baixo', I.slap, { gain: 0.42, corte: 1100 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.55 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.36 });
    const rufo = S.part('rufo', I.snare, { drum: true, gain: 0.5, pan: 0.1 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.42 });
    const cl = S.part('clap', I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.25 }), { drum: true, gain: 0.75 });
    const torcida = S.part('torcida', I.palmas, { drum: true, gain: 0.7, rev: 0.2 });
    const prato = S.part('prato', I.crash, { drum: true, gain: 0.5 });
    const bonk = S.part('tímpano', I.timp, { drum: true, gain: 0.45 });
    const rasgo = S.part('rasgo', I.shaker, { drum: true, pan: 0.15, gain: 2.4 });
    const carta = S.part('cartas', I.block, { drum: true, pan: 0.2, gain: 0.9 });
    const coin = S.part('moedas', I.coin, { drum: true, pan: -0.3, gain: 1.1, rev: 0.15 });
    const sino = S.part('insígnias', I.bell, { pan: -0.2, gain: 1.8, rev: 0.3 });
    const guizo = S.part('guizos', I.sleigh, { drum: true, pan: 0.3, gain: 4 });

    const HATS = 'x.xx.x.xx.xx.x.x'.replace(/\./g, 'o');
    const SLAP = '0:2 8:1~ r:1 0:2 r:2 5:2 s:2 8:2 5:2';
    // a banda inteira (o "frenético" é ela tocando sem parar até o walkout)
    const groove = (b, c) => {
        bass(bs, b, c, SLAP);
        stabs(gt, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        stabs(
            clav,
            b,
            c,
            [
                [3, 1],
                [7, 1],
                [11, 2],
            ],
            { low: 60, n: 3, vel: 0.7 },
        );
        drum(k, b, 1, 'X.....x...x.x...');
        drum(sn, b, 1, '....X..o....X.o.');
        drum(hh, b, 1, HATS);
        drum(cl, b, 1, '....x.......x...');
    };
    /** O stab de metais do slam de texto, na linha `r` do compasso `b`. */
    const bate = (b, r, c, vel = 1) => stabs(slam, b, c, [[r, 2]], { low: 62, n: 3, vel });
    /** Rufo de caixa nas últimas linhas do compasso (a cada 4 cortes). */
    const rufa = (b, pat = '............xxxX') => drum(rufo, b, 1, pat, { vel: 0.9 });

    // 0 · gancho: o clarão do walkout (prato e tímpano no 1º quadro), SOC-CER-MON e o rasgo do pacote
    groove(0, 'Am9');
    drum(prato, 0, 1, 'X...............');
    drum(bonk, 0, 1, 'X...............', { pitch: -3 });
    mel(lead, 0, [GANCHO.em({ grau: -2 })]);
    drum(rasgo, 0, 1, '....ooxX........');

    // 1 · NO CLÁSSICO, ACABA: a melodia cai (o dedo em "Nova copa" na linha 4) · 2 · NO ULTIMATE, É SEU: sobe e fica
    groove(1, 'Am9');
    bate(1, 0, 'Am9');
    mel(lead, 1, ['E5:4 D5:4 C5:4 A4:4']);
    groove(2, 'D9');
    bate(2, 0, 'D9');
    mel(lead, 2, ['A4:4 C5:4 E5:4 A5:4']);

    // 3 · ABRA PACOTES: o rasgo (chocalho que cresce) e, na metade, o Dratini pousa (o motivo no pícolo); rufo pro 4º corte
    groove(3, 'Am9');
    bate(3, 0, 'Am9');
    drum(rasgo, 3, 1, 'ooxX............');
    drum(carta, 3, 1, '........x.x.....', { vel: 0.8 });
    mel(pic, 3, ['r:8 A5:2 C6:1 E6:1 D6:4']);
    rufa(3);

    // 4 · ESCOLHA SEU CRAQUE: a carta vira (madeira)
    groove(4, 'D9');
    bate(4, 0, 'D9');
    drum(carta, 4, 1, '...x.x..........', { pitch: 7 });
    mel(lead, 4, ['r:8 F#5:2 A5:2 D6:4']);

    // 5 · QUÍMICA: o toque no Dratini dá o "ting" e o Dragonair responde uma terça acima; depois os dois juntos
    groove(5, 'Am9');
    bate(5, 0, 'Am9');
    mel(pic, 5, ['r:4 A5:2 r:10']);
    mel(vib, 5, ['r:5 C6:2 r:1 A5+C6:2 C6+E6:1 E6+G6:1 D6+F#6:4']);

    // 6 · ESCOLHA A DIFICULDADE: uma moeda mais aguda a cada nível tocado
    groove(6, 'D9');
    bate(6, 0, 'D9');
    for (const [j, r] of [1, 3, 5, 7].entries()) coin.note(6 * 16 + r, [0, 3, 7, 12][j], 0, 0.6 + j * 0.08);

    // 7-8 · BATALHAS DE TREINADOR: o Slam é o tímpano; o drible é a melodia; as cordas sobem e o rufo leva pro GOL
    // (8.12 = 14,0 s: prato, acorde e torcida), com a rede lenta até o corte
    groove(7, 'Am9');
    bate(7, 0, 'Am9');
    drum(bonk, 7, 1, '.X..............', { pitch: -5 });
    mel(lead, 7, ['r:4 A5:3 G5:2 E5:3 r:4']);
    groove(8, 'D9');
    mel(lead, 8, ['C6:2 B5:2 A5:2 G5:2 E5:2 G5:2 A5+E6:4']);
    mel(cordas, 8, ['r:4 E5:1 F5:1 F#5:1 G5:1 G#5:1 A5:1 A#5:1 B5:1 r:4']);
    rufa(8, '........x.xxX...');
    drum(prato, 8, 1, '............X...');
    drum(torcida, 8, 1, '............x..x');

    // 9 · 8 GINÁSIOS (a torcida segue no 3-3-2): as 8 insígnias num arpejo de sino
    groove(9, 'Am9');
    bate(9, 0, 'Am9');
    drum(torcida, 9, 1, 'x..x..x.........');
    mel(sino, 9, ['r:1 A5:1 B5:1 C6:1 D6:1 E6:1 F#6:1 G6:1 A6:8']);

    // 10 · METAS E PASSE: o "plim" no marco pego, depois as cordas correm de lado com a trilha do passe
    groove(10, 'D9');
    bate(10, 0, 'D9');
    drum(coin, 10, 1, '....x.x.........', { pitch: 12, vel: 0.6 });
    mel(cordas, 10, ['r:8 A5:1 B5:1 C6:1 D6:1 E6:1 F#6:1 G6:1 A6:1'], { vel: 0.8 });

    // 11 · EVENTO DE NATAL: os guizos o compasso inteiro e o vibrafone num arpejo de festa
    groove(11, 'Am9');
    bate(11, 0, 'Am9');
    drum(guizo, 11, 1, 'xoxoxoxoxoxoxoxo');
    mel(vib, 11, ['r:4 E6:2 C6:2 A5:2 C6:2 E6:4']);

    // 12 · SHINY. ÍCONE. EVENTO.: um stab por carta (as notas do gancho, 4-4-8); rufo pro 12º corte
    groove(12, 'E7');
    stabs(
        slam,
        12,
        'E7',
        [
            [0, 2],
            [4, 2],
            [8, 2],
        ],
        { low: 62, n: 3 },
    );
    mel(lead, 12, [GANCHO.em({ grau: -2, ritmo: [4, 4, 8, 0] })]);
    rufa(12);

    // 13 · "Abrir todos (2)" e o 2º pacote rasgando sozinho: sobe pelo cromático, rufo e corta seco no walkout
    bass(bs, 13, 'E7', '0:2 0:2 0:2 0:2 3:1 3:1 5:1 5:1 7:1 7:1 8:1 8:1');
    drum(k, 13, 1, 'X...X...X.X.X.X.');
    drum(hh, 13, 1, 'x.x.x.x.xxxxxxxx', { vel: 0.8 });
    drum(cl, 13, 1, '....x.......x...');
    mel(lead, 13, ['E5:2 r:6 A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1']);
    mel(cordas, 13, ['r:8 A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1']);
    drum(rufo, 13, 1, '........xxxxXXXX', { vel: 0.9 });

    // 14-17 · o walkout: silêncio (o estádio tem som próprio)

    // 18 · o revelar da carta: prato, Si dórico e o motivo do Dratini aumentado nos metais graves (o bronze virou ouro)
    groove(18, 'Bm9');
    drum(prato, 18, 1, 'X...............');
    drum(bonk, 18, 1, 'X...............', { pitch: 2 });
    mel(metais, 18, ['B3:4 D4:2 F#4:2 E4:8']);
    mel(tuba, 18, ['B2:4 D3:2 F#3:2 E3:8']);
    padChord(org, 18, 'Bm9', 16, { low: 57, n: 4, vel: 0.8 });
    padChord(cordas, 18, 'Bm9', 16, { low: 62, n: 3, vel: 0.6 });

    // 19 · MONTE SEU TIME: o balanço em Si; o pícolo (o Dratini) pula quando o dedo toca nele (linha 14)
    groove(19, 'Bm9');
    bate(19, 0, 'Bm9');
    padChord(org, 19, 'Bm9', 16, { low: 57, n: 4, vel: 0.5 });
    mel(lead, 19, ['B5:3 A5:2 F#5:3 r:8']);
    mel(pic, 19, ['r:13 B5:1 D6:1 F#6:1']);

    // 20 · E VAI TER MAIS: um sino e um stab por modo "Em breve" (Rivais, Elite dos Quatro, Draft, Desafios de Montagem)
    groove(20, 'E9');
    stabs(
        slam,
        20,
        'E9',
        [
            [0, 2],
            [4, 2],
            [8, 2],
            [12, 2],
        ],
        { low: 62, n: 3, vel: 0.85 },
    );
    mel(sino, 20, ['B5:4 D6:4 E6:4 F#6:4']);
    rufa(20, '............xxXX');

    // 21 · SOC-CER-MON em Si (lead e metais), com a torcida e o clap no 3-3-2
    groove(21, 'E9');
    drum(prato, 21, 1, 'X...............');
    bate(21, 0, 'E9');
    mel(lead, 21, [GANCHO.em({ grau: -2, tom: 2 })]);
    mel(metais, 21, [GANCHO.em({ grau: -2, tom: 2, oitava: -1 })]);
    drum(torcida, 21, 1, GANCHO.palmas);
    drum(cl, 21, 1, GANCHO.palmas, { vel: 0.8 });

    // 22 · o acorde de Si maior
    drum(prato, 22, 1, 'X...............');
    drum(k, 22, 1, 'X...............');
    drum(bonk, 22, 1, 'X...............', { pitch: 2 });
    mel(metais, 22, ['B4+D#5+F#5:16']);
    mel(tuba, 22, ['B2:16']);
    mel(lead, 22, ['B5+D#6:16'], { vel: 0.8 });
    mel(vib, 22, ['F#6:2 D#6:2 B5:12']);
    padChord(org, 22, 'B', 16, { low: 59, n: 4, vel: 0.8 });
    padChord(cordas, 22, 'Badd9', 16, { low: 62, n: 4, vel: 0.7 });
    bass(bs, 22, 'B', '0:16');
    return S;
}
