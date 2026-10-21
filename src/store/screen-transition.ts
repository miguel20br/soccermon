import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

/**
 * Troca de tela sem teleporte (docs/planos/nada-teleporta.md): toda mudança de `screen` no store passa por `wrap`.
 * Sem nada registrado (testes, Node) a troca é direta; a interface registra a View Transition (src/ui/view-transition.ts).
 * Só a `screen` espera a transição: o resto do estado muda na hora, senão quem lê logo depois (`newRun` e em seguida
 * `getState().run`) via o estado velho, e um `setState` no meio era apagado quando a troca adiada chegava.
 */
let wrap: (apply: () => void) => void = (apply) => apply();
export const setScreenWrap = (w: typeof wrap) => {
    wrap = w;
};

export function screenTransition<T extends { screen: unknown }, Mis extends [StoreMutatorIdentifier, unknown][] = []>(
    config: StateCreator<T, Mis, []>,
): StateCreator<T, Mis, []> {
    return (set, get, api) => {
        const vset = ((partial: T | Partial<T> | ((s: T) => T | Partial<T>), replace?: boolean) => {
            const next = typeof partial === 'function' ? partial(get()) : partial;
            const raw = set as (p: unknown, r?: boolean) => void;
            if (!next || replace || !('screen' in next) || next.screen === get().screen) {
                raw(next, replace);
                return;
            }
            const { screen, ...rest } = next as Partial<T>;
            raw(rest);
            wrap(() => raw({ screen }));
        }) as typeof set;
        api.setState = vset as typeof api.setState;
        return config(vset, get, api);
    };
}
