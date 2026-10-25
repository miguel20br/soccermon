import type { CSSProperties, ReactNode } from 'react';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import type { ZoneDef } from './WildZone';

/**
 * O que os ambientes de dentro (Laboratório, Sede) e a Arena dividem: móveis do kit Modern Interiors (LimeZu, já no
 * projeto pra Sala de troféus) recortados por CSS, o chão onde os Pokémon andam e os botões menores.
 * Medidas em pixels de arte: `--mi` é o tamanho de 1 pixel do kit na tela (2 no celular, 1,5 no pequeno, 3 no desktop).
 */
export type Crop = readonly [x: number, y: number, w: number, h: number];

/** Recortes do Interiors_free_32x32.png (conferidos no tileset, o móvel inteiro com a sombra). */
export const KIT = {
    shelf: [320, 2188, 64, 66],
    shelf2: [320, 2284, 64, 68],
    map: [321, 2131, 62, 36],
    globe: [388, 2116, 24, 40],
    deskBook: [243, 1237, 54, 44],
    labPc: [321, 1280, 54, 49],
    cabinet: [65, 593, 60, 61],
    cart: [205, 595, 40, 60],
    fridge: [385, 1282, 29, 62],
    plant: [386, 1444, 28, 46],
    palm: [426, 1408, 46, 62],
    glassCab: [292, 1568, 54, 54],
    fireplace: [288, 2752, 64, 80],
    lamp: [352, 1774, 30, 50],
    frame: [320, 850, 24, 32],
} as const satisfies Record<string, Crop>;
export type KitPiece = keyof typeof KIT;

/**
 * Um móvel do kit: `x` e `bottom` em pixels de arte dentro do cenário (o pé do móvel fica na linha `bottom`; quem tem
 * o pé mais embaixo passa na frente). `flip` espelha.
 */
export function Mi({ k, x, bottom, flip }: { k: KitPiece; x: number; bottom: number; flip?: boolean }) {
    const [sx, sy, w, h] = KIT[k];
    return (
        <i
            className={`mi${flip ? ' flip' : ''}`}
            style={
                {
                    '--x': x,
                    '--y': bottom - h,
                    '--w': w,
                    '--h': h,
                    '--sx': sx,
                    '--sy': sy,
                    zIndex: bottom,
                } as CSSProperties
            }
        />
    );
}

/** Tela baixa (deitado) ou estreita: sprite 1x; desktop 3x. Os mesmos cortes do Estádio. */
export const SMALL = '(max-width: 359px), (max-height: 520px)';
export const BIG = '(min-width: 900px) and (min-height: 700px)';

/** O chão de um lugar: a faixa livre onde os Pokémon andam (a caixa da zona já fica só no chão). */
export const floorZone = (scale: number, ok: ZoneDef['ok'] = () => true): Record<string, ZoneDef> => ({
    floor: { ok: (x, y) => y > 0.12 && y < 0.9 && ok(x, y), speed: 0.2, scale },
});

/** Botão menor do lugar (ícone, nome e uma linha); `soon` = ainda não abre (tracejado, sem clique). */
export function Tile({
    icon,
    title,
    sub,
    onClick,
    soon,
}: {
    icon: HudIconKind | ReactNode;
    title: string;
    sub?: string;
    onClick?: () => void;
    soon?: boolean;
}) {
    const body = (
        <>
            {typeof icon === 'string' ? <HudIcon kind={icon as HudIconKind} /> : icon}
            <span>
                <b>{title}</b>
                {sub && <small>{sub}</small>}
            </span>
        </>
    );
    return soon ? (
        <div className="amb-tile soon">{body}</div>
    ) : (
        <button type="button" className="amb-tile bc-tile" onClick={onClick}>
            {body}
        </button>
    );
}
