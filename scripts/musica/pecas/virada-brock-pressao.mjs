// Virada contra o Brock na Pressão final (pedido de 22/10/2026): a mesma vinheta de virada-brock.mjs no tom e no
// andamento do trecho `pressao` da Partida: Brock (Sol menor, 132 BPM). O jogo escolhe esta quando a virada acontece na pressão.
import { viradaBrock } from './virada-brock.mjs';

export const meta = { titulo: 'Virada: Brock (pressão)', tela: 'Partida (Brock): virada na Pressão final', lufs: -15 };

export default () => viradaBrock(3, 132);
