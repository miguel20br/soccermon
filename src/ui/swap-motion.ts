import { type RefObject, useLayoutEffect, useRef } from 'react';
import { reduceMotionOn } from './reduce-motion';

/**
 * Nada teleporta: quando `key` muda, cada `[data-uid]` dentro de `box` que mudou de lugar desliza do lugar antigo pro
 * novo (trocar de vaga, substituição, ordem dos pênaltis). Mede relativo à caixa (rolar a página não conta) e anima
 * `translate`, que soma com o `transform` que o elemento já tiver. `settleMs`: mede de novo depois de uma transição de
 * CSS que também move os itens (a troca de formação anda por left/top).
 */
export function useSwapMotion(box: RefObject<HTMLElement | null>, key: string, settleMs = 0) {
    const last = useRef(new Map<string, { left: number; top: number }>());
    // biome-ignore lint/correctness/useExhaustiveDependencies: mede de novo só quando alguém muda de lugar
    useLayoutEffect(() => {
        const measure = (animate: boolean) => {
            const rects = new Map<string, { left: number; top: number }>();
            const origin = box.current?.getBoundingClientRect();
            for (const el of box.current?.querySelectorAll<HTMLElement>('[data-uid]') ?? []) {
                const b = el.getBoundingClientRect();
                const r = { left: b.left - (origin?.left ?? 0), top: b.top - (origin?.top ?? 0) };
                const uid = el.dataset.uid ?? '';
                const was = last.current.get(uid);
                rects.set(uid, r);
                if (!animate || !was || !el.animate || reduceMotionOn() || (was.left === r.left && was.top === r.top))
                    continue;
                el.animate(
                    [
                        { translate: `${was.left - r.left}px ${was.top - r.top}px`, zIndex: 3 },
                        { translate: '0 0', zIndex: 3 },
                    ],
                    { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
                );
            }
            last.current = rects;
        };
        measure(true);
        if (!settleMs) return;
        const id = window.setTimeout(() => measure(false), settleMs);
        return () => clearTimeout(id);
    }, [key]);
}
