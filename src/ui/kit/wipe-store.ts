import { create } from 'zustand';
import type { WipeArt } from './MomentWipe';

/** As transições que cobrem a tela (MomentWipe, DoorWipe). Módulo sem a arte nem o som: quem só pergunta não carrega. */
export const useMoment = create<{ art: WipeArt; cover: (() => void) | null; n: number }>(() => ({
    art: 'bola',
    cover: null,
    n: 0,
}));
export const useDoor = create<{ cover: (() => void) | null; n: number }>(() => ({ cover: null, n: 0 }));

/** Um momento ou uma porta cobrindo a tela agora (quem comemora depois espera passar). */
export function useWipeBusy(): boolean {
    const moment = useMoment((s) => !!s.cover);
    const door = useDoor((s) => !!s.cover);
    return moment || door;
}
