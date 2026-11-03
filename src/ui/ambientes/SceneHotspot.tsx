import type { CSSProperties, ReactNode } from 'react';
import { KIT, type KitPiece, Mi } from './Room';

/**
 * Um objeto da cena que abre uma tela (o baú do Clash): o desenho e a plaquinha com o nome num botão só. Mesmas medidas
 * do `Mi` (pixels de arte, `x` e `bottom` dentro do cenário): com `k`, o desenho é o móvel do kit; sem `k`, vem em
 * `children` com o tamanho em `w` x `h`. A plaquinha fica sempre à vista na base do objeto (`plate` desce ou sobe ela,
 * em px de tela) e pisca 1 vez quando a aba acende. O toque tem no mínimo 44 px mesmo com o desenho menor.
 */
export function SceneHotspot({
    k,
    x,
    bottom,
    w,
    h,
    label,
    sub,
    plate = 0,
    onClick,
    children,
}: {
    k?: KitPiece;
    x: number;
    bottom: number;
    w?: number;
    h?: number;
    label: string;
    sub?: string;
    plate?: number;
    onClick: () => void;
    children?: ReactNode;
}) {
    const [width, height] = k ? [KIT[k][2], KIT[k][3]] : [w ?? 0, h ?? 0];
    return (
        <button
            type="button"
            className="hs"
            aria-label={sub ? `${label}, ${sub}` : label}
            onClick={onClick}
            style={
                {
                    '--x': x,
                    '--y': bottom - height,
                    '--w': width,
                    '--h': height,
                    '--plate': plate,
                    zIndex: bottom,
                } as CSSProperties
            }
        >
            {k ? <Mi k={k} x={0} bottom={height} /> : children}
            <span className="hs-plate">
                <b>{label}</b>
                {sub && <small>{sub}</small>}
            </span>
        </button>
    );
}
