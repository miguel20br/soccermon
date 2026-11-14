import { type CSSProperties, useMemo } from 'react';
import { species } from '../../engine/data';
import { useT } from '../../i18n/react';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { clubColorHex, favoriteSpecies, playedCount } from '../../store/profile';
import { BELT_STEPS, bestTitle, cupMetal, TITLE_STEPS, tierMetal, titlesByMode } from '../../store/trophies';
import { speciesCard } from '../components/EvoChain';
import { FutCard } from '../components/FutCard';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import { hexCss, speciesGif } from './club';

/** Um número grande (Galmuri) com o rótulo embaixo e, se vier, a linha miúda (por jogo). */
function Big({ v, label, sub }: { v: number | string; label: string; sub?: string }) {
    return (
        <div className="pf-num">
            <b>{v}</b>
            <span>{label}</span>
            {sub && <small className="pf-num-sub">{sub}</small>}
        </div>
    );
}

/** Partidas, vitórias, aproveitamento e títulos: a faixa do Perfil (o mesmo que o amigo vê) e o topo da folha. */
export function useMyNumbers() {
    const career = useGame((s) => s.career);
    const records = useGame((s) => s.records);
    const hall = useGame((s) => s.hall);
    const titles = Math.max(records.titles, hall.length);
    const pct = career.matches ? Math.round((career.wins / career.matches) * 100) : 0;
    return { career, records, titles, pct };
}

/** A faixa de números grandes no Perfil: tocar abre "Seus números". */
export function StatsStrip({ onOpen }: { onOpen: () => void }) {
    const { t } = useT();
    const { career, titles, pct } = useMyNumbers();
    return (
        <button
            type="button"
            className="pf-stats-open bc-tile"
            onClick={onOpen}
            aria-label={`${t('profile.stats.open')}: ${t('profile.stats.record', { w: career.wins, l: career.losses, n: career.matches })}`}
        >
            <Big v={career.matches} label={t('profile.numbers.matches')} />
            <Big v={career.wins} label={t('profile.numbers.wins')} />
            <Big v={`${pct}%`} label={t('profile.stats.pctShort')} />
            <Big v={titles} label={t('profile.numbers.titles')} />
        </button>
    );
}

/**
 * Seus números (o Perfil, 11/11): tudo o que o amigo vê no seu cartão e mais o aproveitamento, gols por jogo, a carta
 * favorita, a melhor campanha e os títulos de cada modo. Só o que o save guarda (`dailyTitlesOf`: o Dia tem contador
 * desde a 0.9.50).
 */
