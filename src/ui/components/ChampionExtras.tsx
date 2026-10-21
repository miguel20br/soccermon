import { useEffect, useState } from 'react';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import type { ShotPoint } from '../../engine/match-stats';
import { clubName, cupStageName, moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import type { RunState } from '../../store/game-store';
import { lineupAverage } from '../rating';
import { type Agg, aggregate, avg } from '../stats/CupStats';
import { awayC, homeC, ShotMapChart } from '../stats/StatsCharts';
import { FormationBoard } from './FormationBoard';
import { cardSprite } from './PokeCard';

/**
 * Extras da tela do título (0.8.2): recordes, prêmios, seleção da copa, gols da campanha, golpes, a final e a
 * nota jogo a jogo. Tudo sai do resumo que cada partida guarda no run (`results[].stats`).
 */

const sprite = (speciesId: number, shiny = false) => cardSprite({ speciesId, shiny });

function Mini({ speciesId, shiny, name }: { speciesId: number; shiny?: boolean; name: string }) {
    return <img className="pixel ce-mini" src={sprite(speciesId, shiny)} alt={name} title={name} />;
}

/** Recordes que o título trouxe (calculados no apito final, antes de somar no perfil). */
export function TitleRecords({ run, rarity }: { run: RunState; rarity: Rarity | null }) {
    const { t } = useT();
    const c = run.champ;
    if (!c) return null;
    const items: string[] = [c.titleNo === 1 ? t('title.records.first') : t('title.records.title', { n: c.titleNo })];
    if (c.perfectNo) items.push(t('title.records.perfect', { n: c.perfectNo }));
    for (const b of c.newBests.slice(0, 2))
        items.push(t('title.records.best', { name: b.name, r: b.rating.toFixed(1) }));
    for (const id of c.firstTitles.slice(0, 2)) items.push(t('title.records.firstTitle', { name: species(id).name }));
    if (run.startedAt && run.endedAt) items.push(t('title.records.time', { t: duration(run.endedAt - run.startedAt) }));
    const rare = rarity && rarest(run, rarity);
    if (rare) items.push(t('title.records.rare', { p: rare.pct, name: rare.name }));
    return (
        <ul className="ce-records">
            {items.map((s) => (
                <li key={s}>{s}</li>
            ))}
        </ul>
    );
}

function duration(ms: number): string {
    const min = Math.max(1, Math.round(ms / 60000));
    return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

/** Prêmios: o maior de cada número (Bola de Ouro pede 2+ jogos). Empate fica com quem veio antes. */
const AWARDS: { id: string; score: (a: Agg) => number; show: (a: Agg) => string; min?: (a: Agg) => boolean }[] = [
    { id: 'ball', score: avg, show: (a) => avg(a).toFixed(1), min: (a) => a.games >= 2 },
    { id: 'boot', score: (a) => a.goals, show: (a) => String(a.goals) },
    { id: 'playmaker', score: (a) => a.assists, show: (a) => String(a.assists) },
    { id: 'glove', score: (a) => a.saves, show: (a) => String(a.saves) },
    { id: 'wall', score: (a) => a.tacklesWon + a.interceptions, show: (a) => String(a.tacklesWon + a.interceptions) },
    { id: 'engine', score: (a) => a.distance, show: (a) => (a.distance / 1000).toFixed(1) },
    { id: 'master', score: (a) => a.movesUsed, show: (a) => String(a.movesUsed) },
];

export function CupAwards({ run }: { run: RunState }) {
    const { t } = useT();
    const players = aggregate(run.results);
    const list = AWARDS.flatMap((aw) => {
        const pool = players.filter((a) => aw.score(a) > 0 && (aw.min?.(a) ?? true));
        if (!pool.length) return [];
        const who = pool.reduce((a, b) => (aw.score(b) > aw.score(a) ? b : a));
        return [{ id: aw.id, who, v: aw.show(who) }];
    });
    if (!list.length) return null;
    return (
        <>
            <h2 className="champ-h">{t('title.awards.h')}</h2>
            <div className="ce-awards">
                {list.map((x) => (
                    <div key={x.id} className={`ce-award ce-${x.id}`}>
                        <img className="pixel" src={sprite(x.who.speciesId, x.who.shiny)} alt="" />
                        <b>{t(`title.awards.${x.id}` as 'title.awards.ball')}</b>
                        <span>{x.who.name}</span>
                        <small>{t(`title.awards.${x.id}V` as 'title.awards.ballV', { v: x.v })}</small>
                    </div>
                ))}
            </div>
        </>
    );
}

/** Seleção da copa: o melhor de cada vaga da formação usada (pela nota média e pela posição em que jogou). */
export function CupXI({ run }: { run: RunState }) {
    const { t } = useT();
    const players = aggregate(run.results);
    if (players.length < 5) return null;
    const roleOf = new Map<string, string>();
    for (const r of run.results) for (const p of r.stats?.players ?? []) if (p.minutes >= 1) roleOf.set(p.uid, p.role);
    const byUid = new Map(run.picks.map((p) => [p.uid, p] as [string, PokemonInstance]));
    const pool = players.filter((a) => byUid.has(a.uid)).sort((a, b) => avg(b) - avg(a));
    const used = new Set<string>();
    const slots = formationOf(run.formation).slots;
    const lineup = slots.map((role) => {
        const pick =
            pool.find((a) => !used.has(a.uid) && roleOf.get(a.uid) === role) ?? pool.find((a) => !used.has(a.uid));
        if (pick) used.add(pick.uid);
        return pick?.uid ?? '';
    });
    const rating = new Map(players.map((a) => [a.uid, avg(a)]));
    return (
        <>
            <h2 className="champ-h">{t('title.xi')}</h2>
            <div className="ce-xi">
                <FormationBoard
                    formation={run.formation}
                    lineup={lineup}
                    bench={[]}
                    byUid={byUid}
                    captainUid={run.captainUid}
                    stateOf={() => 'idle'}
                    badgeOf={(inst) => <span className="ce-xi-r">{rating.get(inst.uid)?.toFixed(1)}</span>}
                />
            </div>
        </>
    );
}

/** Gols da campanha: uma linha de 40' por jogo, mapa dos gols e os golpes mais usados. */
export function CupGoals({ run }: { run: RunState }) {
    const { t } = useT();
    const withDigest = run.results.filter((r) => r.stats?.digest);
    if (!withDigest.length) return <p className="muted">{t('title.timeline.none')}</p>;
    const shots: ShotPoint[] = withDigest.flatMap((r) =>
        (r.stats?.digest?.goals ?? [])
            .filter((g) => g.team === 0 && !g.ownGoal)
            .map((g) => ({
                x: g.x,
                y: g.y,
                team: 0 as const,
                outcome: 'gol' as const,
                name: g.name,
                minute: g.minute,
                xg: 0,
                move: !!g.moveId,
            })),
    );
    const moves = new Map<string, { uses: number; goals: number }>();
    for (const r of withDigest) {
        const d = r.stats!.digest!;
        for (const [id, n] of Object.entries(d.moves)) {
            const m = moves.get(id) ?? { uses: 0, goals: 0 };
            m.uses += n;
            moves.set(id, m);
        }
        for (const g of d.goals)
            if (g.team === 0 && g.moveId) {
                const m = moves.get(g.moveId) ?? { uses: 0, goals: 0 };
                m.goals++;
                moves.set(g.moveId, m);
            }
    }
    const topMoves = [...moves].sort((a, b) => b[1].goals - a[1].goals || b[1].uses - a[1].uses).slice(0, 5);
    return (
        <>
            <h2 className="champ-h">{t('title.timeline.h')}</h2>
            <div className="ce-timeline">
                {withDigest.map((r) => {
                    const d = r.stats!.digest!;
                    return (
                        <div key={r.stage} className="ce-tl-row">
                            <span className="ce-tl-label">
                                {cupStageName(run, r.stage)}
                                <small>
                                    {r.score[0]} x {r.score[1]} · {clubName(r.opponent)}
                                </small>
                            </span>
                            <div className="ce-tl-bar" role="img" aria-label={`${r.score[0]} x ${r.score[1]}`}>
                                <i className="ce-tl-half" />
                                {d.goals.map((g, i) => (
                                    <span
                                        // biome-ignore lint/suspicious/noArrayIndexKey: gols de uma partida, em ordem
                                        key={i}
                                        className={`ce-tl-goal${g.team === 0 ? ' mine' : ''}`}
                                        style={{
                                            left: `${(Math.min(40, g.minute) / 40) * 100}%`,
                                            background: g.team === 0 ? homeC() : awayC(),
                                        }}
                                        title={`${g.minute}' ${g.name}${g.ownGoal ? ` (${t('title.timeline.own')})` : ''}${g.moveId ? ` · ${moveName(g.moveId)}` : ''}`}
                                    >
                                        {g.team === 0 && (
                                            <img
                                                className="pixel"
                                                src={sprite(g.speciesId, run.picks.find((p) => p.uid === g.uid)?.shiny)}
                                                alt=""
                                            />
                                        )}
                                    </span>
                                ))}
                            </div>
                            {d.half && (
                                <small className="muted ce-tl-ht">
                                    {t('title.timeline.half', { a: d.half[0], b: d.half[1] })}
                                </small>
                            )}
                        </div>
                    );
                })}
            </div>
            {shots.length > 0 && (
                <>
                    <h2 className="champ-h">{t('title.goalMap')}</h2>
                    <ShotMapChart shots={shots} />
                </>
            )}
            {topMoves.length > 0 && (
                <>
                    <h2 className="champ-h">{t('title.moves.h')}</h2>
                    <table className="ce-moves">
                        <thead>
                            <tr>
                                <th>{t('title.moves.move')}</th>
                                <th>{t('title.moves.uses')}</th>
                                <th>{t('title.moves.goals')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topMoves.map(([id, m], i) => (
                                <tr key={id} className={i === 0 ? 'top' : ''}>
                                    <td>{moveName(id)}</td>
                                    <td>{m.uses}</td>
                                    <td>{m.goals}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </>
    );
}

/** A final: seu time x o finalista (média das cartas) e quem evoluiu na copa. */
export function CupFinal({ run }: { run: RunState }) {
    const { t } = useT();
    const final = run.results.at(-1);
    const opp = final && run.opponents[final.stage];
    if (!final || !opp) return null;
    const mineSlots = run.lineup.map((u) => run.picks.find((p) => p.uid === u));
    const mine = mineSlots.filter((p): p is PokemonInstance => !!p);
    const evolutions = run.results.flatMap((r) => r.stats?.digest?.evolutions ?? []);
    return (
        <>
            <h2 className="champ-h">{t('title.final.h')}</h2>
            <div className="ce-final">
                <div className="ce-final-side">
                    <b>{run.teamName}</b>
                    <div>
                        {mine.map((p) => (
                            <Mini
                                key={p.uid}
                                speciesId={p.speciesId}
                                shiny={p.shiny}
                                name={viewInstance(p).displayName}
                            />
                        ))}
                    </div>
                    <span>
                        <b>{lineupAverage(mineSlots, run.formation)}</b> {t('title.final.avg')}
                    </span>
                </div>
                <b className="ce-final-score">
                    {final.score[0]} x {final.score[1]}
                </b>
                <div className="ce-final-side">
                    <b>{clubName(opp.name)}</b>
                    <div>
                        {opp.lineup.map((p) => (
                            <Mini
                                key={p.uid}
                                speciesId={p.speciesId}
                                shiny={p.shiny}
                                name={viewInstance(p).displayName}
                            />
                        ))}
                    </div>
                    <span>
                        <b>{lineupAverage(opp.lineup, opp.formation)}</b> {t('title.final.avg')}
                    </span>
                </div>
            </div>
            {evolutions.map((e) => (
                <p key={e.uid} className="muted ce-evo">
                    {t('title.final.evolved', { from: species(e.from).name, into: species(e.into).name })}
                </p>
            ))}
        </>
    );
}

/** Nota jogo a jogo de um Pokémon (linha pequena embaixo da carta). */
export function FormSpark({ run, uid }: { run: RunState; uid: string }) {
    const { t } = useT();
    const pts = run.results.map((r) => r.stats?.players.find((p) => p.uid === uid)?.rating ?? null);
    if (pts.filter((p) => p !== null).length < 2) return null;
    const W = 80;
    const H = 24;
    const x = (i: number) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * (W - 6) + 3);
    const y = (r: number) => H - 3 - ((r - 3) / 7) * (H - 6);
    const line = pts.flatMap((r, i) => (r === null ? [] : [`${x(i)},${y(r)}`])).join(' ');
    return (
        <svg className="ce-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('title.form')}>
            <polyline points={line} fill="none" stroke="var(--yellow)" strokeWidth={2} />
            {pts.map((r, i) =>
                r === null ? null : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: uma bolinha por fase
                    <circle key={i} cx={x(i)} cy={y(r)} r={2.5} fill="var(--yellow)" />
                ),
            )}
        </svg>
    );
}

// ---------------------------------------------------------------------------------- raridade

/** Agregado público dos campeões (public/data/raridade.json, gerado pelo `npm run stats -- --raridade`). */
export interface Rarity {
    champions: number;
    /** speciesId → % dos times campeões com ele. */
    species: Record<string, number>;
}

export function useRarity(): Rarity | null {
    const [r, setR] = useState<Rarity | null>(null);
    useEffect(() => {
        let alive = true;
        fetch('data/raridade.json')
            .then((res) => (res.ok ? res.json() : null))
            .then((j: Rarity | null) => alive && j && j.champions >= 20 && setR(j))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return r;
}

/** O Pokémon mais raro entre os campeões (abaixo de 10%). */
function rarest(run: RunState, rarity: Rarity) {
    const squad = [...run.lineup, ...run.bench].map((u) => run.picks.find((p) => p.uid === u)).filter((p) => !!p);
    const best = squad
        .map((p) => ({ name: viewInstance(p!).displayName, pct: rarity.species[p!.speciesId] ?? 0 }))
        .sort((a, b) => a.pct - b.pct)[0];
    return best && best.pct < 10 ? { name: best.name, pct: Math.max(1, Math.round(best.pct)) } : null;
}
