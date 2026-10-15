import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { playSfx } from '../../game/audio';
import { type Dict, fmt } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import '../help/help.css';
import { Trophy } from './Trophy';
import { TypeIcon } from './TypeIcon';

/** Tamanho natural (px) dos sprites usados aqui, pra manter a proporção entre eles. */
const SPRITE_SIZE: Record<number, [number, number]> = {
    1: [37, 38],
    3: [86, 71],
    4: [41, 42],
    5: [66, 56],
    6: [87, 89],
    7: [39, 43],
    9: [70, 66],
    25: [50, 46],
    133: [46, 47],
    143: [74, 75],
    150: [90, 69],
    151: [77, 53],
};

function Sprite({ id, scale = 1, className = '' }: { id: number; scale?: number; className?: string }) {
    const [w, h] = SPRITE_SIZE[id] ?? [56, 56];
    return (
        <img
            className={`pixel ob-sprite ${className}`}
            src={`assets/cards/${id}.gif`}
            alt=""
            width={Math.round(w * scale)}
            height={Math.round(h * scale)}
            draggable={false}
        />
    );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="ob-chevron">
            <path d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
        </svg>
    );
}

/** Mini-quadra vista de cima, com o time em losango (1-2-1). */
function CourtVisual() {
    const spots: [number, number, number][] = [
        [50, 88, 7],
        [50, 64, 1],
        [20, 42, 4],
        [80, 42, 25],
        [50, 18, 6],
    ];
    return (
        <div className="ob-court">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x="2" y="2" width="96" height="96" rx="4" />
                <line x1="2" y1="50" x2="98" y2="50" />
                <circle cx="50" cy="50" r="10" />
                <path d="M32 2v10a18 10 0 0 0 36 0V2M32 98V88a18 10 0 0 1 36 0v10" />
            </svg>
            {spots.map(([x, y, id]) => (
                <span key={id} className="ob-court-spot" style={{ left: `${x}%`, top: `${y}%` }}>
                    <Sprite id={id} scale={id === 6 ? 0.5 : 0.85} />
                </span>
            ))}
        </div>
    );
}

interface Slide {
    title: string;
    text: ReactNode;
    visual: ReactNode;
}

/** Os passos, no idioma do jogo. */
const slides = (d: Dict): Slide[] => {
    const o = d.help.onboarding;
    return [
        {
            title: o.welcomeTitle,
            text: rich(o.welcomeText),
            visual: (
                <div className="ob-welcome">
                    <img className="ob-logo" src="assets/ui/logo.svg" alt="Soccermon" draggable={false} />
                    <div className="ob-lineup">
                        <Sprite id={1} scale={1.3} />
                        <Sprite id={25} scale={1.3} />
                        <Sprite id={4} scale={1.3} />
                        <Sprite id={7} scale={1.3} />
                    </div>
                </div>
            ),
        },
        {
            title: o.draftTitle,
            text: rich(o.draftText),
            visual: (
                <div className="ob-draft">
                    {[6, 9, 3].map((id, i) => (
                        <div key={id} className={`ob-mini-card${i === 1 ? ' picked' : ''}`}>
                            <Sprite id={id} scale={0.62} />
                            <span className="ob-mini-bar" />
                            <span className="ob-mini-bar short" />
                        </div>
                    ))}
                </div>
            ),
        },
        {
            title: o.lineupTitle,
            text: rich(o.lineupText),
            visual: (
                <div className="ob-lineup-visual">
                    <CourtVisual />
                    <div className="ob-chips">
                        <span className="ob-chip">
                            <TypeIcon type="Fire" size={18} /> ×2 +3%
                        </span>
                        <span className="ob-chip">{d.common.link.iniciais.name}</span>
                    </div>
                </div>
            ),
        },
        {
            title: o.coachTitle,
            text: rich(o.coachText),
            visual: (
                <div className="ob-evolve">
                    <div className="ob-evo-row">
                        <Sprite id={4} scale={1.35} />
                        <svg viewBox="0 0 40 20" className="ob-evo-arrow" aria-hidden="true">
                            <path d="M2 10h30M26 4l7 6-7 6" />
                        </svg>
                        <Sprite id={5} scale={1.05} className="ob-glow" />
                    </div>
                    <div className="ob-controls">
                        <span className="ob-pill">{o.tactic}</span>
                        <span className="ob-pill yellow">{o.sub}</span>
                        <span className="ob-pill">2x</span>
                    </div>
                </div>
            ),
        },
        {
            title: o.cupTitle,
            text: rich(o.cupText),
            visual: (
                <div className="ob-cup">
                    <ol className="ob-path">
                        {(['Rock', 'Water', 'Electric', 'Dragon'] as const)
                            .map((type, i) => [type, o.cupPath[i]] as const)
                            .map(([type, label]) => (
                                <li key={label}>
                                    <TypeIcon type={type} size={30} />
                                    <span>{label}</span>
                                </li>
                            ))}
                    </ol>
                    <Trophy size={70} />
                </div>
            ),
        },
        {
            title: o.dexTitle,
            text: rich(o.dexText),
            visual: (
                <div className="ob-dex">
                    <div className="ob-dex-grid">
                        {[25, 133, 143, 150, 151, 9].map((id, i) => (
                            <span key={id} className={`ob-dex-cell${i >= 3 ? ' unseen' : ''}`}>
                                <Sprite id={id} scale={id === 25 || id === 133 ? 0.9 : 0.6} />
                            </span>
                        ))}
                    </div>
                    <svg viewBox="0 0 48 32" className="ob-cloud" aria-hidden="true">
                        <path d="M14 28h22a8 8 0 0 0 1-15.9A11 11 0 0 0 16 9.5 9.3 9.3 0 0 0 14 28Z" />
                        <path d="M24 24v-9M20 18.5l4-4 4 4" className="ob-cloud-arrow" />
                    </svg>
                </div>
            ),
        },
    ];
};

