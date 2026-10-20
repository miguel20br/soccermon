import { flushSync } from 'react-dom';
import { setScreenWrap } from '../store/screen-transition';
import { reduceMotionOn } from './settings-sync';

/**
 * Nada teleporta (docs/planos/nada-teleporta.md) com View Transitions: a tela velha some enquanto a nova entra
 * (250 ms, `--ease-out`, em src/ui/motion.css), e o que existe nas duas (a carta escolhida no draft e a vaga dela)
 * voa de um lugar pro outro. Navegador sem View Transitions, Reduzir movimento ou aba escondida: troca direto.
 * Uma por vez: o que muda durante uma transição (a última contratação do draft também troca de tela) entra nela.
 */
let running = false;

function run(apply: () => void, after?: () => void) {
    if (running || !document.startViewTransition || reduceMotionOn() || document.visibilityState !== 'visible') {
        apply();
        after?.();
        return null;
    }
    running = true;
    document.documentElement.classList.add('vt-screen');
    const vt = document.startViewTransition(() => {
        flushSync(apply);
        after?.();
    });
    void vt.finished.finally(() => {
        running = false;
        document.documentElement.classList.remove('vt-screen');
    });
    return vt;
}

export function startScreenTransitions() {
    setScreenWrap((apply) => void run(apply));
}

/** A carta `[data-fly=uid]` voa até onde ela aparece depois de `apply` (a vaga com `data-uid=uid`). */
export function flyCard(uid: string, apply: () => void) {
    const from = document.querySelector<HTMLElement>(`[data-fly="${CSS.escape(uid)}"]`);
    if (from) from.style.viewTransitionName = 'fly-card';
    let to: HTMLElement | null = null;
    const vt = run(apply, () => {
        if (from) from.style.viewTransitionName = '';
        to = document.querySelector<HTMLElement>(`[data-uid="${CSS.escape(uid)}"]`);
        if (to && from) to.style.viewTransitionName = 'fly-card';
    });
    const clear = () => {
        if (from) from.style.viewTransitionName = '';
        if (to) to.style.viewTransitionName = '';
    };
    if (vt) void vt.finished.finally(clear);
    else clear();
}
