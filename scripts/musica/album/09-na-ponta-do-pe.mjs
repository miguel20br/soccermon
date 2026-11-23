// Faixa 9, "Na ponta do pé" (interlúdio, `extra-cutscene-boba` v2: câmara de desenho animado, Lá menor, 108 BPM,
// pizzicato, fagote, clarinete). Rodada 6 (23/11/2026): "super legal, mas meio parada"; vira INTERLÚDIO de ~40 s,
// só a piada: o A2 (o pizzicato pergunta, o fagote responde, o clarinete entra) e o B inteiro (sobe na ponta do pé
// pelo cromático, tropeça: o apito descendo, o "bonk" e o silêncio). Depois do silêncio, um compasso: o fagote espia,
// o pizzicato sai de fininho na ponta do pé e pousa no Lá com o bloco. A revanche e a 2ª volta saíram (eram o que
// deixava a faixa parada).
import boba from '../pecas/extra-cutscene-boba.mjs';
import { drum, mel } from '../synth.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Na ponta do pé', faixa: 9 };

export default function naPontaDoPe() {
    const { S, P, n } = estender(boba, [[8, 24]], { fim: 1, tail: 3 });
    // depois do silêncio do tropeço: o fagote espia, o pizzicato sai de fininho e pousa
    mel(P('fagote2'), n, ['r:2 E3:1 r:1 A2:1 r:11'], { vel: 0.8 });
    mel(P('pizz'), n, ['r:6 C5:1 r:1 B4:1 r:1 G#4:1 r:1 A4:1 r:3'], { vel: 0.8 });
    drum(P('bloco'), n, 1, '..............x.', { vel: 0.7 });
    return S;
}
