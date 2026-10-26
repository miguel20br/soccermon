import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { clubName, cupStageName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { isPerfectCup, type RunState, useGame } from '../../store/game-store';
import { cupLength } from '../../store/long-cup';
import { useCountUp } from '../ambientes/TopBar';
import { trainerLabel } from '../profile/club';
import { aggregate, avg } from '../stats/CupStats';
import { CupAwards, CupFinal, CupGoals, CupXI, FormSpark, TitleRecords, useRarity } from './ChampionExtras';
import { CupGains } from './CupGains';
import { FutCard } from './FutCard';
import { HallParade } from './HallParade';
import { HudIcon } from './MatchHud';
import { cardSprite } from './PokeCard';
import { Confetti } from './ResultHero';
import { Trophy } from './Trophy';

/** Número do resumo da copa: contornado, contando do 0 (com "reduzir movimento", já parado). */
function TotalNum({ n, run, suffix }: { n: number; run: boolean; suffix?: string }) {
    return (
        <b className="cb-num">
            {useCountUp(n, run)}
            {suffix && <small>{suffix}</small>}
        </b>
    );
}

/**
 * Tela do título: a taça, o caminho até ela (as 4 partidas, com placar, rival e craque) e o elenco campeão
 * inteiro com as cartas e as estatísticas de cada um na copa. Tocar na carta abre tudo sobre o Pokémon.
 */
export function ChampionView({ run, actions }: { run: RunState; actions: ReactNode }) {
    const { t, tn } = useT();
    const rarity = useRarity();
    const hallEntry = useGame((s) => s.hall.find((h) => h.id === run.seed));
    const profile = useGame((s) => s.profile);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const markParaded = useGame((s) => s.markParaded);
    const stats = new Map(aggregate(run.results).map((a) => [a.uid, a]));
    const slots = formationOf(run.formation).slots;
    // partidas jogadas antes da 0.7 não guardaram estatísticas
    const oldSave = run.results.some((r) => !r.stats);
    const squad = [...run.lineup, ...run.bench]
        .map((uid) => run.picks.find((p) => p.uid === uid))
        .filter((p): p is NonNullable<typeof p> => !!p);
    const gf = run.results.reduce((s, r) => s + r.score[0], 0);
    const ga = run.results.reduce((s, r) => s + r.score[1], 0);
    const withStats = run.results.filter((r) => r.stats);
    const poss = withStats.length
        ? Math.round((withStats.reduce((s, r) => s + (r.stats?.possession[0] ?? 0), 0) / withStats.length) * 100)
        : null;
    const players = [...stats.values()];
    const topScorer = players.length ? players.reduce((a, b) => (b.goals > a.goals ? b : a)) : null;
    const star = players
        .filter((a) => a.games >= 2)
        .reduce<(typeof players)[number] | null>((best, a) => (!best || avg(a) > avg(best) ? a : best), null);
    const parading = !!(hallEntry && run.champ && !run.champ.paraded);
    // os números contam depois do desfile; um toque em qualquer lugar completa
    const [skip, setSkip] = useState(false);
    useEffect(() => {
        if (parading) return;
        const done = () => setSkip(true);
        window.addEventListener('pointerdown', done, { once: true });
        return () => window.removeEventListener('pointerdown', done);
    }, [parading]);
    const count = !parading && !skip;

    return (
        <>
            {hallEntry && parading && (
                <HallParade entry={hallEntry} trainer={trainerLabel(profile, googleName)} onDone={markParaded} />
            )}
            <section className="panel rh rh-champ champ" aria-label={t('result.champ.aria')}>
                <Confetti count={70} />
                <div className="champ-trophy">
                    <Trophy size={150} rota={run.mode === 'longa'} />
                </div>
                <h1 className="rh-title champ-title" aria-label={t('result.champ.titleAria')}>
                    {[...t('result.champ.title')].map((ch, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: letras do título
                        <span key={i} style={{ '--i': i } as CSSProperties}>
                            {ch}
                        </span>
                    ))}
                </h1>
                <div className="champ-sub">{rich(t('result.champ.sub'), { team: <b>{run.teamName}</b> })}</div>
                {isPerfectCup(run) && (
                    <div className="perfect-badge k-ribbon">
                        <HudIcon kind="max" />
                        {t('result.champ.perfect')}
                        <HudIcon kind="max" />
                    </div>
                )}
                <TitleRecords run={run} rarity={rarity} />
                <CupGains run={run} />

                <div className="cup-totals champ-totals">
                    <div>
                        <TotalNum
                            n={run.results.filter((r) => r.won).length}
                            run={count}
                            suffix={`/${cupLength(run)}`}
                        />
                        <span>{t('result.champ.wins')}</span>
                    </div>
                    <div>
                        <TotalNum n={gf} run={count} />
                        <span>{t('result.champ.gf')}</span>
                    </div>
                    <div>
                        <TotalNum n={ga} run={count} />
                        <span>{t('result.champ.ga')}</span>
                    </div>
                    {poss !== null && (
                        <div>
                            <TotalNum n={poss} run={count} suffix="%" />
                            <span>{t('result.champ.poss')}</span>
                        </div>
                    )}
                    {topScorer && topScorer.goals > 0 && (
                        <div>
                            <TotalNum n={topScorer.goals} run={count} />
                            <span>
                                {t('result.champ.topScorer', {
                                    goals: tn('result.champ.goalWord', topScorer.goals),
                                    name: topScorer.name,
                                })}
                            </span>
                        </div>
                    )}
                    {star && (
                        <div>
                            <b className="cb-num">{avg(star).toFixed(1)}</b>
                            <span>{t('result.champ.star', { name: star.name })}</span>
                        </div>
                    )}
                </div>

                <h2 className="champ-h">{t('result.champ.path')}</h2>
                <ol className="champ-path">
                    {run.results.map((r) => {
                        const opp = run.opponents[r.stage];
                        const best = r.stats?.players.reduce((a, b) => (b.rating > a.rating ? b : a));
                        return (
                            <li key={r.stage} className="champ-step">
                                <span className="champ-stage">{cupStageName(run, r.stage)}</span>
                                <b className="champ-score">
                                    {r.score[0]} x {r.score[1]}
                                </b>
                                {r.shootout && (
                                    <small>{t('result.champ.pens', { score: r.shootout.join(' x ') })}</small>
                                )}
                                <span className="muted">{t('result.champ.vs', { team: clubName(r.opponent) })}</span>
                                {opp && (
                                    <div className="champ-opp">
                                        {opp.lineup.map((p) => (
                                            <img
                                                key={p.uid}
                                                className="pixel"
                                                src={cardSprite(p)}
                                                alt={viewInstance(p).displayName}
                                            />
                                        ))}
                                    </div>
                                )}
                                {best && (
                                    <span className="champ-best">
                                        <HudIcon kind="max" /> {best.name} ({best.rating.toFixed(1)})
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>

                <CupAwards run={run} />
                <CupXI run={run} />
                <CupGoals run={run} />
                <CupFinal run={run} />

                <h2 className="champ-h">{t('result.champ.squad')}</h2>
                <div className="champ-squad">
                    {squad.map((p) => {
                        const a = stats.get(p.uid);
                        // titular aparece na posição em que jogou; banco, na de origem
                        const slot = run.lineup.indexOf(p.uid);
                        return (
                            <div key={p.uid} className="champ-player">
                                <FutCard
                                    inst={p}
                                    size="sm"
                                    captain={p.uid === run.captainUid}
                                    position={slot >= 0 ? slots[slot] : undefined}
                                />
                                {a ? (
                                    <dl className="champ-stats">
                                        <dt>{t('result.champ.stats.games')}</dt>
                                        <dd>{a.games}</dd>
                                        <dt>{t('result.champ.stats.rating')}</dt>
                                        <dd>{avg(a).toFixed(1)}</dd>
                                        <dt>{t('result.champ.stats.goals')}</dt>
                                        <dd>{a.goals}</dd>
                                        <dt>{t('result.champ.stats.assists')}</dt>
                                        <dd>{a.assists}</dd>
                                        <dt>{t('result.champ.stats.shots')}</dt>
                                        <dd>{a.shots}</dd>
                                        <dt>{t('result.champ.stats.passes')}</dt>
                                        <dd>
                                            {a.passesCompleted}/{a.passes}
                                        </dd>
                                        <dt>{t('result.champ.stats.steals')}</dt>
                                        <dd>{a.tacklesWon + a.interceptions}</dd>
                                        <dt>{t('result.champ.stats.saves')}</dt>
                                        <dd>{a.saves}</dd>
                                        <dt>{t('result.champ.stats.moves')}</dt>
                                        <dd>{a.movesUsed}</dd>
                                        <dt>{t('result.champ.stats.ran')}</dt>
                                        <dd>{(a.distance / 1000).toFixed(1)} km</dd>
                                    </dl>
                                ) : (
                                    <span className="muted champ-nostats">
                                        {oldSave ? t('result.champ.noStats') : t('result.champ.bench')}
                                    </span>
                                )}
                                <FormSpark run={run} uid={p.uid} />
                            </div>
                        );
                    })}
                </div>

                <div className="rh-actions">{actions}</div>
            </section>
        </>
    );
}
