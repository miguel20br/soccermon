import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { clubName, cupStageName, cupStageShort } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { isPerfectCup, type RunState, useGame } from '../../store/game-store';
import { cupLength, isLong, paradeOn } from '../../store/long-cup';
import { Beat, useCascade } from '../kit/Cascade';
import { SeeAll } from '../kit/controls';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { cupGoal } from '../moments';
import { trainerLabel } from '../profile/club';
import { type Agg, aggregate, avg } from '../stats/CupStats';
import {
    CupAwards,
    CupFinal,
    CupGoals,
    CupXI,
    cupAwardList,
    FormSpark,
    TitleRecords,
    useRarity,
} from './ChampionExtras';
import { CupGains } from './CupGains';
import { FutCard } from './FutCard';
import { share } from './HalftimePanel';
import { HallParade } from './HallParade';
import { HudIcon } from './MatchHud';
import { cardSprite } from './PokeCard';
import { Confetti } from './ResultHero';
import { Trophy } from './Trophy';

/**
 * Tela do título em 3 batidas (cara-de-jogo.md, decisão 5), sem rolar: a taça com "CAMPEÕES!" e os selos, os 3
 * destaques (Bola de Ouro, Chuteira de Ouro e o gol da copa) e o caminho do título em placas de placar. Tocar pula pro
 * fim. O relatório inteiro (números, prêmios, seleção, gols, a final e o elenco com as estatísticas) mora na sheet
 * "Estatísticas", com o que a tela de resultado mandar em `stats`.
 */
