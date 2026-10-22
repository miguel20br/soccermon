// Virada contra a Misty na Pressão final (pedido de 22/10/2026): a mesma vinheta de virada-misty.mjs no tom e no
// andamento do trecho `pressao` da Partida: Misty (Ré menor, 90 BPM). O jogo escolhe esta quando a virada acontece na pressão.
import { viradaMisty } from './virada-misty.mjs';

export const meta = { titulo: 'Virada: Misty (pressão)', tela: 'Partida (Misty): virada na Pressão final', lufs: -15 };

export default () => viradaMisty(3, 90);
