import { useMemo, useState } from 'react';
import {
    computeAttributes,
    DEFAULT_FORMULAS,
    eligiblePositions,
    FORMULAS_V04,
    POSITION_LABEL,
    POSITIONS,
    type Position,
    type PositionFormulas,
    positionRating,
} from '../../engine/attributes';
import { SPECIES, type Species } from '../../engine/data';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';

/**
 * Laboratório de posições (?lab=posicoes): compara a regra da v0.4 (só stats) com a atual
 * (stats + físico), mostrando quem mudou de posição e os melhores de cada uma.
 */
interface Proposal {
    id: string;
    name: string;
    pitch: string;
    details: string[];
    formulas: PositionFormulas;
}

const PROPOSALS: Proposal[] = [
    {
        id: 'v04',
        name: 'Antes (v0.4)',
        pitch: 'Posição só pelos stats.',
        details: [
            'Muitos goleiros: todo Pokémon forte e resistente acabava no gol.',
            'Pivô raro: só 13 tinham o Pivô como posição principal.',
        ],
        formulas: FORMULAS_V04,
    },
    {
        id: 'v05',
        name: 'Agora (v0.5): stats + físico',
        pitch: 'O corpo do Pokémon conta: porte e formato.',
        details: [
            'Quem tem mãos ou braços defende melhor: Snorlax, Machamp, Muk, Poliwrath e Hypno são goleiros.',
            'Sem mãos é ruim no gol: quadrúpedes, aves e peixes (Magikarp no gol, nunca).',
            'Pequenos driblam melhor, gigantes pior. Quem tem várias cabeças (Doduo, Exeggutor, Magneton) enxerga o passe.',
            'Pivô "trombador": força pesa tanto quanto o chute.',
            'Ditto joga em qualquer posição.',
        ],
        formulas: DEFAULT_FORMULAS,
    },
];

// proporção de um time de futsal (1-1-2-1) aplicada aos 151
const IDEAL: Record<Position, number> = { GK: 30, FIXO: 30, ALA: 60, PIVO: 30 };

interface Row {
    sp: Species;
    main: Position;
    ratings: Record<Position, number>;
}

function evaluate(formulas: PositionFormulas): Row[] {
    return SPECIES.map((sp) => {
        const a = computeAttributes(sp, 50, formulas);
        const ratings = Object.fromEntries(POSITIONS.map((p) => [p, positionRating(a, p, formulas)])) as Record<
            Position,
            number
        >;
        return { sp, main: eligiblePositions(a, sp.id, formulas)[0], ratings };
    });
}

const countMain = (rows: Row[]) =>
    Object.fromEntries(POSITIONS.map((p) => [p, rows.filter((r) => r.main === p).length])) as Record<Position, number>;

function Mon({ r, pos, note }: { r: Row; pos: Position; note?: string }) {
    return (
        <div className="lab-mon">
            <img className="pixel" src={`assets/cards/${r.sp.id}.gif`} alt="" loading="lazy" />
            <span className="lab-mon-name">
                {r.sp.name}
                {note && <small className="muted"> {note}</small>}
            </span>
            <span className="lab-mon-types">
                {r.sp.types.map((t) => (
                    <i key={t} title={TYPE_PT[t] ?? t} style={{ background: TYPE_COLOR[t] }} />
                ))}
            </span>
            <b>{r.ratings[pos]}</b>
        </div>
    );
}

export function PositionLab({ onExit }: { onExit: () => void }) {
    const [selected, setSelected] = useState('v05');
    const [showAll, setShowAll] = useState(false);

    const results = useMemo(() => PROPOSALS.map((p) => ({ p, rows: evaluate(p.formulas) })), []);
    const base = results[0].rows;
    const current = results.find((x) => x.p.id === selected) ?? results[0];
    const counts = countMain(current.rows);
    const baseCounts = countMain(base);
    const changes = current.rows.filter((r, i) => r.main !== base[i].main);

    return (
        <div className="lab">
            <div className="draft-head">
                <div>
                    <div className="muted">Balanceamento</div>
                    <h1>Posições: antes e depois</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Compare a regra antiga com a nova: quem mudou de posição e os melhores de cada uma.
                    </p>
                </div>
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
            </div>

            <div className="lab-proposals">
                {results.map(({ p, rows }) => {
                    const c = countMain(rows);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            className={`panel lab-proposal${p.id === selected ? ' selected' : ''}`}
                            onClick={() => setSelected(p.id)}
                        >
                            <h2>{p.name}</h2>
                            <p>{p.pitch}</p>
                            <div className="lab-bar">
                                {POSITIONS.map((pos) => (
                                    <span key={pos} className={`lab-pos-${pos}`} style={{ flex: c[pos] }}>
                                        {c[pos]}
                                    </span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="lab-legend muted">
                {POSITIONS.map((pos) => (
                    <span key={pos}>
                        <i className={`lab-pos-${pos}`} /> {POSITION_LABEL[pos]}
                    </span>
                ))}
                <span>· quantos dos 151 têm essa posição como principal</span>
            </div>

            <div className="panel">
                <h2>{current.p.name}</h2>
                <ul className="lab-details">
                    {current.p.details.map((d) => (
                        <li key={d}>{d}</li>
                    ))}
                </ul>
                <div className="lab-counts">
                    {POSITIONS.map((pos) => {
                        const d = counts[pos] - baseCounts[pos];
                        return (
                            <div key={pos} className="lab-count">
                                <span className="muted">{POSITION_LABEL[pos]}</span>
                                <b>{counts[pos]}</b>
                                {d !== 0 && (
                                    <span className={`lab-delta ${d > 0 ? 'up' : 'down'}`}>
                                        {d > 0 ? `+${d}` : d} vs v0.4
                                    </span>
                                )}
                                <small className="muted">ideal ≈ {IDEAL[pos]}</small>
                            </div>
                        );
                    })}
                </div>
            </div>

            {changes.length > 0 && (
                <div className="panel">
                    <h2>Quem muda de posição ({changes.length})</h2>
                    <div className="lab-columns">
                        {POSITIONS.map((pos) => {
                            const moved = changes.filter((r) => r.main === pos);
                            return (
                                <div key={pos} className="lab-col">
                                    <h3>
                                        Viram {POSITION_LABEL[pos]} · {moved.length}
                                    </h3>
                                    {moved.map((r) => (
                                        <Mon
                                            key={r.sp.id}
                                            r={r}
                                            pos={pos}
                                            note={`(era ${POSITION_LABEL[base[SPECIES.indexOf(r.sp)].main]})`}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="panel">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0 }}>Os melhores de cada posição</h2>
                    <button type="button" className="btn small ghost" onClick={() => setShowAll((v) => !v)}>
                        {showAll ? 'Mostrar só os 10 melhores' : 'Mostrar todos'}
                    </button>
                </div>
                <div className="lab-columns">
                    {POSITIONS.map((pos) => {
                        const list = current.rows
                            .filter((r) => r.main === pos)
                            .sort((a, b) => b.ratings[pos] - a.ratings[pos]);
                        return (
                            <div key={pos} className="lab-col">
                                <h3>
                                    {POSITION_LABEL[pos]} · {list.length}
                                </h3>
                                {(showAll ? list : list.slice(0, 10)).map((r) => (
                                    <Mon key={r.sp.id} r={r} pos={pos} />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
