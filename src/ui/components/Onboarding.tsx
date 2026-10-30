import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { type Dict, fmt } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { Logo } from './LogoHits';
import '../help/help.css';
import { HudIcon } from './MatchHud';

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

interface Slide {
    title: string;
    text: ReactNode;
    visual: ReactNode;
}

/** Os passos, no idioma do jogo: só 3 (o resto vira dica na hora em que aparece: escalação, recompensa, Pokédex). */
const slides = (d: Dict): Slide[] => {
    const o = d.help.onboarding;
    return [
        {
            title: o.welcomeTitle,
            text: rich(o.welcomeText),
            visual: (
                <div className="ob-welcome">
                    <Logo className="ob-logo" alt="Soccermon" />
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
    ];
};

const SWIPE_MIN = 45;

/** Passo a passo de boas-vindas ("Como jogar"): cards que deslizam, aparece na primeira visita. */
export function Onboarding() {
    const setOnboarded = useGame((s) => s.setOnboarded);
    const setTour = useGame((s) => s.setTour);
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
        setOnboarded(true);
        setTour(false);
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
                    <span className="ob-count bc-tag">{fmt(o.count, { n: index + 1, total: SLIDES.length })}</span>
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
                        <HudIcon kind="prev" />
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
                        <button type="button" className="btn primary big ob-go" onClick={close}>
                            {o.go}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn ob-arrow ob-next"
                            onClick={() => goTo(index + 1)}
                            aria-label={o.next}
                        >
                            <HudIcon kind="next" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
