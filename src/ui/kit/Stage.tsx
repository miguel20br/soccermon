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
    useTwoCols(body, className.includes('k-stage-place'));
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

/** Celular deitado (a mesma consulta do stage.css). */
const SHORT_LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';

/**
 * Palco de lugar (stage.css). Deitado: se o conteúdo não cabe na coluna da esquerda, ele vira 2 colunas (`data-cols`)
 * e a cena encolhe pra direita, em vez de rolar dentro do palco (mede sempre com 1 coluna: o atributo sai antes).
 * Em pé: passa pra cena onde fica o vão (`--k-gap-y`), pra a dupla do Duelo e da Liga aparecer nele.
 */
function useTwoCols(ref: RefObject<HTMLElement | null>, on: boolean) {
    useLayoutEffect(() => {
        const el = ref.current;
        if (!on || !el || typeof ResizeObserver === 'undefined') return;
        const mq = window.matchMedia(SHORT_LANDSCAPE);
        const stage = el.parentElement;
        const refit = () => {
            delete el.dataset.cols;
            if (mq.matches && el.scrollHeight > el.clientHeight + 1) el.dataset.cols = '2';
            // celular em pé: a dupla da cena desce/sobe pro meio do vão (em tela baixa o vão não fica onde a cena
            // espera e os blocos cobriam a dupla); vão pequeno demais fica como está
            const gap = el.querySelector(':scope > .k-stage-gap')?.getBoundingClientRect();
            if (stage && gap && !mq.matches && window.innerWidth <= 700 && gap.height >= 56) {
                stage.style.setProperty('--k-gap-y', `${Math.round(gap.top + gap.height / 2)}px`);
                stage.dataset.gap = '';
            } else if (stage) delete stage.dataset.gap;
        };
        refit();
        const ro = new ResizeObserver(refit);
        ro.observe(el.parentElement ?? el);
        // o conteúdo troca (sala cheia, outro bloco): mede de novo no quadro seguinte (só filhos: o atributo não volta)
        let frame = 0;
        const mo = new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(refit);
        });
        mo.observe(el, { subtree: true, childList: true });
        document.fonts?.ready.then(refit);
        return () => {
            ro.disconnect();
            mo.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [ref, on]);
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
