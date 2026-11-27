import { useT } from '../../i18n/react';

/** Selo "NOVO": a espécie ainda não estava na Pokédex quando a carta apareceu. */
export function NovoSeal() {
    const { t } = useT();
    return (
        <span className="novo-seal" title={t('team.novoTitle')}>
            {t('team.novo')}
        </span>
    );
}

/** A bola vazia, tracejada: a espécie já foi vista, mas nunca jogou pelo seu time (o contrário da BallMark da Pokédex). */
export function NeverPlayedMark({ className = 'pf-ball' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2" />
            <circle cx="8" cy="8" r="1.6" fill="currentColor" />
        </svg>
    );
}

/** Selo discreto "nunca jogou por você" (ideia de playtester, 07/12/2026): na escolha do draft e na recompensa. */
export function NeverPlayedSeal() {
    const { t } = useT();
    return (
        <span className="never-seal" role="img" aria-label={t('team.neverPlayed')} title={t('team.neverPlayed')}>
            <NeverPlayedMark className="never-mark" />
        </span>
    );
}
