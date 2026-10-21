// Planalto Índigo: tema da Liga nosso, "paródia de clima" do que os jogos fazem na reta final (marcha heroica de
// metais, caixa de banda, tímpanos, subida de tom na volta final). Melodia e harmonia escritas do zero: não cita
// nenhum tema dos jogos Pokémon. Si bemol maior, 112 BPM; a última parte sobe um tom (Dó maior).
// Rodada 4: swing de colcheia (marcha "shuffle"), coro de cordas e metais graves dobrando a melodia, rufos de tímpano
// entre as partes, e o gancho do Soccermon nos metais graves na volta final (leitmotiv). Rodada 5: SOC-CER-MON também
// no meio (trompa respondendo o trompete na parte B).
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, stabs, thirdBelow, transpose } from '../synth.mjs';

export const meta = { titulo: 'Planalto Índigo', tela: 'Rota: Planalto Índigo' };

export default function planalto() {
    const S = new Song({ bpm: 108, bars: 26, swing: 0.18, swingUnit: 8, tail: 4, loopFrom: 2 });
    const lead = S.part('trompete', I.brass, { pan: -0.1, gain: 1.15, rev: 0.25 });
    const harm = S.part('trompa', I.brass, { pan: 0.3, gain: 0.65, rev: 0.25 });
    const pic = S.part('flautim', I.piccolo, { pan: 0.45, gain: 1.5, rev: 0.2 });
    const str = S.part('cordas', I.strings, { gain: 1.1, rev: 0.3 });
    const tu = S.part('tuba', I.tuba, { gain: 0.6 });
    const st = S.part('banda', I.stab, { pan: -0.3, gain: 0.8 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.9 });
    const k = S.part('bumbo', I.kick, { drum: true });
    const ti = S.part('timp', I.timp, { gain: 0.6, drum: true });
    const cr = S.part('crash', I.crash, { drum: true });
    const coro = S.part('coro', I.strings, { gain: 1.3, rev: 0.45 });
    const low = S.part('metaisGraves', I.brass, { pan: -0.3, gain: 0.7, rev: 0.3 });

    // fanfarra de entrada (só na primeira vez)
    mel(lead, 0, ['Bb4+D5+F5:3 Bb4+D5+F5:1 Bb4+D5+F5:4 C5+Eb5+G5:4 D5+F5+A5:4', 'Eb5+G5+Bb5:8 C5+F5+A5:8']);
    drum(ti, 0, 1, 'X..xX.......X...');
    drum(sn, 1, 1, 'oooooooxxxxxXXXX');
    bass(tu, 0, 'Bb', '0:8 0:4 0:4');
    bass(tu, 1, 'F7', '0:8 0:8');

    const A = [
        'F4:3 Bb4:1 D5:4 F5:6 D5:2',
        'Eb5:3 G5:1 Bb5:4 G5:4 Eb5:4',
        'F5:3 C5:1 A4:4 C5:3 F5:1 A5:4',
        'Bb5:8 F5:4 D5:4',
        'D5:3 G5:1 Bb5:4 A5:3 G5:1 F5:4',
        'G5:3 Eb5:1 Bb4:4 Eb5:4 G5:4',
        'E5:3 G5:1 Bb5:4 C6:4 Bb5:4',
        'A5:8 Eb5:4 F5:4',
    ];
    const B = [
        'G5:6 F5:2 Eb5:4 Bb4:4',
        'D5:6 Eb5:2 F5:8',
        'Eb5:3 F5:1 G5:4 Bb5:4 G5:4',
        'A5:12 r:4',
        'Bb5:6 C6:2 Bb5:4 G5:4',
        'F5:6 G5:2 F5:4 D5:4',
        'Eb5:4 G5:4 C6:4 Bb5:2 A5:2',
        'A5:4 C6:4 F6:8',
    ];
    const ACH = ['Bb', 'Eb', 'F', 'Bb', 'Gm', 'Eb', 'C7', 'F7'];
    const BCH = ['Eb', 'Bb', 'Cm7', 'F', 'Eb', 'Bb', 'Cm7', 'F7'];
    const parts = [
        [2, A, ACH, 0],
        [10, B, BCH, 0],
        [18, A, ACH, 2],
    ];
    for (const [b0, M, CH, sh] of parts) {
        mel(lead, b0, M, { shift: sh });
        if (b0 === 10) {
            // no meio: a trompa responde a nota longa do trompete com SOC-CER-MON em Fá maior
            mel(harm, b0, M.slice(0, 3), { harm: thirdBelow(MAJOR(10)) });
            mel(harm, b0 + 3, [GANCHO.em({ tom: 5, oitava: -1 })], { vel: 1.3 });
            mel(harm, b0 + 4, M.slice(4), { harm: thirdBelow(MAJOR(10)) });
        } else if (b0 > 10) mel(harm, b0, M, { shift: sh, harm: thirdBelow(MAJOR((10 + sh) % 12)) });
        if (b0 >= 18) mel(pic, b0, M, { shift: sh + 12, vel: 0.7 });
        const lowM = b0 >= 18 ? M.map((x, i) => (i === 3 || i === 7 ? 'r:16' : x)) : M; // lá entra o gancho
        mel(low, b0, lowM, { shift: sh - 12, vel: b0 >= 10 ? 1 : 0.6 });
        CH.forEach((c0, i) => {
            const c = transpose(c0, sh);
            bass(tu, b0 + i, c, '0:4 5:4 0:4 5:4');
            stabs(
                st,
                b0 + i,
                c,
                [
                    [2, 1],
                    [6, 1],
                    [10, 1],
                    [14, 1],
                ],
                { low: 58, n: 3 },
            );
            if (b0 >= 10) padChord(str, b0 + i, c, 16, { low: 55, n: 4 });
            padChord(coro, b0 + i, c, 16, { low: 67, n: 3, vel: b0 >= 10 ? 1 : 0.6 });
        });
        drum(cr, b0, 1, 'X...............');
    }
    drum(sn, 2, 24, 'X..xX.x.X..xX.xx');
    drum(k, 2, 24, 'X.......X.......');
    drum(sn, 17, 1, 'xxxxxxxxXXXXXXXX');
    drum(ti, 17, 1, 'X...X...X.X.XXXX');
    drum(ti, 9, 1, '........xxxxXXXX');
    drum(cr, 25, 1, '........X.......');
    // leitmotiv: o gancho nos metais graves enquanto a melodia segura (Dó maior e Sol7)
    mel(low, 21, [GANCHO.em({ oitava: -1 })], { vel: 1.2 });
    mel(low, 25, [GANCHO.em({ tom: 7, oitava: -2 })], { vel: 1.2 });
    return S;
}
