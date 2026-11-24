import { useT } from '../../i18n/react';
import type { UtLegacy } from '../../store/ultimate/ultimate';
import { HudIcon } from '../components/MatchHud';
import '../kit/topbar.css';
import './player-card.css';

/** A estrela do nível do treinador (a mesma da barra de cima), no canto do avatar do cartão. */
export function LevelStar({ level }: { level: number }) {
    const { t } = useT();
    return (
        <span className="res-lv pf-lv" role="img" aria-label={t('profile.card.level', { n: level })}>
            <b className="cb-num">{level}</b>
        </span>
    );
}

/**
 * Os enfeites do cartão como vão pela vitrine: id do evento do Time Ultimate (`natal-2026`) e `champ:N` pra cada
 * temporada em que foi campeão. Só texto curto, então o amigo não precisa de migração.
 */
export const ornamentIds = (legacy: UtLegacy): string[] => [
    ...legacy.seasons.filter((s) => s.champion).map((s) => `champ:${s.season}`),
    ...legacy.ornaments,
];

/** Dado de fora (vitrine do amigo, sala do Duelo): até 6 ids curtos e sem coisa estranha. */
export const parseOrnaments = (v: unknown): string[] =>
    Array.isArray(v)
        ? v.filter((x): x is string => typeof x === 'string' && /^[a-z0-9:_-]{1,24}$/i.test(x)).slice(0, 6)
        : [];

/** A fileira de enfeites do cartão (some sem enfeite). */
export function OrnamentRow({ ids, className }: { ids: string[]; className?: string }) {
    const { t, d } = useT();
    if (!ids.length) return null;
    return (
        <ul className={`pf-orn${className ? ` ${className}` : ''}`} aria-label={t('ultimate.legacy.ornaments')}>
            {ids.map((id) => {
                const champ = /^champ:(\d{1,3})$/.exec(id);
                return (
                    <li key={id} className="pf-orn-chip">
                        <HudIcon kind={champ ? 'crown' : 'sparkle'} />
                        {champ ? t('ultimate.legacy.championShort', { n: champ[1] }) : (d.ultimate.events[id] ?? id)}
                    </li>
                );
            })}
        </ul>
    );
}
