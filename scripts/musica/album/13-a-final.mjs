// Faixa 13, "A final" (suíte), rodada 6 (23/11/2026). O Miguel: "Primeiro tempo", "A prancheta" e "Segundo tempo"
// "conseguem trabalhar juntas bem". Viram uma faixa só, a final contada do apito inicial ao acorde do título, com a
// costura e a forma pensadas pra ouvir de uma vez (eram 6:28 em três faixas; agora ~4:50).
// I. PRIMEIRO TEMPO (`partida-1t`, Lá dórico, 120 → 136 BPM): os três níveis, acelerando, o SOC-CER-MON nos metais e o
//   apito do intervalo. Igual ao que funcionava.
// II. O INTERVALO (`escalacao`, Mi menor, 116 BPM): uma volta só da prancheta (antes eram duas: na suíte, a 2ª
//   repetia sem contar nada). A torcida continua do outro lado da parede (abafada, passa-baixa a 500 Hz) e vai
//   sumindo; nos últimos compassos o relógio cresce, a banda para, e o treinador bate a última peça na prancheta.
// III. SEGUNDO TEMPO (`partida-2t`, Si dórico → Dó dórico, 124 → 142 BPM): entra com o apito do 2º tempo e a torcida
//   subindo; os três níveis, a virada, a pressão final UMA vez (antes vinha duas) e o fim com o acorde do título.
// Bumbo e caixa com corpo num barramento comprimido e a palma da torcida no clap 808 macio, como antes.

import escalacao from '../pecas/escalacao.mjs';
import { apito, torcida } from '../pecas/livre-ginasio.mjs';
import partida from '../pecas/partida.mjs';
import { bass, drum, mel, padChord, stabs } from '../synth.mjs';
import { estender } from './estender.mjs';
import { soco } from './kit.mjs';
import { emendar, rms } from './kit-novas.mjs';

export const meta = { titulo: 'A final', faixa: 13 };

const SOCO = soco({ bumbo: 'kick', caixa: 'snare', palmas: 'palmas', gPalmas: 1.3 });

function primeiroTempo() {
    return estender(() => partida()['1t'], [[0, 51]], { fim: 0, tail: 3, ...SOCO }).S;
}

function intervalo() {
    const { S, P, n } = estender(escalacao, [[0, 35]], { fim: 3, tail: 1.5, ...soco({ bumbo: 'bumbo', gBumbo: 0.7 }) });
    // a torcida do outro lado da parede, sumindo
    S.part('parede', torcida(14, 0.2, 9), { drum: true, gain: 0.7, corte: 500 }).note(0, 0, 0, 1);
    // o relógio crescendo nos últimos 6 compassos
    for (let i = 0; i < 6; i++) drum(P('relógio'), n - 6 + i, 1, 'x.x.x.x.x.x.x.x.', { vel: 0.2 + 0.12 * i });
    // Fá menor, a pergunta uma última vez, as cordas seguram
    mel(P('lead'), n, ['r:4 C5:2 F5:2 Ab5:3 G5:1 F5:2 Eb5:2']);
    bass(P('baixo'), n, 'Fm7', '0:2 8:2 0:2 8:2 0:2 8:2 0:1 8:1 s:2');
    stabs(P('clav'), n, 'Fm7', [3, 6, 11, 14], { low: 65, n: 3 });
    padChord(P('cordas'), n, 'Fm7', 16, { low: 56, n: 4, vel: 0.8 });
    drum(P('bumbo'), n, 1, 'x...x...x...x...');
    drum(P('relógio'), n, 1, 'x.x.x.x.x.x.x.x.', { vel: 1.1 });
    // a banda para: só o relógio, alto
    mel(P('metais'), n + 1, ['F4:4 r:12']);
    drum(P('relógio'), n + 1, 1, 'x.x.x.x.x.x.x.x.', { vel: 1.3 });
    // a peça na prancheta (e o último tique)
    drum(P('relógio'), n + 2, 1, 'x...............', { vel: 1.2 });
    drum(P('peça5'), n + 2, 1, '....X...........', { pitch: 7, vel: 1.4 });
    return { S, fim: S.timeOfBar(n + 2) + (8 * 60) / 116 / 4 };
}

function segundoTempo() {
    const { S } = estender(() => partida()['2t'], [[0, 68]], { fim: 0, tail: 4, ...SOCO });
    // o apito do 2º tempo e a torcida subindo
    S.part('apitoInicio', apito(0.7), { drum: true, gain: 0.5, rev: 0.3 }).note(0, 0, 0, 1);
    S.part('torcidaVolta', torcida(7, 1.5, 4), { drum: true, gain: 0.45, rev: 0.3 }).note(0, 0, 0, 1);
    return S;
}

export default function aFinal() {
    const p1 = primeiroTempo();
    const { S: p2, fim } = intervalo();
    const p3 = segundoTempo();
    const [a, b, c] = [p1.render(), p2.render(), p3.render()];
    // o mesmo nível nas três partes (o intervalo um tico abaixo: é o vestiário)
    const alvo = rms(a);
    const t2 = p1.timeOfBar(51);
    return emendar([
        { som: a, em: 0 },
        { som: b, em: t2, ganho: (0.85 * alvo) / rms(b) },
        { som: c, em: t2 + fim, ganho: alvo / rms(c) },
    ]);
}
