// Virada contra a Equipe Rocket na Pressão final (pedido de 22/10/2026): a mesma vinheta de virada-rocket.mjs no tom e no
// andamento do trecho `pressao` da Partida: Equipe Rocket (Mi♭ menor, 142 BPM). O jogo escolhe esta quando a virada acontece na pressão.
import { viradaRocket } from './virada-rocket.mjs';

export const meta = {
    titulo: 'Virada: Equipe Rocket (pressão)',
    tela: 'Partida (Equipe Rocket): virada na Pressão final',
    lufs: -15,
};

export default () => viradaRocket(3, 142);
