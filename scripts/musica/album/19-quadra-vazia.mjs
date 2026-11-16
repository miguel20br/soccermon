// Faixa 19 (bônus, depois dos créditos), "Quadra vazia" (`livre-ginasio`, o Ginásio vazio): o moleque sozinho na
// quadra à noite, imaginando a torcida. A introdução (a bola quicando, as luzes acendendo), o jogo em duas voltas e o
// fim da própria peça: a luz apagando banco por banco e a bola rolando embora. Calma: −16 LUFS.
import ginasio from '../pecas/livre-ginasio.mjs';
import { estender } from './estender.mjs';

export const meta = { titulo: 'Quadra vazia', faixa: 19, lufs: -16 };

export default function quadraVazia() {
    return estender(
        ginasio,
        [
            [0, 29],
            [4, 32],
        ],
        { fim: 0, tail: 4 },
    ).S;
}
