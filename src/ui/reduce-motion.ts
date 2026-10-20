import { type ReduceMotion, useGame } from '../store/game-store';

export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** "Reduzir movimento" resolvido: 'system' segue o aparelho. Módulo leve (sem som): o Álbum do Perfil público usa. */
export function reduceMotionOn(pref: ReduceMotion = useGame.getState().settings.reduceMotion): boolean {
    if (pref !== 'system') return pref === 'on';
    try {
        return window.matchMedia(REDUCE_QUERY).matches;
    } catch {
        return false;
    }
}
