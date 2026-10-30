import { t } from '../../i18n';

/** Taça da Copa de Kanto desenhada em SVG (dourada, com a bola de futsal no centro: pokébola como símbolo não, brand guide). */
export function Trophy({ size = 140, rota = false }: { size?: number; rota?: boolean }) {
    // Taça da Rota Índigo: mesma forma, em índigo e prata (a da Relâmpago é dourada)
    const g = rota ? ['#e4e8ff', '#9aa6f0', '#3d3f9e'] : ['#fff3b0', '#ffd447', '#b07a10'];
    const edge = rota ? '#23245e' : '#7a5200';
    const id = rota ? 'tg-rota' : 'tg-gold';
    return (
        <svg
            className="trophy-svg"
            width={size}
            height={size}
            viewBox="0 0 120 120"
            role="img"
            aria-label={t(rota ? 'longCup.trophy' : 'match.trophy')}
        >
            <defs>
                <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor={g[0]} />
                    <stop offset="0.45" stopColor={g[1]} />
                    <stop offset="1" stopColor={g[2]} />
                </linearGradient>
                <linearGradient id="tg-base" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#5a3a1a" />
                    <stop offset="1" stopColor="#2a1a0a" />
                </linearGradient>
            </defs>
            {/* alças */}
            <path
                d="M28 26 C6 26 6 56 34 60"
                fill="none"
                stroke={`url(#${id})`}
                strokeWidth="7"
                strokeLinecap="round"
            />
            <path
                d="M92 26 C114 26 114 56 86 60"
                fill="none"
                stroke={`url(#${id})`}
                strokeWidth="7"
                strokeLinecap="round"
            />
            {/* copa */}
            <path
                d="M26 16 H94 C94 50 82 70 60 74 C38 70 26 50 26 16 Z"
                fill={`url(#${id})`}
                stroke={edge}
                strokeWidth="2.5"
            />
            <path
                d="M34 22 C35 40 42 56 52 64"
                fill="none"
                stroke="#fffbe6"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
            />
            {/* bola de futsal */}
            <circle cx="60" cy="40" r="11" fill="#ffffff" stroke="#2a1a0a" strokeWidth="2.5" />
            <path
                d="M60 35.3 L64.5 38.5 L62.8 43.8 H57.2 L55.5 38.5 Z M60 35.3 V29.8 M64.5 38.5 L69.8 36.8 M62.8 43.8 L66 48.2 M57.2 43.8 L54 48.2 M55.5 38.5 L50.2 36.8"
                fill="#2a1a0a"
                stroke="#2a1a0a"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            {/* haste e base */}
            <rect x="53" y="73" width="14" height="14" fill={`url(#${id})`} stroke={edge} strokeWidth="2" />
            <rect x="40" y="86" width="40" height="8" rx="2" fill={`url(#${id})`} stroke={edge} strokeWidth="2" />
            <rect x="34" y="94" width="52" height="16" rx="3" fill="url(#tg-base)" stroke="#1a0f05" strokeWidth="2" />
            <rect x="46" y="98" width="28" height="7" rx="1.5" fill={g[1]} opacity="0.85" />
        </svg>
    );
}
