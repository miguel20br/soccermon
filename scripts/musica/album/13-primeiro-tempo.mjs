// Faixa 13, "Primeiro tempo" (`partida`, `partida-1t`). Os três níveis uma vez cada, em sequência (120 → 128 → 136
// BPM: o jogo acelerando até o fim do tempo) e o fim do arquivo do jogo: o SOC-CER-MON nos metais com a torcida e o
// apito do intervalo. Sem final novo: o apito é o final. Emenda sem pausa na Prancheta (o intervalo).
import partida from '../pecas/partida.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Primeiro tempo', faixa: 13, emenda: true };

export default function primeiroTempo() {
    return estender(() => partida()['1t'], [[0, 51]], { fim: 0, tail: 2 }).S;
}
