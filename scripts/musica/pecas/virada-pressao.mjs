// Virada na Pressão final (rodada 8b): a mesma vinheta meio tom acima (Dó, o tom da pressão) e a 144 BPM, o
// andamento do trecho `pressao` do 2º tempo. O jogo escolhe esta quando a virada acontece na pressão.
import { viradaEm } from './virada.mjs';

export const meta = { titulo: 'Virada (pressão)', tela: 'Partida: virada no placar, na Pressão final', lufs: -15 };

export default () => viradaEm(1, 144);
