import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { plural } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { KANTO_BADGES } from '../../store/missions';
import type { Avatar } from '../../store/profile';
import { clubColorHex } from '../../store/profile';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { CourtFloor, clubVars, Stands } from '../ambientes/Estadio';
import { FieldSprite } from '../ambientes/FieldSprite';
import { avatarMon, type Mon } from '../ambientes/metas';
import { TopBar } from '../ambientes/TopBar';
import { KantoBadge } from '../components/BadgeCase';
import { PackArt } from '../components/CardPack';
import { Logo } from '../components/LogoHits';
import { HudIcon } from '../components/MatchHud';
import { PokeCard2 } from '../components/PokeCard2';
import { TopActions } from '../components/TopActions';
import { openPage } from '../doors';
import { uiZoom } from '../ui-zoom';
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

/** Estreia do Ultimate: a contagem do cartão ("faltam N dias") sai só daqui. */
export const ULTIMATE_AT = new Date('2026-11-27T00:00:00-03:00');
/** Dias inteiros até `at` (arredonda pra cima: falta meio dia = falta 1); 0 quando já chegou. */
export const daysUntil = (at: Date, now: Date) => Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 86_400_000));

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

/** Quem toca a bola no herói: o seu Pokémon do avatar (shiny, se for) puxa o triângulo de passes, com Charmander e Squirtle. */
export function passers(avatar: Avatar): Mon[] {
    const lead = avatarMon(avatar);
    return [lead, ...[4, 7, 1].filter((id) => id !== lead.id).map((id) => ({ id }))].slice(0, 3);
}
/** Os três do triângulo (pé em % da quadra) e pra onde cada um olha: pro próximo da roda de passes. */
const PASS = [
    { x: 27, y: 46, dir: 2 },
    { x: 73, y: 36, dir: 7 },
    { x: 56, y: 84, dir: 5 },
];

/** Os goleiros, um em cada área (o Psyduck de um lado, o Snorlax fechando o gol do outro). */
const KEEPERS = [
    { id: 54, x: 7, y: 62, dir: 2 },
    { id: 143, x: 93, y: 58, dir: 6 },
];

/**
 * O Estádio de verdade num cartão: a torcida na cor do clube com a faixa, o letreiro de LED e a
 * quadra com a roda de passes (a bola corre entre os três e quem toca dá o bote).
 */
function SceneAtual({ scale }: { scale: number }) {
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    const ids = passers(useGame((s) => s.profile.avatar));
    return (
        <div className="mm-sc mm-sc-atual" style={clubVars(club)} aria-hidden>
            <Stands clubName={clubName} />
            <div className="es-court mm-court">
                <CourtFloor />
                <i className="es-spot" />
                {PASS.map((p, i) => (
                    <span
                        key={ids[i].id}
                        className="mm-pt mm-kick"
                        style={{ ...at(p.x, p.y), '--k': i } as CSSProperties}
                    >
                        <i className="mm-shadow" />
                        <FieldSprite id={ids[i].id} shiny={ids[i].shiny} anim="Idle" dir={p.dir} scale={scale} />
                    </span>
                ))}
                {KEEPERS.map((k) => (
                    <span key={k.id} className="mm-pt mm-keeper" style={at(k.x, k.y)}>
                        <i className="mm-shadow" />
                        <FieldSprite id={k.id} anim="Idle" dir={k.dir} scale={scale} />
                    </span>
                ))}
                <span className="mm-pass">
                    <i className="mm-shadow" />
                    <img className="mm-ball" src="assets/ui/ball.svg" alt="" />
                </span>
            </div>
        </div>
    );
}

/** A carta ouro que espia do pacote: um Dragonite de verdade (carta Metal), em silhueta e com "?" no lugar da nota. */
const PEEK = { ...createInstance(149, new Rng('menu-modos')), shiny: false };

/** O pacote do jogo treme, a carta ouro sobe com a silhueta e o brilho do foil, e o Eevee pula de curiosidade. */
function SceneUltimate({ scale }: { scale: number }) {
    return (
        <div className="mm-sc mm-sc-ult" aria-hidden>
            <i className="mm-rays" />
            <div className="mm-stage">
                <div className="mm-pack">
                    <span className="mm-peek">
                        <PokeCard2 inst={PEEK} variant="metal" />
                    </span>
                    <PackArt look="gold" />
                </div>
                <span className="mm-pt" style={at(20, 92)}>
                    <FieldSprite id={133} anim="Hop" dir={2} scale={scale} />
                </span>
            </div>
        </div>
    );
}

