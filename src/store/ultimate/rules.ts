import type { Metal } from '../../ui/rarity';

/**
 * Números do Time Ultimate (docs/planos/ultimate-team.md, "Proposta de números"). Todos num lugar só.
 *
 * PROPOSTA, FALTA O OK DO MIGUEL: nada aqui está aprovado. Mudou um número? Atualize a tabela do plano junto.
 */

/** Pacote Mini grátis: um a cada 12 h. */
export const PACK_INTERVAL_MS = 12 * 60 * 60 * 1000;
/** Quantos pacotes grátis acumulam (cheio, o relógio para, como no TCG Pocket). Quem chega começa com o máximo. */
export const PACK_MAX = 2;
/** Cartas no Pacote Mini. */
export const PACK_SIZE = 3;

/** Chance de cada metal, por carta (soma 1). */
export const METAL_ODDS: Record<Metal, number> = { bronze: 0.62, prata: 0.28, ouro: 0.1 };
/** Piso: todo pacote tem pelo menos 1 carta deste metal ou melhor (se não saiu, a última vira esta). */
export const FLOOR_METAL: Metal = 'prata';

/** Edições por carta (por cima do metal): Shiny e Ícone (só os 20 da lista de Ícones). Evento fica pros eventos. */
export const SHINY_ODDS = 1 / 64;
export const ICON_ODDS = 1 / 100;

/** Repetida (mesma espécie e mesma edição que você já tem) não entra: vira pontos de pacote. */
export const REPEAT_POINTS: Record<Metal, number> = { bronze: 1, prata: 3, ouro: 8 };

/** Time: 5 titulares + 2 no banco. Até ter o time cheio, o pacote não repete espécie que você já tem. */
export const TEAM_SIZE = 7;
export const STARTERS = 5;

/** Níveis do jogo contra a IA, do mais fácil ao mais difícil. */
export const LEVELS = ['facil', 'normal', 'dificil', 'mestre'] as const;
export type Level = (typeof LEVELS)[number];

/** O rival acompanha a média do seu time: média dos titulares dele = a sua + isto. */
export const LEVEL_GAP: Record<Level, number> = { facil: -6, normal: 0, dificil: 4, mestre: 8 };

export type Outcome = 'win' | 'draw' | 'loss';
/** Fichas por resultado e nível (o fácil nunca paga zero). Empate = placar igual no tempo normal. */
export const FICHAS: Record<Level, Record<Outcome, number>> = {
    facil: { win: 30, draw: 15, loss: 10 },
    normal: { win: 50, draw: 25, loss: 10 },
    dificil: { win: 80, draw: 40, loss: 15 },
    mestre: { win: 120, draw: 60, loss: 20 },
};
