import { useEffect, useState } from 'react';
import { track } from '../../analytics/track';
import { species } from '../../engine/data';
import {
    dangerByPeriod,
    leaders,
    playerLines,
    possessionByPeriod,
    shotMap,
    teamTotals,
} from '../../engine/match-stats';
import { matchMvp } from '../../engine/mvp';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { ChampionView } from '../components/ChampionView';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { ResultHero } from '../components/ResultHero';
import { FEEDBACK_URL } from '../links';
import { useClubColor } from '../profile/club';
import { shareRun } from '../share';
import { type CardFormat, downloadBlob, shareCardBlob } from '../share-card';
import { CupStats } from '../stats/CupStats';
import { PlayerTable } from '../stats/PlayerTable';
import {
    awayC,
    CompareRows,
    DangerChart,
    homeC,
    leaderTitle,
    leaderValue,
    PossessionChart,
    ShotMapChart,
    TeamLegend,
} from '../stats/StatsCharts';

type Tab = 'times' | 'jogadores' | 'graficos' | 'copa';
/** Abas (o rótulo vem do dicionário: result.tabs). */
const TABS: Tab[] = ['times', 'jogadores', 'graficos', 'copa'];
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function Result() {
    const { run, match, advance, newRun } = useGame();
    const { t, tn, d } = useT();
    const [shared, setShared] = useState<string | null>(null);
    const clubColor = useClubColor();
    // card do título pronto antes do toque: o menu de compartilhar exige o gesto recente do jogador
    const [card, setCard] = useState<Blob | null>(null);
    useEffect(() => {
        setCard(null);
        if (run?.status !== 'champion') return;
        let live = true;
        shareCardBlob(run, 'story', clubColor).then(
            (b) => live && setCard(b),
            () => {}, // sem imagem, o Compartilhar segue só com o texto
        );
        return () => {
            live = false;
        };
    }, [run, clubColor]);
    // fim da copa: abre direto no resumo da copa
    const [tab, setTab] = useState<Tab>(() =>
        run && ['eliminated', 'champion'].includes(run.status) ? 'copa' : 'times',
    );
    if (!run || !match) return null;
    const opponent = run.opponents[run.stage];
    const names: [string, string] = [run.teamName, clubName(opponent.name)];

    const mvp = matchMvp(match);
    const stageResult = run.results.find((r) => r.stage === run.stage);
    const destaque = stageResult?.destaqueUid ? run.picks.find((p) => p.uid === stageResult.destaqueUid) : null;
    // quem evoluiu no meio da partida (o run já guarda a forma nova)
    const evolutions = match.events.flatMap((e) => {
        if (e.type !== 'evolve' || e.team !== 0) return [];
        const inst = run.picks.find((p) => p.uid === e.uid);
        return inst ? [{ inst, from: e.from }] : [];
    });

    const goals = match.events.filter((e) => e.type === 'goal');
    const nameAt = (idx: number, tick: number) => {
        // a vaga pode ter tido mais de uma troca: vale a última antes do lance
        const sub = match.events.filter((e) => e.type === 'sub' && e.outIdx === idx && e.tick <= tick).at(-1);
        return sub && sub.type === 'sub' ? sub.in : match.roster[idx].name;
    };

    // estatísticas detalhadas (src/ui/stats/match-stats.ts)
    const lines = playerLines(match);
    const totals = [teamTotals(lines, 0), teamTotals(lines, 1)] as const;
    const danger = dangerByPeriod(match);
    const leaderList = leaders(lines);
    // o craque do seu time é o mesmo critério da carta Destaque (matchMvp), não só a maior nota
    const ourStar = matchMvp(match, 0);

    const champion = run.status === 'champion';
    const eliminated = run.status === 'eliminated';
    const share = async () => {
        const res = await shareRun(run, card);
        track('share', { kind: card ? 'image' : 'text', result: res, champion });
        setShared(
            res === 'copied' ? t('result.copied') : res === 'shared' ? t('result.shared') : t('result.shareFailed'),
        );
    };
    const download = async (format: CardFormat) => {
        const blob = await shareCardBlob(run, format, clubColor);
        downloadBlob(blob, `soccermon-${format === 'story' ? '9x16' : '1x1'}.png`);
        track('share', { kind: `download-${format}`, result: 'shared', champion });
    };

    const actions = (
        <>
            <div className="row" style={{ justifyContent: 'center' }}>
                {eliminated || champion ? (
                    <>
                        <button type="button" className="btn yellow" onClick={share}>
                            {t('result.share')}
                        </button>
                        <button type="button" className="btn primary" onClick={() => newRun(run.teamName)}>
                            {t('result.newCup')}
                        </button>
                        <button type="button" className="btn ghost" onClick={advance}>
                            {t('result.menu')}
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn primary big" onClick={advance}>
                        {t('result.chooseReward')}
                    </button>
                )}
            </div>
            {shared && <div className="muted">{shared}</div>}
            {champion && (
                <div className="row" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <span className="muted">{t('result.card.download')}</span>
                    <button type="button" className="btn ghost small" onClick={() => download('story')}>
                        {t('result.card.story')}
                    </button>
                    <button type="button" className="btn ghost small" onClick={() => download('square')}>
                        {t('result.card.square')}
                    </button>
                </div>
            )}
            {(eliminated || champion) && (
                <div className="row" style={{ justifyContent: 'center' }}>
                    <a
                        className="btn ghost small"
                        href={FEEDBACK_URL}
                        target="_blank"
                        rel="noopener"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        {t('result.feedback')}
                    </a>
                </div>
            )}
        </>
    );

    return (
        <>
            {champion ? (
                <ChampionView run={run} actions={actions} />
            ) : (
                <ResultHero
                    run={run}
                    match={match}
                    opponent={opponent}
                    names={names}
                    mvpUid={ourStar?.uid ?? null}
                    actions={actions}
                />
            )}
            {champion && <h2 className="champ-h champ-final-h">{t('result.finalDetails')}</h2>}

            <div className="two-col">
                <div className="panel">
                    <h2>{t('result.highlights')}</h2>
                    <div className="st-leaders">
                        {leaderList.map((l) => (
                            <div key={l.id} className="st-leader">
                                <img
                                    className="pixel"
                                    src={cardSprite({ speciesId: l.line.speciesId, shiny: false })}
                                    alt=""
                                />
                                <div>
                                    <span className="muted">{leaderTitle(l)}</span>
                                    <b>{l.line.name}</b>
                                    <small>
                                        <i style={{ background: l.line.team === 0 ? homeC() : awayC() }} />
                                        {names[l.line.team]} · {leaderValue(l)}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="panel">
                    <h2>{t('result.goals')}</h2>
                    <div className="scorers">
                        {goals.length === 0 && <span className="muted">{t('result.noGoals')}</span>}
                        {goals.map(
                            (g) =>
                                g.type === 'goal' && (
                                    <div key={g.tick}>
                                        <span className="muted">{Math.floor(g.minute)}'</span> {nameAt(g.by, g.tick)}
                                        {g.ownGoal ? t('result.ownGoal') : ''} — {names[g.team]}
                                        {g.assist !== null && (
                                            <span className="muted">
                                                {t('result.assist', { name: nameAt(g.assist, g.tick) })}
                                            </span>
                                        )}
                                    </div>
                                ),
                        )}
                    </div>
                    {evolutions.length > 0 && (
                        <div className="destaque-box">
                            <h2>{evolutions.length > 1 ? t('result.evolvedMany') : t('result.evolvedOne')}</h2>
                            <p className="tactic-desc">{t('result.evolvedNote')}</p>
                            <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                                {evolutions.map(({ inst, from }) => (
                                    <div key={inst.uid} className="evolved-card">
                                        <span className="muted">
                                            {species(from).name} → {species(inst.speciesId).name}
                                        </span>
                                        <FutCard inst={inst} size="sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {destaque && (
                        <div className="destaque-box">
                            <h2>{t('result.destaqueTitle')}</h2>
                            <p className="tactic-desc">
                                {t('result.destaqueText', {
                                    name: destaque.nickname ?? species(destaque.speciesId).name,
                                })}
                            </p>
                            <FutCard inst={destaque} size="sm" />
                        </div>
                    )}
                    {mvp && (
                        <>
                            <h2 style={{ marginTop: 16 }}>{t('result.mvp')}</h2>
                            <div className="mini" style={{ display: 'inline-flex' }}>
                                <img className="pixel" src={cardSprite(mvp)} alt="" />
                                <div>
                                    <b>{mvp.name}</b> <span className="muted">({names[mvp.team]})</span>
                                    <div className="muted">
                                        {tn('common.count.goals', mvp.stats.goals)} ·{' '}
                                        {tn('common.count.assists', mvp.stats.assists)} ·{' '}
                                        {tn('common.count.saves', mvp.stats.saves)} ·{' '}
                                        {tn('common.count.tackles', mvp.stats.tacklesWon)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="panel st-panel">
                <div className="st-tabs" role="tablist">
                    {TABS.map((id) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={tab === id}
                            className={`btn small${tab === id ? ' active' : ''}`}
                            onClick={() => setTab(id)}
                        >
                            {d.result.tabs[id]}
                        </button>
                    ))}
                </div>
                {tab !== 'copa' && <TeamLegend names={names} />}
                {tab === 'copa' && <CupStats results={run.results} />}
                {tab === 'times' && (
                    <CompareRows
                        rows={[
                            {
                                label: t('result.rows.possession'),
                                home: Math.round(match.possession[0] * 100),
                                away: Math.round(match.possession[1] * 100),
                                fmt: (v) => `${v}%`,
                            },
                            { label: t('result.rows.shots'), home: totals[0].shots, away: totals[1].shots },
                            {
                                label: t('result.rows.onTarget'),
                                home: totals[0].shotsOnTarget,
                                away: totals[1].shotsOnTarget,
                            },
                            {
                                label: t('result.rows.danger'),
                                home: Math.round(danger.reduce((s, d) => s + d.home, 0) * 100) / 100,
                                away: Math.round(danger.reduce((s, d) => s + d.away, 0) * 100) / 100,
                                fmt: (v) => v.toFixed(2),
                            },
                            {
                                label: t('result.rows.passesCompleted'),
                                home: totals[0].passesCompleted,
                                away: totals[1].passesCompleted,
                            },
                            {
                                label: t('result.rows.passAccuracy'),
                                home: pctOf(totals[0].passesCompleted, totals[0].passes),
                                away: pctOf(totals[1].passesCompleted, totals[1].passes),
                                fmt: (v) => `${v}%`,
                            },
                            { label: t('result.rows.tackles'), home: totals[0].tacklesWon, away: totals[1].tacklesWon },
                            {
                                label: t('result.rows.interceptions'),
                                home: totals[0].interceptions,
                                away: totals[1].interceptions,
                            },
                            { label: t('result.rows.saves'), home: totals[0].saves, away: totals[1].saves },
                            { label: t('result.rows.moves'), home: totals[0].movesUsed, away: totals[1].movesUsed },
                            {
                                label: t('result.rows.distance'),
                                home: totals[0].distance,
                                away: totals[1].distance,
                                fmt: (v) => `${(v / 1000).toFixed(1)} km`,
                            },
                        ]}
                    />
                )}
                {tab === 'jogadores' && <PlayerTable lines={lines} names={names} />}
                {tab === 'graficos' && (
                    <div className="st-charts">
                        <div>
                            <h3>{t('result.dangerTitle')}</h3>
                            <p className="muted st-sub">{t('result.dangerSub', { home: names[0], away: names[1] })}</p>
                            <DangerChart data={danger} names={names} />
                        </div>
                        <div>
                            <h3>{t('result.possessionTitle')}</h3>
                            <PossessionChart data={possessionByPeriod(match)} names={names} />
                        </div>
                        <div>
                            <h3>{t('result.shotMapTitle')}</h3>
                            <p className="muted st-sub">{t('result.shotMapSub', { home: names[0], away: names[1] })}</p>
                            <ShotMapChart shots={shotMap(match, nameAt)} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
