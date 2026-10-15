import Phaser from 'phaser';
import { type CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES, SPECIES_BY_ID, type Species } from '../../engine/data';
import { DRAIN, SPECIAL_EXPLAIN } from '../../engine/moves';
import { EventBus } from '../../game/EventBus';
import type { FxStyle } from '../../game/move-fx';
import { LAB_H, LAB_W, MoveLabScene } from '../../game/scenes/MoveLabScene';
import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';
import { TypeIcon, TypeIcons } from '../components/TypeIcon';
import { GdxIcon } from '../golpedex/GdxIcon';
import {
    ALL_ROWS,
    GAME_ROWS,
    MOVESET,
    type MoveRow,
    norm,
    pad3,
    ROW_BY_ID,
    timesSeen,
} from '../golpedex/golpedex-data';
import '../golpedex/golpedex.css';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';

/**
 * Golpedex (?lab=golpes): todos os golpes do jogo, descobertos como numa Pokédex. Um golpe aparece quando
 * alguém usa em campo numa partida sua; descoberto, mostra a animação da partida, o que faz e quem usa.
 * Dá para navegar por golpe ou por Pokémon. Com &revisao=1 tudo fica revelado e volta a ferramenta de
 * revisão do Miguel (ok/mudar + anotação, salva no navegador, "Copiar revisão").
 */
const KIND_PT: Record<string, string> = {
    strike: 'Físico: chute potente com a bola, carrinho forte sem ela',
    blast: 'Especial: finalização de longe ou chute colocado',
    burst: 'Arrancada (velocidade)',
    buff: 'Reforço: sobe atributos por um tempo',
    debuff: 'Baixa um atributo do rival perto',
    status: 'Status no rival perto (paralisia, sono, veneno, confusão)',
    heal: 'Recupera fôlego',
    flavor: 'Só narração (não faz nada)',
    special: 'Efeito especial',
};

const KIND_SHORT: Record<string, string> = {
    strike: 'Físico',
    blast: 'Especial',
    burst: 'Arrancada',
    buff: 'Reforço',
    debuff: 'Enfraquece',
    status: 'Status',
    heal: 'Cura',
    flavor: 'Narração',
    special: 'Especial',
};

const STYLE_PT: Record<FxStyle, string> = {
    projectile: 'Projétil',
    beam: 'Raio',
    stream: 'Jato',
    sky: 'Do céu',
    quake: 'Terremoto',
    explosion: 'Explosão',
    wave: 'Onda',
    melee: 'Corpo a corpo',
    sound: 'Som',
    cloud: 'Nuvem',
    aura: 'Aura',
};

/** Alvo padrão: um boneco grande e neutro. */
const DUMMY = 143;
const REVIEW_KEY = 'soccermon-move-review';
const AUTOPLAY_MS = 2200;
const LOCKED_HINT = 'Aparece quando alguém usar em campo numa partida sua';

/** Ferramenta de revisão (ok / mudar / copiar) e tudo revelado: só com &revisao=1. */
const REVIEW = new URLSearchParams(window.location.search).has('revisao');

type Verdict = 'ok' | 'mudar';
type Review = Record<string, { verdict?: Verdict; note?: string }>;
type Status = 'todos' | 'descobertos' | 'faltam';
type View = 'golpe' | 'pokemon';

function loadReview(): Review {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_KEY) ?? '{}') as Review;
    } catch {
        return {};
    }
}

/** O save vem do IndexedDB depois do primeiro render: espera para não piscar o "comece a jogar". */
function useHydrated() {
    const [done, setDone] = useState(() => useGame.persist.hasHydrated());
    useEffect(() => {
        if (useGame.persist.hasHydrated()) setDone(true);
        return useGame.persist.onFinishHydration(() => setDone(true));
    }, []);
    return done;
}

