import { useMemo, useState } from 'react';
import {
    computeAttributes,
    DEFAULT_FORMULAS,
    eligiblePositions,
    POSITION_LABEL,
    POSITIONS,
    type Position,
    type PositionFormulas,
    positionRating,
} from '../../engine/attributes';
import { SPECIES, type Species } from '../../engine/data';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';

/**
 * Laboratório de posições (?lab=posicoes): compara a regra atual com sugestões prontas de
 * distribuição de posições. O Miguel escolhe uma e ela é aplicada no jogo.
 */
interface Proposal {
    id: string;
    name: string;
    pitch: string;
    details: string[];
    formulas: PositionFormulas;
    recommended?: boolean;
}

// Pivô "trombador": no futsal o pivô segura a bola de costas pro gol, então força pesa tanto quanto o chute
const PIVO_TROMBADOR = { shooting: 35, strength: 35, dribble: 15, positioning: 15 };

const PROPOSALS: Proposal[] = [
    {
        id: 'atual',
        name: 'Como está hoje',
        pitch: 'A regra que está no jogo agora.',
        details: [
            'Muitos goleiros: todo Pokémon forte e resistente acaba no gol (Dragonite, Machamp, Blastoise).',
            'Pivô é raro: só 13 têm o Pivô como posição principal.',
        ],
        formulas: DEFAULT_FORMULAS,
    },
    {
        id: 'equilibrio',
        name: 'Equilíbrio',
        pitch: 'Menos goleiros, mais que o dobro de pivôs.',
        details: [
            'No gol ficam os grandões de verdade: Lapras, Snorlax, Gyarados, Slowbro e Rhydon.',
            'O Pivô vira o "trombador", que segura a bola de costas: força pesa tanto quanto o chute. Machamp, Dragonite, Moltres e Cloyster passam a ser pivôs.',
            'Fica perto da proporção de um time de futsal: 1 goleiro, 1 fixo, 2 alas e 1 pivô.',
        ],
        formulas: { ...DEFAULT_FORMULAS, PIVO: PIVO_TROMBADOR, bias: { GK: -4, PIVO: 2 } },
        recommended: true,
    },
    {
        id: 'goleiro',
        name: 'Só goleiro',
        pitch: 'Mexe só no gol: vai pra lá só quem é claramente melhor no gol.',
        details: ['Dragonite, Articuno, Blastoise e Golem viram fixos.', 'O Pivô continua raro.'],
        formulas: { ...DEFAULT_FORMULAS, bias: { GK: -4 } },
    },
    {
        id: 'pivo',
        name: 'Só pivô',
        pitch: 'Mexe só no ataque: mais pivôs, com o perfil "trombador".',
        details: ['Os novos pivôs saem dos alas e dos fixos.', 'O gol continua cheio, com uns 40 goleiros.'],
        formulas: { ...DEFAULT_FORMULAS, PIVO: PIVO_TROMBADOR, bias: { PIVO: 3 } },
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
    const [selected, setSelected] = useState('equilibrio');
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
                    <h1>Posições: qual você prefere?</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Separei 3 sugestões. Toque em cada uma pra ver quem muda de posição e me diga qual quer no jogo.
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
                            {p.recommended && <span className="lab-tag">Minha sugestão</span>}
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
                                        {d > 0 ? `+${d}` : d} vs hoje
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
