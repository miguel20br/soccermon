import { useState } from 'react';
import type { StageResult, StageStats } from '../../store/game-store';
import { stageLabel } from '../../store/game-store';
import { cardSprite } from '../components/PokeCard';
import { plural } from '../text';
import { awayC, homeC } from './StatsCharts';

/**
 * Estatísticas da copa inteira (até aqui): campanha partida a partida, gols feitos x sofridos, somatório de
 * cada Pokémon do seu time e os destaques da copa. Vêm do resumo que cada partida guarda no run.
 */
type P = StageStats['players'][number];

export interface Agg {
    uid: string;
    speciesId: number;
    name: string;
    games: number;
    minutes: number;
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    passesCompleted: number;
    tacklesWon: number;
    interceptions: number;
    saves: number;
    movesUsed: number;
    distance: number;
    ratingSum: number;
}

export function aggregate(results: StageResult[]): Agg[] {
    const map = new Map<string, Agg>();
    for (const r of results) {
        for (const p of r.stats?.players ?? []) {
            const a: Agg = map.get(p.uid) ?? {
                uid: p.uid,
                speciesId: p.speciesId,
                name: p.name,
                games: 0,
                minutes: 0,
                goals: 0,
                assists: 0,
                shots: 0,
                passes: 0,
                passesCompleted: 0,
                tacklesWon: 0,
                interceptions: 0,
                saves: 0,
                movesUsed: 0,
                distance: 0,
                ratingSum: 0,
            };
            // a forma mais recente (evoluiu no meio da copa)
            a.speciesId = p.speciesId;
            a.name = p.name;
            a.games++;
            for (const k of [
                'minutes',
                'goals',
                'assists',
                'shots',
                'passes',
                'passesCompleted',
                'tacklesWon',
                'interceptions',
                'saves',
                'movesUsed',
                'distance',
            ] as const) {
                a[k] += (p as P)[k];
            }
            a.ratingSum += p.rating;
            map.set(p.uid, a);
        }
    }
    return [...map.values()];
}

export const avg = (a: Agg) => (a.games ? a.ratingSum / a.games : 0);

