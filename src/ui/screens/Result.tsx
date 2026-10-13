import { useState } from 'react';
import { species } from '../../engine/data';
import { matchMvp } from '../../engine/mvp';
import type { PlayerSummary } from '../../engine/runners/batch-runner';
import { isPerfectCup, stageLabel, useGame } from '../../store/game-store';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { shareRun } from '../share';

export function Result() {
    const { run, match, advance, newRun } = useGame();
    const [shared, setShared] = useState<string | null>(null);
    if (!run || !match) return null;
    const opponent = run.opponents[run.stage];
    const names: [string, string] = [run.teamName, opponent.name];
    const won = match.winner === 0;

    // estatísticas somam quem começou e quem entrou
    const everyone = [...match.finalRoster, ...(match.subbedOut ?? [])];
    const sum = (team: 0 | 1, key: keyof PlayerSummary['stats']) =>
        everyone.filter((p) => p.team === team).reduce((s, p) => s + p.stats[key], 0);
    const mvp = matchMvp(match);
    const stageResult = run.results.find((r) => r.stage === run.stage);
    const destaque = stageResult?.destaqueUid ? run.picks.find((p) => p.uid === stageResult.destaqueUid) : null;

    const goals = match.events.filter((e) => e.type === 'goal');
    const nameAt = (idx: number, tick: number) => {
        const sub = match.events.find((e) => e.type === 'sub' && e.outIdx === idx && e.tick <= tick);
        return sub && sub.type === 'sub' ? sub.in : match.roster[idx].name;
    };

    const rows: [string, (t: 0 | 1) => string][] = [
        ['Posse de bola', (t) => `${Math.round(match.possession[t] * 100)}%`],
        ['Chutes', (t) => String(sum(t, 'shots'))],
        ['No gol', (t) => String(sum(t, 'shotsOnTarget'))],
        ['Defesas', (t) => String(sum(t, 'saves'))],
        ['Passes certos', (t) => `${sum(t, 'passesCompleted')}/${sum(t, 'passes')}`],
        ['Desarmes', (t) => String(sum(t, 'tacklesWon'))],
        ['Golpes usados', (t) => String(sum(t, 'movesUsed'))],
    ];

    const champion = run.status === 'champion';
    const eliminated = run.status === 'eliminated';
    const perfect = isPerfectCup(run);
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

    return (
        <>
            <div className="panel result-hero">
                {champion && <div className="trophy">🏆</div>}
                {perfect && <div className="perfect-badge">★ COPA PERFEITA ★</div>}
                <h1>{champion ? 'CAMPEÕES DA COPA DE KANTO!' : won ? 'Vitória!' : 'Fim da linha…'}</h1>
                <div className="muted">
                    {stageLabel(run.stage)} · {names[0]} x {names[1]}
                </div>
                <div className="big-score">
                    {match.score[0]} x {match.score[1]}
                </div>
                {match.shootout && (
                    <div>
                        Pênaltis: {match.shootout[0]} x {match.shootout[1]}
                    </div>
                )}
                <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
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
                        <button type="button" className="btn primary" onClick={advance}>
                            Escolher recompensa →
                        </button>
                    )}
                </div>
                {shared && <div className="muted">{shared}</div>}
            </div>

            <div className="two-col">
                <div className="panel">
                    <h2>Estatísticas</h2>
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>{names[0]}</th>
                                <th />
                                <th>{names[1]}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(([label, f]) => (
                                <tr key={label}>
                                    <td>{f(0)}</td>
                                    <th>{label}</th>
                                    <td>{f(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                        {mvp.stats.goals} gols · {mvp.stats.assists} assist. · {mvp.stats.saves} defesas
                                        · {mvp.stats.tacklesWon} desarmes
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
