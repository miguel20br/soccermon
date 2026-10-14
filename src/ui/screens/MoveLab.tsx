import Phaser from 'phaser';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MOVES, SPECIES } from '../../engine/data';
import { DRAIN, defaultMoveset, moveProfile, SPECIAL_EXPLAIN } from '../../engine/moves';
import { SIGNATURE } from '../../engine/signature-moves';
import { EventBus } from '../../game/EventBus';
import { type FxStyle, fxStyle } from '../../game/move-fx';
import { LAB_H, LAB_W, MoveLabScene } from '../../game/scenes/MoveLabScene';
import { TypeIcon } from '../components/TypeIcon';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';

/**
 * Laboratório de golpes (?lab=golpes): todos os golpes do jogo com a animação de cada um, quem usa,
 * o que fazem na partida e um espaço para o Miguel marcar "ok"/"mudar" e anotar (fica salvo no navegador
 * e dá para copiar tudo de uma vez para mandar).
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

type Verdict = 'ok' | 'mudar';
type Review = Record<string, { verdict?: Verdict; note?: string }>;

interface MoveRow {
    id: string;
    name: string;
    type: string;
    kind: string;
    style: FxStyle;
    power: number;
    accuracy: number;
    uses: number;
    desc: string | null;
    /** Pokémon que usam por padrão (o da assinatura primeiro). */
    users: string[];
    signatureOf: string[];
    performer: number;
}

function buildRows(): MoveRow[] {
    const defaults = SPECIES.map((sp) => ({ sp, moves: defaultMoveset(sp) }));
    return Object.values(MOVES)
        .map((m) => {
            const prof = moveProfile(m.id);
            const signatureOf = SPECIES.filter((sp) => SIGNATURE[sp.id] === m.id);
            const users = defaults.filter((d) => d.moves.includes(m.id)).map((d) => d.sp);
            const learner = SPECIES.find((sp) => sp.learnset.includes(m.id));
            const performer = (signatureOf[0] ?? users[0] ?? learner ?? SPECIES[24]).id;
            return {
                id: m.id,
                name: m.name,
                type: m.type,
                kind: prof.kind,
                style: fxStyle(m.id, prof.kind),
                power: m.power,
                accuracy: m.accuracy,
                uses: prof.uses,
                desc: m.descPt,
                users: users.map((sp) => sp.name),
                signatureOf: signatureOf.map((sp) => sp.name),
                performer,
            };
        })
        .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

function loadReview(): Review {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_KEY) ?? '{}') as Review;
    } catch {
        return {};
    }
}

/** Palco Phaser com a cena do laboratório. */
function Stage({ onReady }: { onReady: () => void }) {
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
}

