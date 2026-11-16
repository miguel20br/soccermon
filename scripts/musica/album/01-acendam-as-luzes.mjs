// Faixa 1, "Acendam as luzes" (`livre-abertura-album`): já foi composta como a faixa 1 do álbum, com começo e fim.
// Rodada 2 (16/11/2026): as notas ficam; o bumbo e a caixa viram os do kit (com corpo) num barramento comprimido, o
// punch que o Miguel pediu pro disco inteiro. Master a −14 LUFS.
import abertura from '../pecas/livre-abertura-album.mjs';
import { estender } from './estender.mjs';
import { soco } from './kit.mjs';

export const meta = { titulo: 'Acendam as luzes', faixa: 1 };

export default function acendamAsLuzes() {
    const bars = abertura().bars;
    return estender(abertura, [[0, bars]], { fim: 0, tail: 4, ...soco({ bumbo: 'bumbo', caixa: 'caixa' }) }).S;
}
