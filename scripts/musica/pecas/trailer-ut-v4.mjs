// Trailer v4 do Time Ultimate, o frenético (23/11/2026, roteiro-v4.md): "Do zero ao time" (trailer-ut.mjs) rearranjado a
// 150 BPM. Batida = 0,4 s; compasso = 1,6 s; 16 linhas de 0,1 s. 19 compassos (o vídeo tem 30 s = 18¾).
// O que muda da v3: a bateria inteira desde o 1º quadro, um stab de metais em cada slam de texto (cada corte do vídeo),
// um rufo de caixa a cada 4 cortes, a parada seca no walkout (14,4 a 20,8 s: só o som do estádio) e a volta 1 tom acima
// (Lá → Si dórico) no revelar da carta, com o motivo do Dratini aumentado nos metais graves. Fecha com o SOC-CER-MON.
// Sons de assinatura, um por corte, tirados da tela: o rasgo (chocalho que cresce), a carta virando (bloco de madeira),
// o "ting" do Dratini que o Dragonair responde uma terça acima (química), as moedas subindo a cada toque no nível, as 8
// insígnias num arpejo de sino (uma por semicolcheia), os guizos do Natal na faixa do Evento e o 3-3-2 do gancho nas
// edições (SHINY. ÍCONE. EVENTO.).
// Mapa (compasso.linha → plano do roteiro):
//   0 gancho: clarão do walkout (prato e tímpano), SOC-CER-MON, o rasgo · 1.0 NO CLÁSSICO, ACABA (a melodia cai) ·
//   1.8 NO ULTIMATE, É SEU (sobe) · 2.0 ABRA PACOTES · 2.8 RASGUE · 3.0 ESCOLHA SEU CRAQUE · 3.8 QUÍMICA ·
//   4.0 ESCOLHA A DIFICULDADE · 4.8 BATALHAS (o Slam é o tímpano) · 5.12 GOL · 6.0 8 GINÁSIOS · 6.8 METAS · 7.0 PASSE ·
//   7.8 EVENTOS · 8.0/8.3/8.6 SHINY. ÍCONE. EVENTO. · 8.8 Abrir todos: sobe pelo cromático e corta seco ·
//   9-12 silêncio (walkout) · 13 o revelar da carta, Si dórico, o motivo nos metais graves · 14-15 MONTE SEU TIME ·
//   16 E VAI TER MAIS (um sino por modo "Em breve") · 17 SOC-CER-MON em Si · 18 o acorde de Si maior (o bronze virou ouro).
import { bass, drum, GANCHO, I, mel, padChord, Song, stabs } from '../synth.mjs';

export const meta = { titulo: 'Trailer UT v4: Do zero ao time (150)', tela: 'Trailer v4 do Time Ultimate' };

const semDC = (inst) => [...inst.slice(0, -1), 40];

