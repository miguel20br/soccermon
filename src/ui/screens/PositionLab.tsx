import { useMemo, useState } from 'react';
import {
    type AttrKey,
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
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { dict } from '../../i18n';
import { TIER_PT } from '../components/PokeCard';
import { PokeCard2 } from '../components/PokeCard2';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';
import {
    POSITION_REVIEW,
    type PositionReviewItem,
    REVIEW_DISTRIBUTION,
    REVIEW_EVO_DROPS,
    REVIEW_SNAKES,
    type ReviewCategory,
    type ReviewSnapshot,
} from './position-review';

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

/** Com &revisao=1 o laboratório vira a revisão dos suspeitos da auditoria (ok / mudar / copiar), igual à dos golpes. */
const REVIEW = new URLSearchParams(window.location.search).has('revisao');

export function PositionLab({ onExit }: { onExit: () => void }) {
    return REVIEW ? <PositionReview onExit={onExit} /> : <PositionCompare onExit={onExit} />;
}

function PositionCompare({ onExit }: { onExit: () => void }) {
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

// ---------------------------------------------------------------- revisão (?lab=posicoes&revisao=1)

const REVIEW_KEY = 'soccermon-position-review';
type Verdict = 'ok' | 'mudar';
type Review = Record<number, { verdict?: Verdict; note?: string }>;

const CAT_LABEL: Record<ReviewCategory, string> = {
    posicao: 'Posição',
    atributo: 'Atributo',
    evolucao: 'Evolução',
    'sem-lugar': 'Sem lugar bom',
};
const ATTR = dict('pt').common.attr;
const FIELD_STATS: AttrKey[] = ['pace', 'shooting', 'passing', 'dribble', 'tackling', 'strength'];
const GK_STATS: AttrKey[] = ['goalkeeping', 'positioning', 'strength', 'pace', 'passing', 'stamina'];
const NAME = new Map(SPECIES.map((sp) => [sp.id, sp.name]));

function loadReview(): Review {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_KEY) ?? '{}') as Review;
    } catch {
        return {};
    }
}

/** A carta de hoje, como sai no draft (sem shiny nem item). */
function reviewInstance(id: number) {
    return { ...createInstance(id, new Rng(`revisao-${id}`)), shiny: false, item: null };
}

const fitOf = (snap: ReviewSnapshot, p: Position) =>
    snap.eligible[0] === p ? 'principal' : snap.eligible.includes(p) ? 'secundária' : 'fora';

function Arrow({ a, b }: { a: number; b: number }) {
    return (
        <span className={`pr-arrow ${b > a ? 'up' : b < a ? 'down' : ''}`}>
            {a}
            {a !== b && <> ⇒ {b}</>}
        </span>
    );
}