export function MoveLab({ onExit }: { onExit: () => void }) {
    const rows = useMemo(buildRows, []);
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [style, setStyle] = useState('');
    const [onlyInGame, setOnlyInGame] = useState(false);
    const [current, setCurrent] = useState(rows[0]?.id ?? '');
    const [strong, setStrong] = useState(true);
    const [ready, setReady] = useState(false);
    const [auto, setAuto] = useState(false);
    const [review, setReview] = useState<Review>(loadReview);
    const [copied, setCopied] = useState(false);

    const shown = rows.filter(
        (r) =>
            (!query || r.name.toLowerCase().includes(query.toLowerCase())) &&
            (!type || r.type === type) &&
            (!style || r.style === style) &&
            (!onlyInGame || r.users.length > 0),
    );
    const row = rows.find((r) => r.id === current) ?? rows[0];
    const index = shown.findIndex((r) => r.id === current);

    const play = (r: MoveRow | undefined = row) => {
        if (!r) return;
        EventBus.emit('lab:play', { moveId: r.id, userId: r.performer, targetId: DUMMY, strong });
    };
    const select = (r: MoveRow) => {
        setCurrent(r.id);
        play(r);
    };
    const step = (d: number) => {
        if (!shown.length) return;
        const next = shown[(Math.max(0, index) + d + shown.length) % shown.length];
        select(next);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: toca o golpe atual assim que o palco abre
    useEffect(() => {
        if (ready) play();
    }, [ready]);

    // tocar todos: avança sozinho pela lista filtrada
    // biome-ignore lint/correctness/useExhaustiveDependencies: o passo usa a lista atual
    useEffect(() => {
        if (!auto) return;
        const timer = window.setInterval(() => step(1), AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [auto, current, shown.length]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: atalhos de teclado
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT')
                return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') step(1);
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') step(-1);
            if (e.key === ' ') {
                e.preventDefault();
                play();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, shown.length, strong]);

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

    const reviewed = rows.filter((r) => review[r.id]?.verdict).length;
    const copy = async () => {
        const lines = rows
            .filter((r) => review[r.id]?.verdict || review[r.id]?.note)
            .map((r) => {
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

    const types = [...new Set(rows.map((r) => r.type))].sort();
    const rv = row ? review[row.id] : undefined;

    return (
        <div className="move-lab">
            <div className="ml-head">
                <div>
                    <h1>Laboratório de golpes</h1>
                    <p className="muted">
                        Todos os {rows.length} golpes com a animação da partida. Marque <b>ok</b> ou <b>mudar</b>,
                        anote, e no fim use "Copiar revisão" para me mandar. Setas ← → trocam de golpe, espaço repete.
                    </p>
                </div>
                <button type="button" className="btn ghost small" onClick={onExit}>
                    Voltar ao jogo
                </button>
            </div>

            <div className="ml-layout">
                <div className="ml-main">
                    <Stage onReady={() => setReady(true)} />
                    {row && (
                        <div className="panel ml-info">
                            <div className="ml-title">
                                <TypeIcon type={row.type} size={28} />
                                <h2 style={{ color: TYPE_COLOR[row.type] }}>{row.name}</h2>
                                <span className="ml-chip">{STYLE_PT[row.style]}</span>
                                <span className="muted">
                                    {index + 1}/{shown.length}
                                </span>
                            </div>
                            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                                <button type="button" className="btn small" onClick={() => step(-1)}>
                                    ← Anterior
                                </button>
                                <button type="button" className="btn small primary" onClick={() => play()}>
                                    ▶ Repetir
                                </button>
                                <button type="button" className="btn small" onClick={() => step(1)}>
                                    Próximo →
                                </button>
                                <button
                                    type="button"
                                    className={`btn small${auto ? ' active' : ''}`}
                                    onClick={() => setAuto((v) => !v)}
                                >
                                    {auto ? '■ Parar' : '▶▶ Tocar todos'}
                                </button>
                                <label className="ml-check">
                                    <input
                                        type="checkbox"
                                        checked={strong}
                                        onChange={(e) => setStrong(e.target.checked)}
                                    />
                                    Versão forte (câmera de golpe)
                                </label>
                            </div>
                            <dl className="ml-facts">
                                <dt>Na partida</dt>
                                <dd>
                                    {SPECIAL_EXPLAIN[row.id] ??
                                        (DRAIN[row.id]
                                            ? `${KIND_PT[row.kind]} · suga o fôlego do alvo`
                                            : KIND_PT[row.kind])}
                                </dd>
                                <dt>Poder · precisão · usos</dt>
                                <dd>
                                    {row.power || '—'} · {row.accuracy}% · {row.uses}x por partida
                                </dd>
                                <dt>Assinatura de</dt>
                                <dd>{row.signatureOf.join(', ') || '—'}</dd>
                                <dt>Usam por padrão</dt>
                                <dd>{row.users.length ? `${row.users.length}: ${row.users.join(', ')}` : 'ninguém'}</dd>
                                {row.desc && (
                                    <>
                                        <dt>No jogo original</dt>
                                        <dd>{row.desc}</dd>
                                    </>
                                )}
                            </dl>
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
                        </div>
                    )}
                </div>

                <div className="panel ml-list">
                    <div className="ml-filters">
                        <input placeholder="Buscar golpe…" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="">Todos os tipos</option>
                            {types.map((t) => (
                                <option key={t} value={t}>
                                    {TYPE_PT[t] ?? t}
                                </option>
                            ))}
                        </select>
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
                            Só os que algum Pokémon usa
                        </label>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                            <span className="muted">
                                Revisados: {reviewed}/{rows.length}
                            </span>
                            <button type="button" className="btn small primary" onClick={copy}>
                                {copied ? 'Copiado!' : 'Copiar revisão'}
                            </button>
                        </div>
                    </div>
                    <div className="ml-items">
                        {shown.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                className={`ml-item${r.id === current ? ' current' : ''}`}
                                onClick={() => select(r)}
                            >
                                <TypeIcon type={r.type} size={18} />
                                <span className="ml-name">{r.name}</span>
                                <span className="ml-style">{STYLE_PT[r.style]}</span>
                                <span className={`ml-mark ${review[r.id]?.verdict ?? ''}`}>
                                    {review[r.id]?.verdict === 'ok'
                                        ? '✓'
                                        : review[r.id]?.verdict === 'mudar'
                                          ? '✎'
                                          : ''}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