/** O ginásio de Kanto (pixel art): telhado vermelho com o frontão, as 8 insígnias na fachada e a porta dupla. */
function Gym() {
    return (
        <svg className="mm-gym-art" viewBox="0 0 100 60" shapeRendering="crispEdges" aria-hidden>
            {/* alas e corpo */}
            <rect x="4" y="25" width="92" height="35" fill="#0b0f24" />
            <rect x="5" y="26" width="90" height="34" fill="#d9cfb4" />
            <rect x="5" y="54" width="90" height="6" fill="#a99c7f" />
            {[10, 22, 72, 84].map((x) => (
                <g key={x}>
                    <rect x={x} y="42" width="7" height="8" fill="#0b0f24" />
                    <rect x={x + 1} y="43" width="5" height="6" fill="#7fb4e6" />
                    <rect x={x + 1} y="43" width="5" height="2" fill="#b9dcfa" />
                </g>
            ))}
            {/* faixa das insígnias */}
            <rect x="9" y="30" width="82" height="9" fill="#0b0f24" />
            <rect x="10" y="31" width="80" height="7" fill="#262d5c" />
            {/* telhado: beiral vermelho em degraus */}
            <rect x="0" y="18" width="100" height="8" fill="#0b0f24" />
            <rect x="1" y="19" width="98" height="6" fill="#c84a32" />
            <rect x="1" y="19" width="98" height="2" fill="#ec6e48" />
            <rect x="1" y="24" width="98" height="1" fill="#8a2a1c" />
            {/* frontão em cima da porta */}
            <polygon points="30,19 50,3 70,19" fill="#0b0f24" />
            <polygon points="33,18 50,5 67,18" fill="#c84a32" />
            <polygon points="38,18 50,9 62,18" fill="#f3ead2" />
            {/* porta dupla com colunas */}
            <rect x="35" y="40" width="4" height="20" fill="#f3ead2" stroke="#0b0f24" strokeWidth="1" />
            <rect x="61" y="40" width="4" height="20" fill="#f3ead2" stroke="#0b0f24" strokeWidth="1" />
            <rect x="41" y="42" width="18" height="18" fill="#0b0f24" />
            <rect x="42" y="43" width="16" height="17" fill="#3c2a1a" />
            <rect x="49.5" y="43" width="1" height="17" fill="#0b0f24" />
            <rect x="42" y="43" width="16" height="2" fill="#5b4128" />
        </svg>
    );
}

/** Fim de tarde na frente do ginásio de Kanto: a placa, as insígnias acendendo na fachada e o Blue provocando. */
function SceneHistoria({ scale }: { scale: number }) {
    const { t } = useT();
    return (
        <div className="mm-sc mm-sc-his" aria-hidden>
            <i className="mm-ground" />
            <div className="mm-stage">
                <i className="mm-sun" />
                <div className="mm-gym">
                    <Gym />
                    <span className="mm-gym-crest">
                        <KantoBadge leader="brock" earned />
                    </span>
                    <span className="mm-badges">
                        {KANTO_BADGES.map((id, i) => (
                            <span key={id} style={{ '--i': i } as CSSProperties}>
                                <KantoBadge leader={id} earned />
                            </span>
                        ))}
                    </span>
                </div>
                <span className="mm-sign">{t('home.modes.gym')}</span>
                <i className="mm-path" />
                <span className="mm-pt mm-bulba">
                    <FieldSprite id={1} anim="Idle" dir={2} scale={scale} />
                </span>
                <span className="mm-blue" style={at(82, 97)}>
                    <img className="pixel" src="assets/trainers/blue.png" alt="" />
                    <span className="mm-say">{t('home.modes.rival')}</span>
                </span>
            </div>
        </div>
    );
}

export function Scene({ id, scale }: { id: ModeId; scale: number }) {
    if (id === 'atual') return <SceneAtual scale={scale} />;
    if (id === 'ultimate') return <SceneUltimate scale={scale} />;
    return <SceneHistoria scale={scale} />;
}

