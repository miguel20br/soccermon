// Trailer 2 com a Abertura (teste, 22/10/2026). Pedido do Miguel: trocar o Trainer Battle Remix por um tema nosso, a
// Abertura com gancho misturada com música de batalha, composta em cima do corte do trailer 2 v3 (sem mexer no corte).
// Grade do trailer: 178 BPM, compasso 1,3483 s. O compasso 1 começa na batida B0 do vídeo (6,408 s); o compasso 0 é a
// anacruse depois do apito (o arquivo entra em 5,060 s do vídeo). O vídeo acaba no começo do compasso 21 (B80).
// Compasso: plano do vídeo → música
//   0      apito (5,5 s) → silêncio, rufar e subida pro Dó (entra em 5,9 s, como a faixa antiga)
//   1–2    ESCOLHA 1 DE 3: o SOC-CER-MON aumentado, uma nota por carta (B0, B2, B4); clap "hey hey" no destaque (B6)
//   3–6    pacote, ÍCONES RAROS, edições: o A da Abertura a 178 BPM em Dó; sino e virada de carta a cada edição
//   7–9    partida: Lá menor de batalha (riff e tema da Partida v4, baixo em colcheias); FIRE BLAST com o gancho em menor
//          nos metais; na defesa (B34) a banda inteira para num E7b9 e a torcida faz "uuh" no silêncio
//   10–12  evolução: o baixo sobe pelo cromático (Fá, Fá#, Sol no Raichu, Sol#, Lá); no chute em câmera lenta a banda
//          respira e só o rufar sobe
//   13–16  GOL (B48): um tom acima (Ré maior), o refrão da Abertura com segunda voz, metais e o clap 808
//   17–18  o pacote cai (B66): a banda para; tremidas no tímpano; rasga (B69) com rufar e a subida em Lá7
//   19–20  logo (B72) e soccermon.com (B76): o gancho SOC-CER-MON duas vezes com a banda junto (as sílabas do logo
//          piscam nas 3 batidas: linhas 0, 3 e 6 desses compassos)
// Clap: o 808 na receita da rodada 7b (−6 dB, passa-baixa 6,5 kHz, sala curta); na resposta do gancho, dobrado como
// torcida (o segundo 11 ms depois, um pouco mais agudo), como no Campeão.
import { arp, bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, voicing } from '../synth.mjs';
import { FLIP } from './draft.mjs';

export const meta = { titulo: 'Trailer 2 com a Abertura (teste)', tela: 'Trailer', lufs: -14 };

