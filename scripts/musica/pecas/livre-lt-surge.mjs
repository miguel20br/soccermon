// Tema do Lt. Surge (categoria livre, líder de ginásio): o militar elétrico. Toque de corneta (nosso, de quarta e
// quinta), e o funk de marcha: caixa de banda com rufos, arpejo de 16 avos, lead pergunta e os metais respondem, e um
// CHOQUE (o "piu" com estalos) no fim de cada resposta. No B, o quebra-cabeça do ginásio dele: abre lata por lata
// procurando os dois interruptores. Achou o primeiro (clique e sino)! O segundo dá ERRADO: zumbido, a força cai
// (tudo escorrega pro grave) e um compasso de blecaute com a luz piscando. Tenta de novo: clique, clique, a força volta
// subindo, a corneta abre a porta, e o A volta meio tom acima (Sol menor) com o SOC-CER-MON nos metais e o clap 808.
// Fá# menor, 144 BPM. Forma: corneta (2) | A (8) | B: as latas (8) | A' (8) meio tom acima | virada (1): Dó#7.
// Loop do compasso 2 ao fim (~42 s). MOTIVO (2 compassos) pra uma futura Partida: Lt. Surge.
import { arp, bass, drum, GANCHO, I, MINOR, mel, Song, stabs, thirdBelow, transpose } from '../synth.mjs';
import { bzzt, deslize, zap } from './livre-ginasio.mjs';

export const meta = { titulo: 'Tema do Lt. Surge', tela: 'Líder de ginásio: Lt. Surge' };

export const MOTIVO = {
    mel: ['F#5:2 r:1 F#5:1 A5:2 C#6:3 B5:1 A5:2 G#5:2 A5:2', 'F#5:4 C#5:2 E5:2 r:8'],
    acordes: ['F#m', 'C#7'],
};

