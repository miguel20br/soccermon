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
 * Onde pôr o balão: embaixo do alvo, senão em cima, senão ao lado (celular deitado). Nunca em cima do alvo, a não
 * ser que nada caiba (`inside`: encostado no pé da tela).
 */
export function placeBalloon(hole: Box, b: { width: number; height: number }, vw: number, vh: number): Placement {
    const r = hole.left + hole.width;
    const bt = hole.top + hole.height;
    const cx = hole.left + hole.width / 2;
    const cy = hole.top + hole.height / 2;
    const vertical = (side: 'below' | 'above'): Placement => {
        const left = clamp(cx - b.width / 2, M, Math.max(M, vw - b.width - M));
        return {
            side,
            left,
            top: side === 'below' ? bt + GAP : hole.top - GAP - b.height,
            arrow: clamp(cx - left, 16, b.width - 16),
        };
    };
    const horizontal = (side: 'right' | 'left'): Placement => {
        const top = clamp(cy - b.height / 2, M, Math.max(M, vh - b.height - M));
        return {
            side,
            top,
            left: side === 'right' ? r + GAP : hole.left - GAP - b.width,
            arrow: clamp(cy - top, 16, b.height - 16),
        };
    };
    if (vh - bt >= b.height + GAP + M) return vertical('below');
    if (hole.top >= b.height + GAP + M) return vertical('above');
    if (vw - r >= b.width + GAP + M) return horizontal('right');
    if (hole.left >= b.width + GAP + M) return horizontal('left');
    return {
        side: 'inside',
        left: clamp(cx - b.width / 2, M, Math.max(M, vw - b.width - M)),
        top: vh - b.height - M,
        arrow: 0,
    };
}
