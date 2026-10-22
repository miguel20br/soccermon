import { reduceMotionOn } from './settings-sync';

/**
 * Nada teleporta na saída (docs/planos/nada-teleporta.md): modal (`.modal-backdrop`) e o que tiver `data-exit` somem
 * com fade em vez de sumir na hora. O React já tirou o elemento: uma cópia sem clique fica no lugar dele durante a
 * animação (src/ui/motion.css, `.is-leaving`) e sai sozinha. Um observador só pra página inteira.
 */
const SEL = '.modal-backdrop, [data-exit]';

export function startExitMotion() {
    if (typeof MutationObserver === 'undefined') return;
    // testes automáticos (Playwright) não esperam a cópia sumir; `?motion=1` liga mesmo assim (pnpm teleporte)
    if (navigator.webdriver && !new URLSearchParams(window.location.search).has('motion')) return;
    new MutationObserver((list) => {
        if (reduceMotionOn()) return;
        for (const m of list) {
            const parent = m.target;
            if (!parent.isConnected) continue;
            for (const n of m.removedNodes) {
                if (!(n instanceof HTMLElement) || !n.matches(SEL) || n.classList.contains('is-leaving')) continue;
                const ghost = n.cloneNode(true) as HTMLElement;
                ghost.classList.add('is-leaving');
                ghost.setAttribute('aria-hidden', 'true');
                ghost.inert = true;
                // a cópia não pode ser achada no lugar do original (id, data-testid)
                for (const el of [ghost, ...ghost.querySelectorAll<HTMLElement>('[id], [data-testid]')]) {
                    el.removeAttribute('id');
                    el.removeAttribute('data-testid');
                }
                const next = m.nextSibling?.parentNode === parent ? m.nextSibling : null;
                parent.insertBefore(ghost, next);
                const done = () => ghost.remove();
                ghost.addEventListener('animationend', (e) => e.target === ghost && done());
                window.setTimeout(done, 400);
            }
        }
    }).observe(document.body, { childList: true, subtree: true });
}
