import { type CSSProperties, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { KANTO_BADGES } from '../../store/missions';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { FieldSprite } from '../ambientes/FieldSprite';
import { TopBar } from '../ambientes/TopBar';
import { KantoBadge } from '../components/BadgeCase';
import { HudIcon } from '../components/MatchHud';
import '../ambientes/ambientes.css';
import '../components/badges.css';
import './mode-menu.css';

/*
 * Menu de modos: a tela que vem ANTES da Home dos ambientes pra quem já jogou (regra em `modeMenuDue`, store/coach.ts).
 * É o conceito A do ?lab=menu-modos (herói + dois cartões, estilo FIFA); o laboratório usa as mesmas cenas nos
 * conceitos B e C. Nomes e textos em `home.modes` (src/i18n): ainda não estão fechados.
 */

export type ModeId = 'atual' | 'ultimate' | 'historia';
export const LAST: ModeId = 'atual';
const LOCKED = ['ultimate', 'historia'] as const;

/** Nome e itens do modo (i18n). */
export function useMode(id: ModeId) {
    return useT().d.home.modes[id];
}

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
    const { t } = useT();
    return (
        <div className="mm-sc mm-sc-his" aria-hidden>
            <i className="mm-ground" />
            <div className="mm-stage">
                <i className="mm-sun" />
                <div className="mm-gym">
                    <i className="mm-gym-roof" />
                    <span className="mm-gym-sign">{t('home.modes.gym')}</span>
                    <i className="mm-gym-door" />
                </div>
                <i className="mm-path" />
                {/* à direita do caminho, longe da placa do ginásio */}
                <span className="mm-pt" style={at(46, 96)}>
                    <FieldSprite id={1} anim="Idle" dir={2} scale={scale} />
                </span>
                <span className="mm-blue" style={at(76, 96)}>
                    <img className="pixel" src="assets/trainers/blue.png" alt="" />
                    <span className="mm-say">{t('home.modes.rival')}</span>
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

export function Scene({ id, scale }: { id: ModeId; scale: number }) {
    if (id === 'atual') return <SceneAtual scale={scale} />;
    if (id === 'ultimate') return <SceneUltimate scale={scale} />;
    return <SceneHistoria scale={scale} />;
}

/** "Chega em…": placa com o relógio, nunca cadeado. */
export function When({ id }: { id: ModeId }) {
    const m = useMode(id);
    if (!('when' in m)) return null;
    return (
        <span className="mm-when">
            <HudIcon kind="stopwatch" />
            {m.when}
        </span>
    );
}

export function Play({ sub, onClick }: { sub?: string; onClick?: () => void }) {
    const { t } = useT();
    return (
        <button type="button" className="btn cb cb-gold mm-play" onClick={onClick}>
            <i className="cb-shine" aria-hidden />
            <b>{t('home.modes.play')}</b>
            {sub && <small>{sub}</small>}
        </button>
    );
}

export function Chips({ id }: { id: ModeId }) {
    return (
        <span className="mm-chips">
            {useMode(id).topics.map((t) => (
                <span key={t}>{t}</span>
            ))}
        </span>
    );
}

export function Head() {
    return (
        <header className="mm-top">
            <img className="mm-logo" src="assets/ui/logo.svg" alt="Soccermon" width="1441" height="300" />
            <TopBar />
        </header>
    );
}

/** Toque num modo trancado: o cartão balança e a placa da data acende (some sozinha); não navega. */
function useWiggle() {
    const [w, setW] = useState<ModeId | null>(null);
    const timer = useRef(0);
    return [
        w,
        (id: ModeId) => {
            setW(null);
            window.clearTimeout(timer.current);
            requestAnimationFrame(() => setW(id));
            timer.current = window.setTimeout(() => setW(null), 1600);
        },
    ] as const;
}

function LockedCard({ id, n, wiggle, on }: { id: ModeId; n: number; wiggle: (id: ModeId) => void; on: boolean }) {
    const m = useMode(id);
    return (
        <button
            type="button"
            className={`mm-card mm-small${on ? ' wiggle' : ''}`}
            style={{ '--n': n } as CSSProperties}
            onClick={() => wiggle(id)}
        >
            <Scene id={id} scale={2} />
            <span className="mm-small-txt">
                <When id={id} />
                <b className="cb-num">{m.name}</b>
                <span className="mm-list">
                    {m.topics.map((t) => (
                        <span key={t}>{t}</span>
                    ))}
                </span>
            </span>
        </button>
    );
}

/** Conceito A: o modo atual no herói (quadra viva, ÚLTIMO JOGADO e o JOGAR) e os dois trancados embaixo ou ao lado. */
export function ModeGrid({ big, onPlay }: { big: boolean; onPlay?: () => void }) {
    const { t } = useT();
    const [wig, wiggle] = useWiggle();
    return (
        <div className="mm-a">
            <Head />
            <div className="mm-a-grid">
                <article className="mm-card mm-hero" style={{ '--n': 0 } as CSSProperties}>
                    <SceneAtual scale={big ? 3 : 2} />
                    <span className="mm-ribbon">{t('home.modes.last')}</span>
                    <div className="mm-hero-txt">
                        <h2 className="cb-num">{useMode(LAST).name}</h2>
                        <Chips id={LAST} />
                        <Play onClick={onPlay} />
                    </div>
                </article>
                {LOCKED.map((id, n) => (
                    <LockedCard key={id} id={id} n={n + 1} wiggle={wiggle} on={wig === id} />
                ))}
            </div>
        </div>
    );
}

/** O relógio das cenas e o tamanho dos sprites (3x na tela larga), pro menu e pro laboratório. */
export function useMenuScene() {
    const clock = useSceneClock(true);
    const [big] = useState(() => window.matchMedia('(min-width: 900px)').matches);
    return { clock, big };
}

/**
 * O menu de verdade (App.tsx): `phase` 'in' entra com fade por cima da Home, 'out' sai com fade e a Home já está
 * embaixo (JOGAR); 'on' parado.
 */
export function ModeMenu({ phase, onPlay }: { phase: 'in' | 'on' | 'out'; onPlay: () => void }) {
    const { t } = useT();
    const { clock, big } = useMenuScene();
    return (
        <ClockCtx.Provider value={clock}>
            <section className={`mm-root mm-menu mm-${phase}`} aria-label={t('home.modes.aria')}>
                <ModeGrid big={big} onPlay={onPlay} />
            </section>
        </ClockCtx.Provider>
    );
}
