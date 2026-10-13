import type { Vec2 } from './vec';

/**
 * Comandos que um jogador executa num tick. A IA e o jogador humano (futuro modo jogável)
 * produzem exatamente os mesmos comandos — o motor não sabe quem está no controle.
 */
export type Command =
    | { type: 'idle' }
    /** `dir` é a velocidade desejada como fração da máxima (|dir| ≤ 1), como um analógico. */
    | { type: 'move'; dir: Vec2; sprint: boolean }
    /** Passe para um ponto; `receiverId` é só uma dica para a IA do recebedor. */
    | { type: 'pass'; target: Vec2; power: number; receiverId?: number }
    | { type: 'shoot'; target: Vec2; power: number }
    | { type: 'tackle'; targetId: number }
    /** Finta curta: dá vantagem no próximo desarme sofrido. */
    | { type: 'skill'; dir: Vec2 }
    /** Usa um dos 4 golpes (slot 0..3). Combina com o movimento do mesmo tick. */
    | { type: 'useMove'; slot: number; dir?: Vec2 }
    /** Troca o jogador controlado (só faz sentido para controllers humanos). */
    | { type: 'switchPlayer' };

export const IDLE: Command = { type: 'idle' };

/** Interface de quem decide os comandos. */
export interface Controller {
    /** Chamado uma vez por tick para cada jogador controlado. */
    decide(playerIndex: number): Command | Command[];
}
