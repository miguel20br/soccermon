import { create } from 'zustand';
import type { Position } from '../engine/attributes';
import type { PokemonInstance } from '../engine/instance';

export interface CardAction {
    label: string;
    primary?: boolean;
    onClick: () => void;
}

interface CardModalState {
    inst: PokemonInstance | null;
    position?: Position;
    captain?: boolean;
    note?: string;
    /** Abre já rolada até essa parte (ex.: tocar num golpe no painel da partida). */
    section?: 'moves';
    actions: CardAction[];
    open(
        inst: PokemonInstance,
        opts?: { position?: Position; captain?: boolean; note?: string; actions?: CardAction[]; section?: 'moves' },
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
        }),
    close: () => set({ inst: null, actions: [], note: undefined, section: undefined }),
}));
