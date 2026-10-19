import { useState } from 'react';
import type { Position } from '../../engine/attributes';
import type { PlayerLine } from '../../engine/match-stats';
import type { Dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { HudIcon } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { awayC, homeC } from './StatsCharts';

type Col = {
    key: string;
    label: string;
    title: string;
    value: (p: PlayerLine) => number;
    show?: (p: PlayerLine) => string;
};

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Colunas da tabela no idioma do jogo. */
function columns(c: Dict['stats']['table']['col']): Col[] {
    return [
        {
            key: 'rating',
            label: c.rating,
            title: c.ratingTitle,
            value: (p) => p.rating,
            show: (p) => p.rating.toFixed(1),
        },
        { key: 'min', label: c.min, title: c.minTitle, value: (p) => p.minutes },
        { key: 'g', label: c.goals, title: c.goalsTitle, value: (p) => p.stats.goals },
        { key: 'a', label: c.assists, title: c.assistsTitle, value: (p) => p.stats.assists },
        {
            key: 'sh',
            label: c.shots,
            title: c.shotsTitle,
            value: (p) => p.stats.shots,
            show: (p) => `${p.stats.shots} (${p.stats.shotsOnTarget})`,
        },
        {
            key: 'pass',
            label: c.passes,
            title: c.passesTitle,
            value: (p) => p.stats.passesCompleted,
            show: (p) =>
                `${p.stats.passesCompleted}/${p.stats.passes} · ${pct(p.stats.passesCompleted, p.stats.passes)}%`,
        },
        {
            key: 'tk',
            label: c.tackles,
            title: c.tacklesTitle,
            value: (p) => p.stats.tacklesWon,
            show: (p) => `${p.stats.tacklesWon}/${p.stats.tackles}`,
        },
        { key: 'int', label: c.int, title: c.intTitle, value: (p) => p.stats.interceptions },
        { key: 'sv', label: c.saves, title: c.savesTitle, value: (p) => p.stats.saves },
        { key: 'mv', label: c.moves, title: c.movesTitle, value: (p) => p.stats.movesUsed },
        {
            key: 'km',
            label: c.ran,
            title: c.ranTitle,
            value: (p) => p.distance,
            show: (p) => `${p.distance} m`,
        },
        {
            key: 'en',
            label: c.stamina,
            title: c.staminaTitle,
            value: (p) => p.energy,
            show: (p) => `${Math.round(p.energy * 100)}%`,
        },
    ];
}

const ratingClass = (r: number) => (r >= 8 ? 'top' : r >= 7 ? 'good' : r >= 6 ? 'ok' : 'low');

/** Tabela de todos que jogaram, ordenável por qualquer coluna (toque no cabeçalho). */
export function PlayerTable({ lines, names }: { lines: PlayerLine[]; names: [string, string] }) {
    const { t, d } = useT();
    const COLS = columns(d.stats.table.col);
    const [team, setTeam] = useState<0 | 1 | 'all'>(0);
    const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: 'rating', desc: true });
    const col = COLS.find((c) => c.key === sort.key) ?? COLS[0];
    const rows = lines
        .filter((p) => team === 'all' || p.team === team)
        .sort((a, b) => (sort.desc ? col.value(b) - col.value(a) : col.value(a) - col.value(b)));
    return (
        <div className="st-table-wrap">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {([0, 1, 'all'] as const).map((tm) => (
                    <button
                        key={String(tm)}
                        type="button"
                        className={`btn small${team === tm ? ' active' : ''}`}
                        onClick={() => setTeam(tm)}
                    >
                        {tm === 'all' ? t('stats.table.all') : names[tm]}
                    </button>
                ))}
            </div>
            <div className="st-table-scroll">
                <table className="st-table">
                    <thead>
                        <tr>
                            <th className="st-name">{t('stats.cup.col.pokemon')}</th>
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
                                        {sort.key === c.key && (
                                            <HudIcon kind={sort.desc ? 'down' : 'up'} className="st-sort" />
                                        )}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.uid}>
                                <td className="st-name">
                                    <i style={{ background: p.team === 0 ? homeC() : awayC() }} />
                                    <img
                                        className="pixel"
                                        src={cardSprite({ speciesId: p.speciesId, shiny: p.shiny })}
                                        alt=""
                                    />
                                    <span>
                                        {p.name}
                                        <small>{d.common.pos[p.role as Position] ?? p.role}</small>
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
