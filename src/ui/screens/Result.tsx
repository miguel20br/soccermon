import type { PlayerSummary } from '../../engine/runners/batch-runner';
import { stageLabel, useGame } from '../../store/game-store';
import { cardSprite } from '../components/PokeCard';

function mvpScore(p: PlayerSummary) {
    const s = p.stats;
    return (
        s.goals * 3 + s.assists * 2 + s.saves * 0.8 + s.tacklesWon * 0.5 + s.interceptions * 0.4 + s.shotsOnTarget * 0.4
    );
}

export function Result() {
    const { run, match, advance, newRun } = useGame();
    if (!run || !match) return null;
    const opponent = run.opponents[run.stage];
    const names: [string, string] = [run.teamName, opponent.name];
    const won = match.winner === 0;

    // estatísticas somam quem começou e quem entrou
    const everyone = [
        ...match.finalRoster,
        ...match.roster.filter((r) => !match.finalRoster.some((f) => f.uid === r.uid)),
    ];
    const sum = (team: 0 | 1, key: keyof PlayerSummary['stats']) =>
        everyone.filter((p) => p.team === team).reduce((s, p) => s + p.stats[key], 0);
    const mvp = [...everyone].sort((a, b) => mvpScore(b) - mvpScore(a))[0];

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

    return (
        <>
            <div className="panel result-hero">
                {champion && <div className="trophy">🏆</div>}
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
                        <button type="button" className="btn primary" onClick={() => newRun(run.teamName)}>
                            Nova copa
                        </button>
                    ) : (
                        <button type="button" className="btn primary" onClick={advance}>
                            Próxima fase: {stageLabel(run.stage + 1)}
                        </button>
                    )}
                    {(eliminated || champion) && (
                        <button type="button" className="btn ghost" onClick={advance}>
                            Menu
                        </button>
                    )}
                </div>
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
