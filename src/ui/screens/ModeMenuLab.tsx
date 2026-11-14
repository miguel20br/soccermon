import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { ClockCtx } from '../ambientes/clock';
import { HudIcon } from '../components/MatchHud';
import {
    Chips,
    Head,
    LAST,
    type ModeId,
    ModeSlices,
    Play,
    Scene,
    type SliceLook,
    useMenuScene,
    useMode,
    When,
} from './ModeMenu';
import './mode-menu-lab.css';

/*
 * Conceitos do menu de modos (?lab=menu-modos, só no dev e nas prévias), &v=b|c1|c2. O C (fatias, estilo Smash) virou o
 * menu de verdade (ModeMenu.tsx), em dois jeitos no celular em pé: c1 (as três empilhadas) e c2 (o Copa grande em cima e
 * os dois trancados lado a lado embaixo, o padrão). O B fica aqui de reserva, com as mesmas cenas e textos. O A (herói + dois cartões)
 * saiu em 30/10/2026.
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

export function ModeMenuLab({ onExit }: { onExit: () => void }) {
    const params = new URLSearchParams(window.location.search);
    const fixed = params.get('v');
    const [v, setV] = useState<'b' | SliceLook>(fixed === 'b' || fixed === 'c1' ? fixed : 'c2');
    const { clock, big } = useMenuScene();
    return (
        <ClockCtx.Provider value={clock}>
            <div className={`mm-root mm-lab mm-v-${v}`}>
                {v === 'b' ? <ConceptB big={big} /> : <ModeSlices big={big} look={v} />}
                {!fixed && (
                    <div className="mm-switch bc-seg">
                        {(['b', 'c1', 'c2'] as const).map((k) => (
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
