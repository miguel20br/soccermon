// Partida v4 (aprovada na rodada 5 como BASE): já começa animada, funk em Lá menor dórico (energia e tensão de jogo,
// não alegria) e vai ACELERANDO até o fim de cada tempo. 1º tempo 120 → 136 BPM, termina com o gancho nos metais e o
// apito do intervalo; 2º tempo volta a 124 um tom acima (Si dórico), acelera até 142 e, na pressão final, sobe mais
// meio tom (Dó dórico). O molde está em ../partida-base.mjs; as variações por personagem são partida-<nome>.mjs.
// Rodada 6: sai em dois arquivos (partida-1t, partida-2t), cada um em trechos que fazem loop sozinhos por intensidade.
import { partidaBase } from '../partida-base.mjs';

export const meta = { titulo: 'Partida v4 (base)', tela: 'Partida' };

export default function partida() {
    return partidaBase();
}
