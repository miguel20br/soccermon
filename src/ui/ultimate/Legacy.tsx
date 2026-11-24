import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { type Lang, t as tr, tn as trn } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { UtSeasonRecord } from '../../store/ultimate/ultimate';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import './legacy.css';

/** "1 partida · 2 vitórias · marco 3": cada número com o plural dele. */
export const legacyStats = (r: { played: number; wins: number; marks: number }, lang: Lang) =>
    tr(
        'ultimate.legacy.stats',
        {
            p: trn('common.count.matches', r.played, {}, lang),
            w: trn('common.count.wins', r.wins, {}, lang),
            m: r.marks,
        },
        lang,
    );

/** A melhor Lenda entre as temporadas (a de maior nota; empate, a mais recente). */
export function bestLegend(seasons: UtSeasonRecord[]): PokemonInstance | null {
    let best: PokemonInstance | null = null;
    let top = -1;
    for (const r of seasons) {
        if (!r.legend) continue;
        const ovr = viewInstance(r.legend).overall;
        if (ovr >= top) [best, top] = [r.legend, ovr];
    }
    return best;
}

/**
 * O que ficou das temporadas do Time Ultimate (Perfil): medalha, título de campeão, a Lenda (a carta que mais jogou,
 * só enfeite) e os enfeites dos eventos. Sem legado, não aparece.
 */
export function UltimateLegacy() {
    const { t, d, lang } = useT();
    const legacy = useGame((s) => s.ultimate.legacy);
    if (!legacy.seasons.length && !legacy.ornaments.length) return null;
    const best = bestLegend(legacy.seasons);
    const total = legacy.seasons.reduce((a, r) => ({ played: a.played + r.played, wins: a.wins + r.wins }), {
        played: 0,
        wins: 0,
    });
    return (
        <section className="panel ut-legacy bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="medal" />
                {t('ultimate.legacy.title')}
            </h2>
            {best && (
                <div className="ut-legacy-best">
                    <FutCard inst={best} ribbon={t('ultimate.legacy.best')} />
                    <small className="muted">
                        {t('ultimate.legacy.total', {
                            p: trn('common.count.matches', total.played, {}, lang),
                            w: trn('common.count.wins', total.wins, {}, lang),
                        })}
                    </small>
                </div>
            )}
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
                        <small className="muted">{legacyStats(r, lang)}</small>
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