/** Palco Phaser com a cena do laboratório (montado uma vez só). */
const Stage = memo(function Stage({ onReady }: { onReady: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const ready = useRef(onReady);
    ready.current = onReady;
    useEffect(() => {
        const handler = () => ready.current();
        EventBus.on('lab:ready', handler);
        let game: Phaser.Game | null = null;
        const timer = window.setTimeout(() => {
            if (!ref.current) return;
            game = new Phaser.Game({
                type: Phaser.AUTO,
                width: LAB_W,
                height: LAB_H,
                parent: ref.current,
                pixelArt: true,
                backgroundColor: '#5a3820',
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
                audio: { noAudio: true },
                scene: [MoveLabScene],
            });
        }, 0);
        return () => {
            clearTimeout(timer);
            EventBus.off('lab:ready', handler);
            game?.destroy(true);
        };
    }, []);
    return <div ref={ref} className="ml-stage" />;
});

function Sprite({ id, shown, size = 48 }: { id: number; shown: boolean; size?: number }) {
    return (
        <img
            className={`pixel gdx-sprite${shown ? '' : ' silhouette'}`}
            src={`assets/cards/${id}.gif`}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            draggable={false}
        />
    );
}

export function MoveLab({ onExit }: { onExit: () => void }) {
    const moves = useGame((s) => s.moves);
    const dex = useGame((s) => s.dex);
    const hydrated = useHydrated();

    const [view, setView] = useState<View>('golpe');
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState<Status>('todos');
    const [style, setStyle] = useState('');
    const [onlyInGame, setOnlyInGame] = useState(false);
    const [spQuery, setSpQuery] = useState('');
    const [speciesId, setSpeciesId] = useState<number | null>(null);

    const [current, setCurrent] = useState('');
    const [performer, setPerformer] = useState(0);
    const [sheet, setSheet] = useState(false);
    const [strong, setStrong] = useState(true);
    const [ready, setReady] = useState(false);
    const [auto, setAuto] = useState(false);
    const [review, setReview] = useState<Review>(loadReview);
    const [copied, setCopied] = useState(false);
    const browseRef = useRef<HTMLElement>(null);

    // vezes que cada golpe apareceu em campo
    const seen = useMemo(() => {
        const out: Record<string, number> = {};
        for (const r of ALL_ROWS) out[r.id] = timesSeen(r.id, moves, dex);
        return out;
    }, [moves, dex]);
    const isOpen = (id: string) => REVIEW || seen[id] > 0;
    const spSeen = (id: number) => REVIEW || !!dex[id];
    const discovered = GAME_ROWS.filter((r) => seen[r.id] > 0).length;
    const total = GAME_ROWS.length;

    // ---------- por golpe ----------
    const base = REVIEW ? (onlyInGame ? ALL_ROWS.filter((r) => r.users.length) : ALL_ROWS) : GAME_ROWS;
    const baseFound = REVIEW ? base.filter((r) => seen[r.id] > 0).length : discovered;
    const q = norm(query);
    const shown = base.filter((r) => {
        const open = isOpen(r.id);
        if (status === 'descobertos' && !(seen[r.id] > 0)) return false;
        if (status === 'faltam' && seen[r.id] > 0) return false;
        // golpe escondido não revela nome nem tipo: some com busca ou filtro de tipo
        if ((q || type) && !open) return false;
        if (q && !norm(r.name).includes(q)) return false;
        if (type && r.type !== type) return false;
        if (style && r.style !== style) return false;
        return true;
    });
    const hiddenOfType = type && !REVIEW ? GAME_ROWS.filter((r) => r.type === type && !(seen[r.id] > 0)).length : 0;
    const types = useMemo(() => [...new Set(GAME_ROWS.map((r) => r.type))].sort(), []);

    // ---------- por Pokémon ----------
    const sp = speciesId !== null ? SPECIES_BY_ID.get(speciesId) : undefined;
    const spMoves = sp ? (MOVESET.get(sp.id) ?? []).flatMap((id) => ROW_BY_ID.get(id) ?? []) : [];
    const sq = norm(spQuery);
    const spShown = SPECIES.filter((s) => {
        if (!sq) return true;
        if (/^\d+$/.test(sq)) return String(s.id).includes(String(Number(sq)));
        return spSeen(s.id) && norm(s.name).includes(sq);
    });

    // lista que as setas / "tocar todos" percorrem
    const nav = (view === 'pokemon' && sp ? spMoves : shown).filter((r) => isOpen(r.id));
    const row = current ? ROW_BY_ID.get(current) : undefined;
    const index = nav.findIndex((r) => r.id === current);

    const performerFor = (r: MoveRow): number => {
        if (view === 'pokemon' && sp && r.users.some((u) => u.id === sp.id)) return sp.id;
        if (REVIEW) return r.performer;
        const known = r.signatureOf.find((u) => dex[u.id]) ?? r.users.find((u) => dex[u.id]);
        return known?.id ?? r.performer;
    };
    const emitPlay = (id: string, user: number) => {
        if (!id || !user) return;
        EventBus.emit('lab:play', { moveId: id, userId: user, targetId: DUMMY, strong });
    };
    const play = () => emitPlay(current, performer);
    const select = (r: MoveRow, open = true) => {
        if (!isOpen(r.id)) return;
        const user = performerFor(r);
        setCurrent(r.id);
        setPerformer(user);
        if (open) setSheet(true);
        emitPlay(r.id, user);
    };
    const step = (d: number) => {
        if (!nav.length) return;
        const next = nav[(Math.max(0, index) + d + nav.length) % nav.length];
        select(next, false);
    };

    // abre já mostrando o primeiro golpe descoberto (no PC; no celular a gaveta fica fechada)
    // biome-ignore lint/correctness/useExhaustiveDependencies: só na primeira vez que palco e save estão prontos
    useEffect(() => {
        if (!ready || !hydrated) return;
        if (current) return play();
        const first = GAME_ROWS.find((r) => isOpen(r.id));
        if (first) select(first, false);
    }, [ready, hydrated]);

    // tocar todos: avança sozinho pela lista atual
    // biome-ignore lint/correctness/useExhaustiveDependencies: o passo usa a lista atual
    useEffect(() => {
        if (!auto) return;
        const timer = window.setInterval(() => step(1), AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [auto, current, nav.length]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: atalhos de teclado
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
            if (e.key === 'Escape') setSheet(false);
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                step(1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                step(-1);
            }
            if (e.key === ' ') {
                e.preventDefault();
                play();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, performer, nav.length, strong]);

    // ---------- revisão ----------
    const save = (id: string, patch: { verdict?: Verdict; note?: string }) => {
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
    const reviewed = ALL_ROWS.filter((r) => review[r.id]?.verdict).length;
    const copy = async () => {
        const lines = ALL_ROWS.filter((r) => review[r.id]?.verdict || review[r.id]?.note).map((r) => {
            const rv = review[r.id];
            return `${r.name} (${TYPE_PT[r.type] ?? r.type}, ${STYLE_PT[r.style]}): ${rv.verdict === 'mudar' ? 'MUDAR' : 'ok'}${rv.note ? ` — ${rv.note}` : ''}`;
        });
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    /** Nomes de quem usa; quem você ainda não viu fica escondido. */
    const who = (list: Species[], none: string) => {
        if (!list.length) return none;
        const known = list.filter((s) => spSeen(s.id));
        const hidden = list.length - known.length;
        const names = known.map((s) => s.name).join(', ');
        if (!hidden) return names;
        const rest = `${hidden} que você ainda não viu`;
        return names ? `${names} e mais ${rest}` : rest;
    };

    const rv = row ? review[row.id] : undefined;
    const times = row ? seen[row.id] : 0;
    const pct = total ? Math.round((discovered / total) * 100) : 0;
    const empty = hydrated && discovered === 0 && !REVIEW;

    const cellMark = (id: string) =>
        REVIEW && review[id]?.verdict ? (
            <span className={`ml-mark ${review[id]?.verdict}`}>{review[id]?.verdict === 'ok' ? '✓' : '✎'}</span>
        ) : null;

    const moveCell = (r: MoveRow, sig?: boolean) => {
        const open = isOpen(r.id);
        const n = seen[r.id] ?? 0;
        if (!open)
            return (
                <li key={r.id} className="gdx-cell locked" title={LOCKED_HINT}>
                    <span className="gdx-num">{r.num ? `#${pad3(r.num)}` : ''}</span>
                    <span className="gdx-lock">
                        <GdxIcon kind="lock" size={14} />
                    </span>
                    <span className="gdx-name">???</span>
                </li>
            );
        return (
            <li key={r.id}>
                <button
                    type="button"
                    className={`gdx-cell${r.id === current ? ' current' : ''}${n > 0 ? '' : ' unseen'}`}
                    style={{ '--tc': TYPE_COLOR[r.type] } as CSSProperties}
                    onClick={() => select(r)}
                >
                    <span className="gdx-num">{r.num ? `#${pad3(r.num)}` : 'fora'}</span>
                    <TypeIcon type={r.type} size={20} />
                    <span className="gdx-name">
                        {r.name}
                        <small>
                            {sig && (
                                <span className="gdx-sig" title="Golpe assinatura">
                                    <GdxIcon kind="star" size={10} /> Assinatura ·{' '}
                                </span>
                            )}
                            {r.tmOnly && (
                                <span className="gdx-tm" title="Só chega em campo por MT">
                                    MT
                                </span>
                            )}
                            {sig !== undefined && `${KIND_SHORT[r.kind] ?? ''} · `}
                            {n > 0 ? `Visto ${n}x` : 'Não visto'}
                        </small>
                    </span>
                    {cellMark(r.id)}
                </button>
            </li>
        );
    };

    return (
        <div className="golpedex">
            <MenuHead title="Golpedex" icon="moves" onBack={onExit} />

            <section className="panel gdx-progress" aria-label="Progresso">
                <div className="gdx-progress-top">
                    <span>
                        <b>{discovered}</b>/{total} golpes descobertos
                    </span>
                    <span className="muted">{pct}%</span>
                </div>
                <div
                    className="gdx-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={discovered}
                >
                    <span style={{ width: `${pct}%` }} />
                </div>
                {REVIEW ? (
                    <p className="muted gdx-note">
                        Modo revisão: tudo revelado ({ALL_ROWS.length} golpes, contando os que só chegam por MT). Marque{' '}
                        <b>ok</b> ou <b>mudar</b>, anote, e no fim use "Copiar revisão". Setas trocam de golpe, espaço
                        repete.
                    </p>
                ) : (
                    <p className="muted gdx-note">
                        <GdxIcon kind="lock" size={12} /> {LOCKED_HINT}, do seu time ou do rival.
                    </p>
                )}
            </section>

            {empty && (
                <section className="panel gdx-empty">
                    <p>
                        <b>Jogue uma partida pra começar a descobrir golpes.</b> Cada golpe que alguém usar em campo
                        entra aqui, com a animação e o que ele faz.
                    </p>
                    <button type="button" className="btn primary small" onClick={onExit}>
                        Voltar ao início
                    </button>
                </section>
            )}

            <div className="gdx-layout">
                <button
                    type="button"
                    className={`gdx-backdrop${sheet ? ' open' : ''}`}
                    aria-label="Fechar"
                    tabIndex={-1}
                    onClick={() => setSheet(false)}
                />
                <aside className={`panel gdx-detail${sheet ? ' open' : ''}`} aria-label="Golpe escolhido">
                    <button
                        type="button"
                        className="btn ghost small gdx-close"
                        onClick={() => setSheet(false)}
                        aria-label="Fechar"
                    >
                        <GdxIcon kind="close" size={14} />
                    </button>
                    <Stage onReady={() => setReady(true)} />
                    {row ? (
                        <div className="ml-info">
                            <div className="ml-title">
                                <TypeIcon type={row.type} size={26} />
                                <h2 style={{ color: TYPE_COLOR[row.type] }}>{row.name}</h2>
                                <span className="ml-chip">{TYPE_PT[row.type] ?? row.type}</span>
                                <span className="ml-chip">{STYLE_PT[row.style]}</span>
                            </div>
                            <p className="gdx-seen">
                                {times > 0
                                    ? `Visto ${times} ${times === 1 ? 'vez' : 'vezes'} em campo`
                                    : 'Ainda não visto em campo'}
                            </p>
                            <div className="gdx-controls">
                                <button
                                    type="button"
                                    className="btn small"
                                    onClick={() => step(-1)}
                                    aria-label="Golpe anterior"
                                >
                                    <GdxIcon kind="prev" size={12} />
                                </button>
                                <button type="button" className="btn small primary" onClick={play}>
                                    <GdxIcon kind="play" size={12} /> Repetir
                                </button>
                                <button
                                    type="button"
                                    className="btn small"
                                    onClick={() => step(1)}
                                    aria-label="Próximo golpe"
                                >
                                    <GdxIcon kind="next" size={12} />
                                </button>
                                <button
                                    type="button"
                                    className={`btn small${auto ? ' active' : ''}`}
                                    onClick={() => setAuto((v) => !v)}
                                >
                                    <GdxIcon kind={auto ? 'stop' : 'auto'} size={12} />
                                    {auto ? 'Parar' : 'Tocar todos'}
                                </button>
                                <span className="muted gdx-count">
                                    {index >= 0 ? `${index + 1}/${nav.length}` : `${nav.length} na lista`}
                                </span>
                                {REVIEW && (
                                    <label className="ml-check">
                                        <input
                                            type="checkbox"
                                            checked={strong}
                                            onChange={(e) => setStrong(e.target.checked)}
                                        />
                                        Versão forte
                                    </label>
                                )}
                            </div>
                            <dl className="ml-facts">
                                <dt>Na partida</dt>
                                <dd>
                                    {SPECIAL_EXPLAIN[row.id] ??
                                        (DRAIN[row.id]
                                            ? `${KIND_PT[row.kind]} · suga o fôlego do alvo`
                                            : KIND_PT[row.kind])}
                                </dd>
                                <dt>Poder · precisão</dt>
                                <dd>
                                    {row.power || '—'} · {row.accuracy}%
                                </dd>
                                <dt>Usos</dt>
                                <dd>{row.uses}x por partida</dd>
                                <dt>Assinatura de</dt>
                                <dd>{who(row.signatureOf, '—')}</dd>
                                <dt>Quem usa</dt>
                                <dd>{who(row.users, 'ninguém por padrão: só chega por MT')}</dd>
                                {row.desc && (
                                    <>
                                        <dt>No jogo original</dt>
                                        <dd>{row.desc}</dd>
                                    </>
                                )}
                            </dl>
                            {REVIEW && (
                                <div className="ml-review">
                                    <div className="row" style={{ gap: 6 }}>
                                        <button
                                            type="button"
                                            className={`btn small${rv?.verdict === 'ok' ? ' active' : ''}`}
                                            onClick={() => save(row.id, { verdict: 'ok' })}
                                        >
                                            ✓ Ok
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn small yellow${rv?.verdict === 'mudar' ? ' active' : ''}`}
                                            onClick={() => save(row.id, { verdict: 'mudar' })}
                                        >
                                            ✎ Mudar
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder="O que mudar? (ex.: Fire Blast tinha que ser a estrela de fogo caindo no alvo)"
                                        value={rv?.note ?? ''}
                                        onChange={(e) => save(row.id, { note: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="muted gdx-pick">
                            {empty
                                ? 'Os golpes que você descobrir vão aparecer aqui, com a animação da partida.'
                                : 'Toque num golpe descoberto pra ver a animação.'}
                        </p>
                    )}
                </aside>

                <section className="panel gdx-browse" ref={browseRef}>
                    <div className="gdx-sticky">
                        <div className="gdx-tabs" role="tablist">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'golpe'}
                                className={view === 'golpe' ? 'on' : ''}
                                onClick={() => setView('golpe')}
                            >
                                Por golpe
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'pokemon'}
                                className={view === 'pokemon' ? 'on' : ''}
                                onClick={() => setView('pokemon')}
                            >
                                Por Pokémon
                            </button>
                        </div>

                        {view === 'golpe' ? (
                            <div className="gdx-filters">
                                <label className="gdx-search">
                                    <GdxIcon kind="search" size={14} />
                                    <input
                                        type="search"
                                        placeholder="Buscar golpe…"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </label>
                                <div className="gdx-seg">
                                    {(
                                        [
                                            ['todos', 'Todos', base.length],
                                            ['descobertos', 'Descobertos', baseFound],
                                            ['faltam', 'Faltam', base.length - baseFound],
                                        ] as const
                                    ).map(([k, label, n]) => (
                                        <button
                                            key={k}
                                            type="button"
                                            className={status === k ? 'on' : ''}
                                            onClick={() => setStatus(k)}
                                        >
                                            <span>{label}</span>
                                            <small>{n}</small>
                                        </button>
                                    ))}
                                </div>
                                <div className="gdx-types">
                                    <button
                                        type="button"
                                        className={`gdx-type all${type ? '' : ' on'}`}
                                        onClick={() => setType('')}
                                    >
                                        Todos
                                    </button>
                                    {types.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`gdx-type${type === t ? ' on' : ''}`}
                                            style={{ '--tc': TYPE_COLOR[t] } as CSSProperties}
                                            onClick={() => setType(type === t ? '' : t)}
                                            aria-label={TYPE_PT[t] ?? t}
                                            aria-pressed={type === t}
                                        >
                                            <TypeIcon type={t} size={22} />
                                        </button>
                                    ))}
                                </div>
                                {REVIEW && (
                                    <div className="gdx-review-tools">
                                        <select value={style} onChange={(e) => setStyle(e.target.value)}>
                                            <option value="">Todos os estilos</option>
                                            {(Object.keys(STYLE_PT) as FxStyle[]).map((s) => (
                                                <option key={s} value={s}>
                                                    {STYLE_PT[s]}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="ml-check">
                                            <input
                                                type="checkbox"
                                                checked={onlyInGame}
                                                onChange={(e) => setOnlyInGame(e.target.checked)}
                                            />
                                            Só os do moveset padrão
                                        </label>
                                        <span className="muted">
                                            Revisados: {reviewed}/{ALL_ROWS.length}
                                        </span>
                                        <button type="button" className="btn small primary" onClick={copy}>
                                            {copied ? 'Copiado!' : 'Copiar revisão'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : sp ? (
                            <div className="gdx-sp-head">
                                <button
                                    type="button"
                                    className="btn ghost small"
                                    onClick={() => setSpeciesId(null)}
                                    aria-label="Voltar para todos os Pokémon"
                                >
                                    <GdxIcon kind="prev" size={12} /> Todos
                                </button>
                                <Sprite id={sp.id} shown size={56} />
                                <div>
                                    <span className="gdx-num">#{pad3(sp.id)}</span>
                                    <h2>{sp.name}</h2>
                                    <TypeIcons types={sp.types} size={18} />
                                </div>
                            </div>
                        ) : (
                            <div className="gdx-filters">
                                <label className="gdx-search">
                                    <GdxIcon kind="search" size={14} />
                                    <input
                                        type="search"
                                        placeholder="Nome ou número…"
                                        value={spQuery}
                                        onChange={(e) => setSpQuery(e.target.value)}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {view === 'golpe' && (
                        <>
                            {hiddenOfType > 0 && (
                                <p className="muted gdx-note">
                                    <GdxIcon kind="lock" size={12} /> Faltam {hiddenOfType}{' '}
                                    {hiddenOfType === 1 ? 'golpe' : 'golpes'} de {TYPE_PT[type] ?? type} pra descobrir.
                                </p>
                            )}
                            {shown.length ? (
                                <ul className="gdx-grid">{shown.map((r) => moveCell(r))}</ul>
                            ) : (
                                <p className="muted gdx-pick">Nenhum golpe com esses filtros.</p>
                            )}
                        </>
                    )}

                    {view === 'pokemon' && sp && (
                        <>
                            <p className="muted gdx-note">
                                Os {spMoves.length} golpes que {sp.name} leva pra quadra.
                                {dex[sp.id]?.matches
                                    ? ` Jogou ${dex[sp.id].matches} ${dex[sp.id].matches === 1 ? 'partida' : 'partidas'} pelo seu time.`
                                    : ''}
                            </p>
                            <ul className="gdx-grid gdx-grid-one">
                                {spMoves.map((r) =>
                                    moveCell(
                                        r,
                                        r.signatureOf.some((s) => s.id === sp.id),
                                    ),
                                )}
                            </ul>
                        </>
                    )}

                    {view === 'pokemon' && !sp && (
                        <ul className="gdx-dex">
                            {spShown.map((s) => {
                                const open = spSeen(s.id);
                                const set = MOVESET.get(s.id) ?? [];
                                const got = set.filter((id) => (seen[id] ?? 0) > 0).length;
                                return (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            className={`gdx-mon${open ? '' : ' locked'}`}
                                            disabled={!open}
                                            title={open ? s.name : 'Pokémon ainda não visto'}
                                            onClick={() => {
                                                setSpeciesId(s.id);
                                                browseRef.current?.scrollIntoView({ block: 'start' });
                                            }}
                                        >
                                            <span className="gdx-num">#{pad3(s.id)}</span>
                                            <Sprite id={s.id} shown={open} />
                                            <span className="gdx-mon-name">{open ? s.name : '???'}</span>
                                            {open && (
                                                <small className={got === set.length ? 'full' : ''}>
                                                    {got}/{set.length}
                                                </small>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                            {!spShown.length && <li className="muted gdx-pick">Nenhum Pokémon encontrado.</li>}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
