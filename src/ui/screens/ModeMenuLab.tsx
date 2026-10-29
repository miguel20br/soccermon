import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { KANTO_BADGES } from '../../store/missions';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { FieldSprite } from '../ambientes/FieldSprite';
import { TopBar } from '../ambientes/TopBar';
import { KantoBadge } from '../components/BadgeCase';
import { HudIcon } from '../components/MatchHud';
import '../ambientes/ambientes.css';
import '../components/badges.css';
import './mode-menu-lab.css';

/*
 * Conceitos do menu de modos (?lab=menu-modos, só no dev e nas prévias): a tela que vem ANTES da Home dos ambientes,
 * a partir da 2ª visita. Três jeitos (&v=a|b|c). Rascunho pra decidir com o Miguel; nada aqui vai pro jogo assim.
 */

type ModeId = 'atual' | 'ultimate' | 'historia';
const MODE: Record<ModeId, { name: string; when?: string; topics: string[] }> = {
    atual: { name: 'MODO ATUAL', topics: ['Copa', 'Rota Índigo', 'Duelo', 'Liga'] },
    ultimate: {
        name: 'ULTIMATE',
        when: 'Fim de novembro',
        topics: ['Time da temporada', 'Abra pacotes', 'Zera a cada temporada'],
    },
    historia: { name: 'MODO HISTÓRIA', when: '2027', topics: ['Os 8 ginásios', 'Insígnias de Kanto', 'Blue de rival'] },
};
const LAST: ModeId = 'atual';

/** Ponto da cena (em %): o pé do sprite fica nele. */
const at = (x: number, y: number): CSSProperties => ({ left: `${x}%`, top: `${y}%` });

/*
 * Cada cena: o fundo enche o cartão e o "palco" (16:10, preso embaixo, `.mm-stage`) leva o desenho e os Pokémon. Assim
 * a mesma cena serve no cartão pequeno, no pôster alto e na fatia larga sem esticar nada.
 */

/** Quadra de futsal viva: torcida, o Pikachu conduz a bola de um lado ao outro, a dupla respira, o refletor passeia. */
function SceneAtual({ scale }: { scale: number }) {
    return (
        <div className="mm-sc mm-sc-atual" aria-hidden>
            <i className="mm-stand" />
            <i className="mm-half" />
            <div className="mm-stage">
                <i className="mm-circle" />
                <i className="mm-spot" />
                <span className="mm-pt" style={at(22, 64)}>
                    <FieldSprite id={4} anim="Idle" dir={2} scale={scale} />
                </span>
                <span className="mm-pt" style={at(78, 58)}>
                    <FieldSprite id={7} anim="Idle" dir={6} scale={scale} />
                </span>
                <span className="mm-run">
                    <span className="mm-pt" style={at(0, 90)}>
                        <FieldSprite id={25} anim="Walk" dir={2} scale={scale} />
                    </span>
                    <img className="mm-ball" src="assets/ui/ball.svg" alt="" style={at(0, 90)} />
                </span>
            </div>
        </div>
    );
}

/** Pacote fechado que treme, uma carta dourada espia com a silhueta e o Eevee pula de curiosidade. */
function SceneUltimate({ scale }: { scale: number }) {
    return (
        <div className="mm-sc mm-sc-ult" aria-hidden>
            <i className="mm-rays" />
            <div className="mm-stage">
                <div className="mm-pack">
                    <span className="mm-peek">
                        <img className="mm-peek-mon pixel" src="assets/cards/150.gif" alt="" />
                    </span>
                    <span className="mm-pack-body">
                        <img src="assets/ui/simbolo.svg" alt="" />
                    </span>
                </div>
                <span className="mm-pt" style={at(22, 92)}>
                    <FieldSprite id={133} anim="Hop" dir={2} scale={scale} />
                </span>
            </div>
        </div>
    );
}

/** Fim de tarde na frente do ginásio: o Blue provoca, as 8 insígnias acendem uma por uma. */
function SceneHistoria({ scale }: { scale: number }) {
    return (
        <div className="mm-sc mm-sc-his" aria-hidden>
            <i className="mm-ground" />
            <div className="mm-stage">
                <i className="mm-sun" />
                <div className="mm-gym">
                    <i className="mm-gym-roof" />
                    <span className="mm-gym-sign">GINÁSIO</span>
                    <i className="mm-gym-door" />
                </div>
                <i className="mm-path" />
                <span className="mm-pt" style={at(24, 94)}>
                    <FieldSprite id={1} anim="Idle" dir={2} scale={scale} />
                </span>
                <span className="mm-blue" style={at(74, 96)}>
                    <img className="pixel" src="assets/trainers/blue.png" alt="" />
                    <span className="mm-say">Até mais, perdedor!</span>
                </span>
            </div>
            <span className="mm-badges">
                {KANTO_BADGES.map((id, i) => (
                    <span key={id} style={{ '--i': i } as CSSProperties}>
                        <KantoBadge leader={id} earned />
                    </span>
                ))}
            </span>
        </div>
    );
}