export function MyStats() {
    const { t, tn, d, lang } = useT();
    const { career, records, titles, pct } = useMyNumbers();
    const hall = useGame((s) => s.hall);
    const daily = useGame((s) => s.daily);
    const duels = useGame((s) => s.duels);
    const dex = useGame((s) => s.dex);
    const fav = useMemo(() => favoriteSpecies(dex), [dex]);
    const favCard = useMemo(() => (fav ? speciesCard(fav) : null), [fav]);
    const best = useMemo(() => bestTitle(hall), [hall]);
    const bestDiff = best?.scores.reduce((x, [a, b]) => x + a - b, 0) ?? 0;
    const modes = titlesByMode({ ...records, titles }, daily);
    const duel = duelWinsOf(records, duels);
    const loc = lang === 'pt' ? 'pt-BR' : 'en-US';
    const per = (n: number) =>
        t('profile.stats.perGame', {
            n: (n / Math.max(1, career.matches)).toLocaleString(loc, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }),
        });
    const diff = career.goalsFor - career.goalsAgainst;

    if (!career.matches && !records.cups)
        return (
            <div className="pf-empty-state">
                <img className="pixel" src={speciesGif(25)} alt="" />
                <b>{t('profile.numbers.emptyTitle')}</b>
                <p>{t('profile.numbers.emptyText')}</p>
            </div>
        );

    const MODES: { k: keyof typeof modes | 'duelo'; art: ArtKind; n: number; steps: readonly number[] }[] = [
        { k: 'relampago', art: 'taca', n: modes.relampago, steps: TITLE_STEPS },
        { k: 'dia', art: 'medalhao', n: modes.dia, steps: TITLE_STEPS },
        { k: 'rota', art: 'taca', n: modes.rota, steps: TITLE_STEPS },
        { k: 'duelo', art: 'cinturao', n: duel, steps: BELT_STEPS },
    ];

    return (
        <div className="pf-mine">
            <section className="pf-mine-hero">
                <b className="pf-mine-pct">{pct}%</b>
                <span className="pf-mine-pct-lbl">{t('profile.numbers.winRate')}</span>
                <div className="pf-winbar" role="img" aria-label={t('profile.numbers.winBarAria', { pct })}>
                    <i style={{ width: `${pct}%` }} />
                </div>
                <small>{t('profile.stats.record', { w: career.wins, l: career.losses, n: career.matches })}</small>
            </section>

            <div className="pf-career wide three">
                <Big v={career.goalsFor} label={t('profile.numbers.goalsFor')} sub={per(career.goalsFor)} />
                <Big v={career.goalsAgainst} label={t('profile.numbers.goalsAgainst')} sub={per(career.goalsAgainst)} />
                <Big v={diff > 0 ? `+${diff}` : diff} label={t('profile.numbers.goalDiff')} />
            </div>

            <h3 className="bc-lbl">{t('profile.stats.byMode')}</h3>
            <ul className="pf-modes">
                {MODES.map(({ k, art, n, steps }) => {
                    const metal = tierMetal(n, steps);
                    return (
                        <li key={k} className={n ? '' : 'off'}>
                            <PixelTrophy kind={art} metal={metal ?? 'bronze'} ghost={!metal} />
                            <b>{n}</b>
                            <span>
                                {d.profile.stats[k]}
                                {k === 'duelo' && <small> · {t('profile.stats.duelWins')}</small>}
                            </span>
                        </li>
                    );
                })}
            </ul>

            <div className="pf-mine-duo">
                {fav && favCard && (
                    <section className="pf-mine-box">
                        <h3 className="bc-lbl">{t('profile.stats.favorite')}</h3>
                        <FutCard inst={favCard} size="sm" />
                        <b>{species(fav).name}</b>
                        <small>
                            {tn('profile.numbers.matchesN', dex[fav].matches)} ·{' '}
                            {tn('profile.stats.goalsN', dex[fav].goals)}
                        </small>
                    </section>
                )}
                {best && (
                    <section
                        className="pf-mine-box"
                        style={{ '--tc': hexCss(clubColorHex(best.clubColor)) } as CSSProperties}
                    >
                        <h3 className="bc-lbl">{t('profile.stats.best')}</h3>
                        <PixelTrophy kind="taca" metal={cupMetal(best)} className="pf-mine-cup" />
                        <b>{best.club}</b>
                        <ol className="pf-mine-scores">
                            {best.scores.map(([a, b], i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: a ordem das partidas é a chave
                                <li key={i} className={a > b ? 'won' : ''}>
                                    {t('profile.stats.score', { a, b })}
                                </li>
                            ))}
                        </ol>
                        <small>
                            {t('profile.stats.bestLine', {
                                s: bestDiff > 0 ? `+${bestDiff}` : bestDiff,
                                n: best.scores.length,
                            })}
                            {best.perfect ? ` · ${t('profile.card.perfect')}` : ''}
                        </small>
                    </section>
                )}
            </div>

            <h3 className="bc-lbl">{t('profile.stats.more')}</h3>
            <div className="pf-career wide">
                <Big v={records.bestStreak ?? 0} label={t('profile.stats.bestStreak')} />
                <Big v={records.perfect} label={t('profile.numbers.perfect')} />
                <Big v={career.shootoutWins} label={t('profile.numbers.shootoutWins')} />
                <Big v={playedCount(dex)} label={t('profile.card.played')} />
            </div>

            {hall.length > 0 && (
                <>
                    <h3 className="bc-lbl">{t('profile.card.lastTitles')}</h3>
                    <ul className="pcard-titles">
                        {hall.slice(0, 3).map((h) => {
                            const cap = h.squad.find((p) => p.captain) ?? h.squad[0];
                            const fin = h.scores.at(-1) ?? [0, 0];
                            return (
                                <li key={h.id} style={{ '--tc': hexCss(clubColorHex(h.clubColor)) } as CSSProperties}>
                                    <img className="pixel" src={speciesGif(cap?.speciesId ?? 25, cap?.shiny)} alt="" />
                                    <span>
                                        <b>{h.club}</b>
                                        <small>
                                            {new Date(h.date).toLocaleDateString(loc)} ·{' '}
                                            {t('profile.card.final', { a: fin[0], b: fin[1] })}
                                            {h.perfect ? ` · ${t('profile.card.perfect')}` : ''}
                                        </small>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
            <p className="pf-note">{t('profile.stats.note')}</p>
        </div>
    );
}
