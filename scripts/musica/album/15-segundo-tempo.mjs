// Faixa 15, "Segundo tempo" (`partida`, `partida-2t`). Um tom acima, os três níveis em sequência (124 → 142 BPM),
// a virada, a pressão final (meio tom acima) duas vezes, e o fim do arquivo do jogo: o SOC-CER-MON nos metais com a
// torcida e o acorde final. Vem colada na Prancheta.
import partida from '../pecas/partida.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Segundo tempo', faixa: 15, apara: false };

export default function segundoTempo() {
    return estender(
        () => partida()['2t'],
        [
            [0, 65],
            [49, 68],
        ],
        { fim: 0, tail: 4 },
    ).S;
}
