export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}
export type Side = 'below' | 'above' | 'right' | 'left' | 'inside';
export interface Placement {
    side: Side;
    left: number;
    top: number;
    /** Onde a ponta do balão encosta (px dentro do balão, no eixo da borda que aponta pro alvo). */
    arrow: number;
}

const M = 8;
const GAP = 12;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Onde pôr a linha da dica: embaixo do alvo, senão em cima, senão ao lado (celular deitado). Nunca em cima do alvo, a não
 * ser que nada caiba (`inside`: dentro do alvo, no pé dele; no pé da tela tapava o botão de jogar). `gap`: o vão do dedo entre a linha e o alvo.
 */
export function placeBalloon(
    hole: Box,
    b: { width: number; height: number },
    vw: number,
    vh: number,
    gap = GAP,
): Placement {
    const r = hole.left + hole.width;
    const bt = hole.top + hole.height;
    const cx = hole.left + hole.width / 2;
    const cy = hole.top + hole.height / 2;
    const vertical = (side: 'below' | 'above'): Placement => {
        const left = clamp(cx - b.width / 2, M, Math.max(M, vw - b.width - M));
        return {
            side,
            left,
            top: side === 'below' ? bt + gap : hole.top - gap - b.height,
            arrow: clamp(cx - left, 16, b.width - 16),
        };
    };
    const horizontal = (side: 'right' | 'left'): Placement => {
        const top = clamp(cy - b.height / 2, M, Math.max(M, vh - b.height - M));
        return {
            side,
            top,
            left: side === 'right' ? r + gap : hole.left - gap - b.width,
            arrow: clamp(cy - top, 16, b.height - 16),
        };
    };
    if (vh - bt >= b.height + gap + M) return vertical('below');
    if (hole.top >= b.height + gap + M) return vertical('above');
    if (vw - r >= b.width + gap + M) return horizontal('right');
    if (hole.left >= b.width + gap + M) return horizontal('left');
    const left = clamp(cx - b.width / 2, M, Math.max(M, vw - b.width - M));
    return {
        side: 'inside',
        left,
        top: clamp(bt - b.height - M, M, Math.max(M, vh - b.height - M)),
        arrow: clamp(cx - left, 16, b.width - 16),
    };
}

/** Só rola a página se o alvo estiver (em parte) fora da tela; alvo que já cabe não mexe na rolagem (o logo fica). */
export function needsScroll(r: { top: number; bottom: number }, vh: number): boolean {
    return r.top < 0 || r.bottom > vh;
}
