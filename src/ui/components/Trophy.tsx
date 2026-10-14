/** Taça da Copa de Kanto desenhada em SVG (dourada, com a pokébola no centro). */
export function Trophy({ size = 140 }: { size?: number }) {
    return (
        <svg className="trophy-svg" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Taça">
            <defs>
                <linearGradient id="tg-gold" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#fff3b0" />
                    <stop offset="0.45" stopColor="#ffd447" />
                    <stop offset="1" stopColor="#b07a10" />
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
                stroke="url(#tg-gold)"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <path
                d="M92 26 C114 26 114 56 86 60"
                fill="none"
                stroke="url(#tg-gold)"
                strokeWidth="7"
                strokeLinecap="round"
            />
            {/* copa */}
            <path
                d="M26 16 H94 C94 50 82 70 60 74 C38 70 26 50 26 16 Z"
                fill="url(#tg-gold)"
                stroke="#7a5200"
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
            {/* pokébola */}
            <circle cx="60" cy="40" r="11" fill="#e8423f" stroke="#2a1a0a" strokeWidth="2.5" />
            <path d="M49 40 A11 11 0 0 0 71 40 Z" fill="#ffffff" stroke="#2a1a0a" strokeWidth="2.5" />
            <circle cx="60" cy="40" r="3.6" fill="#ffffff" stroke="#2a1a0a" strokeWidth="2.5" />
            {/* haste e base */}
            <rect x="53" y="73" width="14" height="14" fill="url(#tg-gold)" stroke="#7a5200" strokeWidth="2" />
            <rect x="40" y="86" width="40" height="8" rx="2" fill="url(#tg-gold)" stroke="#7a5200" strokeWidth="2" />
            <rect x="34" y="94" width="52" height="16" rx="3" fill="url(#tg-base)" stroke="#1a0f05" strokeWidth="2" />
            <rect x="46" y="98" width="28" height="7" rx="1.5" fill="#ffd447" opacity="0.85" />
        </svg>
    );
}
