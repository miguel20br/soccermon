import { viewInstance } from '../../engine/instance';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import './legacy.css';

/**
 * O que ficou das temporadas do Time Ultimate (Perfil): medalha, título de campeão, a Lenda (a carta que mais jogou,
 * só enfeite) e os enfeites dos eventos. Sem legado, não aparece.
 */
export function UltimateLegacy() {
    const { t, d } = useT();
    const legacy = useGame((s) => s.ultimate.legacy);
    if (!legacy.seasons.length && !legacy.ornaments.length) return null;
    return (
        <section className="panel ut-legacy bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="medal" />
                {t('ultimate.legacy.title')}
            </h2>
            {[...legacy.seasons].reverse().map((r) => (
                <div key={r.season} className="ut-legacy-row">
                    {r.legend ? (
                        <FutCard inst={r.legend} size="sm" ribbon={t('ultimate.legacy.legend', { n: r.season })} />
                    ) : (
                        <small className="muted">{t('ultimate.legacy.noLegend')}</small>
                    )}
                    <span>
                        <b>
                            <HudIcon kind="medal" />
                            {t('ultimate.legacy.medal', { n: r.season })}
                        </b>
                        {r.champion && (
                            <b className="ut-legacy-title">
                                <HudIcon kind="crown" />
                                {t('ultimate.legacy.champion', { n: r.season })}
                            </b>
                        )}
                        <small className="muted">
                            {t('ultimate.legacy.stats', { p: r.played, w: r.wins, m: r.marks })}
                        </small>
                        {r.legend && <small className="muted">{viewInstance(r.legend).displayName}</small>}
                    </span>
                </div>
            ))}
            {!!legacy.ornaments.length && (
                <>
                    <span className="bc-lbl">{t('ultimate.legacy.ornaments')}</span>
                    <div className="row ut-ornaments">
                        {legacy.ornaments.map((id) => (
                            <span key={id} className="k-chip">
                                <HudIcon kind="sparkle" />
                                {d.ultimate.events[id] ?? id}
                            </span>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