const SWIPE_MIN = 45;

/** Passo a passo de boas-vindas ("Como jogar"): cards que deslizam, aparece na primeira visita. */
export function Onboarding() {
    const setOnboarded = useGame((s) => s.setOnboarded);
    const { d } = useT();
    const o = d.help.onboarding;
    const SLIDES = useMemo(() => slides(d), [d]);
    const [index, setIndex] = useState(0);
    const [drag, setDrag] = useState(0);
    const start = useRef<{ x: number; y: number; id: number } | null>(null);
    const dialog = useRef<HTMLDivElement>(null);
    const last = index === SLIDES.length - 1;

    useEffect(() => {
        dialog.current?.focus();
    }, []);

    const close = () => {
        playSfx('select');
        setOnboarded(true);
    };
    const goTo = (i: number) => setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(index + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(index - 1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        } else if (e.key === 'Tab') {
            // foco preso no diálogo
            const items = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
            if (!items?.length) return;
            const first = items[0];
            const lastEl = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
            // resistência nas pontas
            const edge = (index === 0 && dx > 0) || (last && dx < 0);
            setDrag(edge ? dx / 3 : dx);
        }
    };
    const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        start.current = null;
        const dx = e.clientX - s.x;
        if (dx <= -SWIPE_MIN) goTo(index + 1);
        else if (dx >= SWIPE_MIN) goTo(index - 1);
        setDrag(0);
    };

    return (
        <div className="modal-backdrop ob-backdrop" role="presentation">
            <div
                ref={dialog}
                className="panel ob-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ob-title"
                aria-roledescription={o.carousel}
                tabIndex={-1}
                onKeyDown={onKeyDown}
            >
                <div className="ob-top">
                    <span className="ob-count">{fmt(o.count, { n: index + 1, total: SLIDES.length })}</span>
                    <button type="button" className="btn ghost small ob-skip" onClick={close}>
                        {o.skip}
                    </button>
                </div>

                <div
                    className="ob-viewport"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                >
                    <div
                        className={`ob-track${drag ? ' dragging' : ''}`}
                        style={{ transform: `translateX(calc(${-index} * (100% + 32px) + ${drag}px))` }}
                    >
                        {SLIDES.map((s, i) => (
                            <section
                                key={s.title}
                                className="ob-slide"
                                aria-hidden={i !== index}
                                aria-roledescription={o.step}
                                aria-label={fmt(o.stepOf, { n: i + 1, total: SLIDES.length })}
                            >
                                <div className="ob-visual">{s.visual}</div>
                                <div className="ob-copy">
                                    <h2 id={i === index ? 'ob-title' : undefined}>{s.title}</h2>
                                    <p>{s.text}</p>
                                </div>
                            </section>
                        ))}
                    </div>
                </div>

                <div className="ob-nav">
                    <button
                        type="button"
                        className="btn ghost ob-arrow"
                        onClick={() => goTo(index - 1)}
                        disabled={index === 0}
                        aria-label={o.prev}
                    >
                        <Chevron dir="left" />
                    </button>
                    <div className="ob-dots">
                        {SLIDES.map((s, i) => (
                            <button
                                key={s.title}
                                type="button"
                                className={`ob-dot${i === index ? ' on' : ''}`}
                                onClick={() => goTo(i)}
                                aria-label={fmt(o.goToStep, { n: i + 1, title: s.title })}
                                aria-current={i === index ? 'step' : undefined}
                            />
                        ))}
                    </div>
                    {last ? (
                        <button type="button" className="btn primary ob-go" onClick={close}>
                            {o.go}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn ob-arrow ob-next"
                            onClick={() => goTo(index + 1)}
                            aria-label={o.next}
                        >
                            <Chevron dir="right" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
