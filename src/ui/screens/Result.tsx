import { type ReactNode, useEffect, useState } from 'react';
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
import type { MatchResult } from '../../engine/runners/batch-runner';
import { specialBonus } from '../../engine/specials';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { lineupPosition, useGame } from '../../store/game-store';
import { cupLength, isFinalStage, isLong } from '../../store/long-cup';
import { rivalColor } from '../../store/profile';
import { ChampionView } from '../components/ChampionView';
import { CupGains } from '../components/CupGains';
import { FoulCard } from '../components/FoulCard';
import { FutCard } from '../components/FutCard';
import { LeaderQuote } from '../components/LeaderQuote';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { CupGoalCard, MomentsButton } from '../components/Moments';
import { cardSprite } from '../components/PokeCard';
import { type HeroStat, ResultHero } from '../components/ResultHero';
import { UnlockStrip } from '../components/UnlockNotice';
import { Tip } from '../help/Tip';
import { FEEDBACK_URL } from '../links';
import { useClubColor } from '../profile/club';
import { editionLabel } from '../rarity';
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
import { useHeld } from '../use-held';

type Tab = 'times' | 'jogadores' | 'graficos' | 'copa';
/** Abas (o rótulo vem do dicionário: result.tabs). */
const TABS: Tab[] = ['times', 'jogadores', 'graficos', 'copa'];
const TAB_ICON: Record<Tab, HudIconKind> = { times: 'team', jogadores: 'players', graficos: 'chart', copa: 'cup' };
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function Result() {
    const { run: liveRun, match: liveMatch, advance, newRun, go } = useGame();
    const run = useHeld(liveRun);
    const match = useHeld(liveMatch);
    const { t } = useT();
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
    if (!run || !match) return null;
    // fim da copa: abre direto no resumo da copa
    const tab: Tab = ['eliminated', 'champion'].includes(run.status) ? 'copa' : 'times';
    const opponent = run.opponents[run.stage];
    const names: [string, string] = [run.teamName, clubName(opponent.name)];

    // o craque do seu time é o mesmo critério da carta Destaque (matchMvp), não só a maior nota
    const ourStar = matchMvp(match, 0);
    const stageResult = run.results.find((r) => r.stage === run.stage);
    const destaque = stageResult?.destaqueUid ? run.picks.find((p) => p.uid === stageResult.destaqueUid) : null;
    // quem evoluiu no meio da partida (o run já guarda a forma nova)
    const evolutions = match.events.flatMap((e) => {
        if (e.type !== 'evolve' || e.team !== 0) return [];
        const inst = run.picks.find((p) => p.uid === e.uid);
        return inst ? [{ inst, from: e.from }] : [];
    });

    const champion = run.status === 'champion';
    const eliminated = run.status === 'eliminated';
    const share = async () => {
        const res = await shareRun(run, card);
        track('share', { kind: card ? 'image' : 'text', result: res, champion });
        setShared(
            res === 'copied' ? t('result.copied') : res === 'shared' ? t('result.shared') : t('result.shareFailed'),
        );
        // aviso em pílula que some sozinho (antes ficava como texto cinza para sempre)
        window.setTimeout(() => setShared(null), 2200);
    };
    const download = async (format: CardFormat) => {
        const blob = await shareCardBlob(run, format, clubColor);
        downloadBlob(blob, `soccermon-${format === 'story' ? '9x16' : '1x1'}.png`);
        track('share', { kind: `download-${format}`, result: 'shared', champion });
    };

    // Copa longa: cartão amarelo (1ª derrota fora da Final) ou vermelho (a 2ª), com o resto do caminho bloqueado
    const lost = run.results.at(-1)?.won === false;
    const foul =
        isLong(run) && lost
            ? run.status === 'map'
                ? 'yellow'
                : run.status === 'eliminated' && !isFinalStage(run)
                  ? 'red'
                  : null
            : null;

    const actions = (
        <>
            {foul && <FoulCard kind={foul} remaining={cupLength(run) - run.results.length} />}
            {eliminated && <CupGains run={run} />}
            {(eliminated || champion) && <CupGoalCard run={run} match={match} />}
            <div className="row" style={{ justifyContent: 'center' }}>
                <MomentsButton run={run} match={match} />
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
                {eliminated || champion ? (
                    <>
                        {run.daily ? (
                            // Copa do Dia: o ranking e o compartilhar (estilo Wordle) ficam na tela do dia
                            <button type="button" className="btn yellow" onClick={() => go('daily')}>
                                {t('liga.daily.rankingTitle')}
                            </button>
                        ) : (
                            <button type="button" className="btn yellow" onClick={share}>
                                {t('result.share')}
                            </button>
                        )}
                        <button type="button" className="btn primary" onClick={() => newRun(run.teamName)}>
                            {t('result.newCup')}
                        </button>
                        <button type="button" className="btn ghost" onClick={advance}>
                            {t('result.menu')}
                        </button>
                    </>
                ) : (
                    <div className="bc-thumbbar">
                        <button type="button" className="btn primary big" onClick={advance}>
                            {run.status === 'map' ? t('longCup.backToMap') : t('result.chooseReward')}
                            <HudIcon kind="next" />
                        </button>
                    </div>
                )}
            </div>
            {shared && (
                <div className="toast-pill" role="status">
                    {shared}
                </div>
            )}
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
                    stats={heroStats(match, t)}
                    actions={actions}
                />
            )}
            {/* fora do título a fala vem no topo do resultado (ResultHero) */}
            {champion && (
                <LeaderQuote
                    club={opponent.name}
                    won
                    color={`#${rivalColor(clubColor, opponent.color).toString(16).padStart(6, '0')}`}
                />
            )}
            <UnlockStrip />
            {/* dica na hora certa (era uma página do passo a passo de boas-vindas) */}
            <Tip id="result-dex">{t('result.dexTip')}</Tip>
            {champion && <h2 className="champ-h champ-final-h">{t('result.finalDetails')}</h2>}

            <MatchDetails
                match={match}
                names={names}
                initialTab={tab}
                cupTab={<CupStats results={run.results} mode={run.mode} />}
                goalsExtra={
                    <>
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
                                            <FutCard inst={inst} size="sm" position={lineupPosition(run, inst.uid)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {destaque && (
                            <div className="destaque-box">
                                <h2>
                                    {destaque.special?.kind === 'icone' || destaque.special?.kind === 'evento'
                                        ? t('result.mvpTitle', {
                                              ed: editionLabel(destaque.special.kind),
                                              n: destaque.special.level ?? 1,
                                          })
                                        : (destaque.special?.level ?? 1) > 1
                                          ? t('result.destaqueLevelTitle', { n: destaque.special?.level ?? 1 })
                                          : t('result.destaqueTitle')}
                                </h2>
                                <p className="tactic-desc">
                                    {destaque.special?.kind === 'icone' || destaque.special?.kind === 'evento'
                                        ? t('result.mvpText', {
                                              name: destaque.nickname ?? species(destaque.speciesId).name,
                                              bonus: specialBonus(destaque),
                                          })
                                        : (destaque.special?.level ?? 1) > 1
                                          ? t('result.destaqueLevelText', {
                                                name: destaque.nickname ?? species(destaque.speciesId).name,
                                                bonus: specialBonus(destaque),
                                            })
                                          : t('result.destaqueText', {
                                                name: destaque.nickname ?? species(destaque.speciesId).name,
                                                bonus: specialBonus(destaque),
                                            })}
                                </p>
                                <FutCard inst={destaque} size="sm" position={lineupPosition(run, destaque.uid)} />
                            </div>
                        )}
                    </>
                }
            />
        </>
    );
}

