import { type CSSProperties, type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';
import './stage.css';

/**
 * Palco (cara-de-jogo.md, peça 1): a tela de jogo que não rola. Ocupa a altura da tela embaixo da barra de cima, com
 * a cena de fundo (`scene`, decoração), no máximo um bloco de conteúdo no meio e a ação gorda no polegar (`action`,
 * vai pra `.bc-thumbbar`). O que não couber mora numa Sheet.
 */
export function Stage({
    scene,
    action,
    children,
    className = '',
    style,
}: {
    scene?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}) {
    const body = useRef<HTMLDivElement>(null);
    useFitZoom(body);
    return (
        <div className={`k-stage ${className}`} style={style}>
            {scene && (
                <div className="k-stage-scene" aria-hidden>
                    {scene}
                </div>
            )}
            <div className="k-stage-body" ref={body}>
                {children}
            </div>
            {action && <div className="bc-thumbbar k-stage-action">{action}</div>}
        </div>
    );
}

/**
 * Regra de 1440 (stage.css): no PC o conteúdo cresce com o zoom `--k-big`; se assim não couber (o Resultado tem mais
 * linhas que o fim de partida), o zoom desce o quanto precisar (`--k-fit`), nunca abaixo do tamanho do celular.
 * Mede a sobra no próprio corpo e nos filhos diretos (o painel do Resultado corta o que passa, não deixa vazar).
 */
export function useFitZoom(ref: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const refit = () => {
            el.style.removeProperty('--k-fit');
            const big = Number.parseFloat(getComputedStyle(el).getPropertyValue('--k-big')) || 1;
            let f = 1;
            // o conteúdo flexível encolhe um pouco junto: 3 passadas acertam
            for (let i = 0; i < 3 && big > 1; i++) {
                // filho que corta (o painel do Resultado) conta; o que vaza (título com o acento passando) já cai no corpo
                const boxes = [
                    el,
                    ...Array.from(el.children).filter((c) => getComputedStyle(c).overflowY !== 'visible'),
                ];
                const r = Math.min(
                    ...boxes.map((b) =>
                        b.clientHeight && b.scrollHeight > b.clientHeight + 1 ? b.clientHeight / b.scrollHeight : 1,
                    ),
                );
                if (r >= 1) break;
                f = Math.max(1 / big, f * r);
                el.style.setProperty('--k-fit', String(f));
            }
        };
        refit();
        // olha o pai (o tamanho da tela): o corpo muda de tamanho com o próprio zoom e daria laço no observador
        const ro = new ResizeObserver(refit);
        ro.observe(el.parentElement ?? el);
        // o conteúdo troca (pacote fechado → leque, batidas da cascata): mede de novo no quadro seguinte
        let frame = 0;
        const mo = new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(refit);
        });
        mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        document.fonts?.ready.then(refit);
        return () => {
            ro.disconnect();
            mo.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [ref]);
}
