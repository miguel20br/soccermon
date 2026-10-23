import type { CSSProperties } from 'react';
import sheets from '../../data/icon-sheets.json';

/**
 * Ícone de menu (o "bonequinho de caixa"), de uma folha só por fonte (scripts/fetch-icons.ts): pra lista, mapa da
 * Rota e chave da copa, onde o GIF da carta pesa e não cabe. Comparação das fontes em `?lab=icones`.
 */
export type IconSource = 'pokesprite' | 'pokesprite7' | 'showdown';

/** A fonte dos ícones no jogo inteiro: trocar de fonte é mudar só esta linha. */
export const ICON_SOURCE: IconSource = 'pokesprite7';

/**
 * `scale` inteiro (pixel art: 1, 2, 3). Sem shiny na fonte, mostra o normal. Número fora da folha (Gen 2 ainda
 * desligada) não desenha nada.
 */
export function MonIcon({
    id,
    shiny = false,
    source = ICON_SOURCE,
    scale = 1,
    label,
    className = '',
}: {
    id: number;
    shiny?: boolean;
    source?: IconSource;
    scale?: number;
    /** Nome pra leitor de tela; sem nome, o ícone é decoração. */
    label?: string;
    className?: string;
}) {
    const s = sheets[source];
    if (id < 1 || id > sheets.count) return null;
    const i = id - 1;
    const w = s.w * scale;
    const h = s.h * scale;
    const style: CSSProperties = {
        width: w,
        height: h,
        backgroundImage: `url(assets/icons/${source}${shiny && s.shiny ? '-shiny' : ''}.png)`,
        backgroundSize: `${sheets.cols * w}px auto`,
        backgroundPosition: `${-(i % sheets.cols) * w}px ${-Math.floor(i / sheets.cols) * h}px`,
    };
    return label ? (
        <span className={`mon-icon ${className}`} style={style} role="img" aria-label={label} />
    ) : (
        <span className={`mon-icon ${className}`} style={style} aria-hidden />
    );
}