/** As 3 linhas do topo do resultado (posse, chutes e golpes), copa e duelo. */
export function heroStats(match: MatchResult, t: ReturnType<typeof useT>['t']): HeroStat[] {
    const lines = playerLines(match);
    const totals = [teamTotals(lines, 0), teamTotals(lines, 1)] as const;
    return [
        {
            label: t('result.rows.possession'),
            home: Math.round(match.possession[0] * 100),
            away: Math.round(match.possession[1] * 100),
            fmt: (v) => `${v}%`,
        },
        { label: t('result.rows.shots'), home: totals[0].shots, away: totals[1].shots },
        { label: t('result.rows.moves'), home: totals[0].movesUsed, away: totals[1].movesUsed },
    ];
}

/**
 * Detalhes da partida (destaques, gols, craque e as abas de estatística): os mesmos na copa e no duelo. O que é só
 * da copa (evoluções, carta Destaque, aba da copa) entra por `goalsExtra` e `cupTab`.
 */
export function MatchDetails({
    match,
    names,
    goalsExtra,
    cupTab,
    initialTab = 'times',
    side = 0,
}: {
    match: MatchResult;
    names: [string, string];
    /** Seu lado (no duelo o convidado é o 1): a lista "O rival evoluiu" é do outro. */
    side?: 0 | 1;
    goalsExtra?: ReactNode;
    cupTab?: ReactNode;
    initialTab?: Tab;
}) {
    const { t, tn, d } = useT();
    const [tab, setTab] = useState<Tab>(initialTab);
    const mvp = matchMvp(match);
    const goals = match.events.filter((e) => e.type === 'goal');
    // evoluções do rival: lembrete pra quem não viu na quadra
    const rivalEvos = match.events.flatMap((e) => (e.type === 'evolve' && e.team !== side ? [e] : []));
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

    return (
        <>
            <div className="two-col">
                <div className="panel">
                    <h2>{t('result.highlights')}</h2>
                    <div className="st-leaders">
                        {leaderList.map((l) => (
                            <div key={l.id} className="st-leader">
                                <img
                                    className="pixel"
                                    src={cardSprite({ speciesId: l.line.speciesId, shiny: l.line.shiny })}
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
                    {goalsExtra}
                    {rivalEvos.length > 0 && (
                        <>
                            <h2 style={{ marginTop: 16 }}>{t('result.rivalEvolved')}</h2>
                            {rivalEvos.map((e) => (
                                <div key={`${e.tick}-${e.uid}`} className="mini rival-evo">
                                    <img
                                        className="pixel"
                                        src={cardSprite({
                                            speciesId: e.into,
                                            shiny: !!lines.find((x) => x.uid === e.uid)?.shiny,
                                        })}
                                        alt=""
                                    />
                                    <div>
                                        <b>
                                            {species(e.from).name} → {species(e.into).name}
                                        </b>{' '}
                                        <span className="muted">
                                            ({names[e.team]}, {Math.floor(e.minute)}')
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </>
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
                <div className="st-tabs bc-tabs" role="tablist">
                    {TABS.filter((id) => id !== 'copa' || cupTab).map((id) => (
                        <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                            <HudIcon kind={TAB_ICON[id]} />
                            <span>{d.result.tabs[id]}</span>
                        </button>
                    ))}
                </div>
                {tab !== 'copa' && <TeamLegend names={names} />}
                {tab === 'copa' && cupTab}
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
                            {
                                label: t('result.rows.corners'),
                                home: match.events.filter((e) => e.type === 'corner' && e.team === 0).length,
                                away: match.events.filter((e) => e.type === 'corner' && e.team === 1).length,
                            },
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
