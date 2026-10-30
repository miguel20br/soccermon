import { type CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { onBeat } from '../../game/music';
import { plural } from '../../i18n';
import type { Lang } from '../../i18n/lang';
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
import { clubWild } from '../ambientes/wild';
import { KantoBadge } from '../components/BadgeCase';
import { PackArt } from '../components/CardPack';
import { Logo } from '../components/LogoHits';
import { HudIcon } from '../components/MatchHud';
import { PokeCard2 } from '../components/PokeCard2';
import { TopActions } from '../components/TopActions';
import { openPage } from '../doors';
import { reduceMotionOn } from '../settings-sync';
import { uiZoom } from '../ui-zoom';
import '../ambientes/ambientes.css';
import '../components/badges.css';
import './mode-menu.css';

/*
 * Menu de modos: a tela que vem ANTES da Home dos ambientes pra quem já jogou (regra em `modeMenuDue`, store/coach.ts).
 * É o conceito C do ?lab=menu-modos (fatias na diagonal, estilo Smash, escolhido em 30/10/2026); o laboratório guarda
 * o B com as mesmas cenas. Nomes e textos em `home.modes` (src/i18n).
 */

export type ModeId = 'atual' | 'ultimate' | 'historia';
export const LAST: ModeId = 'atual';

/** Estreia do Ultimate: a contagem do cartão ("faltam N dias") sai só daqui. */
export const ULTIMATE_AT = new Date('2026-11-27T00:00:00-03:00');
/** Dias inteiros até `at` (arredonda pra cima: falta meio dia = falta 1); 0 quando já chegou. */
export const daysUntil = (at: Date, now: Date) => Math.max(0, Math.ceil((at.getTime() - now.getTime()) / 86_400_000));
/** A data do selo "EM BREVE": o dia da estreia do Ultimate (de `ULTIMATE_AT`, "27/11" / "Nov 27") ou o ano do Modo História. */
export const soonDate = (id: ModeId, lang: Lang) =>
    id === 'ultimate'
        ? ULTIMATE_AT.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
              timeZone: 'America/Sao_Paulo',
              ...(lang === 'pt' ? { day: '2-digit', month: '2-digit' } : { day: 'numeric', month: 'short' }),
          })
        : '2027';

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