export function ChampionView({
    run,
    icons,
    thumb,
    extra,
    goal,
}: {
    run: RunState;
    /** Botões-ícone da fileira (Melhores momentos, Compartilhar); o Estatísticas entra aqui. */
    icons: ReactNode;
    /** A barra do polegar (Nova copa). */
    thumb: ReactNode;
    /** O resto do relatório (a final, baixar o card, feedback): vai pra sheet. */
    extra: ReactNode;
    /** O gol da copa com o replay (abre ao tocar no destaque). */
    goal: ReactNode;
}) {
    const { t, d } = useT();
    const [sheet, setSheet] = useState<'goal' | null>(null);
    const [openStage, setOpenStage] = useState<number | null>(null);
    const shown = run.results.find((r) => r.stage === openStage);
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
    const players = [...stats.values()];
    // o desfile só no raro (Rota e 1º título de cada modo); nos repetidos, a taça curta da quadra já fez a festa
    const rare = useGame((s) => paradeOn(run, s.records, s.daily.filter((e) => e.champion).length));
    const parading = !!(hallEntry && run.champ && !run.champ.paraded && rare);

    return (
        <>
            {hallEntry && parading && (
                <HallParade entry={hallEntry} trainer={trainerLabel(profile, googleName)} onDone={markParaded} />
            )}
            <Stage className="champ-wrap k-stage-rola">
                <section
                    className="panel rh rh-champ champ champ-stage"
                    aria-label={t(isLong(run) ? 'result.champ.ariaRota' : 'result.champ.aria')}
                >
                    <Confetti count={70} />
                    {/* a cascata recomeça quando o desfile do Hall acaba (antes, ela tocaria escondida embaixo dele) */}
                    <ChampBeats
                        key={parading ? 'hall' : 'go'}
                        run={run}
                        quiet={parading}
                        onGoal={() => setSheet('goal')}
                    />
                    <div className="champ-icons">{icons}</div>
                    <div className="rh-actions">{thumb}</div>
                </section>
            </Stage>
            <Sheet open={sheet === 'goal'} onClose={() => setSheet(null)} title={t('moments.cup.h')}>
                {goal}
            </Sheet>
            {/* o relatório da copa embaixo do palco, rolando (antes numa sheet: ter que tocar pra ver era ruim) */}
            <section className="champ-report" aria-label={t('result.champ.statsTitle')}>
                <h2 className="champ-h champ-final-h">{t('result.champ.statsTitle')}</h2>
                <CupGains run={run} />

                {/* placar de TV (o mesmo do Intervalo): 3 números com barra; o resto no Ver tudo */}
                <ChampBoard run={run} players={players} ready={!parading} />

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
                                {r.stats && (
                                    <>
                                        <div className="champ-opp champ-mine">
                                            {played(r.stats.players).map((p) => (
                                                <img
                                                    key={p.uid}
                                                    className="pixel"
                                                    src={cardSprite({ speciesId: p.speciesId, shiny: !!p.shiny })}
                                                    alt={p.name}
                                                />
                                            ))}
                                        </div>
                                        <span className="champ-x" aria-hidden>
                                            x
                                        </span>
                                    </>
                                )}
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
                                {r.stats && (
                                    <button
                                        type="button"
                                        className="champ-step-open"
                                        aria-haspopup="dialog"
                                        aria-label={t('result.champ.lineupOf', { stage: cupStageName(run, r.stage) })}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenStage(r.stage);
                                        }}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>
                <Sheet
                    open={!!shown}
                    onClose={() => setOpenStage(null)}
                    title={shown ? `${cupStageName(run, shown.stage)} · ${shown.score[0]} x ${shown.score[1]}` : ''}
                    className="champ-lineup-sheet"
                >
                    {shown?.stats && (
                        <ul className="cl-list">
                            <li className="cl-row cl-labels" aria-hidden>
                                <span />
                                <span />
                                <span>{t('team.panel.rating')}</span>
                                <span title={t('team.panel.goals')}>G</span>
                                <span title={t('team.panel.assists')}>A</span>
                            </li>
                            {played(shown.stats.players).map((p) => (
                                <li key={p.uid} className="cl-row">
                                    <img
                                        className="pixel"
                                        src={cardSprite({ speciesId: p.speciesId, shiny: !!p.shiny })}
                                        alt=""
                                    />
                                    <span className="cl-name">
                                        <b>{p.name}</b>
                                        <small>{d.common.pos[p.role as keyof typeof d.common.pos] ?? p.role}</small>
                                    </span>
                                    <span className="cl-num">{p.rating.toFixed(1)}</span>
                                    <span className={p.goals ? 'cl-num on' : 'cl-num'}>{p.goals || '–'}</span>
                                    <span className={p.assists ? 'cl-num on' : 'cl-num'}>{p.assists || '–'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Sheet>

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

                {extra}
            </section>
        </>
    );
}

/** As 3 batidas do título: taça e selos, os 3 destaques, o caminho em placas. */
/** Quem jogou na partida (titulares primeiro: a lista já vem na ordem do elenco). */
const played = (players: NonNullable<RunState['results'][number]['stats']>['players']) =>
    players.filter((p) => p.minutes > 0);

function ChampBeats({ run, quiet, onGoal }: { run: RunState; quiet: boolean; onGoal: () => void }) {
    const { t, d } = useT();
    const rarity = useRarity();
    const awards = cupAwardList(run).filter((a) => a.id === 'ball' || a.id === 'boot');
    const goal = useMemo(() => cupGoal(run.results), [run.results]);
    // o título cai letra a letra (~1 s): os destaques esperam ele assentar
    const c = useCascade([0, 1100, 600], { sound: !quiet });
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a festa; os botões ficam no teclado
        <div className="champ-beats" onClick={c.skip}>
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
            <div className="champ-sub">
                {rich(t(isLong(run) ? 'result.champ.subRota' : 'result.champ.sub'), { team: <b>{run.teamName}</b> })}
            </div>
            {isPerfectCup(run) && (
                <div className="perfect-badge k-ribbon">
                    <HudIcon kind="max" />
                    {t('result.champ.perfect')}
                    <HudIcon kind="max" />
                </div>
            )}
            <TitleRecords run={run} rarity={rarity} />
            <Beat on={c.step > 1} className="champ-picks">
                {awards.map((a) => (
                    <div key={a.id} className={`champ-pick ce-${a.id}`}>
                        <img
                            className="pixel"
                            src={cardSprite({ speciesId: a.who.speciesId, shiny: a.who.shiny })}
                            alt=""
                        />
                        <b>{t(`title.awards.${a.id}` as 'title.awards.ball')}</b>
                        <span>{a.who.name}</span>
                        <small>{t(`title.awards.${a.id}V` as 'title.awards.ballV', { v: a.v })}</small>
                    </div>
                ))}
                {goal && (
                    <button
                        type="button"
                        className="champ-pick champ-pick-goal"
                        aria-haspopup="dialog"
                        onClick={(e) => {
                            e.stopPropagation();
                            onGoal();
                        }}
                    >
                        <img
                            className="pixel"
                            src={cardSprite({
                                speciesId: goal.goal.speciesId,
                                shiny: !!run.picks.find((p) => p.uid === goal.goal.uid)?.shiny,
                            })}
                            alt=""
                        />
                        <b>{t('moments.cup.h')}</b>
                        <span>{goal.goal.name}</span>
                        <small>
                            <HudIcon kind="play" /> {goal.goal.minute}'
                        </small>
                    </button>
                )}
            </Beat>
            <Beat on={c.step > 2} className="champ-road">
                {run.results.map((r) => (
                    <span key={r.stage} className="champ-plate">
                        <small>{cupStageShort(run, r.stage, d.match.stageShort)}</small>
                        <b>
                            {r.score[0]}x{r.score[1]}
                        </b>
                    </span>
                ))}
            </Beat>
        </div>
    );
}

/** A cascata do placar da copa: as 3 linhas, 250 ms entre uma e outra. */
const BOARD_BEATS = [0, 250, 250];

/**
 * Placar de TV das estatísticas da copa (cara-de-jogo.md, padrão 8; o mesmo do Intervalo): vitórias, gols feitos x
 * sofridos e posse, cada um com a barra, entrando um por vez quando o placar aparece na tela (depois do desfile do
 * Hall). O resto (artilheiro, craque e os números do time) fica no Ver tudo.
 */
function ChampBoard({ run, players, ready }: { run: RunState; players: Agg[]; ready: boolean }) {
    const { t } = useT();
    const box = useRef<HTMLDListElement>(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = box.current;
        if (!el || !ready) return;
        if (typeof IntersectionObserver === 'undefined') return setSeen(true);
        const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.6 });
        io.observe(el);
        return () => io.disconnect();
    }, [ready]);
    const casc = useCascade(seen ? BOARD_BEATS : []);
    const wins = run.results.filter((r) => r.won).length;
    const games = cupLength(run);
    const gf = run.results.reduce((s, r) => s + r.score[0], 0);
    const ga = run.results.reduce((s, r) => s + r.score[1], 0);
    const withStats = run.results.filter((r) => r.stats);
    const poss = withStats.length
        ? Math.round((withStats.reduce((s, r) => s + (r.stats?.possession[0] ?? 0), 0) / withStats.length) * 100)
        : null;
    const topScorer = players.length ? players.reduce((a, b) => (b.goals > a.goals ? b : a)) : null;
    const star = players
        .filter((a) => a.games >= 2)
        .reduce<Agg | null>((best, a) => (!best || avg(a) > avg(best) ? a : best), null);
    const sum = (f: (a: Agg) => number) => players.reduce((s, a) => s + f(a), 0);
    const bar = (v: number) => ({ '--v': v }) as CSSProperties;
    // o resto do placar: uma linha por número, no Ver tudo
    const rest: [string, ReactNode][] = [
        ...(topScorer && topScorer.goals > 0
            ? [[`${t('title.awards.boot')} · ${topScorer.name}`, topScorer.goals] as [string, ReactNode]]
            : []),
        ...(star ? [[`${t('title.awards.ball')} · ${star.name}`, avg(star).toFixed(1)] as [string, ReactNode]] : []),
        ...(withStats.length
            ? ([
                  [t('result.champ.stats.shots'), sum((a) => a.shots)],
                  [t('result.champ.stats.passes'), `${sum((a) => a.passesCompleted)}/${sum((a) => a.passes)}`],
                  [t('result.champ.stats.steals'), sum((a) => a.tacklesWon + a.interceptions)],
                  [t('result.champ.stats.saves'), sum((a) => a.saves)],
                  [t('result.champ.stats.moves'), sum((a) => a.movesUsed)],
                  [t('result.champ.stats.ran'), `${(sum((a) => a.distance) / 1000).toFixed(1)} km`],
              ] as [string, ReactNode][])
            : []),
    ];
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a cascata (tudo já está no DOM)
        <div className="champ-board" onClick={casc.skip}>
            <dl className="ht-stats ht-board" ref={box}>
                <Beat on={casc.step > 0} className="ht-row">
                    <dt>{t('result.champ.wins')}</dt>
                    <dd>
                        <i className="ht-bar one" style={bar(games ? wins / games : 0)} />
                        <b className="bc-sc">
                            {wins}/{games}
                        </b>
                    </dd>
                </Beat>
                <Beat on={casc.step > 1} className="ht-row">
                    <dt>{t('result.champ.stats.goals')}</dt>
                    <dd>
                        <b className="bc-sc">{gf}</b>
                        <i className="ht-bar two" style={bar(share(gf, ga))} />
                        <b className="bc-sc">{ga}</b>
                    </dd>
                </Beat>
                {poss !== null && (
                    <Beat on={casc.step > 2} className="ht-row">
                        <dt>{t('result.champ.poss')}</dt>
                        <dd>
                            <b className="bc-sc">{poss}%</b>
                            <i className="ht-bar two" style={bar(poss / 100)} />
                            <b className="bc-sc">{100 - poss}%</b>
                        </dd>
                    </Beat>
                )}
            </dl>
            {rest.length > 0 && (
                <SeeAll title={t('result.champ.statsTitle')}>
                    <dl className="champ-all">
                        {rest.map(([k, v]) => (
                            <div key={k}>
                                <dt>{k}</dt>
                                <dd className="bc-sc">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </SeeAll>
            )}
        </div>
    );
}
