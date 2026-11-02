import { useContext, useEffect, useRef, useState } from 'react';
import '../ambientes/ambientes.css';
import { ClockCtx } from '../ambientes/clock';
import { FieldSprite } from '../ambientes/FieldSprite';

/** Quem desfila no rodapé dos Créditos (os mesmos sprites de campo da quadra), na ordem da fila. */
const MONS = [25, 1, 4, 7, 133, 39, 143, 151];
/** Passo do desfile (px/s); segurando, o relógio dos Créditos manda `fast`. */
const SPEED = 42;

/**
 * Desfile dos Créditos: os Pokémon andam pra direita pelo pé da tela, espalhados por igual e dando a volta. Anda no
 * relógio da cena (para com a aba escondida e não existe com "reduzir movimento"). Pedaço à parte: o FieldSprite e o
 * CSS dos ambientes não entram no pacote da Home.
 */
export function CreditsParade({ fast }: { fast: { current: number } }) {
    const clock = useContext(ClockCtx);
    const box = useRef<HTMLDivElement>(null);
    const mons = useRef<(HTMLSpanElement | null)[]>([]);
    const [n, setN] = useState(0);
    useEffect(() => {
        const el = box.current;
        if (!el) return;
        const size = () => setN(Math.min(MONS.length, Math.max(4, Math.round(el.clientWidth / 110))));
        size();
        const ro = new ResizeObserver(size);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    useEffect(() => {
        const el = box.current;
        if (!clock || !el || !n) return;
        let s = 0;
        return clock.sub((_t, dt) => {
            s += (SPEED * fast.current * dt) / 1000;
            // a volta: da borda esquerda (escondido) até passar da direita, um a cada L/n
            const L = el.clientWidth + 80;
            mons.current.forEach((m, i) => {
                if (m) m.style.transform = `translateX(${(((s + (i * L) / n) % L) - 40).toFixed(1)}px)`;
            });
        });
    }, [clock, n, fast]);
    return (
        <div className="cr-parade" ref={box} aria-hidden>
            {MONS.slice(0, n).map((id, i) => (
                <span
                    key={id}
                    className="cr-mon"
                    ref={(m) => {
                        mons.current[i] = m;
                    }}
                    style={{ transform: 'translateX(-80px)' }}
                >
                    <FieldSprite id={id} anim="Walk" dir={2} />
                </span>
            ))}
        </div>
    );
}
