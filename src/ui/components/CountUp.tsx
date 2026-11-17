import { useLayoutEffect, useRef, useState } from 'react';
import { reduceMotionOn } from '../reduce-motion';

/** ease-out com leve overshoot (passa um tico do alvo e volta). */
export const easeOutBack = (p: number) => {
    const c = 1.3;
    const x = p - 1;
    return 1 + (c + 1) * x ** 3 + c * x ** 2;
};

/**
 * O número `elapsed` ms depois de começar a rolar. Antes do começo é `start`: a troca de tela feita dentro do fim de
 * uma animação (o corte de TV, a saída em câmera lenta) monta a tela com o carimbo do quadro já no passado, e o
 * overshoot de um progresso negativo mostrava o placar "-3 x -1" por um quadro.
 */
export function countValue(start: number, to: number, elapsed: number, ms: number) {
    const p = Math.max(0, Math.min(1, elapsed / ms));
    return p < 1 ? start + (to - start) * easeOutBack(p) : to;
}

/**
 * Número que rola até `to` (~400 ms, ease-out com leve overshoot). `from` vale só na montagem; depois, cada
 * mudança de `to` rola do valor da tela até o novo. `skip` mostra o final na hora (toque pra pular).
 * Reduzir movimento: o final aparece direto e acende na cor de destaque (`.cu-hl`) por um instante.
 */
export function CountUp({
    to,
    from = to,
    ms = 400,
    skip = false,
    format = String,
    className = '',
}: {
    to: number;
    from?: number;
    ms?: number;
    skip?: boolean;
    format?: (v: number) => string;
    className?: string;
}) {
    const [shown, setShown] = useState(from);
    const [hl, setHl] = useState(false);
    const cur = useRef(from);
    useLayoutEffect(() => {
        const start = cur.current;
        if (start === to) return;
        if (skip || reduceMotionOn()) {
            cur.current = to;
            setShown(to);
            if (skip) return;
            setHl(true);
            // sem limpar no cleanup: no StrictMode o efeito roda 2x na montagem e o destaque ficaria aceso
            window.setTimeout(() => setHl(false), 700);
            return;
        }
        const t0 = performance.now();
        let raf = 0;
        const step = (now: number) => {
            cur.current = countValue(start, to, now - t0, ms);
            setShown(cur.current);
            if (cur.current !== to) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [to, ms, skip]);
    return <span className={`count-up${hl ? ' cu-hl' : ''} ${className}`}>{format(Math.round(shown))}</span>;
}
