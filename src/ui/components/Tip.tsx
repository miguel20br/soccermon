import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { uiZoom } from '../ui-zoom';
import './tip.css';

/** Toque longo que abre a dica (o mesmo tempo da info rápida da carta). */
export const TIP_PRESS_MS = 400;
/** Uma dica aberta por vez: abrir outra fecha a anterior. */
let closeCurrent: (() => void) | null = null;

/**
 * Dica curta de um selo, etiqueta ou medalha: mouse em cima (desktop), dedo segurado (~400 ms, celular) ou foco no
 * teclado. A bolha vai num portal (a carta corta o que passa da borda), em cima do alvo e, sem espaço, embaixo;
 * nunca sai da tela. O alvo aponta pra ela com aria-describedby. Dentro de um botão (carta clicável) o alvo não
 * entra no Tab (`focusable={false}`): o toque longo não vira clique na carta.
 */
export function Tip({
    text,
    children,
    className,
    focusable = true,
}: {
    text: string;
    children: ReactNode;
    className?: string;
    focusable?: boolean;
}) {
    const id = useId();
    const ref = useRef<HTMLSpanElement>(null);
    const bubble = useRef<HTMLSpanElement>(null);
    const press = useRef<number | undefined>(undefined);
    const linger = useRef<number | undefined>(undefined);
    const pressed = useRef(false);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

    useEffect(
        () => () => {
            clearTimeout(press.current);
            clearTimeout(linger.current);
        },
        [],
    );

    useLayoutEffect(() => {
        if (!open || !ref.current || !bubble.current) {
            setPos(null);
            return;
        }
        // tela grande: as medidas vêm em px da tela e o estilo vale em px do CSS (ui-zoom.ts)
        const z = uiZoom();
        const px = (d: DOMRect) => ({
            left: d.left / z,
            top: d.top / z,
            width: d.width / z,
            height: d.height / z,
            bottom: d.bottom / z,
        });
        const r = px(ref.current.getBoundingClientRect());
        const b = px(bubble.current.getBoundingClientRect());
        const gap = 8;
        const left = Math.min(Math.max(gap, r.left + r.width / 2 - b.width / 2), window.innerWidth / z - b.width - gap);
        const above = r.top - b.height - gap;
        setPos({ left, top: above >= gap ? above : r.bottom + gap });
    }, [open]);

    const close = useRef(() => setOpen(false));
    const show = () => {
        clearTimeout(linger.current);
        if (closeCurrent && closeCurrent !== close.current) closeCurrent();
        closeCurrent = close.current;
        setOpen(true);
    };
    const hide = () => {
        clearTimeout(press.current);
        setOpen(false);
    };

    return (
        <>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: os eventos só abrem a dica (aria-describedby); não há ação */}
            <span
                ref={ref}
                className={`tip-target${className ? ` ${className}` : ''}`}
                tabIndex={focusable ? 0 : undefined}
                aria-describedby={id}
                onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
                onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
                onPointerDown={(e) => {
                    if (e.pointerType === 'mouse') return;
                    // a carta tem a própria info rápida no toque longo: aqui quem responde é a dica
                    e.stopPropagation();
                    pressed.current = false;
                    press.current = window.setTimeout(() => {
                        pressed.current = true;
                        show();
                    }, TIP_PRESS_MS);
                }}
                onPointerUp={(e) => {
                    if (e.pointerType === 'mouse') return;
                    clearTimeout(press.current);
                    if (pressed.current) linger.current = window.setTimeout(() => setOpen(false), 1600);
                }}
                onPointerCancel={hide}
                onClickCapture={(e) => {
                    if (!pressed.current) return;
                    pressed.current = false;
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onContextMenu={(e) => e.preventDefault()}
                onFocus={focusable ? show : undefined}
                onBlur={focusable ? hide : undefined}
                onKeyDown={(e) => e.key === 'Escape' && hide()}
            >
                {children}
            </span>
            {createPortal(
                <span
                    ref={bubble}
                    id={id}
                    role="tooltip"
                    className="tip-bubble"
                    hidden={!open}
                    style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
                >
                    {text}
                </span>,
                document.body,
            )}
        </>
    );
}