export default function trailerUtV4() {
    const S = new Song({ bpm: 150, bars: 19, swing: 0.06, tail: 2.5 });
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
    drum(carta, 0, 1, '..............x.', { pitch: 0 });

    // 1 · tela dividida: NO CLÁSSICO, ACABA (a melodia cai) / NO ULTIMATE, É SEU (sobe e fica)
    groove(1, 'Am9');
    bate(1, 0, 'Am9');
    bate(1, 8, 'Am9');
    mel(lead, 1, ['E5:2 D5:2 C5:2 A4:2 A4:2 C5:2 E5:2 A5:2']);

    // 2 · ABRA PACOTES (o leque, o Dratini pousa) · RASGUE (o 2º pacote rasgado); rufo pro 4º corte
    groove(2, 'D9');
    bate(2, 0, 'D9');
    bate(2, 8, 'D9');
    drum(carta, 2, 1, '..x.x.x.........', { vel: 0.8 });
    drum(rasgo, 2, 1, '........ooxX....');
    mel(pic, 2, ['A5:2 C6:1 E6:1 D6:4 r:8']);
    rufa(2);

    // 3 · ESCOLHA SEU CRAQUE (a carta vira: madeira) · QUÍMICA (o toque no Dratini dá o "ting"; o Dragonair responde)
    groove(3, 'Am9');
    bate(3, 0, 'Am9');
    bate(3, 8, 'Am9');
    drum(carta, 3, 1, '...x.x..........', { pitch: 7 });
    mel(pic, 3, ['r:10 A5:2 r:4']);
    mel(vib, 3, ['r:11 C6:2 r:3']);

    // 4 · ESCOLHA A DIFICULDADE: uma moeda mais aguda a cada nível tocado · BATALHAS DE TREINADOR: o Slam é o tímpano
    groove(4, 'D9');
    bate(4, 0, 'D9');
    bate(4, 8, 'D9');
    for (const [j, r] of [0, 2, 4, 6].entries()) coin.note(4 * 16 + r, [0, 3, 7, 12][j], 0, 0.6 + j * 0.08);
    drum(bonk, 4, 1, '........X.......', { pitch: -5 });

    // 5 · a partida: o drible é a melodia; as cordas sobem pelo cromático e o rufo leva pro GOL na batida 23 (9,2 s,
    // linha 12: prato e acorde), com a rede lenta até o corte
    groove(5, 'Am9');
    mel(lead, 5, ['A5:3 G5:2 E5:3 C6:2 B5:2 A5+E6:4']);
    mel(cordas, 5, ['r:4 E5:1 F5:1 F#5:1 G5:1 G#5:1 A5:1 A#5:1 B5:1 r:4']);
    rufa(5, '........x.xxX...');
    drum(prato, 5, 1, '............X...');
    drum(torcida, 5, 1, '............x..x');

    // 6 · 8 GINÁSIOS (a torcida segue no 3-3-2): as 8 insígnias num arpejo de sino · METAS: as moedas
    groove(6, 'D9');
    drum(torcida, 6, 1, 'x..x..x.........');
    bate(6, 0, 'D9');
    mel(sino, 6, ['r:1 A5:1 B5:1 C6:1 D6:1 E6:1 F#6:1 G6:1 A6:8']);
    bate(6, 8, 'D9');
    drum(coin, 6, 1, '..........x.x...', { pitch: 12, vel: 0.6 });

    // 7 · PASSE DA TEMPORADA (as cordas correm de lado) · EVENTOS TODA SEMANA (os guizos do Natal); rufo pro 12º corte
    groove(7, 'Am9');
    bate(7, 0, 'Am9');
    mel(cordas, 7, ['A5:1 B5:1 C6:1 D6:1 E6:1 F#6:1 G6:1 A6:1 r:8'], { vel: 0.8 });
    bate(7, 8, 'Am9');
    drum(guizo, 7, 1, '........xoxoxoxo');
    rufa(7);

    // 8 · SHINY. ÍCONE. EVENTO. no 3-3-2 do gancho · "Abrir todos (2)": sobe pelo cromático, rufo e corta seco no walkout
    bass(bs, 8, 'E7', '0:3 0:3 0:2 0:1 0:1 3:1 3:1 5:1 5:1 7:1 8:1');
    drum(k, 8, 1, 'X..X..X.X.X.X.X.');
    drum(hh, 8, 1, 'x..x..x.xxxxxxxx', { vel: 0.8 });
    stabs(
        slam,
        8,
        'E7',
        [
            [0, 2],
            [3, 2],
            [6, 2],
        ],
        { low: 62, n: 3 },
    );
    mel(lead, 8, [`${GANCHO.em({ grau: -2, ritmo: [3, 3, 2, 0] })} A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1`]);
    mel(cordas, 8, ['r:8 A5:1 A#5:1 B5:1 C6:1 C#6:1 D6:1 D#6:1 E6:1']);
    drum(rufo, 8, 1, '........xxxxXXXX', { vel: 0.9 });
    drum(cl, 8, 1, 'x..x..x.........');

    // 9-12 · o walkout: silêncio (o estádio tem som próprio)

    // 13 · o revelar da carta: prato, Si dórico e o motivo do Dratini aumentado nos metais graves (o bronze virou ouro)
    groove(13, 'Bm9');
    drum(prato, 13, 1, 'X...............');
    drum(bonk, 13, 1, 'X...............', { pitch: 2 });
    mel(metais, 13, ['B3:4 D4:2 F#4:2 E4:8']);
    mel(tuba, 13, ['B2:4 D3:2 F#3:2 E3:8']);
    padChord(org, 13, 'Bm9', 16, { low: 57, n: 4, vel: 0.8 });
    padChord(cordas, 13, 'Bm9', 16, { low: 62, n: 3, vel: 0.6 });

    // 14-15 · MONTE SEU TIME: o balanço em Si; o pícolo (o Dratini) pula quando o dedo toca nele; rufo pro E VAI TER MAIS
    groove(14, 'Bm9');
    groove(15, 'E9');
    bate(14, 0, 'Bm9');
    padChord(org, 14, 'Bm9', 16, { low: 57, n: 4, vel: 0.5 });
    padChord(org, 15, 'E9', 16, { low: 57, n: 4, vel: 0.5 });
    mel(lead, 14, ['B5:3 A5:2 F#5:3 r:8']);
    mel(pic, 14, ['r:13 B5:2 D6:1']);
    mel(pic, 15, ['F#6:1 E6:3 r:12']);
    mel(vib, 15, ['r:4 G#5:2 B5:2 D6:4 r:4']);
    rufa(15);

    // 16 · E VAI TER MAIS: um sino e um stab por modo "Em breve" (Rivais, Elite dos Quatro, Draft, Desafios de Montagem)
    groove(16, 'E9');
    stabs(
        slam,
        16,
        'E9',
        [
            [0, 2],
            [4, 2],
            [8, 2],
            [12, 2],
        ],
        { low: 62, n: 3, vel: 0.85 },
    );
    mel(sino, 16, ['B5:4 D6:4 E6:4 F#6:4']);
    rufa(16, '............xxXX');

    // 17 · SOC-CER-MON em Si (lead e metais), com a torcida e o clap no 3-3-2
    groove(17, 'E9');
    drum(prato, 17, 1, 'X...............');
    bate(17, 0, 'E9');
    mel(lead, 17, [GANCHO.em({ grau: -2, tom: 2 })]);
    mel(metais, 17, [GANCHO.em({ grau: -2, tom: 2, oitava: -1 })]);
    drum(torcida, 17, 1, GANCHO.palmas);
    drum(cl, 17, 1, GANCHO.palmas, { vel: 0.8 });

    // 18 · o acorde de Si maior
    drum(prato, 18, 1, 'X...............');
    drum(k, 18, 1, 'X...............');
    drum(bonk, 18, 1, 'X...............', { pitch: 2 });
    mel(metais, 18, ['B4+D#5+F#5:16']);
    mel(tuba, 18, ['B2:16']);
    mel(lead, 18, ['B5+D#6:16'], { vel: 0.8 });
    mel(vib, 18, ['F#6:2 D#6:2 B5:12']);
    padChord(org, 18, 'B', 16, { low: 59, n: 4, vel: 0.8 });
    padChord(cordas, 18, 'Badd9', 16, { low: 62, n: 4, vel: 0.7 });
    bass(bs, 18, 'B', '0:16');
    return S;
}