/** Gols feitos (vermelho) e sofridos (azul) por partida. */
function GoalsChart({ results }: { results: StageResult[] }) {
    const [hover, setHover] = useState<number | null>(null);
    const W = 560;
    const H = 180;
    const pad = { l: 8, r: 8, t: 18, b: 30 };
    const max = Math.max(3, ...results.flatMap((r) => r.score));
    const band = (W - pad.l - pad.r) / Math.max(1, results.length);
    const bw = Math.min(24, band * 0.28);
    const ph = H - pad.t - pad.b;
    const y = (v: number) => pad.t + ph - (v / max) * ph;
    return (
        <div className="st-chart">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gols feitos e sofridos por partida">
                <line x1={pad.l} x2={W - pad.r} y1={pad.t + ph} y2={pad.t + ph} stroke="#3a4680" />
                {results.map((r, i) => {
                    const cx = pad.l + band * i + band / 2;
                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: dica do gráfico (a campanha tem os números)
                        <g key={r.stage} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                            <rect x={cx - band / 2} y={pad.t} width={band} height={ph} fill="transparent" />
                            {[r.score[0], r.score[1]].map((v, k) => {
                                const x = cx + (k === 0 ? -bw - 1 : 1);
                                const h = pad.t + ph - y(v);
                                return (
                                    <g key={k === 0 ? 'f' : 's'}>
                                        {h > 0 && (
                                            <rect
                                                x={x}
                                                y={y(v)}
                                                width={bw}
                                                height={h}
                                                rx={3}
                                                fill={k === 0 ? homeC() : awayC()}
                                            />
                                        )}
                                        <text
                                            x={x + bw / 2}
                                            y={y(v) - 4}
                                            fill="var(--text)"
                                            fontSize={11}
                                            textAnchor="middle"
                                        >
                                            {v}
                                        </text>
                                    </g>
                                );
                            })}
                            <text x={cx} y={H - 12} fill="var(--muted)" fontSize={10} textAnchor="middle">
                                {stageLabel(r.stage).replace(' de final', '')}
                            </text>
                            {hover === i && (
                                <text x={cx} y={H - 1} fill="var(--text)" fontSize={10} textAnchor="middle">
                                    vs {r.opponent}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="st-legend">
                <span>
                    <i style={{ background: homeC() }} />
                    Gols feitos
                </span>
                <span>
                    <i style={{ background: awayC() }} />
                    Gols sofridos
                </span>
            </div>
        </div>
    );
}

export function CupStats({ results }: { results: StageResult[] }) {
    if (!results.length) return <p className="muted">A copa ainda não teve partidas.</p>;
    const players = aggregate(results).sort((a, b) => b.goals - a.goals || avg(b) - avg(a));
    const gf = results.reduce((s, r) => s + r.score[0], 0);
    const ga = results.reduce((s, r) => s + r.score[1], 0);
    const withStats = results.filter((r) => r.stats);
    const poss = withStats.length
        ? Math.round((withStats.reduce((s, r) => s + (r.stats?.possession[0] ?? 0), 0) / withStats.length) * 100)
        : null;
    const pick = (score: (a: Agg) => number, min = 0) => {
        const list = players.filter((a) => score(a) > min);
        return list.length ? list.reduce((x, y) => (score(y) > score(x) ? y : x)) : null;
    };
    const awards: [string, Agg | null, (a: Agg) => string][] = [
        ['Artilheiro da copa', pick((a) => a.goals), (a) => plural(a.goals, 'gol', 'gols')],
        ['Garçom', pick((a) => a.assists), (a) => plural(a.assists, 'assistência', 'assistências')],
        ['Melhor nota média', pick((a) => (a.games >= 2 ? avg(a) : 0)), (a) => avg(a).toFixed(1)],
        ['Maratonista', pick((a) => a.distance), (a) => `${(a.distance / 1000).toFixed(1)} km`],
        [
            'Ladrão de bolas',
            pick((a) => a.tacklesWon + a.interceptions),
            (a) => plural(a.tacklesWon + a.interceptions, 'roubada', 'roubadas'),
        ],
        ['Paredão', pick((a) => a.saves), (a) => plural(a.saves, 'defesa', 'defesas')],
    ];

    return (
        <div className="st-charts">
            <div className="cup-totals">
                <div>
                    <b>{results.filter((r) => r.won).length}</b>
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
            </div>

            <div>
                <h3>Campanha</h3>
                <div className="cup-campaign">
                    {results.map((r) => {
                        const star = r.stats?.players.reduce((a, b) => (b.rating > a.rating ? b : a));
                        return (
                            <div key={r.stage} className={`cup-match ${r.won ? 'won' : 'lost'}`}>
                                <span className="muted">{stageLabel(r.stage)}</span>
                                <b>
                                    {r.score[0]} x {r.score[1]}
                                    {r.shootout && <small> (pên. {r.shootout.join('x')})</small>}
                                </b>
                                <span>vs {r.opponent}</span>
                                {star && (
                                    <span className="muted">
                                        Craque: {star.name} ({star.rating.toFixed(1)})
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3>Gols por partida</h3>
                <GoalsChart results={results} />
            </div>

            <div>
                <h3>Destaques da copa</h3>
                <div className="st-leaders">
                    {awards
                        .filter(([, a]) => a)
                        .map(([title, a, value]) =>
                            a ? (
                                <div key={title} className="st-leader">
                                    <img
                                        className="pixel"
                                        src={cardSprite({ speciesId: a.speciesId, shiny: false })}
                                        alt=""
                                    />
                                    <div>
                                        <span className="muted">{title}</span>
                                        <b>{a.name}</b>
                                        <small>{value(a)}</small>
                                    </div>
                                </div>
                            ) : null,
                        )}
                </div>
            </div>

            <div>
                <h3>Seu time na copa</h3>
                <div className="st-table-scroll">
                    <table className="st-table">
                        <thead>
                            <tr>
                                <th className="st-name">Pokémon</th>
                                <th title="Partidas">J</th>
                                <th title="Nota média">Nota</th>
                                <th title="Gols">G</th>
                                <th title="Assistências">A</th>
                                <th title="Chutes">Chutes</th>
                                <th title="Passes certos / tentados">Passes</th>
                                <th title="Desarmes + interceptações">Roubadas</th>
                                <th title="Defesas">Defesas</th>
                                <th title="Golpes usados">Golpes</th>
                                <th title="Distância percorrida">Correu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((a) => (
                                <tr key={a.uid}>
                                    <td className="st-name">
                                        <i style={{ background: homeC() }} />
                                        <img
                                            className="pixel"
                                            src={cardSprite({ speciesId: a.speciesId, shiny: false })}
                                            alt=""
                                        />
                                        <span>{a.name}</span>
                                    </td>
                                    <td>{a.games}</td>
                                    <td>{avg(a).toFixed(1)}</td>
                                    <td>{a.goals}</td>
                                    <td>{a.assists}</td>
                                    <td>{a.shots}</td>
                                    <td>
                                        {a.passesCompleted}/{a.passes}
                                    </td>
                                    <td>{a.tacklesWon + a.interceptions}</td>
                                    <td>{a.saves}</td>
                                    <td>{a.movesUsed}</td>
                                    <td>{(a.distance / 1000).toFixed(1)} km</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
