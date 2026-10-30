import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { ClockCtx } from '../ambientes/clock';
import { HudIcon } from '../components/MatchHud';
import { Chips, Head, LAST, ModeGrid, type ModeId, Play, Scene, useMenuScene, useMode, When } from './ModeMenu';
import './mode-menu-lab.css';

/*
 * Conceitos do menu de modos (?lab=menu-modos, só no dev e nas prévias), &v=a|b|c. O A virou o menu de verdade
 * (ModeMenu.tsx); B e C ficam aqui de reserva, com as mesmas cenas e textos.
 */

/** Nome do modo pra quem não é componente (os pontos do carrossel). */
function useNames(): Record<ModeId, string> {
    const m = useT().d.home.modes;
    return { atual: m.atual.name, ultimate: m.ultimate.name, historia: m.historia.name };
}

function Name({ id }: { id: ModeId }) {
    return <b className="cb-num">{useMode(id).name}</b>;
}

/* ---------------------------------------------------------------- B: carrossel de pôsteres (Fortnite antigo) */
const ORDER_B: ModeId[] = ['ultimate', 'atual', 'historia'];
function ConceptB({ big }: { big: boolean }) {
    const track = useRef<HTMLDivElement>(null);
    const [cur, setCur] = useState(ORDER_B.indexOf(LAST));
    // abre no último jogado (antes de pintar: não é salto, é o lugar inicial)
    useLayoutEffect(() => {
        const el = track.current?.children[ORDER_B.indexOf(LAST)] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
    }, []);
    const onScroll = () => {
        const t = track.current;
        if (!t) return;
        const mid = t.scrollLeft + t.clientWidth / 2;
        let best = 0;
        let dist = Number.POSITIVE_INFINITY;
        Array.from(t.children).forEach((c, i) => {
            const e = c as HTMLElement;
            const d = Math.abs(e.offsetLeft + e.offsetWidth / 2 - mid);
            if (d < dist) {
                dist = d;
                best = i;
            }
        });
        setCur(best);
    };
    const goTo = (i: number) =>
        (track.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({
            block: 'nearest',
            inline: 'center',
            behavior: 'smooth',
        });
    const id = ORDER_B[cur];
    const names = useNames();
    const { t } = useT();
    return (
        <div className="mm-b">
            <Head />
            <div className="mm-b-track" ref={track} onScroll={onScroll}>
                {ORDER_B.map((m, i) => (
                    <button
                        type="button"
                        key={m}
                        className={`mm-poster mm-p-${m}${i === cur ? ' on' : ''}`}
                        style={{ '--n': i } as CSSProperties}
                        onClick={() => goTo(i)}
                    >
                        <Scene id={m} scale={big ? 3 : 2} />
                        {m === LAST && <span className="mm-ribbon">{t('home.modes.last')}</span>}
                        <span className="mm-poster-txt">
                            <When id={m} />
                            <Name id={m} />
                            <Chips id={m} />
                        </span>
                    </button>
                ))}
            </div>
            <div className="mm-b-dots">
                {ORDER_B.map((m, i) => (
                    <button
                        type="button"
                        key={m}
                        className={i === cur ? 'on' : ''}
                        aria-label={names[m]}
                        onClick={() => goTo(i)}
                    />
                ))}
            </div>
            <div className="mm-b-cta">
                <div className={`mm-swap${id === 'atual' ? ' on' : ''}`}>
                    <Play />
                </div>
                <div className={`mm-swap${id !== 'atual' ? ' on' : ''}`}>
                    <span className="mm-b-soon">
                        <HudIcon kind="stopwatch" />
                        {id === 'historia' ? t('home.modes.historia.when') : t('home.modes.ultimate.when')}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ---------------------------------------------------------------- C: fatias na diagonal (Smash) */
const ORDER_C: ModeId[] = ['atual', 'ultimate', 'historia'];
function ConceptC({ big }: { big: boolean }) {
    const [sel, setSel] = useState<ModeId>(LAST);
    const names = useNames();
    const { t } = useT();
    return (
        <div className="mm-c">
            <Head />
            <div className="mm-c-stack">
                {ORDER_C.map((m, n) => (
                    <button
                        type="button"
                        key={m}
                        className={`mm-slice mm-s-${m}${sel === m ? ' on' : ''}`}
                        style={{ '--n': n } as CSSProperties}
                        onClick={() => setSel(m)}
                        aria-pressed={sel === m}
                    >
                        <Scene id={m} scale={big ? 3 : 2} />
                        <span className="mm-slice-txt">
                            {m === LAST && <span className="mm-tag">{t('home.modes.last')}</span>}
                            <When id={m} />
                            <Name id={m} />
                            <span className="mm-slice-more">
                                <Chips id={m} />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
            {/* o polegar sempre joga o último modo; tocar numa fatia só abre a prévia dela */}
            <div className="mm-c-cta">
                <Play sub={sel === 'atual' ? undefined : `${names.atual} · ${t('home.modes.last').toLowerCase()}`} />
            </div>
        </div>
    );
}

export function ModeMenuLab({ onExit }: { onExit: () => void }) {
    const params = new URLSearchParams(window.location.search);
    const fixed = params.get('v');
    const [v, setV] = useState(fixed === 'b' || fixed === 'c' ? fixed : 'a');
    const { clock, big } = useMenuScene();
    return (
        <ClockCtx.Provider value={clock}>
            <div className={`mm-root mm-lab mm-v-${v}`}>
                {v === 'a' ? <ModeGrid big={big} /> : v === 'b' ? <ConceptB big={big} /> : <ConceptC big={big} />}
                {!fixed && (
                    <div className="mm-switch bc-seg">
                        {(['a', 'b', 'c'] as const).map((k) => (
                            <button type="button" key={k} className={v === k ? 'active' : ''} onClick={() => setV(k)}>
                                {k.toUpperCase()}
                            </button>
                        ))}
                        <button type="button" onClick={onExit} aria-label="Sair">
                            <HudIcon kind="close" />
                        </button>
                    </div>
                )}
            </div>
        </ClockCtx.Provider>
    );
}
