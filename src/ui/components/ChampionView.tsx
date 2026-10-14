import type { CSSProperties, ReactNode } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { isPerfectCup, type RunState } from '../../store/game-store';
import { aggregate, avg } from '../stats/CupStats';
import { FutCard } from './FutCard';
import { cardSprite } from './PokeCard';
import { Confetti } from './ResultHero';
import { Trophy } from './Trophy';

/**
 * Tela do título: a taça, o caminho até ela (as 4 partidas, com placar, rival e craque) e o elenco campeão
 * inteiro com as cartas e as estatísticas de cada um na copa. Tocar na carta abre tudo sobre o Pokémon.
 */
export function ChampionView({ run, actions }: { run: RunState; actions: ReactNode }) {
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

    return (
        <section className="panel rh rh-champ champ" aria-label="Campeões da Copa de Kanto">
            <Confetti count={70} />
            <div className="champ-trophy">
                <Trophy size={150} />
            </div>
            <h1 className="rh-title champ-title" aria-label="Campeões!">
                {[...'CAMPEÕES!'].map((ch, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: letras do título
                    <span key={i} style={{ '--i': i } as CSSProperties}>
                        {ch}
                    </span>
                ))}
            </h1>
            <div className="champ-sub">
                <b>{run.teamName}</b> conquistou a Copa de Kanto
            </div>
            {isPerfectCup(run) && <div className="perfect-badge">★ COPA PERFEITA: nenhum gol sofrido ★</div>}

            <div className="cup-totals champ-totals">
                <div>
                    <b>
                        {run.results.filter((r) => r.won).length}/{CUP_STAGES.length}
                    </b>
                    <span>vitórias</span>
                </div>
                <div>
                    <b>{gf}</b>
                    <span>gols feitos</span>
                </div>
                <div>
                    <b>{ga}</b>
                    <span>gols sofridos</span>
                </div>
                {poss !== null && (
                    <div>
                        <b>{poss}%</b>
                        <span>posse média</span>
                    </div>
                )}
                {topScorer && topScorer.goals > 0 && (
                    <div>
                        <b>{topScorer.goals}</b>
                        <span>
                            {topScorer.goals === 1 ? 'gol' : 'gols'} de {topScorer.name} (artilheiro)
                        </span>
                    </div>
                )}
                {star && (
                    <div>
                        <b>{avg(star).toFixed(1)}</b>
                        <span>{star.name}, craque da copa</span>
                    </div>
                )}
            </div>

            <h2 className="champ-h">Caminho do título</h2>
            <ol className="champ-path">
                {run.results.map((r) => {
                    const opp = run.opponents[r.stage];
                    const best = r.stats?.players.reduce((a, b) => (b.rating > a.rating ? b : a));
                    return (
                        <li key={r.stage} className="champ-step">
                            <span className="champ-stage">{CUP_STAGES[r.stage]}</span>
                            <b className="champ-score">
                                {r.score[0]} x {r.score[1]}
                            </b>
                            {r.shootout && <small>pênaltis {r.shootout.join(' x ')}</small>}
                            <span className="muted">vs {r.opponent}</span>
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
                                    ★ {best.name} ({best.rating.toFixed(1)})
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>

            <h2 className="champ-h">Elenco campeão</h2>
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
                                    <dt>Jogos</dt>
                                    <dd>{a.games}</dd>
                                    <dt>Nota</dt>
                                    <dd>{avg(a).toFixed(1)}</dd>
                                    <dt>Gols</dt>
                                    <dd>{a.goals}</dd>
                                    <dt>Assist.</dt>
                                    <dd>{a.assists}</dd>
                                    <dt>Chutes</dt>
                                    <dd>{a.shots}</dd>
                                    <dt>Passes</dt>
                                    <dd>
                                        {a.passesCompleted}/{a.passes}
                                    </dd>
                                    <dt>Roubadas</dt>
                                    <dd>{a.tacklesWon + a.interceptions}</dd>
                                    <dt>Defesas</dt>
                                    <dd>{a.saves}</dd>
                                    <dt>Golpes</dt>
                                    <dd>{a.movesUsed}</dd>
                                    <dt>Correu</dt>
                                    <dd>{(a.distance / 1000).toFixed(1)} km</dd>
                                </dl>
                            ) : (
                                <span className="muted champ-nostats">
                                    {oldSave ? 'Sem estatísticas' : 'Ficou no banco'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="rh-actions">{actions}</div>
        </section>
    );
}
