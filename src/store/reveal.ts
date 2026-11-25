import { create } from 'zustand';
import type { DesafioItem } from './desafio-natal';

/**
 * A fila da tela de prêmio (RewardReveal, src/ui/components/RewardReveal.tsx): cada prêmio grande no centro, um por vez.
 * Fica na memória (não no save): o prêmio já está na conta quando entra aqui, a tela só conta o que chegou.
 */
export type RevealSource =
    /** Degrau do Desafio de Natal: `degrau` (1 a 8), a soma da comunidade e os seus gols. */
    | { kind: 'desafio'; degrau: number; total: number; meus: number }
    /** Presente de Natal do dia 25 (Time Ultimate). */
    | { kind: 'gift' }
    /** Copa de Natal ganha (24 ou 25/12). */
    | { kind: 'natalCup' };

export interface Reveal {
    item: DesafioItem;
    source: RevealSource;
}

export const useReveal = create<{ queue: Reveal[] }>(() => ({ queue: [] }));

export const pushReveals = (items: Reveal[]) => {
    if (items.length) useReveal.setState((s) => ({ queue: [...s.queue, ...items] }));
};
export const shiftReveal = () => useReveal.setState((s) => ({ queue: s.queue.slice(1) }));