export default function trailerAbertura() {
    const S = new Song({ bpm: 178, bars: 21, swing: 0.06, tail: 2.5 });
    const lead = S.part('lead', I.lead, { pan: -0.1, gain: 1, echo: { rows: 3, fb: 0.25, mix: 0.18 }, rev: 0.08 });
    const harm = S.part('terças', I.pulse, { pan: 0.25, gain: 0.55 });
    const counter = S.part('contracanto', I.counter, { pan: -0.35, gain: 0.7 });
    const bs = S.part('baixo', I.slap, { gain: 0.8 });
    const st = S.part('acordes', I.stab, { pan: 0.3, gain: 0.85 });
    const clav = S.part('clavinete', I.clav, { pan: 0.4, gain: 0.9 });
    const ar = S.part('arpejo', I.arp, { pan: 0.55, gain: 0.7, echo: { rows: 2, fb: 0.2, mix: 0.25 } });
    const pad = S.part('pad', I.pad, { gain: 0.7 });
    const horns = S.part('metais', I.brass, { pan: 0.2, gain: 0.8, rev: 0.15 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 2, rev: 0.25 });
    const flip = S.part('carta', FLIP, { drum: true, pan: -0.2, gain: 1.4 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.9 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.8 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.35, gain: 0.9 });
    const sh = S.part('shaker', I.shaker, { drum: true, pan: -0.45, gain: 0.8 });
    const cr = S.part('crash', I.crash, { drum: true, pan: 0.2, gain: 0.8 });
    const tm = S.part('tom', I.tom, { drum: true, gain: 0.8 });
    const ti = S.part('tímpano', I.timp, { drum: true, gain: 0.3, rev: 0.2 });
    const clap = I.clap808.com({ ganho: 0.5, corte: 6500, sala: 0.3 });
    const cl = S.part('clap', clap, { drum: true, gain: 1.2 });
    const cl2 = S.part('clap2', clap.com({ atraso: 0.011, tom: 0.4 }), { drum: true, pan: 0.4, gain: 0.9 });
    const hey = (bar, pat = GANCHO.palmas, vel = 1.2) => {
        drum(cl, bar, 1, pat, { vel });
        drum(cl2, bar, 1, pat, { vel });
    };

    const DOMAJ = thirdBelow(MAJOR(0));
    const REMAJ = thirdBelow(MAJOR(2));
    const FUNK = '0:2 8:1~ 0:1 r:1 5:1 8:2 0:1 r:1 8:1~ s:2 5:1 3:2'; // o baixo da Abertura
    const BATALHA = '0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 5:1 r:1 s:1 8:1'; // colcheias que empurram
    const STAB = [3, 6, [10, 2], 14];
    const groove = (bar, n, { kick = 'X.....x.X.....x.', backbeat = true } = {}) => {
        drum(k, bar, n, kick);
        drum(sn, bar, n, '....X..o.o..X..o');
        drum(hh, bar, n, 'xoxoxoxoxoxoxoxo');
        drum(sh, bar, n, 'x.o.x.o.x.o.x.o.');
        if (backbeat) drum(cl, bar, n, '....x.......x...', { vel: 0.7 });
    };

    // 0: anacruse (a música entra depois do apito)
    drum(sn, 0, 1, '..........xxXXXX', { vel: 0.9 });
    drum(tm, 0, 1, '..........x.x.x.', { pitch: 4 });
    mel(lead, 0, ['r:10 G4:2 B4:2 D5:2']);

    // 1–2: escolha 1 de 3. Uma nota do gancho por carta (B0, B2, B4) e o "hey hey" no destaque (B6)
    mel(lead, 1, ['G5:8 E5:8', 'C6:8 r:8']);
    mel(harm, 1, ['G5:8 E5:8', 'C6:8 r:8'], { harm: DOMAJ });
    mel(sino, 1, ['G6:8 E6:8', 'C7:8 r:8']);
    drum(flip, 1, 1, 'x.......x.......');
    drum(flip, 2, 1, 'x...............');
    drum(cr, 1, 1, 'X...............');
    bass(bs, 1, 'C', FUNK);
    bass(bs, 2, 'Fmaj7', '0:2 8:1~ 0:1 r:1 5:1 8:2 r:8');
    bass(bs, 2, 'G7', 'r:8 0:2 r:2 8:2 s:2');
    stabs(st, 1, 'C', STAB);
    stabs(st, 2, 'Fmaj7', [3, 6]);
    stabs(
        st,
        2,
        'G7',
        [
            [8, 1],
            [10, 1],
        ],
        { vel: 1.2 },
    );
    padChord(pad, 1, 'C', 16);
    padChord(pad, 2, 'Fmaj7', 8);
    padChord(pad, 2, 'G7', 8, { at: 8 });
    groove(1, 1);
    drum(k, 2, 1, 'X.....x.X.X.....');
    drum(sn, 2, 1, '....X..o....xxXX');
    drum(hh, 2, 1, 'xoxoxoxo........');
    hey(2, '........x.x.....');

    // 3–6: pacote (B8, abre em B10), ÍCONES RAROS (B12), edições (B16, B18, B20, B22): o A da Abertura
    const A_CH = ['C', 'Am7', 'Fmaj7', 'G7'];
    mel(lead, 3, [
        'E5:2 E5:2 G5:3 E5:1 r:2 D5:2 C5:2 D5:2',
        'E5:3 C5:3 A4:2 r:2 C5:2 E5:2 G5:2',
        'A5:3 G5:3 F5:2 E5:2 C5:2 A4:2 C5:2',
        'D5:6 r:2 B4:2 C5:2 D5:2 F5:2',
    ]);
    mel(counter, 3, ['G4:6 E4:2 G4:8', 'A4:6 G4:2 E4:8', 'F4:6 A4:2 C5:8', 'B4:8 G4:4 F4:4'], { vel: 0.8 });
    A_CH.forEach((c, i) => {
        bass(bs, 3 + i, c, FUNK);
        stabs(st, 3 + i, c, STAB);
        if (i >= 2) arp(ar, 3 + i, c, { low: 64, step: 1 });
    });
    groove(3, 4);
    drum(cr, 4, 1, 'X...............'); // ÍCONES RAROS
    drum(flip, 3, 1, '........x.......'); // o pacote abre
    // as edições: carta virando + sino na nota do acorde
    drum(flip, 5, 2, 'x.......x.......');
    mel(sino, 5, ['C7:8 A6:8', 'B6:8 D7:8']);
    drum(sn, 6, 1, '............xxXX');

    // 7–9: partida em Lá menor, energia de batalha
    const RIFF = 'A4:1 A4:1 r:1 C5:1 r:1 D5:2 E5:1 r:2 G5:1 E5:2 D5:1 C5:1 A4:1';
    mel(clav, 7, [RIFF]);
    mel(clav, 8, [RIFF], { shift: 5, vel: 0.7 });
    mel(lead, 7, ['E5:2 E5:1 E5:1 G5:2 A5:2 r:2 G5:1 E5:1 D5:2 C5:2']);
    bass(bs, 7, 'Am7', BATALHA);
    stabs(st, 7, 'Am7', [[0, 2], 6, 10, 14]);
    drum(cr, 7, 1, 'X...............');
    // FIRE BLAST (B28): os metais e o lead gritam o gancho em menor (3-3-2)
    const hookMenor = GANCHO.em({ tom: -3, menor: true }); // E5 C5 A5
    mel(lead, 8, [hookMenor]);
    mel(horns, 8, [GANCHO.em({ tom: -3, menor: true, oitava: -1 })]);
    bass(bs, 8, 'D7', BATALHA);
    stabs(
        st,
        8,
        'D7',
        [
            [0, 2],
            [3, 2],
            [6, 4],
        ],
        { vel: 1.1 },
    );
    drum(ti, 8, 1, 'X..x..x.........');
    // defesa: a banda para inteira em B34 (linha 8 do compasso 9) e a torcida faz "uuh" no silêncio
    mel(lead, 9, ['E5:3 D5:3 C5:2 G#5:4! r:4']);
    mel(horns, 9, ['r:8 B4+D5+F5+G#5:4 r:4']);
    bass(bs, 9, 'Fmaj7', '0:1 r:1 0:1 8:1 0:1 r:1 5:1 8:1 r:8');
    bass(bs, 9, 'E7b9', 'r:8 0:4 r:4');
    stabs(st, 9, 'Fmaj7', [0, 3, 6]);
    groove(7, 2, { kick: 'X.....x.X.x...x.' });
    drum(k, 9, 1, 'X.....x.X.......');
    drum(sn, 9, 1, '....X..o........');
    drum(hh, 9, 1, 'xoxoxoxo........');
    drum(sh, 9, 1, 'x.o.x.o.........');
    drum(cl, 9, 1, '....x...........', { vel: 0.7 });
    drum(cr, 9, 1, '........X.......');
    drum(ti, 9, 1, '........X.......');

    // 10–12: evolução. O baixo sobe pelo cromático; troca de acorde na silhueta (B38) e no Raichu (B40)
    const SUBIDA = [
        [10, 'F', 'F#dim'],
        [11, 'G', 'G#dim'],
    ];
    for (const [b, c1, c2] of SUBIDA) {
        bass(bs, b, c1, '0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1 r:8');
        bass(bs, b, c2, 'r:8 0:1 r:1 0:1 8:1 0:1 r:1 0:1 8:1');
        arp(ar, b, c1, { low: 65, step: 1, rows: 8 });
        padChord(pad, b, c1, 8, { vel: 0.8 });
        padChord(pad, b, c2, 8, { at: 8, vel: 0.9 });
        stabs(st, b, c2, [[8, 2]], { vel: 1.1 });
    }
    // o arpejo do 2º acorde de cada compasso (o arp sempre começa na linha 0)
    for (const [b, , c2] of SUBIDA) {
        const v = voicing(c2, 65, 3);
        for (let i = 8; i < 16; i++) ar.note(b * 16 + i, v[i % 3] + (i >= 12 ? 12 : 0), 1, 0.8);
    }
    mel(lead, 10, ['C6:6 A5:2 C6:8', 'D6:6 B5:2 D6:4 D6:2 F6:2']);
    mel(counter, 10, ['A4:8 A4:8', 'B4:8 B4:8']);
    mel(horns, 11, ['G4+B4+D5:4 r:12']); // o Raichu aparece
    groove(10, 2, { kick: 'X...X...X...X...' });
    drum(cr, 11, 1, 'X...............');
    drum(sn, 11, 1, '........xxxxXXXX', { vel: 0.8 });
    // 12: o chute (B44) e a câmera lenta (B46): a banda respira, só o Lá no baixo e o rufar subindo pro gol
    bass(bs, 12, 'A7sus4', '0:8 r:8');
    padChord(pad, 12, 'A7sus4', 8);
    padChord(pad, 12, 'A7', 8, { at: 8, vel: 1.1 });
    mel(lead, 12, ['E6:8 r:5 A5:1 B5:1 C#6:1']);
    mel(counter, 12, ['D5:8 C#5:8']);
    drum(k, 12, 1, 'X.......X...X.X.');
    drum(sn, 12, 1, '........xoxoxxXX', { vel: 0.9 });
    drum(ti, 12, 1, 'X.......x...x...');

    // 13–16: GOL (B48), um tom acima: o refrão da Abertura em Ré, com terças, metais e o clap 808
    const REFRAO = [
        'C6:2 C6:2 A5:2 C6:4 A5:2 G5:2 F5:2',
        'D6:2 D6:2 B5:2 D6:4 B5:2 A5:2 G5:2',
        'E6:3 D6:3 B5:2 G5:4 E5:4',
        'A5:3 G5:3 E5:2 C5:2 E5:2 G5:2 A5:2',
    ];
    const C_CH = ['G', 'A', 'F#m7', 'Bm7'];
    mel(lead, 13, REFRAO, { shift: 2 });
    mel(harm, 13, REFRAO, { shift: 2, harm: REMAJ });
    mel(horns, 13, ['r:12 F#5:1 A5:1 D6:2', 'r:12 G5:1 B5:1 E6:2', 'r:16', 'r:12 F#5:1 A5:1 B5:2']);
    C_CH.forEach((c, i) => {
        bass(bs, 13 + i, c, FUNK);
        stabs(st, 13 + i, c, STAB);
        arp(ar, 13 + i, c, { low: 67, step: 1 });
        padChord(pad, 13 + i, c, 16, { vel: 0.6 });
    });
    groove(13, 4, { kick: 'X.....x.X..x....' });
    drum(cr, 13, 1, 'X...............');
    drum(ti, 13, 1, 'X...............');
    drum(cr, 15, 1, '........X.......'); // campeão (B58)
    hey(14);
    hey(16);

    // 17–18: o pacote cai (B66), treme (B67, B68) e rasga (B69); a banda para e volta subindo em Lá7
    mel(lead, 17, ['G5:2 G5:2 B5:2 D6:2 r:8']);
    mel(harm, 17, ['G5:2 G5:2 B5:2 D6:2 r:8'], { harm: REMAJ });
    bass(bs, 17, 'Em7', '0:2 8:1~ 0:1 r:1 5:1 8:2 r:8');
    bass(bs, 17, 'A7sus4', 'r:8 0:4 r:4');
    stabs(st, 17, 'Em7', [3, 6]);
    stabs(st, 17, 'A7sus4', [[8, 3]], { vel: 1.2 });
    drum(k, 17, 1, 'X.....x.X.......');
    drum(sn, 17, 1, '....X..o........');
    drum(hh, 17, 1, 'xoxoxoxo........');
    drum(cl, 17, 1, '....x...........', { vel: 0.7 });
    drum(ti, 17, 1, '........X...x...');
    drum(ti, 18, 1, 'X...............');
    drum(sn, 18, 1, 'xoxoxoxoxxxxXXXX', { vel: 0.9 });
    drum(cr, 18, 1, '....X...........'); // rasga (B69)
    drum(k, 18, 1, '....X...X...X.X.');
    mel(horns, 18, ['r:4 A4+C#5+E5+G5:12']);
    padChord(pad, 18, 'A7', 12, { at: 4 });
    bass(bs, 18, 'A7', 'r:4 0:4 0:2 8:2 0:1 8:1 0:1 8:1');
    mel(lead, 18, ['r:4 A4:2 B4:2 C#5:2 D5:2 E5:2 F#5:1 G#5:1']);

    // 19–20: logo (B72) e soccermon.com (B76). O gancho em Ré com a banda junto, a torcida responde "hey hey"
    const hookRe = GANCHO.em({ tom: 2 }); // A5 F#5 D6
    mel(lead, 19, [hookRe, 'A5:3 F#5:3 D6:10']);
    mel(harm, 19, [hookRe, 'A5:3 F#5:3 D6:10'], { harm: REMAJ });
    mel(horns, 19, [GANCHO.em({ tom: 2, oitava: -1 }), 'A4:3 F#4:3 D5:10']);
    mel(sino, 19, ['r:6 D7:6 r:4', 'r:6 D7:10']);
    for (const b of [19, 20]) {
        stabs(
            st,
            b,
            'D',
            [
                [0, 2],
                [3, 2],
                [6, 6],
            ],
            { vel: 1.1 },
        );
        drum(k, b, 1, 'X..X..X.........');
        drum(ti, b, 1, 'X..x..X.........');
        drum(cr, b, 1, 'X.....X.........');
        hey(b);
    }
    bass(bs, 19, 'D', '0:3 0:3 8:6 r:4');
    bass(bs, 20, 'D', '0:3 0:3 8:10');
    drum(hh, 19, 1, '........xoxoxoxo');
    drum(sn, 19, 1, '............o.oo');
    padChord(pad, 20, 'Dadd9', 16, { at: 6, n: 4 });
    arp(ar, 20, 'Dadd9', { low: 74, step: 1, vel: 0.6 });
    return S;
}