function Scene({ id, scale }: { id: ModeId; scale: number }) {
    if (id === 'atual') return <SceneAtual scale={scale} />;
    if (id === 'ultimate') return <SceneUltimate scale={scale} />;
    return <SceneHistoria scale={scale} />;
}

/** "Chega em…": placa com o relógio, nunca cadeado. */
function When({ id }: { id: ModeId }) {
    const w = MODE[id].when;
    if (!w) return null;
    return (
        <span className="mm-when">
            <HudIcon kind="stopwatch" />
            {id === 'historia' ? `Chega em ${w}` : `Chega ${w.toLowerCase()}`}
        </span>
    );
}

function Play({ sub }: { sub?: string }) {
    return (
        <button type="button" className="btn cb cb-gold mm-play">
            <i className="cb-shine" aria-hidden />
            <b>JOGAR</b>
            {sub && <small>{sub}</small>}
        </button>
    );
}

function Chips({ id }: { id: ModeId }) {
    return (
        <span className="mm-chips">
            {MODE[id].topics.map((t) => (
                <span key={t}>{t}</span>
            ))}
        </span>
    );
}

/** Toque num modo trancado: balança e troca a dica (vivo, sem "Em breve"). */
function useWiggle() {
    const [w, setW] = useState<ModeId | null>(null);
    return [
        w,
        (id: ModeId) => {
            setW(null);
            requestAnimationFrame(() => setW(id));
        },
    ] as const;
}

function Head() {
    return (
        <header className="mm-top">
            <img className="mm-logo" src="assets/ui/logo.svg" alt="Soccermon" width="1441" height="300" />
            <TopBar />
        </header>
    );
}

/* ---------------------------------------------------------------- A: herói + dois menores (FIFA) */
function ConceptA({ big }: { big: boolean }) {
    const [wig, wiggle] = useWiggle();
    return (
        <div className="mm-a">
            <Head />
            <div className="mm-a-grid">
                <article className="mm-card mm-hero" style={{ '--n': 0 } as CSSProperties}>
                    <SceneAtual scale={big ? 3 : 2} />
                    <span className="mm-ribbon">ÚLTIMO JOGADO</span>
                    <div className="mm-hero-txt">
                        <h2 className="cb-num">{MODE.atual.name}</h2>
                        <Chips id="atual" />
                        <Play sub="Copa Relâmpago · 4 jogos" />
                    </div>
                </article>
                {(['ultimate', 'historia'] as const).map((id, n) => (
                    <button
                        type="button"
                        key={id}
                        className={`mm-card mm-small${wig === id ? ' wiggle' : ''}`}
                        style={{ '--n': n + 1 } as CSSProperties}
                        onClick={() => wiggle(id)}
                    >
                        <Scene id={id} scale={2} />
                        <span className="mm-small-txt">
                            <When id={id} />
                            <b className="cb-num">{MODE[id].name}</b>
                            <span className="mm-list">
                                {MODE[id].topics.map((t) => (
                                    <span key={t}>{t}</span>
                                ))}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
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
                        {m === LAST && <span className="mm-ribbon">ÚLTIMO JOGADO</span>}
                        <span className="mm-poster-txt">
                            <When id={m} />
                            <b className="cb-num">{MODE[m].name}</b>
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
                        aria-label={MODE[m].name}
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
                        {id === 'historia' ? 'Chega em 2027' : 'Chega fim de novembro'}
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
                            {m === LAST && <span className="mm-tag">ÚLTIMO JOGADO</span>}
                            <When id={m} />
                            <b className="cb-num">{MODE[m].name}</b>
                            <span className="mm-slice-more">
                                <Chips id={m} />
                            </span>
                        </span>
                    </button>
                ))}
            </div>
            {/* o polegar sempre joga o último modo; tocar numa fatia só abre a prévia dela */}
            <div className="mm-c-cta">
                <Play sub={sel === 'atual' ? 'Copa Relâmpago · 4 jogos' : `${MODE.atual.name} · último jogado`} />
            </div>
        </div>
    );
}

export function ModeMenuLab({ onExit }: { onExit: () => void }) {
    const params = new URLSearchParams(window.location.search);
    const fixed = params.get('v');
    const [v, setV] = useState(fixed === 'b' || fixed === 'c' ? fixed : 'a');
    const clock = useSceneClock(true);
    const [big] = useState(() => window.matchMedia('(min-width: 900px)').matches);
    return (
        <ClockCtx.Provider value={clock}>
            <div className={`mm-lab mm-v-${v}`}>
                {v === 'a' ? <ConceptA big={big} /> : v === 'b' ? <ConceptB big={big} /> : <ConceptC big={big} />}
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