function ReviewCard({
    it,
    rv,
    save,
}: {
    it: PositionReviewItem;
    rv?: Review[number];
    save: (patch: Review[number]) => void;
}) {
    const inst = useMemo(() => reviewInstance(it.id), [it.id]);
    const changed = Object.keys(it.delta) as AttrKey[];
    const base = it.after.eligible[0] === 'GK' ? GK_STATS : FIELD_STATS;
    const attrs = [...base, ...changed.filter((k) => !base.includes(k))];
    return (
        <article className={`panel pr-item${rv?.verdict ? ` done-${rv.verdict}` : ''}`}>
            <div className="pr-card">
                <PokeCard2 inst={inst} variant="metal" size="sm" />
            </div>
            <div className="pr-body">
                <header className="pr-head">
                    <h2>
                        <span className="muted">#{String(it.id).padStart(3, '0')}</span> {it.name}
                    </h2>
                    <span className="muted">
                        {TIER_PT[it.tier]} · BST {it.bst}
                    </span>
                    <span className="pr-cats">
                        {it.cats.map((c) => (
                            <span key={c} className={`pr-cat cat-${c}`}>
                                {CAT_LABEL[c]}
                            </span>
                        ))}
                    </span>
                </header>
                <p className="pr-reason">{it.reason}</p>
                <p className="pr-change">
                    <b>Sugestão:</b> {it.change}
                </p>
                <div className="pr-tables">
                    <table className="pr-table">
                        <thead>
                            <tr>
                                <th>Posição</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody>
                            {POSITIONS.map((p) => {
                                const f0 = fitOf(it.before, p);
                                const f1 = fitOf(it.after, p);
                                return (
                                    <tr
                                        key={p}
                                        className={`fit-${f1 === 'principal' ? 'main' : f1 === 'fora' ? 'off' : 'alt'}`}
                                    >
                                        <td>
                                            {POSITION_LABEL[p]}
                                            <small className="muted"> {f0 === f1 ? f1 : `${f0} ⇒ ${f1}`}</small>
                                        </td>
                                        <td>
                                            <Arrow a={it.before.slot[p]} b={it.after.slot[p]} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <table className="pr-table">
                        <thead>
                            <tr>
                                <th>Atributo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attrs.map((k) => (
                                <tr key={k} className={changed.includes(k) ? 'changed' : ''}>
                                    <td>{ATTR[k]}</td>
                                    <td>
                                        <Arrow a={it.before.attrs[k]} b={it.after.attrs[k]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {it.evo && (
                    <p className="pr-evo">
                        <b>Evolução</b> ({POSITION_LABEL[it.evo.pos]}): {NAME.get(it.evo.from)} {it.evo.before[0]} →{' '}
                        {NAME.get(it.evo.to)} {it.evo.before[1]}
                        {(it.evo.after[0] !== it.evo.before[0] || it.evo.after[1] !== it.evo.before[1]) && (
                            <>
                                {' '}
                                ⇒ {it.evo.after[0]} → {it.evo.after[1]}
                            </>
                        )}
                    </p>
                )}
                <div className="ml-review">
                    <div className="row" style={{ gap: 6 }}>
                        <button
                            type="button"
                            className={`btn small${rv?.verdict === 'ok' ? ' active' : ''}`}
                            onClick={() => save({ verdict: 'ok' })}
                        >
                            Ok
                        </button>
                        <button
                            type="button"
                            className={`btn small outline${rv?.verdict === 'mudar' ? ' active' : ''}`}
                            onClick={() => save({ verdict: 'mudar' })}
                        >
                            Mudar
                        </button>
                    </div>
                    {(rv?.verdict === 'mudar' || rv?.note) && (
                        <textarea
                            placeholder="O que mudar? (ex.: não adicionar Goleiro, só a força)"
                            value={rv?.note ?? ''}
                            onChange={(e) => save({ note: e.target.value })}
                        />
                    )}
                </div>
            </div>
        </article>
    );
}

function DistTable({ title, rows }: { title: string; rows: [string, string][] }) {
    const { before, after } = REVIEW_DISTRIBUTION;
    const table = title === 'Raridade' ? 'tiers' : 'metals';
    return (
        <table className="pr-table pr-dist">
            <thead>
                <tr>
                    <th>{title}</th>
                    {POSITIONS.map((p) => (
                        <th key={p}>{POSITION_LABEL[p]}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map(([key, label]) => (
                    <tr key={key}>
                        <td>{label}</td>
                        {POSITIONS.map((p) => (
                            <td key={p}>
                                <Arrow
                                    a={(before[table] as Record<string, Record<Position, number>>)[key]?.[p] ?? 0}
                                    b={(after[table] as Record<string, Record<Position, number>>)[key]?.[p] ?? 0}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function PositionReview({ onExit }: { onExit: () => void }) {
    const [review, setReview] = useState<Review>(loadReview);
    const [cat, setCat] = useState<ReviewCategory | ''>('');
    const [copied, setCopied] = useState(false);

    const save = (id: number, patch: Review[number]) => {
        setReview((prev) => {
            const next = { ...prev, [id]: { ...prev[id], ...patch } };
            try {
                localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
            } catch {
                // modo privado: a revisão vale só enquanto a aba estiver aberta
            }
            return next;
        });
    };
    const reviewed = POSITION_REVIEW.filter((it) => review[it.id]?.verdict).length;
    const copy = async () => {
        const lines = POSITION_REVIEW.filter((it) => review[it.id]?.verdict || review[it.id]?.note).map((it) => {
            const rv = review[it.id];
            return `${it.name} (#${it.id}): ${rv.verdict === 'mudar' ? 'MUDAR' : rv.verdict === 'ok' ? 'ok' : 'sem veredito'}${rv.note ? ` — ${rv.note}` : ''}`;
        });
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };
    const list = cat ? POSITION_REVIEW.filter((it) => it.cats.includes(cat)) : POSITION_REVIEW;

    return (
        <div className="lab pr">
            <div className="draft-head">
                <div>
                    <div className="muted">Balanceamento · revisão</div>
                    <h1>Posições e atributos: {POSITION_REVIEW.length} suspeitos</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        A carta é a de hoje. Notas por vaga como a carta mostra (antes ⇒ depois da sugestão). Nada foi
                        aplicado no jogo.
                    </p>
                </div>
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
            </div>

            <div className="panel pr-tools">
                <div className="pr-filters">
                    <button
                        type="button"
                        className={`btn small${cat === '' ? ' active' : ''}`}
                        onClick={() => setCat('')}
                    >
                        Todos
                    </button>
                    {(Object.keys(CAT_LABEL) as ReviewCategory[]).map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={`btn small${cat === c ? ' active' : ''}`}
                            onClick={() => setCat(cat === c ? '' : c)}
                        >
                            {CAT_LABEL[c]} · {POSITION_REVIEW.filter((it) => it.cats.includes(c)).length}
                        </button>
                    ))}
                </div>
                <div className="row" style={{ gap: 8 }}>
                    <span className="muted">
                        Revisados: {reviewed} de {POSITION_REVIEW.length}
                    </span>
                    <button type="button" className="btn small primary" onClick={copy}>
                        {copied ? 'Copiado!' : 'Copiar revisão'}
                    </button>
                </div>
            </div>

            {list.map((it) => (
                <ReviewCard key={it.id} it={it} rv={review[it.id]} save={(patch) => save(it.id, patch)} />
            ))}

            <details className="panel pr-more">
                <summary>Distribuição: posição principal por raridade e metal</summary>
                <p className="muted">Quantos têm cada posição como principal, hoje ⇒ com todas as sugestões.</p>
                <div className="pr-tables">
                    <DistTable
                        title="Raridade"
                        rows={(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((t) => [
                            t,
                            TIER_PT[t],
                        ])}
                    />
                    <DistTable
                        title="Metal"
                        rows={[
                            ['bronze', 'Bronze'],
                            ['prata', 'Prata'],
                            ['ouro', 'Ouro'],
                        ]}
                    />
                </div>
            </details>

            <details className="panel pr-more">
                <summary>Proposta de fórmula: a evolução herda a vaga</summary>
                <p className="muted">
                    Em vez de posição extra caso a caso: a forma evoluída ganha como secundária a vaga em que estava
                    jogando. Resolve todas as quedas abaixo de uma vez (hoje ⇒ com a regra).
                </p>
                <table className="pr-table">
                    <tbody>
                        {REVIEW_EVO_DROPS.map((d) => (
                            <tr key={`${d.from}-${d.pos}`}>
                                <td>
                                    {d.from} → {d.to}{' '}
                                    <small className="muted">{POSITION_LABEL[d.pos as Position]}</small>
                                </td>
                                <td>
                                    {d.now[0]} → <Arrow a={d.now[1]} b={d.inherit[1]} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>

            <details className="panel pr-more">
                <summary>Proposta de fórmula: serpente mede o porte pelo peso</summary>
                <p className="muted">
                    Hoje o porte é metade peso, metade altura, e a altura da serpente é comprimento: Ekans (7 kg, 2 m)
                    conta como grande e perde drible. Só pelo peso (nota principal hoje ⇒ com a regra):
                </p>
                <table className="pr-table">
                    <tbody>
                        {REVIEW_SNAKES.map((s) => (
                            <tr key={s.name}>
                                <td>{s.name}</td>
                                <td>
                                    {POSITION_LABEL[s.before[0] as Position]}{' '}
                                    {s.before[0] !== s.after[0] && <>⇒ {POSITION_LABEL[s.after[0] as Position]} </>}
                                    <Arrow a={s.before[1] as number} b={s.after[1] as number} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}
