import { useMemo, useState } from 'react';
import {
    type AttrKey,
    computeAttributes,
    DEFAULT_FORMULAS,
    eligiblePositions,
    type GoalkeepingInput,
    POSITION_LABEL,
    POSITIONS,
    type Position,
    type PositionFormulas,
    positionRating,
} from '../../engine/attributes';
import { SPECIES, type Species } from '../../engine/data';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';

/**
 * Laboratório de posições (?lab=posicoes): o Miguel mexe nos pesos das fórmulas e vê na hora
 * a distribuição, as listas de cada posição e quem muda. "Copiar configuração" gera o JSON para aplicar no jogo.
 */
const STORAGE_KEY = 'soccermon-lab-formulas';

const GK_INPUTS: [GoalkeepingInput, string][] = [
    ['hp', 'HP'],
    ['def', 'Defense'],
    ['spd', 'Sp. Def'],
    ['size', 'Tamanho (peso + altura)'],
    ['spe', 'Speed'],
    ['atk', 'Attack'],
    ['spa', 'Sp. Atk'],
];
const FIELD_INPUTS: [AttrKey, string][] = [
    ['pace', 'Velocidade'],
    ['dribble', 'Drible'],
    ['shooting', 'Chute'],
    ['passing', 'Passe'],
    ['tackling', 'Desarme'],
    ['strength', 'Força'],
    ['positioning', 'Leitura'],
    ['stamina', 'Fôlego'],
];

interface Row {
    sp: Species;
    eligible: Position[];
    ratings: Record<Position, number>;
}

function evaluate(formulas: PositionFormulas): Row[] {
    return SPECIES.map((sp) => {
        const a = computeAttributes(sp, 50, formulas);
        const ratings = Object.fromEntries(POSITIONS.map((p) => [p, positionRating(a, p, formulas)])) as Record<
            Position,
            number
        >;
        return { sp, eligible: eligiblePositions(a, sp.id, formulas), ratings };
    });
}

function summary(rows: Row[]) {
    return Object.fromEntries(
        POSITIONS.map((p) => {
            const list = rows.filter((r) => r.eligible.includes(p));
            return [
                p,
                {
                    main: rows.filter((r) => r.eligible[0] === p).length,
                    eligible: list.length,
                    avg: Math.round(list.reduce((s, r) => s + r.ratings[p], 0) / Math.max(1, list.length)),
                    elite: list.filter((r) => r.ratings[p] >= 80).length,
                },
            ];
        }),
    ) as Record<Position, { main: number; eligible: number; avg: number; elite: number }>;
}

function loadSaved(): PositionFormulas {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return { ...DEFAULT_FORMULAS, ...JSON.parse(raw) };
    } catch {
        // sem localStorage: começa do padrão
    }
    return structuredClone(DEFAULT_FORMULAS);
}

const pct = (weights: Record<string, number | undefined>, key: string) => {
    const total = Object.values(weights).reduce((s: number, v) => s + (v ?? 0), 0);
    return total > 0 ? Math.round(((weights[key] ?? 0) / total) * 100) : 0;
};

