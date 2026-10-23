import { flushSync } from 'react-dom';
import { setScreenWrap } from '../store/screen-transition';
import { reduceMotionOn } from './settings-sync';

/**
 * Nada teleporta (docs/planos/nada-teleporta.md) com View Transitions: a tela velha some enquanto a nova entra
 * (250 ms, `--ease-out`, em src/ui/motion.css), e o que existe nas duas (a carta escolhida no draft e a vaga dela)
 * voa de um lugar pro outro. Navegador sem View Transitions, Reduzir movimento ou aba escondida: troca direto.
 * Uma por vez: o que muda durante uma transição (a última contratação do draft também troca de tela) entra nela.
 */
type Step = { apply: () => void; after?: () => void };
/** Transição criada e a troca ainda não aplicada: o que chegar agora entra nela, na ordem. */
let queue: Step[] | null = null;
/** Troca já aplicada, animação rodando: o que chegar agora troca direto. */
let animating = false;

const can = () =>
    typeof document !== 'undefined' &&
    !!document.startViewTransition &&
    !reduceMotionOn() &&
    document.visibilityState === 'visible';

/** Aplica `apply` dentro de uma View Transition (ou direto), sempre na ordem em que as trocas chegaram. */
export function run(apply: () => void, after?: () => void) {
    if (queue) {
        queue.push({ apply, after });
        return null;
    }
    if (animating || !can()) {
        apply();
        after?.();
        return null;
    }
    queue = [{ apply, after }];
    document.documentElement.classList.add('vt-screen');
    const vt = document.startViewTransition(() => {
        const steps = queue ?? [];
        queue = null;
        animating = true;
        flushSync(() => {
            for (const st of steps) st.apply();
        });
        for (const st of steps) st.after?.();
    });
    // pulada (a tela mudou de tamanho no meio, aba escondida): a troca já valeu, só a animação não; sem o catch,
    // vira "promessa rejeitada sem tratamento" no console
    vt.ready.catch(() => {});
    const done = vt.finished.catch(() => {});
    void done.finally(() => {
        animating = false;
        document.documentElement.classList.remove('vt-screen');
    });
    return { finished: done };
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
    if (vt) void vt.finished.then(clear);
    else clear();
}
