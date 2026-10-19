/** Ícones do menu principal, desenhados em SVG (nada de emoji). */
export type MenuIconKind =
    | 'moves'
    | 'news'
    | 'settings'
    | 'credits'
    | 'cards'
    | 'back'
    | 'profile'
    | 'dex'
    | 'help'
    | 'feedback'
    | 'daily'
    | 'liga';

export function MenuIcon({ kind }: { kind: MenuIconKind }) {
    return (
        <svg className={`menu-icon mi-${kind}`} viewBox="0 0 32 32" aria-hidden>
            {kind === 'moves' && (
                // raio: golpe
                <path d="M18 2 L6 18 H14 L12 30 L26 12 H17 Z" fill="#ffcb05" stroke="#2a1a00" strokeWidth="2" />
            )}
            {kind === 'news' && (
                // folha de notas com o selo vermelho de "novo"
                <g stroke="#1a1430" strokeWidth="2">
                    <rect x="6" y="4" width="20" height="24" rx="3" fill="#f4f1e6" />
                    <path d="M10 11 H22 M10 16 H22 M10 21 H18" strokeLinecap="round" />
                    <circle cx="25" cy="7" r="5" fill="#e8423f" />
                </g>
            )}
            {kind === 'settings' && (
                // engrenagem
                <g fill="#a6aed6" stroke="#141a33" strokeWidth="2" strokeLinejoin="round">
                    <path d="M13 2 H19 L20 6 L23.5 7.5 L27 5.5 L30 10.5 L27 13 V19 L30 21.5 L27 26.5 L23.5 24.5 L20 26 L19 30 H13 L12 26 L8.5 24.5 L5 26.5 L2 21.5 L5 19 V13 L2 10.5 L5 5.5 L8.5 7.5 L12 6 Z" />
                    <circle cx="16" cy="16" r="5" fill="#141a33" />
                </g>
            )}
            {kind === 'credits' && (
                // medalha com estrela
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <path d="M10 2 H14 L16 10 L18 2 H22 L19 13 H13 Z" fill="#3a7bd5" />
                    <circle cx="16" cy="21" r="9" fill="#ffcb05" />
                    <path
                        d="M16 15.5 L17.6 19 L21.2 19.3 L18.4 21.6 L19.3 25.2 L16 23.2 L12.7 25.2 L13.6 21.6 L10.8 19.3 L14.4 19 Z"
                        fill="#fff3b0"
                        strokeWidth="1.2"
                    />
                </g>
            )}
            {kind === 'cards' && (
                <g stroke="#1a1430" strokeWidth="2">
                    <rect x="4" y="7" width="14" height="20" rx="2" fill="#a45cff" transform="rotate(-12 11 17)" />
                    <rect x="13" y="5" width="14" height="20" rx="2" fill="#3a8dff" transform="rotate(10 20 15)" />
                </g>
            )}
            {kind === 'profile' && (
                // boné de treinador
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <path d="M5 19 C5 9 27 9 27 19 Z" fill="#e8423f" />
                    <path d="M3 19 H29 L26 23 H6 Z" fill="#f4f1e6" />
                    <path d="M16 10 V19" />
                    <circle cx="16" cy="15" r="2.6" fill="#f4f1e6" />
                </g>
            )}
            {kind === 'dex' && (
                // Pokédex aberta: tela e luz azul
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <rect x="5" y="3" width="22" height="26" rx="3" fill="#e8423f" />
                    <circle cx="11" cy="9" r="3" fill="#7fd3ff" />
                    <rect x="9" y="14" width="14" height="10" rx="1.5" fill="#d8f0d2" />
                </g>
            )}
            {kind === 'help' && (
                <g>
                    <circle cx="16" cy="16" r="13" fill="#3a7bd5" stroke="#1a1430" strokeWidth="2" />
                    <path
                        d="M12 12.5 C12 9.5 14 8 16 8 C18.5 8 20 9.7 20 11.8 C20 15 16 15 16 18.5"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="16" cy="23.5" r="2" fill="#fff" />
                </g>
            )}
            {kind === 'feedback' && (
                // balão de conversa
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <path d="M4 6 H28 V22 H14 L8 28 V22 H4 Z" fill="#58b85c" />
                    <path d="M9 12 H23 M9 17 H19" stroke="#f4f1e6" strokeLinecap="round" />
                </g>
            )}
            {kind === 'daily' && (
                // folhinha do calendário com o dia marcado
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <rect x="4" y="6" width="24" height="22" rx="3" fill="#f4f1e6" />
                    <path d="M4 9 C4 7 5 6 7 6 H25 C27 6 28 7 28 9 V12 H4 Z" fill="#e8423f" />
                    <path d="M10 3 V8 M22 3 V8" strokeLinecap="round" />
                    <rect x="13" y="16" width="7" height="7" rx="1" fill="#ffcb05" />
                </g>
            )}
            {kind === 'liga' && (
                // escudo com as três faixas da divisão (bronze, prata, ouro)
                <g stroke="#1a1430" strokeWidth="2" strokeLinejoin="round">
                    <path d="M16 3 L27 7 V15 C27 22 22 27 16 29 C10 27 5 22 5 15 V7 Z" fill="#2f6fde" />
                    <path d="M10 20 H22" stroke="#c98a52" strokeWidth="3" strokeLinecap="round" />
                    <path d="M10 15.5 H22" stroke="#c9ced8" strokeWidth="3" strokeLinecap="round" />
                    <path d="M10 11 H22" stroke="#e8c24a" strokeWidth="3" strokeLinecap="round" />
                </g>
            )}
            {kind === 'back' && (
                <path
                    d="M19 6 L9 16 L19 26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
        </svg>
    );
}
