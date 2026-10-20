import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

/**
 * Troca de tela sem teleporte (docs/planos/nada-teleporta.md): toda mudança de `screen` no store passa por `wrap`.
 * Sem nada registrado (testes, Node) a troca é direta; a interface registra a View Transition (src/ui/view-transition.ts).
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
            const apply = () => (set as (p: unknown, r?: boolean) => void)(next, replace);
            if (next && 'screen' in next && next.screen !== get().screen) wrap(apply);
            else apply();
        }) as typeof set;
        api.setState = vset as typeof api.setState;
        return config(vset, get, api);
    };
}