/** Quem toca a bola no Modo Copa: o seu Pokémon do avatar (shiny, se for) puxa o triângulo de passes, com Charmander e Squirtle. */
export function passers(avatar: Avatar, skip?: number): Mon[] {
    const lead = avatarMon(avatar);
    return [lead, ...[4, 7, 1].filter((id) => id !== lead.id).map((id) => ({ id }))]
        .filter((m) => m.id !== skip)
        .slice(0, 3);
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
function SceneAtual({ scale, bare }: { scale: number; bare?: boolean }) {
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    const cap = useCaptain();
    // na fatia o capitão vai grande na frente (Hero): na roda de passes entra outro no lugar dele
    const ids = passers(
        useGame((s) => s.profile.avatar),
        bare ? cap.id : undefined,
    );
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

/**
 * O capitão do clube (o herói da fatia do Modo Copa): o artilheiro ou o mais usado (`clubWild`, o mesmo da Sede);
 * quem nunca jogou, o Pokémon do avatar.
 */
function useCaptain(): Mon {
    const dex = useGame((s) => s.dex);
    const avatar = useGame((s) => s.profile.avatar);
    return useMemo(() => clubWild(dex, 1)[0] ?? avatarMon(avatar), [dex, avatar]);
}

/** A carta ouro que espia do pacote: um Dragonite de verdade (carta Metal), em silhueta e com "?" no lugar da nota. */
const PEEK = { ...createInstance(149, new Rng('menu-modos')), shiny: false };

/** O pacote do jogo treme e a carta ouro sobe com a silhueta e o brilho do foil. */
function Pack() {
    return (
        <div className="mm-pack">
            <span className="mm-peek">
                <PokeCard2 inst={PEEK} variant="metal" />
            </span>
            <PackArt look="gold" />
        </div>
    );
}

/** O pacote (fora da cena quando é o herói da fatia, `bare`) e o Eevee pulando de curiosidade. */
function SceneUltimate({ scale, bare }: { scale: number; bare?: boolean }) {
    return (
        <div className="mm-sc mm-sc-ult" aria-hidden>
            <i className="mm-rays" />
            <div className="mm-stage">
                {!bare && <Pack />}
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

/** O Blue provocando, com o balão. */
function Blue({ style }: { style?: CSSProperties }) {
    const { t } = useT();
    return (
        <span className="mm-blue" style={style}>
            <img className="pixel" src="assets/trainers/blue.png" alt="" />
            <span className="mm-say">{t('home.modes.rival')}</span>
        </span>
    );
}

/** Fim de tarde na frente do ginásio de Kanto: a placa, as insígnias acendendo na fachada e o Blue provocando. */
function SceneHistoria({ scale, bare }: { scale: number; bare?: boolean }) {
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
                {!bare && <Blue style={at(82, 97)} />}
            </div>
        </div>
    );
}

/** A cena do modo; `bare` (nas fatias) deixa de fora o herói, que vai por cima e fura a borda (`Hero`). */
export const Scene = memo(function Scene({ id, scale, bare }: { id: ModeId; scale: number; bare?: boolean }) {
    if (id === 'atual') return <SceneAtual scale={scale} bare={bare} />;
    if (id === 'ultimate') return <SceneUltimate scale={scale} bare={bare} />;
    return <SceneHistoria scale={scale} bare={bare} />;
});

/**
 * O herói da fatia, grande e fora do recorte (fura a borda, como a arte de lutador do Smash): o capitão do clube, o
 * pacote com a carta ouro e o Blue. Atrás dele (no fundo da fatia), raios girando quando ela está aberta.
 */
const Hero = memo(function Hero({ id, scale }: { id: ModeId; scale: number }) {
    const cap = useCaptain();
    return (
        <span className={`mm-hero mm-hero-${id}`} aria-hidden>
            {id === 'atual' ? (
                <span className="mm-pt mm-cap">
                    <i className="mm-shadow" />
                    <FieldSprite id={cap.id} shiny={cap.shiny} anim="Idle" dir={6} scale={scale} />
                </span>
            ) : id === 'ultimate' ? (
                <Pack />
            ) : (
                <Blue />
            )}
        </span>
    );
});

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

/** Selo do modo que ainda não chegou: "EM BREVE" e a data grande, na cor do jogo (nunca cadeado). */
export function Soon({ id }: { id: ModeId }) {
    const { t, lang } = useT();
    return (
        <span className="mm-soon">
            <span>{t('home.modes.soon')}</span>
            <b>{soonDate(id, lang)}</b>
        </span>
    );
}

/**
 * O botão de baixo com um trancado aberto: diz quando chega (não é JOGAR, então não é dourado) e um toque volta pro
 * Modo Copa, onde o JOGAR reaparece.
 */
function SoonCta({ id, on, onBack }: { id: ModeId; on: boolean; onBack: () => void }) {
    const { t, lang } = useT();
    return (
        <button
            type="button"
            className={`btn cb mm-soon-cta mm-cta-${id}${on ? '' : ' off'}`}
            inert={!on}
            onClick={onBack}
        >
            <b>
                <HudIcon kind="stopwatch" />
                {t('home.modes.arrives', { date: soonDate(id, lang) })}
            </b>
            <small>
                <HudIcon kind="prev" />
                {t('home.modes.backTo', { name: t('home.modes.atual.name') })}
            </small>
        </button>
    );
}

/** O JOGAR pulsa na batida da música do menu (sem música, o pulso do CSS segue sozinho). `off`: some (um trancado aberto). */
export function Play({ sub, off, onClick }: { sub?: string; off?: boolean; onClick?: () => void }) {
    const { t } = useT();
    const ring = useRef<HTMLElement>(null);
    useEffect(
        () =>
            onBeat((beat) => {
                if (document.documentElement.dataset.reduceMotion === 'true') return;
                ring.current?.animate(
                    [
                        { opacity: beat === 0 ? 0.9 : 0.5, transform: 'scale(1)' },
                        { opacity: 0, transform: 'scale(1.08, 1.35)' },
                    ],
                    { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
                );
            }),
        [],
    );
    return (
        <button type="button" className={`btn cb cb-gold mm-play${off ? ' off' : ''}`} inert={off} onClick={onClick}>
            <i ref={ring} className="mm-play-ring" aria-hidden />
            <i className="mm-play-glow" aria-hidden />
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

/** Quadros de uma animação FLIP: `at(e)` com `e` de 1 (a foto velha) a 0 (o layout novo), no ease-out do jogo. */
const FLIP_STEPS = 12;
function flipFrames(at: (e: number) => string): Keyframe[] {
    return Array.from({ length: FLIP_STEPS + 1 }, (_, k) => ({ transform: at((1 - k / FLIP_STEPS) ** 4) }));
}

/**
 * Abrir a fatia sem relayout por quadro (FLIP): mede cada peça antes, aplica o layout final de uma vez (`apply`) e
 * anima só transform, no compositor, da posição velha pra nova. O fundo escala até a caixa velha e a cena dentro dele
 * leva a escala inversa (não estica: a caixa recorta e vai revelando, presa no canto de fora de cada fatia); o herói
 * e o nome vão de onde estavam (a placa encolhe ou cresce até o tamanho novo). Os itens e os brilhos seguem com as
 * transições de opacidade do CSS. Animar a grade, o flex e a altura relayoutava a pilha a cada quadro e engasgava no
 * celular (30/10). Reduzir movimento: troca direto. Devolve as animações (um toque no meio cancela e parte de onde
 * está, a medida já inclui o transform em curso).
 */
function flipSlices(stack: HTMLElement, running: Animation[], apply: () => void): Animation[] {
    if (reduceMotionOn() || typeof stack.animate !== 'function') {
        for (const a of running) a.cancel();
        apply();
        return [];
    }
    const z = uiZoom();
    const parts = [...stack.querySelectorAll<HTMLElement>('.mm-slice')].map((s, i) => ({
        i,
        bg: s.querySelector<HTMLElement>('.mm-slice-bg'),
        inner: [...s.querySelectorAll<HTMLElement>('.mm-slice-bg > .mm-sc')],
        hero: s.querySelector<HTMLElement>('.mm-hero'),
        mark: s.querySelector<HTMLElement>('.mm-cap, .mm-hero .mm-pack, .mm-hero .mm-blue img'),
        txt: s.querySelector<HTMLElement>('.mm-slice-txt'),
        plate: s.querySelector<HTMLElement>('.mm-plate'),
    }));
    const box = (e: HTMLElement | null) => e?.getBoundingClientRect();
    const before = parts.map((p) => ({ bg: box(p.bg), mark: box(p.mark), plate: box(p.plate) }));
    for (const a of running) a.cancel();
    apply();
    const out: Animation[] = [];
    const opts: KeyframeAnimationOptions = { duration: 280, easing: 'linear' };
    const go = (el: HTMLElement, frames: Keyframe[], origin = '0 0') => {
        frames[0].transformOrigin = origin;
        frames[frames.length - 1].transformOrigin = origin;
        out.push(el.animate(frames, opts));
    };
    for (const p of parts) {
        const a = before[p.i];
        const bg = box(p.bg);
        if (p.bg && a.bg && bg?.width && bg.height) {
            const sx = a.bg.width / bg.width;
            const sy = a.bg.height / bg.height;
            const dx = (a.bg.left - bg.left) / z;
            const dy = (a.bg.top - bg.top) / z;
            if (Math.abs(sx - 1) > 0.002 || Math.abs(sy - 1) > 0.002 || Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                const lerp = (e: number, v: number) => 1 + (v - 1) * e;
                go(
                    p.bg,
                    flipFrames((e) => `translate(${dx * e}px, ${dy * e}px) scale(${lerp(e, sx)}, ${lerp(e, sy)})`),
                );
                // a cena presa no canto de fora: o Copa em cima e à esquerda, o do meio embaixo, o último embaixo e à direita
                const ax = ([0, 0.5, 1][p.i] ?? 0.5) * (bg.width / z);
                const ay = (p.i === 0 ? 0 : 1) * (bg.height / z);
                for (const c of p.inner)
                    go(
                        c,
                        flipFrames((e) => {
                            const ix = 1 / lerp(e, sx);
                            const iy = 1 / lerp(e, sy);
                            return `translate(${ax * (1 - ix)}px, ${ay * (1 - iy)}px) scale(${ix}, ${iy})`;
                        }),
                    );
            }
        }
        const mark = box(p.mark);
        const hero = box(p.hero);
        if (p.hero && a.mark && mark && hero) {
            // o herói vai de onde estava: a marca (o pé do capitão, o pacote, o Blue) volta pro lugar e tamanho velhos
            const s = mark.height && a.mark.height ? a.mark.height / mark.height : 1;
            const tx = (a.mark.left - hero.left - s * (mark.left - hero.left)) / z;
            const ty = (a.mark.top - hero.top - s * (mark.top - hero.top)) / z;
            if (Math.abs(s - 1) > 0.002 || Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5)
                go(
                    p.hero,
                    flipFrames((e) => `translate(${tx * e}px, ${ty * e}px) scale(${1 + (s - 1) * e})`),
                );
        }
        const plate = box(p.plate);
        if (p.txt && p.plate && a.plate && plate) {
            // o nome: a placa (pelo centro) volta pro lugar e tamanho velhos; o resto do texto vai junto
            const dx = (a.plate.left + a.plate.width / 2 - plate.left - plate.width / 2) / z;
            const dy = (a.plate.top + a.plate.height / 2 - plate.top - plate.height / 2) / z;
            const k = plate.width ? a.plate.width / plate.width : 1;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)
                go(
                    p.txt,
                    flipFrames((e) => `translate(${dx * e}px, ${dy * e}px)`),
                );
            if (Math.abs(k - 1) > 0.002)
                go(
                    p.plate,
                    flipFrames((e) => `scale(${1 + (k - 1) * e})`),
                    'center',
                );
        }
    }
    return out;
}

/** A ordem das fatias: o Modo Copa (o que joga) primeiro, os trancados depois. */
const ORDER: ModeId[] = ['atual', 'ultimate', 'historia'];

/**
 * Fatias na diagonal, estilo Smash (conceito C do ?lab=menu-modos): no PC e deitado lado a lado; no celular em pé,
 * `look` c2 (padrão, 30/10/2026: o Copa grande em cima e os dois trancados lado a lado embaixo, cada um com a cena
 * inteira) ou c1 (as três empilhadas). Tocar abre a fatia (cresce, acende, mostra os itens). Os trancados têm o selo
 * "EM BREVE" com a data; abertos, o JOGAR dá lugar a "Chega em…" (um toque volta pro Modo Copa).
 */
export type SliceLook = 'c1' | 'c2';
export function ModeSlices({ big, look = 'c2', onPlay }: { big: boolean; look?: SliceLook; onPlay?: () => void }) {
    const { t, d } = useT();
    const [sel, setSel] = useState<ModeId>(LAST);
    // o "Chega em…" guarda o último trancado aberto: voltando pro Copa, ele some com o texto certo
    const locked = useRef<ModeId>('ultimate');
    if (sel !== LAST) locked.current = sel;
    const stack = useRef<HTMLDivElement>(null);
    const anims = useRef<Animation[]>([]);
    const open = (m: ModeId) => {
        if (m === sel) return;
        const el = stack.current;
        if (!el) return setSel(m);
        anims.current = flipSlices(el, anims.current, () => flushSync(() => setSel(m)));
    };
    return (
        <div className={`mm-c mm-${look}`}>
            <Head />
            <div ref={stack} className={`mm-c-stack mm-sel-${sel}`}>
                {ORDER.map((m, n) => (
                    <button
                        type="button"
                        key={m}
                        className={`mm-slice mm-s-${m}${sel === m ? ' on' : ''}`}
                        style={{ '--n': n + 1 } as CSSProperties}
                        onClick={() => open(m)}
                        aria-pressed={sel === m}
                    >
                        <span className="mm-slice-bg">
                            <Scene id={m} scale={big ? 3 : 2} bare />
                            <i className="mm-burst" />
                        </span>
                        <Hero id={m} scale={big ? 5 : 3} />
                        <span className="mm-slice-txt">
                            {m === LAST ? <span className="mm-tag">{t('home.modes.last')}</span> : <Soon id={m} />}
                            <b className="cb-num mm-plate">
                                <span>{d.home.modes[m].name}</span>
                            </b>
                            <span className="mm-slice-more">
                                <span>
                                    {m === 'ultimate' && <When id={m} />}
                                    <Chips id={m} />
                                </span>
                            </span>
                        </span>
                    </button>
                ))}
            </div>
            <div className="mm-c-cta" style={{ '--n': 4 } as CSSProperties}>
                <Play off={sel !== LAST} onClick={onPlay} />
                <SoonCta id={locked.current} on={sel !== LAST} onBack={() => open(LAST)} />
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
 * Corte pro Estádio: a conta da câmera que leva a quadra do Modo Copa a encher a tela (escala e deslocamento, origem no
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
 * fatia do Modo Copa cresce até encher a tela e some no Estádio, que já está embaixo; 'on' parado.
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
        const scene = r?.querySelector('.mm-s-atual .mm-sc');
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
                <ModeSlices big={big} onPlay={play} />
            </section>
        </ClockCtx.Provider>
    );
}
