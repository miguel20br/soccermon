import type { ReactNode } from 'react';
import { useT } from '../../i18n/react';
import { KANTO_BADGES, missionById, type TrainerId } from '../../store/missions';
import './badges.css';

/**
 * As 8 insígnias de Kanto, desenhadas por código (formas simples, inspiradas nas dos jogos). Ficam aqui
 * soltas para o estojo do Perfil e, depois, o Modo história.
 */
const ART: Record<string, ReactNode> = {
    // Rocha: octógono cinza com facetas
    brock: (
        <>
            <polygon
                points="14,3 26,3 37,14 37,26 26,37 14,37 3,26 3,14"
                fill="#8e949c"
                stroke="#33373d"
                strokeWidth="2"
            />
            <polygon points="16,9 24,9 31,16 31,24 24,31 16,31 9,24 9,16" fill="#b5bbc3" />
            <polygon points="16,9 24,9 20,20" fill="#dde1e6" />
        </>
    ),
    // Cascata: gota azul
    misty: (
        <>
            <path
                d="M20 3 C14 12 8 18 8 25 A12 12 0 0 0 32 25 C32 18 26 12 20 3 Z"
                fill="#4aa3ff"
                stroke="#173f78"
                strokeWidth="2"
            />
            <ellipse cx="15" cy="24" rx="2.6" ry="5" fill="#d8ecff" transform="rotate(20 15 24)" />
        </>
    ),
    // Trovão: estrela laranja de 8 pontas com o miolo amarelo
    ltsurge: (
        <>
            <polygon
                points={Array.from({ length: 16 }, (_, i) => {
                    const a = (Math.PI / 8) * i - Math.PI / 2;
                    const r = i % 2 ? 9.5 : 17;
                    return `${(20 + r * Math.cos(a)).toFixed(1)},${(20 + r * Math.sin(a)).toFixed(1)}`;
                }).join(' ')}
                fill="#f39c1f"
                stroke="#7e4304"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <circle cx="20" cy="20" r="6" fill="#ffe066" stroke="#7e4304" strokeWidth="1.5" />
        </>
    ),
    // Arco-Íris: flor de 6 pétalas coloridas
    erika: (
        <>
            {['#f05454', '#f39c1f', '#ffd23f', '#49c06a', '#4a8dff', '#a45cff'].map((c, i) => (
                <ellipse
                    key={c}
                    cx="20"
                    cy="10.5"
                    rx="5.5"
                    ry="8.5"
                    fill={c}
                    stroke="#2a2140"
                    strokeWidth="1.5"
                    transform={`rotate(${i * 60} 20 20)`}
                />
            ))}
            <circle cx="20" cy="20" r="5" fill="#fff6d6" stroke="#2a2140" strokeWidth="1.5" />
        </>
    ),
    // Alma: coração rosa
    koga: (
        <>
            <path
                d="M20 35 C8 26 3 19 3 13 A8 8 0 0 1 20 9 A8 8 0 0 1 37 13 C37 19 32 26 20 35 Z"
                fill="#ff6fa8"
                stroke="#7d1846"
                strokeWidth="2"
            />
            <ellipse cx="12" cy="14" rx="3" ry="2" fill="#ffd1e4" transform="rotate(-30 12 14)" />
        </>
    ),
    // Pântano: anéis dourados
    sabrina: (
        <>
            <circle cx="20" cy="20" r="16" fill="#f2c230" stroke="#6b4d07" strokeWidth="2" />
            <circle cx="20" cy="20" r="10.5" fill="#b8860b" />
            <circle cx="20" cy="20" r="6" fill="#ffe680" stroke="#6b4d07" strokeWidth="1.5" />
        </>
    ),
    // Vulcão: chama vermelha com o miolo amarelo
    blaine: (
        <>
            <path
                d="M20 3 C25 11 32 15 32 24 A12 12 0 0 1 8 24 C8 18 12 14 14 9 C15 14 17 16 19 17 C21 12 19 8 20 3 Z"
                fill="#ff5a2a"
                stroke="#6e1504"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path d="M20 18 C23 22 26 24 26 28 A6 6 0 0 1 14 28 C14 25 17 22 20 18 Z" fill="#ffd23f" />
        </>
    ),
    // Terra: folha verde
    giovanni: (
        <>
            <path d="M20 3 C31 10 35 21 20 37 C5 21 9 10 20 3 Z" fill="#49c06a" stroke="#154d24" strokeWidth="2" />
            <path
                d="M20 8 V32 M20 17 L14 13 M20 23 L26 18 M20 28 L15 25"
                stroke="#154d24"
                strokeWidth="1.6"
                fill="none"
            />
        </>
    ),
};

/** Uma insígnia (apagada quando ainda não saiu). */
export function KantoBadge({
    leader,
    earned,
    className = '',
}: {
    leader: TrainerId;
    earned: boolean;
    className?: string;
}) {
    return (
        <svg className={`kb-badge${earned ? '' : ' off'} ${className}`} viewBox="0 0 40 40" aria-hidden>
            {ART[leader]}
        </svg>
    );
}

/** Estojo das 8 insígnias com a contagem ("5 de 8"). `earned` = líderes já vencidos (ids de treinador). */
export function BadgeCase({ earned }: { earned: readonly string[] }) {
    const { t, d } = useT();
    const n = KANTO_BADGES.filter((id) => earned.includes(id)).length;
    return (
        <section className="panel kb-case">
            <h2>
                {t('profile.badges.title')}{' '}
                <span className="kb-count">{t('profile.badges.count', { n, total: KANTO_BADGES.length })}</span>
            </h2>
            <ul className="kb-grid">
                {KANTO_BADGES.map((id) => {
                    const got = earned.includes(id);
                    const name = d.profile.badges.names[id];
                    const city = missionById(id)?.vars?.city ?? '';
                    return (
                        <li
                            key={id}
                            className={`kb-slot${got ? ' got' : ''}`}
                            title={name}
                            aria-label={t(got ? 'profile.badges.ariaGot' : 'profile.badges.ariaMissing', {
                                name,
                                city,
                            })}
                        >
                            <span className="kb-socket">
                                <KantoBadge leader={id} earned={got} />
                            </span>
                            <small>{d.profile.badges.short[id]}</small>
                        </li>
                    );
                })}
            </ul>
            {n < KANTO_BADGES.length && <small className="muted kb-help">{t('profile.badges.help')}</small>}
        </section>
    );
}
