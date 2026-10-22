// Pênaltis no jogo (pedido de 22/10/2026): a "Disputa de pênaltis" da categoria livre (livre-penaltis.mjs) conta uma
// disputa inventada, cobrança por cobrança, e a disputa de verdade não segue o roteiro dela. No jogo vão três pedaços
// feitos dela, com os mesmos sons:
//   espera (loop de 2 compassos, 92 BPM; no jogo o arquivo traz o loop 3 vezes: entrada, loop, e uma cópia depois só
//     pro codificador: loop na ponta do arquivo estala no mp3): o coração, o relógio, o Mi grave e uma nota alta parada, entre as cobranças;
//   ganhou (~4 s, 126 BPM), na cobrança decisiva a seu favor: a torcida explode, SOC-CER-MON em Mi maior com palmas
//     808 dobradas, e fecha num Mi maior longo (o Mi menor da espera vira maior);
//   perdeu (~2,5 s, 96 BPM), na decisiva contra: a torcida deles lá longe, o "óóó" da nossa, os metais caindo
//     (Si, Sol, Mi) em Mi menor.
import { bass, drum, GANCHO, I, MAJOR, mel, padChord, Song, thirdBelow } from '../synth.mjs';
import { torcida } from './livre-ginasio.mjs';

export const meta = { titulo: 'Pênaltis (jogo)', tela: 'Partida: disputa de pênaltis' };

export default function penaltisJogo() {
    return { espera: espera(), ganhou: ganhou(), perdeu: perdeu() };
}

function espera() {
    const S = new Song({ bpm: 92, bars: 2, tail: 3, loopFrom: 0 });
    const alto = S.part('notaAlta', I.strings, { gain: 1.8, rev: 0.5 });
    const ped = S.part('pedal', I.bass, { gain: 0.35, corte: 700 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const cor = S.part('coracao', I.kick, { drum: true, gain: 0.5 });
    const tique = S.part('relogio', I.block, { drum: true, pan: -0.4, gain: 0.9 });
    for (const b of [0, 1]) {
        drum(cor, b, 1, 'X..x............', { pitch: -4 });
        drum(tique, b, 1, 'x...x...x...x...', { vel: 0.7 });
        mel(ped, b, ['E2:16']);
        padChord(pad, b, 'Em', 16, { low: 52, n: 3, vel: 0.7 });
        mel(alto, b, ['B5:16'], { vel: 0.4 });
    }
    return S;
}

function ganhou() {
    const S = new Song({ bpm: 126, bars: 2, tail: 2.5 });
    const tcFim = S.part('torcidaFim', torcida(6, 0.1, 3), { drum: true, gain: 0.55, rev: 0.3 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.55, corte: 2800, rev: 0.3 });
    const lead = S.part('lead', I.pulse, { pan: -0.1, gain: 1.3, corte: 3800, echo: { rows: 3, fb: 0.25, mix: 0.2 } });
    const harm = S.part('terças', I.counter, { pan: 0.35, gain: 0.6 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const bs = S.part('baixo', I.slap, { gain: 0.6 });
    const k = S.part('bumbo', I.kick, { drum: true, gain: 0.6 });
    const sn = S.part('caixa', I.snare, { drum: true, gain: 0.7 });
    const hh = S.part('chimbal', I.hat, { drum: true, pan: 0.3, gain: 0.8 });
    const cl = S.part('palmas', I.clap808.com({ ganho: 0.5, corte: 6800, sala: 0.4 }), {
        drum: true,
        gain: 1.1,
        rev: 0.3,
    });
    const cl2 = S.part('palmas2', I.clap808.com({ ganho: 0.4, corte: 6500, sala: 0.5, atraso: 0.014, tom: -1 }), {
        drum: true,
        pan: 0.4,
        gain: 0.9,
        rev: 0.3,
    });
    const cr = S.part('prato', I.crash, { drum: true, gain: 0.6 });
    const tp = S.part('timpano', I.timp, { drum: true, gain: 0.25 });

    tcFim.note(0, 0, 0, 1);
    const HOOK = GANCHO.em({ tom: 4 }); // B5 G#5 E6
    mel(lead, 0, [HOOK, 'E6:16']);
    mel(harm, 0, [HOOK, 'G#5:16'], { harm: thirdBelow(MAJOR(4)) });
    mel(met, 0, ['r:12 B4:2 D#5:2', 'G#4+B4+E5:16']);
    bass(bs, 0, 'E', '0:2 8:1~ r:1 5:2 0:2 r:2 s:2 8:2 5:2');
    bass(bs, 1, 'E', '0:16');
    padChord(pad, 0, 'E', 32, { low: 55, n: 4, vel: 0.7 });
    drum(k, 0, 1, 'X.....x...x..x..');
    drum(sn, 0, 1, '....X..o.o..XxXX');
    drum(hh, 0, 1, 'x.xx.x.xx.xx.x.x');
    drum(cl, 0, 1, GANCHO.palmas);
    drum(cl2, 0, 1, GANCHO.palmas);
    drum(cr, 0, 1, 'X...............');
    drum(cr, 1, 1, 'X...............');
    drum(tp, 1, 1, 'X...............');
    drum(k, 1, 1, 'X...............');
    return S;
}

function perdeu() {
    const S = new Song({ bpm: 96, bars: 1, tail: 2.5 });
    const ped = S.part('pedal', I.bass, { gain: 0.35, corte: 700 });
    const pad = S.part('pad', I.pad, { gain: 0.8, rev: 0.4 });
    const met = S.part('metais', I.brass, { pan: 0.2, gain: 0.55, corte: 2800, rev: 0.3 });
    const tcEles = S.part('torcidaDeles', torcida(1.8, 0.1, 1.2), { drum: true, pan: 0.5, gain: 0.35, rev: 0.5 });
    const tcOh = S.part('torcidaOh', torcida(1.5, 0.1, 1), { drum: true, gain: 0.5, rev: 0.3 });
    const cor = S.part('coracao', I.kick, { drum: true, gain: 0.5 });
    tcEles.note(0, 2, 0, 1);
    tcOh.note(1, -4, 0, 1);
    mel(met, 0, ['r:2 B3:2 G3:2 E3:10'], { vel: 0.8 });
    mel(ped, 0, ['E2:16'], { vel: 0.7 });
    padChord(pad, 0, 'Em', 16, { low: 52, n: 3, vel: 0.5 });
    drum(cor, 0, 1, '........X..x....', { pitch: -4, vel: 0.6 });
    return S;
}
