import { type HudIconKind, ICONS } from '../components/MatchHud';

/** Ícones pequenos da Golpedex: os mesmos do HudIcon (grade 24, ponta redonda), com tamanho próprio. */
export type GdxIconKind = 'lock' | 'play' | 'prev' | 'next' | 'close' | 'star' | 'auto' | 'stop' | 'search';

const KIND: Record<GdxIconKind, HudIconKind> = {
    lock: 'lock',
    play: 'play',
    prev: 'prev',
    next: 'next',
    close: 'close',
    star: 'max',
    auto: 'skip',
    stop: 'stop',
    search: 'search',
};

export function GdxIcon({ kind, size = 16 }: { kind: GdxIconKind; size?: number }) {
    return (
        <svg
            className={`gdx-icon gi-${kind}`}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            // abaixo de 14 px o traço 2.4 fica fino demais: engrossa (docs/marca/brand-guide.md, Ícones)
            strokeWidth={size <= 14 ? 3 : 2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d={ICONS[KIND[kind]]} />
        </svg>
    );
}
