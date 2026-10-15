/** Ícones pequenos da Golpedex, desenhados em SVG (nada de emoji). */
export type GdxIconKind = 'lock' | 'play' | 'prev' | 'next' | 'close' | 'star' | 'auto' | 'stop' | 'search';

export function GdxIcon({ kind, size = 16 }: { kind: GdxIconKind; size?: number }) {
    return (
        <svg className={`gdx-icon gi-${kind}`} viewBox="0 0 16 16" width={size} height={size} aria-hidden>
            {kind === 'lock' && (
                <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round">
                    <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" />
                    <rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="currentColor" fillOpacity="0.18" />
                    <path d="M8 10 V11.6" strokeLinecap="round" />
                </g>
            )}
            {kind === 'play' && <path d="M4.5 2.5 L13 8 L4.5 13.5 Z" fill="currentColor" />}
            {kind === 'prev' && (
                <path
                    d="M10.5 2.5 L5 8 L10.5 13.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
            {kind === 'next' && (
                <path
                    d="M5.5 2.5 L11 8 L5.5 13.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
            {kind === 'close' && (
                <path
                    d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
            )}
            {kind === 'star' && (
                <path
                    d="M8 1.3 L9.9 5.6 L14.6 6 L11 9.1 L12.1 13.7 L8 11.3 L3.9 13.7 L5 9.1 L1.4 6 L6.1 5.6 Z"
                    fill="currentColor"
                />
            )}
            {kind === 'auto' && <path d="M1.5 3 L7.5 8 L1.5 13 Z M8.5 3 L14.5 8 L8.5 13 Z" fill="currentColor" />}
            {kind === 'stop' && <rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="currentColor" />}
            {kind === 'search' && (
                <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                    <circle cx="6.8" cy="6.8" r="4.3" />
                    <path d="M10 10 L14 14" />
                </g>
            )}
        </svg>
    );
}
