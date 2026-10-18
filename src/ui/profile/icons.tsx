/** Ícones pequenos do Perfil, desenhados em SVG (nada de emoji). */

/** Bolinha de futsal: marca quem já jogou pelo seu time. */
export function BallMark({ className = 'pf-ball' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="7" fill="#f4f1e6" stroke="#0e1430" strokeWidth="1.5" />
            <path d="M8 4.6 L11 6.8 L9.9 10.3 H6.1 L5 6.8 Z" fill="#0e1430" />
        </svg>
    );
}

/** Alto-falante: tocar o grito. */
export function SpeakerIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" />
            <path
                d="M16 9 C17.3 10.3 17.3 13.7 16 15 M18.5 6.5 C21.2 9.2 21.2 14.8 18.5 17.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

/** Cadeado: ainda não descoberto. */
export function LockIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" />
            <path d="M8 10 V7.5 A4 4 0 0 1 16 7.5 V10" fill="none" stroke="currentColor" strokeWidth="2.4" />
        </svg>
    );
}

/** Setas de navegação (anterior/próximo). */
export function Chevron({ dir }: { dir: 'left' | 'right' }) {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d={dir === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Seta da cadeia de evolução. */
export function EvoArrow() {
    return (
        <svg className="pf-evo-arrow" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 12 H17 M12 6 L18 12 L12 18" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
    );
}

/** Medalha com fita: prêmio de título (missões). */
export function MedalIcon() {
    return (
        <svg className="pf-medal" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 2 H11 L13 9 H9 Z" fill="#e8423f" />
            <path d="M13 2 H17 L15 9 H11 Z" fill="#3a7bd5" />
            <circle cx="12" cy="15" r="6.5" fill="#ffcb05" stroke="#0e1430" strokeWidth="1.5" />
            <path
                d="M12 11.6 L13 14 L15.4 14.2 L13.6 15.8 L14.1 18.2 L12 17 L9.9 18.2 L10.4 15.8 L8.6 14.2 L11 14 Z"
                fill="#b07a12"
            />
        </svg>
    );
}

/** Fita de campeão (roseta dourada com as fitas vermelhas) com o número de títulos da espécie. */
export function ChampionRibbon({ n, className = 'pf-ribbon' }: { n: number; className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 30" aria-hidden>
            <path d="M7 15 L3 29 L8 26 L11 29 L12 17 Z" fill="#c8323a" stroke="#0e1430" strokeWidth="1.2" />
            <path d="M17 15 L21 29 L16 26 L13 29 L12 17 Z" fill="#e8423f" stroke="#0e1430" strokeWidth="1.2" />
            <circle
                cx="12"
                cy="11"
                r="10.5"
                fill="#f2c230"
                stroke="#0e1430"
                strokeWidth="1.4"
                strokeDasharray="2.2 1.1"
            />
            <circle cx="12" cy="11" r="7.2" fill="#c8323a" stroke="#ffe680" strokeWidth="1.2" />
            <text
                x="12"
                y="11"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={n >= 10 ? 8 : 10}
                fontWeight="700"
                fill="#fff"
                fontFamily="Galmuri11, monospace"
            >
                {n}
            </text>
        </svg>
    );
}

/** Visto de "salvo". */
export function CheckIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M5 12.5 L10 17 L19 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