export default function temaSurge() {
    const S = new Song({ bpm: 144, bars: 27, swing: 0.06, tail: 3, loopFrom: 2 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.3, corte: 3500, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.55 });
    const ar = S.part('arpejo', I.thin, { pan: 0.4, gain: 0.55, corte: 2600 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.85, corte: 3000, rev: 0.2 });
    const st = S.part('acordes', I.stab, { pan: -0.3, gain: 1.2, corte: 3000 });
    const sino = S.part('sino', I.bell, { pan: 0.3, gain: 1.6, rev: 0.4 });
    const bs = S.part('baixo', I.slap, { gain: 0.75 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.55 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.65 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.35 }), { drum: true, gain: 1.1 });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.6 });
    const zp = S.part('choque', zap, { drum: true, pan: 0.35, gain: 0.7, echo: { rows: 3, fb: 0.3, mix: 0.3 } });
    const bz = S.part('erro', bzzt, { drum: true, gain: 0.7 });
    const cai = S.part('forcaCai', deslize(420, 35, 1.4), { drum: true, gain: 0.9 });
    const volta = S.part('forcaVolta', deslize(35, 420, 0.8), { drum: true, gain: 0.9 });
    const lata = S.part('lata', I.block, { drum: true, pan: -0.3, gain: 1 });
    const clique = S.part('clique', I.block, { drum: true, pan: 0.2, gain: 0.9 });

    // corneta
    mel(met, 0, ['C#5:2 C#5:1 C#5:1 F#5:4 C#5:2 F#5:2 A5:4', 'C#6:6 A5:2 F#5:8']);
    drum(sn, 1, 1, 'x.x.x.x.xxxxXXXX', { vel: 0.8 });
    zp.note(16 + 14, 0, 0, 1);

    const CH = ['F#m', 'F#m', 'D', 'E', 'F#m', 'F#m', 'D', 'C#7'];
    const A = [
        ...MOTIVO.mel,
        'D6:2 r:1 D6:1 C#6:2 B5:3 A5:1 B5:2 C#6:2 D6:2',
        'E6:4 B5:2 G#5:2 r:8',
        ...MOTIVO.mel,
        'A5:2 B5:2 C#6:2 D6:2 E6:2 F#6:2 E6:2 D6:2',
        'C#6:4 G#5:2 E#5:2 C#5:8',
    ];
    const RESP = {
        1: 'r:8 C#4:2 E4:2 F#4:2 A4:2',
        3: 'r:8 E4:2 G#4:2 B4:2 D5:2',
        5: 'r:8 C#4:2 E4:2 F#4:2 A4:2',
    };
    const BASS = '0:2 8:1~ r:1 0:2 r:2 5:2 0:2 s:2 8:2';
    const marcha = (b, c, cheio = true) => {
        bass(bs, b, c, BASS);
        arp(ar, b, c, { low: 66, pattern: [0, 1, 2, 4, 2, 1, 0, 1] });
        stabs(st, b, c, [2, 6, 10, 14], { low: 60, n: 3 });
        drum(k, b, 1, 'X.....x.X..x....');
        drum(sn, b, 1, cheio ? '..o.X..o.oo.X.o.' : '....X.......X...');
        drum(hh, b, 1, 'x.x.x.x.x.x.x.x.');
    };
    const blocoA = (b0, s) => {
        mel(lead, b0, s ? A.slice(0, 7) : A, { shift: s });
        if (s) mel(lead, b0 + 7, [GANCHO.em({ menor: true, tom: 7 })]);
        if (s) mel(harm, b0, A.slice(0, 7), { shift: 1, harm: thirdBelow(MINOR(7)) });
        for (const [i, r] of Object.entries(RESP)) {
            mel(met, b0 + Number(i), [r], { shift: s });
            zp.note((b0 + Number(i)) * 16 + 14, s, 0, 0.9);
        }
        CH.forEach((c0, i) => {
            const c = s && i === 7 ? 'Gm' : transpose(c0, s);
            marcha(b0 + i, c, s > 0 || i >= 4);
        });
        drum(cr, b0, 1, 'X...............');
    };
    blocoA(2, 0);

    // B: as latas. Procura, acha o primeiro interruptor, erra o segundo, blecaute, tenta de novo, a força volta
    for (const [b, c] of [
        [10, 'Bm7'],
        [11, 'C#7'],
        [12, 'Bm7'],
    ]) {
        bass(bs, b, c, '0:4 r:4 0:4 r:4', { vel: 0.8 });
        arp(ar, b, c, { low: 59, pattern: [0, 1, 2, 1], vel: 0.6 });
        drum(hh, b, 1, '..x...x...x...x.', { vel: 0.6 });
        drum(k, b, 1, 'x.......x.......', { vel: 0.6 });
    }
    // o compasso do erro: tudo para na metade, quando a força cai
    bass(bs, 13, 'C#7', '0:4 r:12', { vel: 0.8 });
    arp(ar, 13, 'C#7', { low: 59, pattern: [0, 1, 2, 1], vel: 0.6, rows: 8 });
    drum(hh, 13, 1, '..x...x.........', { vel: 0.6 });
    drum(k, 13, 1, 'x...............', { vel: 0.6 });
    drum(lata, 10, 1, 'x.....x.........', { pitch: -7 });
    mel(lead, 10, ['r:8 B4:2 D5:2 F#5:4'], { vel: 0.7 });
    drum(lata, 11, 1, 'x.........x.....', { pitch: -7 });
    mel(lead, 11, ['r:8 C#5:2 E#5:2 G#5:4'], { vel: 0.7 });
    drum(lata, 12, 1, 'x.....x.........', { pitch: -7 });
    drum(clique, 12, 1, '........x.x.....', { pitch: 7 });
    mel(sino, 12, ['r:8 C#6:8']);
    mel(lead, 12, ['r:10 F#5:2 A5:2 C#6:2']);
    drum(lata, 13, 1, 'x...............', { pitch: -7 });
    bz.note(13 * 16 + 4, 0, 0, 1);
    cai.note(13 * 16 + 8, 0, 0, 1);
    // blecaute: só a luz piscando
    zp.note(14 * 16 + 3, -7, 0, 0.35);
    zp.note(14 * 16 + 11, -5, 0, 0.3);
    // de novo: clique, clique, e a força volta subindo
    drum(lata, 15, 1, 'x..x............', { pitch: -7 });
    drum(clique, 15, 1, '....x.....x.....', { pitch: 7 });
    mel(sino, 15, ['r:4 C#6:6 F#6:6']);
    volta.note(15 * 16 + 12, 0, 0, 1);
    drum(sn, 15, 1, '........xxxxXXXX', { vel: 0.7 });
    // a corneta abre a porta
    mel(met, 16, ['F#5:2 F#5:1 F#5:1 A5:4 F#5:2 A5:2 C#6:4', 'E#5:6 G#5:2 C#6:8']);
    marcha(16, 'D');
    marcha(17, 'C#7');
    drum(cr, 16, 1, 'X...............');
    zp.note(16 * 16 + 14, 0, 0, 1);
    drum(sn, 17, 1, '............xxXX');

    // A' meio tom acima (Sol menor), com terças; fecha no SOC-CER-MON com o clap
    blocoA(18, 1);
    mel(met, 25, [GANCHO.em({ menor: true, tom: -5 })]);
    drum(cl, 25, 1, GANCHO.palmas);
    // virada: Dó#7, de volta pro Fá# menor
    mel(lead, 26, ['C#6:2 B5:2 A5:2 G#5:2 F5:2 E5:2 D5:2 C#5:2']);
    marcha(26, 'C#7');
    drum(sn, 26, 1, '........xxXxXXXX', { vel: 0.9 });
    zp.note(26 * 16 + 15, 0, 0, 1);
    return S;
}
