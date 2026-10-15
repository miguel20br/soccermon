import { species } from '../../engine/data';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { Dex, DexEntry } from '../../store/profile';
import { speciesGif } from './club';

/** Top 5 da Dex por um número (só quem jogou e tem esse número > 0). */
function top(dex: Dex, key: keyof DexEntry, tie: keyof DexEntry) {
    return Object.entries(dex)
        .map(([id, e]) => ({ id: Number(id), e }))
        .filter(({ e }) => e.matches > 0 && e[key] > 0)
        .sort((a, b) => b.e[key] - a.e[key] || b.e[tie] - a.e[tie] || a.id - b.id)
        .slice(0, 5);
}

/** Números: a carreira do treinador, os recordes e os Pokémon que mais marcaram e mais jogaram. */
export function NumbersTab({ onOpenDex }: { onOpenDex: () => void }) {
    const career = useGame((s) => s.career);
    const records = useGame((s) => s.records);
    const dex = useGame((s) => s.dex);
    const go = useGame((s) => s.go);
    const { t, tn } = useT();
    const unit = (key: 'profile.numbers.goalUnit' | 'profile.numbers.gameUnit', n: number) => {
        const [one, many = one] = t(key).split('|');
        return n === 1 ? one : many;
    };

    if (career.matches === 0 && records.cups === 0) {
        return (
            <div className="pf-empty-state panel">
                <img className="pixel" src={speciesGif(25)} alt="" />
                <b>{t('profile.numbers.emptyTitle')}</b>
                <p>{t('profile.numbers.emptyText')}</p>
                <button type="button" className="btn primary" onClick={() => go('home')}>
                    {t('profile.numbers.emptyCta')}
                </button>
            </div>
        );
    }

    const pct = career.matches ? Math.round((career.wins / career.matches) * 100) : 0;
    const diff = career.goalsFor - career.goalsAgainst;
    const scorers = top(dex, 'goals', 'assists');
    const regulars = top(dex, 'matches', 'minutes');

    return (
        <div className="pf-numbers">
            <section className="panel pf-card">
                <h2>{t('profile.numbers.career')}</h2>
                <div className="pf-career wide">
                    <Num label={t('profile.numbers.matches')} v={career.matches} />
                    <Num label={t('profile.numbers.wins')} v={career.wins} />
                    <Num label={t('profile.numbers.losses')} v={career.losses} />
                    <Num label={t('profile.numbers.winRate')} v={`${pct}%`} />
                    <Num label={t('profile.numbers.goalsFor')} v={career.goalsFor} />
                    <Num label={t('profile.numbers.goalsAgainst')} v={career.goalsAgainst} />
                    <Num label={t('profile.numbers.goalDiff')} v={diff > 0 ? `+${diff}` : diff} />
                    <Num label={t('profile.numbers.shootoutWins')} v={career.shootoutWins} />
                </div>
                {career.matches > 0 && (
                    <div className="pf-winbar" role="img" aria-label={t('profile.numbers.winBarAria', { pct })}>
                        <i style={{ width: `${pct}%` }} />
                    </div>
                )}
            </section>

            <section className="panel pf-card">
                <h2>{t('profile.numbers.records')}</h2>
                <div className="pf-career wide three">
                    <Num label={t('profile.numbers.cups')} v={records.cups} />
                    <Num label={t('profile.numbers.titles')} v={records.titles} />
                    <Num label={t('profile.numbers.perfect')} v={records.perfect} />
                    <Num label={t('profile.numbers.destaques')} v={records.destaques ?? 0} />
                    <Num label={t('profile.numbers.evolutions')} v={records.evolucoes ?? 0} />
                    <Num label={t('profile.numbers.icons')} v={records.icones ?? 0} />
                </div>
            </section>

            <div className="pf-tops">
                <section className="panel pf-card">
                    <h2>{t('profile.numbers.scorers')}</h2>
                    {scorers.length ? (
                        <ol className="pf-rank">
                            {scorers.map(({ id, e }, i) => (
                                <li key={id}>
                                    <span className="pf-rank-pos">{i + 1}</span>
                                    <img className="pixel" src={speciesGif(id)} alt="" loading="lazy" />
                                    <span className="pf-rank-name">
                                        <b>{species(id).name}</b>
                                        <small>
                                            {tn('profile.numbers.matchesN', e.matches)} ·{' '}
                                            {tn('profile.numbers.assistsN', e.assists)}
                                        </small>
                                    </span>
                                    <b className="pf-rank-v">
                                        {e.goals}
                                        <small>{unit('profile.numbers.goalUnit', e.goals)}</small>
                                    </b>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="pf-note">{t('profile.numbers.noScorers')}</p>
                    )}
                </section>
                <section className="panel pf-card">
                    <h2>{t('profile.numbers.regulars')}</h2>
                    {regulars.length ? (
                        <ol className="pf-rank">
                            {regulars.map(({ id, e }, i) => (
                                <li key={id}>
                                    <span className="pf-rank-pos">{i + 1}</span>
                                    <img className="pixel" src={speciesGif(id)} alt="" loading="lazy" />
                                    <span className="pf-rank-name">
                                        <b>{species(id).name}</b>
                                        <small>
                                            {tn('profile.numbers.minutesN', e.minutes)} ·{' '}
                                            {tn('profile.numbers.winsN', e.wins)}
                                        </small>
                                    </span>
                                    <b className="pf-rank-v">
                                        {e.matches}
                                        <small>{unit('profile.numbers.gameUnit', e.matches)}</small>
                                    </b>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="pf-note">{t('profile.numbers.noRegulars')}</p>
                    )}
                </section>
            </div>
            <button type="button" className="btn ghost pf-to-dex" onClick={onOpenDex}>
                {t('profile.numbers.toDex')}
            </button>
        </div>
    );
}

function Num({ label, v }: { label: string; v: number | string }) {
    return (
        <div className="pf-num">
            <b>{v}</b>
            <span>{label}</span>
        </div>
    );
}
