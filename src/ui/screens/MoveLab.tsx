import Phaser from 'phaser';
import { type CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';
import { SPECIES, SPECIES_BY_ID, type Species } from '../../engine/data';
import { DRAIN, SPECIAL_EXPLAIN } from '../../engine/moves';
import { EventBus } from '../../game/EventBus';
import type { FxStyle } from '../../game/move-fx';
import { LAB_H, LAB_W, MoveLabScene } from '../../game/scenes/MoveLabScene';
import { moveDesc, plural, typeName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
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
import { TYPE_COLOR } from '../type-colors';

/**
 * Golpedex (?lab=golpes): todos os golpes do jogo, descobertos como numa Pokédex. Um golpe aparece quando
 * alguém usa em campo numa partida sua; descoberto, mostra a animação da partida, o que faz e quem usa.
 * Dá para navegar por golpe ou por Pokémon. Com &revisao=1 tudo fica revelado e volta a ferramenta de
 * revisão do Miguel (ok/mudar + anotação, salva no navegador, "Copiar revisão").
 */
/** Alvo padrão: um boneco grande e neutro. */
const DUMMY = 143;
const REVIEW_KEY = 'soccermon-move-review';
const AUTOPLAY_MS = 2200;

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
    const { t, tn, d, lang } = useT();
    const L = d.stats.lab;
    const kindLong = (k: string) => L.kind[k] ?? k;
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
            return `${r.name} (${typeName(r.type)}, ${L.style[r.style] ?? r.style}): ${rv.verdict === 'mudar' ? 'MUDAR' : 'ok'}${rv.note ? ` — ${rv.note}` : ''}`;
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
        const rest = t('stats.lab.notSeenYet', { n: hidden });
        return names ? t('stats.lab.andMore', { names, rest }) : rest;
    };

    const rv = row ? review[row.id] : undefined;
    /** Texto do jogo original: em português a tradução dos dados, em inglês o oficial. */
    const desc = row ? (lang === 'pt' ? row.desc : moveDesc(row.id, lang)) : null;
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
                <li key={r.id} className="gdx-cell locked" title={L.lockedHint}>
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
                    <span className="gdx-num">{r.num ? `#${pad3(r.num)}` : L.out}</span>
                    <TypeIcon type={r.type} size={20} />
                    <span className="gdx-name">
                        {r.name}
                        <small>
                            {sig && (
                                <span className="gdx-sig" title={L.signatureTitle}>
                                    <GdxIcon kind="star" size={10} /> {L.signature} ·{' '}
                                </span>
                            )}
                            {r.tmOnly && (
                                <span className="gdx-tm" title={L.tmOnlyTitle}>
                                    {L.tmBadge}
                                </span>
                            )}
                            {sig !== undefined && `${L.kindShort[r.kind] ?? ''} · `}
                            {n > 0 ? t('stats.lab.seenN', { n }) : L.notSeen}
                        </small>
                    </span>
                    {cellMark(r.id)}
                </button>
            </li>
        );
    };

    return (
        <div className="golpedex">
            <MenuHead title={t('stats.lab.title')} icon="moves" onBack={onExit} />

            <section className="panel gdx-progress" aria-label={L.progress}>
                <div className="gdx-progress-top">
                    <span>
                        <b>{discovered}</b>/{t('stats.lab.discovered', { total })}
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
                    <p className="muted gdx-note">{rich(t('stats.lab.reviewNote', { n: ALL_ROWS.length }))}</p>
                ) : (
                    <p className="muted gdx-note">
                        <GdxIcon kind="lock" size={12} /> {L.lockedHintFull}
                    </p>
                )}
            </section>

            {empty && (
                <section className="panel gdx-empty">
                    <p>{rich(L.empty)}</p>
                    <button type="button" className="btn primary small" onClick={onExit}>
                        {t('common.ui.backHome')}
                    </button>
                </section>
            )}

            <div className="gdx-layout">
                <button
                    type="button"
                    className={`gdx-backdrop${sheet ? ' open' : ''}`}
                    aria-label={t('common.ui.close')}
                    tabIndex={-1}
                    onClick={() => setSheet(false)}
                />
                <aside className={`panel gdx-detail${sheet ? ' open' : ''}`} aria-label={L.detailAria}>
                    <button
                        type="button"
                        className="btn ghost small gdx-close"
                        onClick={() => setSheet(false)}
                        aria-label={t('common.ui.close')}
                    >
                        <GdxIcon kind="close" size={14} />
                    </button>
                    <Stage onReady={() => setReady(true)} />
                    {row ? (
                        <div className="ml-info">
                            <div className="ml-title">
                                <TypeIcon type={row.type} size={26} />
                                <h2 style={{ color: TYPE_COLOR[row.type] }}>{row.name}</h2>
                                <span className="ml-chip">{typeName(row.type)}</span>
                                <span className="ml-chip">{L.style[row.style] ?? row.style}</span>
                            </div>
                            <p className="gdx-seen">{times > 0 ? tn('stats.lab.seenField', times) : L.notSeenField}</p>
                            <div className="gdx-controls">
                                <button
                                    type="button"
                                    className="btn small"
                                    onClick={() => step(-1)}
                                    aria-label={L.prev}
                                >
                                    <GdxIcon kind="prev" size={12} />
                                </button>
                                <button type="button" className="btn small primary" onClick={play}>
                                    <GdxIcon kind="play" size={12} /> {L.replay}
                                </button>
                                <button type="button" className="btn small" onClick={() => step(1)} aria-label={L.next}>
                                    <GdxIcon kind="next" size={12} />
                                </button>
                                <button
                                    type="button"
                                    className={`btn small${auto ? ' active' : ''}`}
                                    onClick={() => setAuto((v) => !v)}
                                >
                                    <GdxIcon kind={auto ? 'stop' : 'auto'} size={12} />
                                    {auto ? L.stop : L.playAll}
                                </button>
                                <span className="muted gdx-count">
                                    {index >= 0
                                        ? `${index + 1}/${nav.length}`
                                        : t('stats.lab.inList', { n: nav.length })}
                                </span>
                                {REVIEW && (
                                    <label className="ml-check">
                                        <input
                                            type="checkbox"
                                            checked={strong}
                                            onChange={(e) => setStrong(e.target.checked)}
                                        />
                                        {L.strong}
                                    </label>
                                )}
                            </div>
                            <dl className="ml-facts">
                                <dt>{L.inMatch}</dt>
                                <dd>
                                    {(lang === 'pt' ? SPECIAL_EXPLAIN[row.id] : undefined) ??
                                        (DRAIN[row.id]
                                            ? t('stats.lab.drains', { kind: kindLong(row.kind) })
                                            : kindLong(row.kind))}
                                </dd>
                                <dt>{L.powerAcc}</dt>
                                <dd>
                                    {row.power || '—'} · {row.accuracy}%
                                </dd>
                                <dt>{L.uses}</dt>
                                <dd>{t('stats.lab.usesValue', { n: row.uses })}</dd>
                                <dt>{L.signatureOf}</dt>
                                <dd>{who(row.signatureOf, '—')}</dd>
                                <dt>{L.users}</dt>
                                <dd>{who(row.users, L.nobody)}</dd>
                                {desc && (
                                    <>
                                        <dt>{L.original}</dt>
                                        <dd>{desc}</dd>
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
                                            {L.reviewOk}
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn small yellow${rv?.verdict === 'mudar' ? ' active' : ''}`}
                                            onClick={() => save(row.id, { verdict: 'mudar' })}
                                        >
                                            {L.reviewChange}
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder={L.reviewPlaceholder}
                                        value={rv?.note ?? ''}
                                        onChange={(e) => save(row.id, { note: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="muted gdx-pick">{empty ? L.pickEmpty : L.pick}</p>
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
                                {L.byMove}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={view === 'pokemon'}
                                className={view === 'pokemon' ? 'on' : ''}
                                onClick={() => setView('pokemon')}
                            >
                                {L.byPokemon}
                            </button>
                        </div>

                        {view === 'golpe' ? (
                            <div className="gdx-filters">
                                <label className="gdx-search">
                                    <GdxIcon kind="search" size={14} />
                                    <input
                                        type="search"
                                        placeholder={L.searchMove}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </label>
                                <div className="gdx-seg">
                                    {(
                                        [
                                            ['todos', L.all, base.length],
                                            ['descobertos', L.found, baseFound],
                                            ['faltam', L.missing, base.length - baseFound],
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
                                        {L.all}
                                    </button>
                                    {types.map((ty) => (
                                        <button
                                            key={ty}
                                            type="button"
                                            className={`gdx-type${type === ty ? ' on' : ''}`}
                                            style={{ '--tc': TYPE_COLOR[ty] } as CSSProperties}
                                            onClick={() => setType(type === ty ? '' : ty)}
                                            aria-label={typeName(ty)}
                                            aria-pressed={type === ty}
                                        >
                                            <TypeIcon type={ty} size={22} />
                                        </button>
                                    ))}
                                </div>
                                {REVIEW && (
                                    <div className="gdx-review-tools">
                                        <select value={style} onChange={(e) => setStyle(e.target.value)}>
                                            <option value="">{L.allStyles}</option>
                                            {(Object.keys(L.style) as FxStyle[]).map((s) => (
                                                <option key={s} value={s}>
                                                    {L.style[s]}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="ml-check">
                                            <input
                                                type="checkbox"
                                                checked={onlyInGame}
                                                onChange={(e) => setOnlyInGame(e.target.checked)}
                                            />
                                            {L.onlyUsed}
                                        </label>
                                        <span className="muted">
                                            {t('stats.lab.reviewed', { n: reviewed, total: ALL_ROWS.length })}
                                        </span>
                                        <button type="button" className="btn small primary" onClick={copy}>
                                            {copied ? L.copied : L.copyReview}
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
                                    aria-label={L.backAll}
                                >
                                    <GdxIcon kind="prev" size={12} /> {L.all}
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
                                        placeholder={L.searchMon}
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
                                    <GdxIcon kind="lock" size={12} />{' '}
                                    {tn('stats.lab.missingOfType', hiddenOfType, { type: typeName(type) })}
                                </p>
                            )}
                            {shown.length ? (
                                <ul className="gdx-grid">{shown.map((r) => moveCell(r))}</ul>
                            ) : (
                                <p className="muted gdx-pick">{L.noMoves}</p>
                            )}
                        </>
                    )}

                    {view === 'pokemon' && sp && (
                        <>
                            <p className="muted gdx-note">
                                {t('stats.lab.monMoves', { n: spMoves.length, name: sp.name })}
                                {dex[sp.id]?.matches ? plural(L.monPlayed, dex[sp.id].matches) : ''}
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
                                            title={open ? s.name : L.monLocked}
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
                            {!spShown.length && <li className="muted gdx-pick">{L.noMon}</li>}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
