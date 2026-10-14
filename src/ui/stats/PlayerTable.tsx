import { useState } from 'react';
import { POSITION_LABEL, type Position } from '../../engine/attributes';
import type { PlayerLine } from '../../engine/match-stats';
import { cardSprite } from '../components/PokeCard';
import { AWAY_C, HOME_C } from './StatsCharts';

type Col = {
    key: string;
    label: string;
    title: string;
    value: (p: PlayerLine) => number;
    show?: (p: PlayerLine) => string;
};

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

const COLS: Col[] = [
    {
        key: 'rating',
        label: 'Nota',
        title: 'Nota de 0 a 10 (6 = partida normal)',
        value: (p) => p.rating,
        show: (p) => p.rating.toFixed(1),
    },
    { key: 'min', label: 'Min', title: 'Minutos em campo', value: (p) => p.minutes },
    { key: 'g', label: 'G', title: 'Gols', value: (p) => p.stats.goals },
    { key: 'a', label: 'A', title: 'Assistências', value: (p) => p.stats.assists },
    {
        key: 'sh',
        label: 'Chutes',
        title: 'Chutes (no gol)',
        value: (p) => p.stats.shots,
        show: (p) => `${p.stats.shots} (${p.stats.shotsOnTarget})`,
    },
    {
        key: 'pass',
        label: 'Passes',
        title: 'Passes certos / tentados',
        value: (p) => p.stats.passesCompleted,
        show: (p) => `${p.stats.passesCompleted}/${p.stats.passes} · ${pct(p.stats.passesCompleted, p.stats.passes)}%`,
    },
    {
        key: 'tk',
        label: 'Desarmes',
        title: 'Desarmes certos / tentados',
        value: (p) => p.stats.tacklesWon,
        show: (p) => `${p.stats.tacklesWon}/${p.stats.tackles}`,
    },
    { key: 'int', label: 'Intercep.', title: 'Interceptações', value: (p) => p.stats.interceptions },
    { key: 'sv', label: 'Defesas', title: 'Defesas', value: (p) => p.stats.saves },
    { key: 'mv', label: 'Golpes', title: 'Golpes usados', value: (p) => p.stats.movesUsed },
    {
        key: 'km',
        label: 'Correu',
        title: 'Distância percorrida',
        value: (p) => p.distance,
        show: (p) => `${p.distance} m`,
    },
    {
        key: 'en',
        label: 'Fôlego',
        title: 'Fôlego no fim',
        value: (p) => p.energy,
        show: (p) => `${Math.round(p.energy * 100)}%`,
    },
];

const ratingClass = (r: number) => (r >= 8 ? 'top' : r >= 7 ? 'good' : r >= 6 ? 'ok' : 'low');

/** Tabela de todos que jogaram, ordenável por qualquer coluna (toque no cabeçalho). */
export function PlayerTable({ lines, names }: { lines: PlayerLine[]; names: [string, string] }) {
    const [team, setTeam] = useState<0 | 1 | 'all'>(0);
    const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: 'rating', desc: true });
    const col = COLS.find((c) => c.key === sort.key) ?? COLS[0];
    const rows = lines
        .filter((p) => team === 'all' || p.team === team)
        .sort((a, b) => (sort.desc ? col.value(b) - col.value(a) : col.value(a) - col.value(b)));
    return (
        <div className="st-table-wrap">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {([0, 1, 'all'] as const).map((t) => (
                    <button
                        key={String(t)}
                        type="button"
                        className={`btn small${team === t ? ' active' : ''}`}
                        onClick={() => setTeam(t)}
                    >
                        {t === 'all' ? 'Todos' : names[t]}
                    </button>
                ))}
            </div>
            <div className="st-table-scroll">
                <table className="st-table">
                    <thead>
                        <tr>
                            <th className="st-name">Pokémon</th>
                            {COLS.map((c) => (
                                <th key={c.key} title={c.title}>
                                    <button
                                        type="button"
                                        className={sort.key === c.key ? 'on' : ''}
                                        onClick={() =>
                                            setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : true }))
                                        }
                                    >
                                        {c.label}
                                        {sort.key === c.key ? (sort.desc ? ' ▼' : ' ▲') : ''}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.uid}>
                                <td className="st-name">
                                    <i style={{ background: p.team === 0 ? HOME_C : AWAY_C }} />
                                    <img
                                        className="pixel"
                                        src={cardSprite({ speciesId: p.speciesId, shiny: false })}
                                        alt=""
                                    />
                                    <span>
                                        {p.name}
                                        <small>{POSITION_LABEL[p.role as Position] ?? p.role}</small>
                                    </span>
                                </td>
                                {COLS.map((c) => (
                                    <td key={c.key}>
                                        {c.key === 'rating' ? (
                                            <span className={`st-rating ${ratingClass(p.rating)}`}>
                                                {p.rating.toFixed(1)}
                                            </span>
                                        ) : (
                                            (c.show?.(p) ?? c.value(p))
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
