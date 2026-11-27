import type { ReactNode } from 'react';
import { create } from 'zustand';
import type { Position } from '../engine/attributes';
import type { PokemonInstance } from '../engine/instance';

export interface CardAction {
    label: string;
    primary?: boolean;
    /** Não dá agora: o botão fica, apagado, com o motivo no próprio texto. */
    disabled?: boolean;
    onClick: () => void;
}

interface CardModalState {
    inst: PokemonInstance | null;
    position?: Position;
    captain?: boolean;
    note?: string;
    /** Abre já rolada até essa parte (ex.: tocar num golpe no painel da partida). */
    section?: 'moves' | 'pick';
    actions: CardAction[];
    /** Embaixo das ações (o Álbum põe "Suas versões"). */
    extra?: ReactNode;
    open(
        inst: PokemonInstance,
        opts?: {
            position?: Position;
            captain?: boolean;
            note?: string;
            actions?: CardAction[];
            section?: 'moves' | 'pick';
            extra?: ReactNode;
        },
    ): void;
    close(): void;
}

/** Carta completa (modal) aberta a partir de qualquer tela. */
export const useCardModal = create<CardModalState>((set) => ({
    inst: null,
    actions: [],
    open: (inst, opts = {}) =>
        set({
            inst,
            actions: opts.actions ?? [],
            position: opts.position,
            captain: opts.captain,
            note: opts.note,
            section: opts.section,
            extra: opts.extra,
        }),
    close: () => set({ inst: null, actions: [], note: undefined, section: undefined, extra: undefined }),
}));

/** Dá pra escolher os golpes da carta: na escalação, antes de travar o time, e não na ficha de espécie (peek). */
export const canPickMoves = (run: { status: string; lockedTeam?: unknown } | null | undefined, peek?: boolean) =>
    !peek && run?.status === 'lineup' && !run.lockedTeam;
