import { useEffect, useRef } from 'react';
import { musicAudible, onGanchoHit } from '../../game/music';
import './logo-hits.css';

/** Sílabas do logo (SOC, CER, MON) em % da largura; cada uma pisca na batida do gancho da faixa que toca. */
const SYLLABLES: [number, number][] = [
    [0, 34.7],
    [34.7, 67.7],
    [67.7, 100],
];
/** Sem som (áudio travado ou música no zero), o logo da Home bate o SOC-CER-MON sozinho, no ritmo do gancho, a cada tanto. */
const IDLE_EVERY_MS = 8000;
const IDLE_BEATS_MS = [0, 347, 662];

/**
 * Cópias do logo recortadas por sílaba (e um brilho atrás de cada uma) que piscam nas 3 batidas "SOC-CER-MON" de
 * qualquer faixa que toque (`gancho.hits` do .json, e o fim da virada). Vai dentro de um pai `position: relative` que
 * tem o logo; só transform, opacity e filter (WAAPI). `idle` (só a Home): sem som, pisca sozinho a cada 8 s.
 */
export function LogoHits({ idle = false }: { idle?: boolean }) {
    const hit = useRef<(HTMLImageElement | null)[]>([]);
    const star = useRef<(HTMLSpanElement | null)[]>([]);
    const ring = useRef<(HTMLSpanElement | null)[]>([]);
    useEffect(() => {
        // estrela e anel só na 1ª passada de cada grupo de ganchos (os compassos 36 a 42 seguidos não cansam)
        let groupAt = -1e9;
        let fx = true;
        const play = (i: number) => {
            const img = hit.current[i];
            const root = img?.parentElement?.parentElement;
            if (!img || !root || root.offsetParent === null) return; // logo escondido (partida): nada a animar
            const white = [{ filter: 'brightness(0) invert(1)' }, { filter: 'brightness(1)' }];
            if (document.documentElement.dataset.reduceMotion === 'true') {
                // só o clarão branco, sem escala nem tremida
                img.animate(
                    [
                        { opacity: 1, filter: 'brightness(0) invert(1)' },
                        { opacity: 0, filter: 'brightness(1)' },
                    ],
                    { duration: 150, easing: 'ease-out' },
                );
                return;
            }
            if (i === 0) {
                const now = performance.now();
                fx = now - groupAt > 5000;
                groupAt = now;
            }
            const base = { composite: 'add' } as const;
            // pula 1 → 1,15 → 1 em 180 ms, nasce branca e volta à cor em 150 ms
            img.animate(
                [
                    { opacity: 1, transform: 'scale(1)' },
                    { opacity: 1, transform: 'scale(1.15)', offset: 0.45 },
                    { opacity: 1, transform: 'scale(1)' },
                ],
                { ...base, duration: 180, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.4)' },
            );
            img.animate(white, { duration: 150, easing: 'ease-in' });
            if (fx) {
                // estrela dourada e anel branco chapados (sem brilho) abrem e somem em 300 ms
                star.current[i]?.animate(
                    [
                        { opacity: 1, transform: 'scale(0.4) rotate(0deg)' },
                        { opacity: 0, transform: 'scale(1.5) rotate(20deg)' },
                    ],
                    { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
                );
                ring.current[i]?.animate(
                    [
                        { opacity: 1, transform: 'scale(0.5)' },
                        { opacity: 0, transform: 'scale(2)' },
                    ],
                    { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
                );
            }
            if (i === 2)
                root.animate(
                    [
                        { transform: 'translate(0, 0)' },
                        { transform: 'translate(-4px, 1px)', offset: 0.2 },
                        { transform: 'translate(4px, -2px)', offset: 0.45 },
                        { transform: 'translate(-3px, 1px)', offset: 0.7 },
                        { transform: 'translate(0, 0)' },
                    ],
                    { duration: 200, easing: 'linear' },
                );
        };
        const off = onGanchoHit(play);
        if (!idle) return off;
        const timers = new Set<number>();
        const idleHits = () => {
            if (document.hidden || musicAudible()) return;
            for (const [i, ms] of IDLE_BEATS_MS.entries()) {
                const t = window.setTimeout(() => {
                    timers.delete(t);
                    play(i);
                }, ms);
                timers.add(t);
            }
        };
        const every = window.setInterval(idleHits, IDLE_EVERY_MS);
        const first = window.setTimeout(idleHits, 1500);
        return () => {
            off();
            window.clearInterval(every);
            window.clearTimeout(first);
            for (const t of timers) window.clearTimeout(t);
        };
    }, [idle]);
    return SYLLABLES.map(([a, b], i) => (
        <span key={a} aria-hidden="true">
            <span
                ref={(el) => {
                    star.current[i] = el;
                }}
                className="logo-star"
                style={{ left: `${(a + b) / 2}%` }}
            />
            <span
                ref={(el) => {
                    ring.current[i] = el;
                }}
                className="logo-ring"
                style={{ left: `${(a + b) / 2}%` }}
            />
            <img
                ref={(el) => {
                    hit.current[i] = el;
                }}
                className="logo-hit"
                src="assets/ui/logo.svg"
                alt=""
                style={{ clipPath: `inset(0 ${100 - b}% 0 ${a}%)`, transformOrigin: `${(a + b) / 2}% 55%` }}
            />
        </span>
    ));
}

/**
 * O logo do jogo com as sílabas piscando no SOC-CER-MON da música que toca (regra do Miguel, 30/10/2026: logo na tela
 * com música tocando pisca, em qualquer lugar). Todo logo em HTML passa por aqui; `className` dá a largura.
 */
export function Logo({ className = '', alt = '', idle = false }: { className?: string; alt?: string; idle?: boolean }) {
    return (
        <span className={`logo-blink logo-c ${className}`}>
            <img src="assets/ui/logo.svg" alt={alt} width="1441" height="300" draggable={false} />
            <LogoHits idle={idle} />
        </span>
    );
}