/** "Chega em…": placa com o relógio, nunca cadeado. No Ultimate, a contagem dos dias até `ULTIMATE_AT`. */
export function When({ id }: { id: ModeId }) {
    const m = useMode(id);
    const { d } = useT();
    if (!('when' in m)) return null;
    const n = id === 'ultimate' ? daysUntil(ULTIMATE_AT, new Date()) : 0;
    return (
        <span className="mm-when">
            <HudIcon kind="stopwatch" />
            {n > 0 ? plural(d.home.modes.countdown, n) : m.when}
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

/** Ícone de cada item do modo Copa (na ordem de `home.modes.atual.topics`). */
const TOPIC_ICON = ['cup', 'map', 'friends', 'crown'] as const;

export function Chips({ id }: { id: ModeId }) {
    return (
        <span className="mm-chips">
            {useMode(id).topics.map((t, i) => (
                <span key={t}>
                    {id === 'atual' && <HudIcon kind={TOPIC_ICON[i] ?? 'cup'} />}
                    {t}
                </span>
            ))}
        </span>
    );
}

/** O topo: logo, o treinador, Novidades, Ajuda e a engrenagem (o mesmo canto da Home). */
export function Head() {
    return (
        <header className="mm-top k-topbar" style={{ '--n': 0 } as CSSProperties}>
            {/* celular em pé: o logo inteiro ficaria abaixo dos 120 px do guia; lá vai o símbolo */}
            <span className="mm-brand">
                <Logo className="mm-logo" alt="Soccermon" idle />
                <img className="mm-symbol" src="assets/ui/simbolo.svg" alt="Soccermon" width="40" height="40" />
            </span>
            <TopBar />
            <TopActions help={() => openPage('help')} profile={false} />
        </header>
    );
}

/** Toque num modo trancado: o cartão balança e a placa da data acende (some sozinha); não navega. */
function useWiggle() {
    const [w, setW] = useState<ModeId | null>(null);
    const timer = useRef(0);
    const raf = useRef(0);
    useEffect(
        () => () => {
            window.clearTimeout(timer.current);
            cancelAnimationFrame(raf.current);
        },
        [],
    );
    return [
        w,
        (id: ModeId) => {
            setW(null);
            window.clearTimeout(timer.current);
            cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(() => setW(id));
            timer.current = window.setTimeout(() => setW(null), 1600);
        },
    ] as const;
}

function LockedCard({ id, n, wiggle, on }: { id: ModeId; n: number; wiggle: (id: ModeId) => void; on: boolean }) {
    const m = useMode(id);
    return (
        <button
            type="button"
            className={`mm-card mm-small mm-${id}${on ? ' wiggle' : ''}`}
            style={{ '--n': n } as CSSProperties}
            onClick={() => wiggle(id)}
        >
            <Scene id={id} scale={2} />
            <When id={id} />
            <span className="mm-small-txt">
                <b className="cb-num">{m.name}</b>
                {'tag' in m && <span className="mm-tagline">{m.tag}</span>}
            </span>
        </button>
    );
}

/** Conceito A: o modo atual no herói (o Estádio, ÚLTIMO JOGADO e o JOGAR) e os dois trancados embaixo ou ao lado. */
export function ModeGrid({ big, onPlay }: { big: boolean; onPlay?: () => void }) {
    const { t } = useT();
    const [wig, wiggle] = useWiggle();
    return (
        <div className="mm-a">
            <Head />
            <div className="mm-a-grid">
                <article className="mm-card mm-hero" style={{ '--n': 1 } as CSSProperties}>
                    <SceneAtual scale={big ? 3 : 2} />
                    <span className="mm-ribbon">{t('home.modes.last')}</span>
                    <div className="mm-hero-txt">
                        <div className="mm-hero-name">
                            <h2 className="cb-num">{useMode(LAST).name}</h2>
                            <Chips id={LAST} />
                        </div>
                        <Play onClick={onPlay} />
                    </div>
                </article>
                {LOCKED.map((id, n) => (
                    <LockedCard key={id} id={id} n={n + 2} wiggle={wiggle} on={wig === id} />
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
 * Corte pro Estádio: a conta da câmera que leva a quadra do herói a encher a tela (escala e deslocamento, origem no
 * canto do conteúdo). Tudo em px da tela; quem escreve no estilo divide o deslocamento pelo `uiZoom()`.
 */
type Box = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
export function cutTo(scene: Box, view: Box, origin: Box) {
    const s = Math.max(view.width / scene.width, view.height / scene.height);
    const cx = scene.left + scene.width / 2 - origin.left;
    const cy = scene.top + scene.height / 2 - origin.top;
    return {
        s,
        x: view.left + view.width / 2 - origin.left - cx * s,
        y: view.top + view.height / 2 - origin.top - cy * s,
    };
}

/**
 * O menu de verdade (App.tsx): `phase` 'in' entra com fade por cima da Home; 'out' (JOGAR) é o corte: a quadra do
 * herói cresce até encher a tela e some no Estádio, que já está embaixo; 'on' parado.
 */
export function ModeMenu({ phase, onPlay }: { phase: 'in' | 'on' | 'out'; onPlay: () => void }) {
    const { t } = useT();
    const { clock, big } = useMenuScene();
    const root = useRef<HTMLElement>(null);
    // voltando da Home (fade de entrada), o foco vai pro JOGAR do menu
    // biome-ignore lint/correctness/useExhaustiveDependencies: só na montagem
    useEffect(() => {
        if (phase === 'in') root.current?.querySelector<HTMLElement>('.mm-play')?.focus({ preventScroll: true });
    }, []);
    const play = () => {
        const r = root.current;
        const inner = r?.firstElementChild;
        const scene = r?.querySelector('.mm-hero .mm-sc');
        if (r && inner && scene) {
            const z = uiZoom();
            const c = cutTo(scene.getBoundingClientRect(), r.getBoundingClientRect(), inner.getBoundingClientRect());
            r.style.setProperty('--cut-s', String(c.s));
            r.style.setProperty('--cut-x', `${c.x / z}px`);
            r.style.setProperty('--cut-y', `${c.y / z}px`);
        }
        onPlay();
    };
    return (
        <ClockCtx.Provider value={clock}>
            <section ref={root} className={`mm-root mm-menu mm-${phase}`} aria-label={t('home.modes.aria')}>
                <ModeGrid big={big} onPlay={play} />
            </section>
        </ClockCtx.Provider>
    );
}
