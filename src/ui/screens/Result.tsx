import { useState } from 'react';
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
import { useGame } from '../../store/game-store';
import { ChampionView } from '../components/ChampionView';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { ResultHero } from '../components/ResultHero';
import { shareRun } from '../share';
import { CupStats } from '../stats/CupStats';
import { PlayerTable } from '../stats/PlayerTable';
import {
    AWAY_C,
    CompareRows,
    DangerChart,
    HOME_C,
    PossessionChart,
    ShotMapChart,
    TeamLegend,
} from '../stats/StatsCharts';
import { plural } from '../text';

type Tab = 'times' | 'jogadores' | 'graficos' | 'copa';
const TABS: { id: Tab; label: string }[] = [
    { id: 'times', label: 'Times' },
    { id: 'jogadores', label: 'Jogadores' },
    { id: 'graficos', label: 'Gráficos' },
    { id: 'copa', label: 'Copa' },
];
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function Result() {
    const { run, match, advance, newRun } = useGame();
    const [shared, setShared] = useState<string | null>(null);
    // fim da copa: abre direto no resumo da copa
    const [tab, setTab] = useState<Tab>(() =>
        run && ['eliminated', 'champion'].includes(run.status) ? 'copa' : 'times',
    );
    if (!run || !match) return null;
    const opponent = run.opponents[run.stage];
    const names: [string, string] = [run.teamName, opponent.name];

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
    const ourStar = lines
        .filter((l) => l.team === 0)
        .reduce<(typeof lines)[number] | null>((best, l) => (!best || l.rating > best.rating ? l : best), null);

    const champion = run.status === 'champion';
    const eliminated = run.status === 'eliminated';
    const share = async () => {
        const res = await shareRun(run);
        setShared(
            res === 'copied'
                ? 'Copiado! Cole onde quiser.'
                : res === 'shared'
                  ? 'Compartilhado!'
                  : 'Não deu pra copiar :(',
        );
    };

    const actions = (
        <>
            <div className="row" style={{ justifyContent: 'center' }}>
                {eliminated || champion ? (
                    <>
                        <button type="button" className="btn yellow" onClick={share}>
                            Compartilhar
                        </button>
                        <button type="button" className="btn primary" onClick={() => newRun(run.teamName)}>
                            Nova copa
                        </button>
                        <button type="button" className="btn ghost" onClick={advance}>
                            Menu
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn primary big" onClick={advance}>
                        Escolher recompensa →
                    </button>
                )}
            </div>
            {shared && <div className="muted">{shared}</div>}
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
            {champion && <h2 className="champ-h champ-final-h">A final em detalhes</h2>}

            <div className="two-col">
                <div className="panel">
                    <h2>Destaques da partida</h2>
                    <div className="st-leaders">
                        {leaderList.map((l) => (
                            <div key={l.title} className="st-leader">
                                <img
                                    className="pixel"
                                    src={cardSprite({ speciesId: l.line.speciesId, shiny: false })}
                                    alt=""
                                />
                                <div>
                                    <span className="muted">{l.title}</span>
                                    <b>{l.line.name}</b>
                                    <small>
                                        <i style={{ background: l.line.team === 0 ? HOME_C : AWAY_C }} />
                                        {names[l.line.team]} · {l.value}
                                    </small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="panel">
                    <h2>Gols</h2>
                    <div className="scorers">
                        {goals.length === 0 && <span className="muted">Nenhum gol.</span>}
                        {goals.map(
                            (g) =>
                                g.type === 'goal' && (
                                    <div key={g.tick}>
                                        <span className="muted">{Math.floor(g.minute)}'</span> {nameAt(g.by, g.tick)}
                                        {g.ownGoal ? ' (contra)' : ''} — {names[g.team]}
                                        {g.assist !== null && (
                                            <span className="muted"> (assist. {nameAt(g.assist, g.tick)})</span>
                                        )}
                                    </div>
                                ),
                        )}
                    </div>
                    {evolutions.length > 0 && (
                        <div className="destaque-box">
                            <h2>{evolutions.length > 1 ? 'Evoluíram na partida!' : 'Evoluiu na partida!'}</h2>
                            <p className="tactic-desc">A evolução vale para o resto da copa.</p>
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
                            <h2>Virou carta Destaque!</h2>
                            <p className="tactic-desc">
                                {destaque.nickname ?? species(destaque.speciesId).name} foi o craque do seu time e
                                ganhou a edição Destaque: +2 em todos os atributos.
                            </p>
                            <FutCard inst={destaque} size="sm" />
                        </div>
                    )}
                    {mvp && (
                        <>
                            <h2 style={{ marginTop: 16 }}>Craque da partida</h2>
                            <div className="mini" style={{ display: 'inline-flex' }}>
                                <img className="pixel" src={cardSprite(mvp)} alt="" />
                                <div>
                                    <b>{mvp.name}</b> <span className="muted">({names[mvp.team]})</span>
                                    <div className="muted">
                                        {plural(mvp.stats.goals, 'gol', 'gols')} ·{' '}
                                        {plural(mvp.stats.assists, 'assistência', 'assistências')} ·{' '}
                                        {plural(mvp.stats.saves, 'defesa', 'defesas')} ·{' '}
                                        {plural(mvp.stats.tacklesWon, 'desarme', 'desarmes')}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="panel st-panel">
                <div className="st-tabs" role="tablist">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.id}
                            className={`btn small${tab === t.id ? ' active' : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {tab !== 'copa' && <TeamLegend names={names} />}
                {tab === 'copa' && <CupStats results={run.results} />}
                {tab === 'times' && (
                    <CompareRows
                        rows={[
                            {
                                label: 'Posse de bola',
                                home: Math.round(match.possession[0] * 100),
                                away: Math.round(match.possession[1] * 100),
                                fmt: (v) => `${v}%`,
                            },
                            { label: 'Chutes', home: totals[0].shots, away: totals[1].shots },
                            { label: 'Chutes no gol', home: totals[0].shotsOnTarget, away: totals[1].shotsOnTarget },
                            {
                                label: 'Perigo criado (chance de gol somada)',
                                home: Math.round(danger.reduce((s, d) => s + d.home, 0) * 100) / 100,
                                away: Math.round(danger.reduce((s, d) => s + d.away, 0) * 100) / 100,
                                fmt: (v) => v.toFixed(2),
                            },
                            {
                                label: 'Passes certos',
                                home: totals[0].passesCompleted,
                                away: totals[1].passesCompleted,
                            },
                            {
                                label: 'Acerto de passe',
                                home: pctOf(totals[0].passesCompleted, totals[0].passes),
                                away: pctOf(totals[1].passesCompleted, totals[1].passes),
                                fmt: (v) => `${v}%`,
                            },
                            { label: 'Desarmes', home: totals[0].tacklesWon, away: totals[1].tacklesWon },
                            { label: 'Interceptações', home: totals[0].interceptions, away: totals[1].interceptions },
                            { label: 'Defesas', home: totals[0].saves, away: totals[1].saves },
                            { label: 'Golpes usados', home: totals[0].movesUsed, away: totals[1].movesUsed },
                            {
                                label: 'Distância percorrida',
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
                            <h3>Perigo por período</h3>
                            <p className="muted st-sub">
                                Soma da chance de gol dos chutes a cada 5 minutos (para cima: {names[0]}; para baixo:{' '}
                                {names[1]}). A bolinha marca os gols.
                            </p>
                            <DangerChart data={danger} names={names} />
                        </div>
                        <div>
                            <h3>Posse de bola por período</h3>
                            <PossessionChart data={possessionByPeriod(match)} names={names} />
                        </div>
                        <div>
                            <h3>Mapa de chutes</h3>
                            <p className="muted st-sub">
                                De onde saiu cada chute. {names[0]} ataca para a direita, {names[1]} para a esquerda.
                            </p>
                            <ShotMapChart shots={shotMap(match, nameAt)} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
