import { type RefObject, useEffect } from 'react';

/**
 * Luz e inclinação das cartas holográficas (técnica do pokemon-cards-css, reimplementada): o ponteiro
 * vira variáveis CSS (--mx/--my, --rx/--ry, --bx/--by, --hyp, --act, --ang) que as camadas de brilho usam.
 * Sem estado do React: tudo via style + requestAnimationFrame, e só a carta sob o ponteiro anima.
 * Ao sair, volta suave para o centro. Com "reduzir movimento" não inclina nem anima.
 */
const reduceMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// cartas fora da tela pausam as animações de fundo
let observer: IntersectionObserver | null = null;
function offscreenObserver(): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') return null;
    observer ??= new IntersectionObserver(
        (entries) => {
            for (const e of entries) e.target.classList.toggle('pc2-offscreen', !e.isIntersecting);
        },
        { rootMargin: '120px' },
    );
    return observer;
}

interface State {
    x: number;
    y: number;
    act: number;
}

function write(el: HTMLElement, s: State, maxTilt: number) {
    const dx = s.x - 0.5;
    const dy = s.y - 0.5;
    const st = el.style;
    st.setProperty('--mx', `${(s.x * 100).toFixed(2)}%`);
    st.setProperty('--my', `${(s.y * 100).toFixed(2)}%`);
    st.setProperty('--rx', `${(-dy * maxTilt * 2 * s.act).toFixed(2)}deg`);
    st.setProperty('--ry', `${(dx * maxTilt * 2 * s.act).toFixed(2)}deg`);
    // o brilho anda menos que o ponteiro (parece reflexo na superfície)
    st.setProperty('--bx', `${(50 + dx * 46).toFixed(2)}%`);
    st.setProperty('--by', `${(50 + dy * 46).toFixed(2)}%`);
    st.setProperty('--hyp', Math.min(1, Math.hypot(dx, dy) * 2).toFixed(3));
    st.setProperty('--act', s.act.toFixed(3));
    st.setProperty('--ang', `${(dx * 60).toFixed(2)}deg`);
}

export function useHoloPointer(ref: RefObject<HTMLElement | null>, opts: { enabled: boolean; maxTilt?: number }) {
    const { enabled, maxTilt = 12 } = opts;
    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;
        const io = offscreenObserver();
        io?.observe(el);
        if (reduceMotion()) {
            return () => io?.unobserve(el);
        }

        const cur: State = { x: 0.5, y: 0.5, act: 0 };
        const target: State = { x: 0.5, y: 0.5, act: 0 };
        let raf = 0;

        const tick = () => {
            const k = target.act > 0 ? 0.18 : 0.08; // entra rápido, volta devagar
            cur.x += (target.x - cur.x) * k;
            cur.y += (target.y - cur.y) * k;
            cur.act += (target.act - cur.act) * k;
            write(el, cur, maxTilt);
            const done =
                Math.abs(target.x - cur.x) < 0.002 &&
                Math.abs(target.y - cur.y) < 0.002 &&
                Math.abs(target.act - cur.act) < 0.004;
            if (done && target.act === 0) {
                // descansou: limpa o inline e devolve a carta ao estado de repouso (e à animação ociosa)
                for (const p of ['--mx', '--my', '--rx', '--ry', '--bx', '--by', '--hyp', '--act', '--ang']) {
                    el.style.removeProperty(p);
                }
                el.classList.remove('is-active');
                raf = 0;
                return;
            }
            raf = requestAnimationFrame(tick);
        };
        const start = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };
        const point = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            target.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            target.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
            target.act = 1;
        };
        const enter = (e: PointerEvent) => {
            if (!el.classList.contains('is-active')) {
                // parte de onde a animação ociosa estava, sem pulo
                const cs = getComputedStyle(el);
                const mx = Number.parseFloat(cs.getPropertyValue('--mx'));
                const my = Number.parseFloat(cs.getPropertyValue('--my'));
                if (Number.isFinite(mx)) cur.x = mx / 100;
                if (Number.isFinite(my)) cur.y = my / 100;
                el.classList.add('is-active');
            }
            point(e);
            start();
        };
        const move = (e: PointerEvent) => {
            if (!el.classList.contains('is-active')) return enter(e);
            point(e);
            start();
        };
        const leave = () => {
            target.x = 0.5;
            target.y = 0.5;
            target.act = 0;
            start();
        };
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerdown', enter);
        el.addEventListener('pointerleave', leave);
        el.addEventListener('pointercancel', leave);
        // no toque, a luz some quando o dedo sai da tela
        const up = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') leave();
        };
        el.addEventListener('pointerup', up);
        return () => {
            el.removeEventListener('pointerup', up);
            cancelAnimationFrame(raf);
            io?.unobserve(el);
            el.removeEventListener('pointerenter', enter);
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerdown', enter);
            el.removeEventListener('pointerleave', leave);
            el.removeEventListener('pointercancel', leave);
        };
    }, [ref, enabled, maxTilt]);
}