function Delta({ now, before }: { now: number; before: number }) {
    const d = now - before;
    if (d === 0) return null;
    return <span className={`lab-delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? `+${d}` : d}</span>;
}

export function PositionLab({ onExit }: { onExit: () => void }) {
    const [formulas, setFormulas] = useState<PositionFormulas>(loadSaved);
    const [onlyMain, setOnlyMain] = useState(true);
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState(false);

    const baseRows = useMemo(() => evaluate(DEFAULT_FORMULAS), []);
    const rows = useMemo(() => evaluate(formulas), [formulas]);
    const base = useMemo(() => summary(baseRows), [baseRows]);
    const now = useMemo(() => summary(rows), [rows]);
    const changes = rows.filter((r, i) => r.eligible[0] !== baseRows[i].eligible[0]);

    const update = (next: PositionFormulas) => {
        setFormulas(next);
        setCopied(false);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ok sem persistência
        }
    };
    const setWeight = (group: 'goalkeeping' | 'FIXO' | 'ALA' | 'PIVO', key: string, value: number) =>
        update({ ...formulas, [group]: { ...formulas[group], [key]: value } });

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(formulas, null, 2));
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    const q = search.trim().toLowerCase();
    const groups: { key: 'goalkeeping' | 'FIXO' | 'ALA' | 'PIVO'; title: string; inputs: [string, string][] }[] = [
        { key: 'goalkeeping', title: 'Goleiro (atributo, a partir dos stats base)', inputs: GK_INPUTS },
        { key: 'FIXO', title: 'Fixo', inputs: FIELD_INPUTS },
        { key: 'ALA', title: 'Ala', inputs: FIELD_INPUTS },
        { key: 'PIVO', title: 'Pivô', inputs: FIELD_INPUTS },
    ];

    return (
        <div className="lab">
            <div className="draft-head">
                <div>
                    <div className="muted">Ferramenta de balanceamento</div>
                    <h1>Laboratório de posições</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Mexa nos pesos e veja na hora como os 151 se distribuem. Os pesos são relativos (contam em %).
                    </p>
                </div>
                <div className="row">
                    <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => update(structuredClone(DEFAULT_FORMULAS))}
                    >
                        Restaurar padrão
                    </button>
                    <button type="button" className="btn small yellow" onClick={copy}>
                        {copied ? 'Copiado!' : 'Copiar configuração'}
                    </button>
                    <button type="button" className="btn small" onClick={onExit}>
                        Sair
                    </button>
                </div>
            </div>

            <div className="lab-grid">
                <div className="panel lab-controls">
                    {groups.map((g) => (
                        <fieldset key={g.key} className="lab-group">
                            <legend>{g.title}</legend>
                            {g.inputs.map(([key, label]) => {
                                const weights = formulas[g.key] as Record<string, number | undefined>;
                                const v = weights[key] ?? 0;
                                return (
                                    <label key={key} className={`lab-slider${v ? '' : ' off'}`}>
                                        <span>{label}</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={60}
                                            step={5}
                                            value={v}
                                            onChange={(e) => setWeight(g.key, key, Number(e.target.value))}
                                        />
                                        <b>{pct(weights, key)}%</b>
                                    </label>
                                );
                            })}
                        </fieldset>
                    ))}
                    <fieldset className="lab-group">
                        <legend>Elegibilidade</legend>
                        <label className="lab-slider">
                            <span>Margem (pontos da melhor nota)</span>
                            <input
                                type="range"
                                min={0}
                                max={10}
                                step={1}
                                value={formulas.margin}
                                onChange={(e) => update({ ...formulas, margin: Number(e.target.value) })}
                            />
                            <b>{formulas.margin}</b>
                        </label>
                        <label className="lab-slider">
                            <span>Máximo de posições</span>
                            <input
                                type="range"
                                min={1}
                                max={4}
                                step={1}
                                value={formulas.maxPositions}
                                onChange={(e) => update({ ...formulas, maxPositions: Number(e.target.value) })}
                            />
                            <b>{formulas.maxPositions}</b>
                        </label>
                    </fieldset>
                </div>

                <div className="lab-results">
                    <div className="panel">
                        <h2>Distribuição</h2>
                        <table className="stats-table lab-table">
                            <thead>
                                <tr>
                                    <th>Posição</th>
                                    <th>Principal</th>
                                    <th>Elegíveis</th>
                                    <th>Média</th>
                                    <th>Nota ≥ 80</th>
                                </tr>
                            </thead>
                            <tbody>
                                {POSITIONS.map((p) => (
                                    <tr key={p}>
                                        <td>{POSITION_LABEL[p]}</td>
                                        <td>
                                            {now[p].main} <Delta now={now[p].main} before={base[p].main} />
                                        </td>
                                        <td>
                                            {now[p].eligible} <Delta now={now[p].eligible} before={base[p].eligible} />
                                        </td>
                                        <td>
                                            {now[p].avg} <Delta now={now[p].avg} before={base[p].avg} />
                                        </td>
                                        <td>
                                            {now[p].elite} <Delta now={now[p].elite} before={base[p].elite} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="tactic-desc">Números pequenos = diferença para a configuração atual do jogo.</p>
                    </div>

                    <div className="panel">
                        <h2>Mudaram de posição principal ({changes.length})</h2>
                        {changes.length === 0 ? (
                            <p className="muted">Nenhum: igual ao jogo atual.</p>
                        ) : (
                            <div className="lab-changes">
                                {changes.map((r) => {
                                    const i = rows.indexOf(r);
                                    return (
                                        <span key={r.sp.id} className="lab-change">
                                            <img
                                                className="pixel"
                                                src={`assets/cards/${r.sp.id}.gif`}
                                                alt=""
                                                loading="lazy"
                                            />
                                            <b>{r.sp.name}</b> {POSITION_LABEL[baseRows[i].eligible[0]]} →{' '}
                                            <b>{POSITION_LABEL[r.eligible[0]]}</b>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="panel">
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0 }}>Pokémon por posição</h2>
                            <div className="row">
                                <input
                                    className="team-name-input lab-search"
                                    placeholder="Buscar Pokémon ou tipo…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={`btn small${onlyMain ? ' active' : ''}`}
                                    onClick={() => setOnlyMain(true)}
                                >
                                    Só principal
                                </button>
                                <button
                                    type="button"
                                    className={`btn small${!onlyMain ? ' active' : ''}`}
                                    onClick={() => setOnlyMain(false)}
                                >
                                    Todas elegíveis
                                </button>
                            </div>
                        </div>
                        <div className="lab-columns">
                            {POSITIONS.map((p) => {
                                const list = rows
                                    .filter((r) => (onlyMain ? r.eligible[0] === p : r.eligible.includes(p)))
                                    .sort((a, b) => b.ratings[p] - a.ratings[p]);
                                return (
                                    <div key={p} className="lab-col">
                                        <h3>
                                            {POSITION_LABEL[p]} · {list.length}
                                        </h3>
                                        {list.map((r) => {
                                            const match =
                                                q &&
                                                (r.sp.name.toLowerCase().includes(q) ||
                                                    r.sp.types.some((t) =>
                                                        (TYPE_PT[t] ?? t).toLowerCase().includes(q),
                                                    ));
                                            return (
                                                <div key={r.sp.id} className={`lab-mon${match ? ' hit' : ''}`}>
                                                    <img
                                                        className="pixel"
                                                        src={`assets/cards/${r.sp.id}.gif`}
                                                        alt=""
                                                        loading="lazy"
                                                    />
                                                    <span className="lab-mon-name">{r.sp.name}</span>
                                                    <span className="lab-mon-types">
                                                        {r.sp.types.map((t) => (
                                                            <i
                                                                key={t}
                                                                title={TYPE_PT[t] ?? t}
                                                                style={{ background: TYPE_COLOR[t] }}
                                                            />
                                                        ))}
                                                    </span>
                                                    <b>{r.ratings[p]}</b>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
