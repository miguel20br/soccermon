import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SPECIES } from '../../engine/data';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { plural } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { utNow } from '../../store/ultimate/clock';
import { ClockCtx } from '../ambientes/clock';
import { CourtFloor, clubVars, Stands } from '../ambientes/Estadio';
import { FieldSprite } from '../ambientes/FieldSprite';
import { goTab } from '../ambientes/nav';
import { openDoor } from '../doors';
import type { NewsArt, NewsCard, NewsTo } from '../news';
import { type PatchNotes, patchNotes } from '../patch-notes';
import { daysUntil, Scene, useMenuScene } from '../screens/ModeMenu';
import { reduceMotionOn } from '../settings-sync';
import { TYPE_COLOR } from '../type-colors';
import { uiZoom } from '../ui-zoom';
import { readUltimate } from '../ultimate/flag';
import { PackArt } from './CardPack';
import { HudIcon } from './MatchHud';
import { PokeCard2 } from './PokeCard2';
import { TypeIcon } from './TypeIcon';
import '../news-feed.css';

/*
 * A tela cheia das Novidades (pedaço preguiçoso, com as notas), como o feed de notícias do lobby do Fortnite: duas
 * abas no topo, Notícias (ui/news.ts, um cartão por tela) e Notas da versão (o changelog inteiro). Pesquisa e
 * decisões em docs/planos/noticias.md.
 */

/** Tempo de cada cartão no autoplay (para de vez no primeiro toque, tecla ou foco). */
const AUTO_MS = 6000;

/** O sprite pela tela (a arte enche a tela): 2 no celular pequeno, 3 no comum e deitado, até 5 no PC. */
function artScale(): number {
    const z = uiZoom();
    const w = window.innerWidth / z;
    const h = window.innerHeight / z;
    const [aw, ah] = w < h ? [w, h * 0.55] : [w * 0.7, h - 110];
    return Math.max(2, Math.min(5, Math.round(Math.min(aw, ah * 1.6) / 130)));
}

/** As cartas do Pokémon Picks (escolha 1 de 3): cartas de verdade do jogo, sempre as mesmas. */
const PICKS = [25, 6, 131].map((id) => ({ ...createInstance(id, new Rng(`noticias-${id}`)), shiny: false }));

/**
 * As artes: cenas que o jogo já tem (Estádio e pacote do menu de modos) e as montadas aqui com os mesmos sprites.
 * `s` = escala do sprite; o pixel do cenário (`--px`) acompanha.
 */
function Art({ art, s, type = 'normal' }: { art: NewsArt; s: number; type?: string }) {
    if (art === 'daily') return <Scene id="atual" scale={s} />;
    if (art === 'ultimate') return <Scene id="ultimate" scale={s} />;
    if (art === 'max')
        // câmera lenta: faixas de cinema, raios na cor do rival e o Charizard dele no meio da quadra
        return (
            <div className="mm-sc nf-max" aria-hidden>
                <i className="mm-rays" />
                <div className="es-court nf-court">
                    <CourtFloor />
                </div>
                <div className="mm-stage">
                    <span className="mm-pt" style={{ left: '50%', top: '84%' }}>
                        <i className="mm-shadow" />
                        <FieldSprite id={6} anim="Idle" dir={0} scale={s} />
                    </span>
                    <img className="nf-ball" src="assets/ui/ball.svg" alt="" />
                </div>
                <i className="nf-bar top" />
                <i className="nf-bar bottom" />
            </div>
        );
    if (art === 'packs')
        // Meus pacotes e Picks: a pilha de pacotes guardados e as três cartas pra escolher uma (a do meio sobe)
        return (
            <div className="mm-sc nf-packs" aria-hidden>
                <i className="mm-rays" />
                <div className="mm-stage">
                    <span className="nf-pile">
                        {(['', 'gold', 'special'] as const).map((look, i) => (
                            <span key={look} style={{ '--i': i } as CSSProperties}>
                                <PackArt look={look} />
                            </span>
                        ))}
                    </span>
                    <span className="nf-picks">
                        {PICKS.map((inst, i) => (
                            <span key={inst.speciesId} className={i === 1 ? 'on' : ''}>
                                <PokeCard2 inst={inst} variant="metal" />
                            </span>
                        ))}
                    </span>
                </div>
            </div>
        );
    if (art === 'rota')
        // a Rota nova: o mapa largo com o caminho, a grama alta da Zona Safari e as fichas do Cassino
        return (
            <div className="mm-sc nf-rota" aria-hidden>
                <div className="mm-stage">
                    <svg className="nf-map" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden>
                        <path d="M6 82 C 30 82, 34 52, 58 54 S 92 80, 112 58 S 140 26, 154 22" />
                    </svg>
                    {[
                        [4, 82],
                        [36, 55],
                        [70, 64],
                        [96, 22],
                    ].map(([x, y]) => (
                        <i key={x} className="nf-node" style={{ left: `${x}%`, top: `${y}%` }} />
                    ))}
                    <span className="mm-pt" style={{ left: '16%', top: '49%' }}>
                        <FieldSprite id={128} anim="Idle" dir={2} scale={s} />
                    </span>
                    <i className="nf-grass" style={{ left: '4%', top: '44%' }} />
                    <span className="nf-coins" style={{ left: '78%', top: '86%' }}>
                        <i />
                        <i />
                        <i />
                    </span>
                    {/* longe do canto: perto dele o quadro passava da borda da arte e o Meowth saía cortado */}
                    <span className="mm-pt" style={{ left: '80%', top: '82%' }}>
                        <i className="mm-shadow" />
                        <FieldSprite id={52} anim="Idle" dir={6} scale={s} />
                    </span>
                    <span className="mm-pt nf-walker" style={{ left: '52%', top: '62%' }}>
                        <i className="mm-shadow" />
                        <FieldSprite id={25} anim="Walk" dir={2} scale={s} />
                    </span>
                </div>
            </div>
        );
    if (art === 'golpedex')
        // especiais e bicudas: o Snorlax isola de bicuda (a bola sobe no arco) e o Gengar solta o especial
        return (
            <div className="mm-sc nf-dex" aria-hidden>
                <i className="mm-rays" />
                <div className="es-court nf-court">
                    <CourtFloor />
                </div>
                <div className="mm-stage">
                    <i className="nf-arc" />
                    <img className="nf-ball nf-punt" src="assets/ui/ball.svg" alt="" />
                    <span className="mm-pt" style={{ left: '18%', top: '88%' }}>
                        <i className="mm-shadow" />
                        <FieldSprite id={143} anim="Idle" dir={2} scale={s} />
                    </span>
                    <span className="mm-pt" style={{ left: '74%', top: '84%' }}>
                        <i className="mm-shadow" />
                        <FieldSprite id={94} anim="Pose" dir={6} scale={s} />
                    </span>
                </div>
            </div>
        );
    if (art === 'evento') {
        // o evento da semana: a cor e o ícone do tipo e três Pokémon dele (o primeiro, o do meio e o último da Dex)
        const of = SPECIES.filter((sp) => sp.types.includes(type));
        const trio = [of[0], of[of.length >> 1], of[of.length - 1]];
        return (
            <div className="mm-sc nf-evento" style={{ '--tc': TYPE_COLOR[type] } as CSSProperties} aria-hidden>
                <i className="mm-rays" />
                <span className="nf-type">
                    <TypeIcon type={type} size={64} />
                </span>
                <div className="mm-stage">
                    {trio.map((sp, i) => (
                        <span
                            key={sp.id}
                            className="mm-pt"
                            style={{ left: `${22 + i * 28}%`, top: i === 1 ? '90%' : '82%' }}
                        >
                            <i className="mm-shadow" />
                            <FieldSprite id={sp.id} anim="Idle" dir={i === 0 ? 2 : i === 1 ? 0 : 6} scale={s} />
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    return <Bench s={s} />;
}

/** O banco da Copa longa, na beira da quadra do Estádio: três sentados e a vaga vazia esperando o reforço que chega. */
function Bench({ s }: { s: number }) {
    const clubName = useGame((g) => g.profile.clubName || 'Pallet FC');
    const club = useGame((g) => clubColorHex(g.profile.clubColor));
    return (
        <div className="mm-sc mm-sc-atual nf-bench" style={clubVars(club)} aria-hidden>
            <Stands clubName={clubName} />
            <div className="es-court mm-court">
                <CourtFloor />
            </div>
            <div className="mm-stage">
                <i className="nf-plank" />
                {[25, 4, 7].map((id, i) => (
                    <span key={id} className="mm-pt" style={{ left: `${18 + i * 16}%`, top: '66%' }}>
                        <FieldSprite id={id} anim="Idle" dir={0} scale={s} />
                    </span>
                ))}
                <i className="nf-slot" />
                <span className="mm-pt nf-walker" style={{ left: '88%', top: '86%' }}>
                    <i className="mm-shadow" />
                    <FieldSprite id={133} anim="Walk" dir={6} scale={s} />
                </span>
            </div>
        </div>
    );
}

/** O que o botão do cartão faz; null = destino fechado (o botão some). */
function destOf(to: NewsTo | undefined): (() => void) | null {
    if (!to) return null;
    if (to === 'ultimate' && !readUltimate()) return null;
    return () => {
        const g = useGame.getState();
        if (to === 'golpedex') openDoor('collection', 'golpedex');
        else if (to === 'estadio' || to === 'rota') {
            goTab(to);
            if (g.screen !== 'home') g.go('home');
        } else if (g.screen !== to) g.go(to);
    };
}

function Slide({
    c,
    i,
    n,
    on,
    fresh,
    s,
    leave,
}: {
    c: NewsCard;
    i: number;
    n: number;
    on: boolean;
    fresh: boolean;
    s: number;
    leave: (then?: () => void) => void;
}) {
    const { t, d, lang } = useT();
    const dest = destOf(c.to);
    const wait = c.opensAt ? daysUntil(new Date(c.opensAt), new Date(utNow())) : 0;
    return (
        <article
            className="nfs-slide"
            aria-roledescription="slide"
            aria-label={`${t('home.newsFeed.slide', { i: i + 1, n })}: ${c.title[lang]}`}
            inert={!on}
        >
            <div className="nfs-art" style={{ '--s': s } as CSSProperties}>
                <Art art={c.art} s={s} type={c.type} />
            </div>
            <div className="nfs-copy">
                {fresh && <span className="novo-seal nfs-new">{t('home.newsFeed.new')}</span>}
                <h3 className="nfs-title">{c.title[lang]}</h3>
                <p className="nfs-text">{c.text[lang]}</p>
                {wait > 0 ? (
                    <span className="nfs-when">
                        <HudIcon kind="stopwatch" />
                        {plural(d.home.modes.countdown, wait)}
                    </span>
                ) : (
                    dest &&
                    c.cta && (
                        <button type="button" className="btn primary nfs-go" onClick={() => leave(dest)}>
                            <HudIcon kind="play" />
                            {c.cta[lang]}
                        </button>
                    )
                )}
            </div>
        </article>
    );
}

/**
 * O carrossel: arrastar com o dedo (scroll-snap nativo), setas grandes nas bordas, teclado (setas, pelo `step`) e as
 * abas com os títulos embaixo (pontinhos no celular em pé). Autoplay calmo que para de vez no primeiro toque; com
 * Reduzir movimento, sem autoplay e a troca sem deslizar.
 */
function Carousel({
    cards,
    fresh,
    onSeen,
    leave,
    step,
}: {
    cards: NewsCard[];
    fresh: ReadonlySet<string>;
    onSeen: (id: string) => void;
    leave: (then?: () => void) => void;
    step: { current: ((d: number) => void) | null };
}) {
    const { t, lang } = useT();
    const { clock } = useMenuScene();
    const [s, setS] = useState(artScale);
    const track = useRef<HTMLDivElement>(null);
    const [cur, setCur] = useState(0);
    const [auto, setAuto] = useState(() => !reduceMotionOn() && cards.length > 1);
    const n = cards.length;
    const goTo = (i: number) => {
        const el = track.current;
        if (!el) return;
        const k = (i + n) % n;
        el.scrollTo({ left: k * el.clientWidth, behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    };
    const stop = () => setAuto(false);
    step.current = (d: number) => {
        stop();
        goTo(cur + d);
    };
    const curId = cards[cur]?.id;
    useEffect(() => {
        if (curId) onSeen(curId);
    }, [curId, onSeen]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: goTo lê o track na hora; o relógio recomeça a cada cartão
    useEffect(() => {
        if (!auto) return;
        const id = window.setTimeout(() => {
            if (document.visibilityState === 'visible') goTo(cur + 1);
        }, AUTO_MS);
        return () => clearTimeout(id);
    }, [auto, cur]);
    // girou o celular ou mudou a janela: a arte acompanha e o cartão da vez continua na tela
    useEffect(() => {
        const onResize = () => {
            setS(artScale());
            const el = track.current;
            if (el) el.scrollLeft = cur * el.clientWidth;
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [cur]);
    const onScroll = () => {
        const el = track.current;
        if (el?.clientWidth) setCur(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
    };
    return (
        <ClockCtx.Provider value={clock}>
            <section
                className="nfs-car"
                aria-roledescription="carousel"
                aria-label={t('home.newsFeed.aria')}
                onPointerDown={stop}
                onWheel={stop}
                onFocus={stop}
            >
                <div ref={track} className="nfs-track" onScroll={onScroll}>
                    {cards.map((c, i) => (
                        <Slide
                            key={c.id}
                            c={c}
                            i={i}
                            n={n}
                            on={i === cur}
                            fresh={fresh.has(c.id)}
                            s={s}
                            leave={leave}
                        />
                    ))}
                </div>
                {n > 1 && (
                    <>
                        <button
                            type="button"
                            className="nfs-arrow prev"
                            aria-label={t('home.newsFeed.prev')}
                            onClick={() => goTo(cur - 1)}
                        >
                            <HudIcon kind="prev" />
                        </button>
                        <button
                            type="button"
                            className="nfs-arrow next"
                            aria-label={t('home.newsFeed.next')}
                            onClick={() => goTo(cur + 1)}
                        >
                            <HudIcon kind="next" />
                        </button>
                        <div className={`nfs-nav${auto ? ' auto' : ''}`}>
                            {cards.map((c, i) => (
                                <button
                                    type="button"
                                    key={c.id}
                                    className={i === cur ? 'on' : ''}
                                    aria-current={i === cur ? 'true' : undefined}
                                    onClick={() => goTo(i)}
                                    style={{ '--ms': `${AUTO_MS}ms` } as CSSProperties}
                                >
                                    <span>{c.title[lang]}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </ClockCtx.Provider>
    );
}

function PatchBody({ n }: { n: PatchNotes }) {
    return n.sections.map((sec) => (
        <div key={sec.title}>
            <h3>{sec.title}</h3>
            <ul>
                {sec.lines.map((l) => (
                    <li key={l}>{l}</li>
                ))}
            </ul>
        </div>
    ));
}

const patchDate = (n: PatchNotes, lang: 'pt' | 'en') =>
    new Date(`${n.date}T12:00:00Z`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });

/** A versão de agora (cara-de-jogo.md, decisão 15): o nome grande e 4 destaques (o 1º item de cada seção). */
function PatchPoster({ n, lang }: { n: PatchNotes; lang: 'pt' | 'en' }) {
    const { t } = useT();
    return (
        <section className="patch-poster">
            <p className="patch-meta">
                <span className="bc-tag">{t('home.latest')}</span>
                <span>v{n.version}</span>
                <time dateTime={n.date}>{patchDate(n, lang)}</time>
            </p>
            <h2 className="patch-poster-title">{n.title}</h2>
            <ol className="patch-hl">
                {n.sections.slice(0, 4).map((sec) => (
                    <li key={sec.title}>
                        <HudIcon kind="max" />
                        <span>
                            <b>{sec.title}</b>
                            <small>{sec.lines[0]}</small>
                        </span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

/** Uma versão inteira (da lista). */
function PatchVersion({ n, lang }: { n: PatchNotes; lang: 'pt' | 'en' }) {
    const { t } = useT();
    return (
        <section className="patch-version">
            <p className="patch-meta">
                <time dateTime={n.date}>{patchDate(n, lang)}</time>
            </p>
            <h2 className="bc-caption">{t('home.version', { v: n.version, title: n.title })}</h2>
            <PatchBody n={n} />
        </section>
    );
}

/** A aba Notas da versão: a versão de agora com os destaques e a lista de todas; tocar numa abre ela inteira. */
function Notes() {
    const { t, lang } = useT();
    const notes = patchNotes(lang);
    const [page, setPage] = useState('list');
    const box = useRef<HTMLDivElement>(null);
    // trocou de página: volta pro topo (a lista é comprida)
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda a cada página
    useEffect(() => {
        box.current?.scrollTo({ top: 0 });
    }, [page]);
    return (
        <div ref={box} className="nfs-notes">
            {/* uma página por vez, entrando com fade (nada teleporta) */}
            <div key={page} className="patch-notes patch-page">
                {page === 'list' ? (
                    <>
                        {notes[0] && <PatchPoster n={notes[0]} lang={lang} />}
                        <h3>{t('home.newsFeed.versions')}</h3>
                        <ul className="patch-old-list">
                            {notes.map((n) => (
                                <li key={n.version}>
                                    <button type="button" className="patch-toggle" onClick={() => setPage(n.version)}>
                                        <span className="patch-old-title">
                                            {t('home.version', { v: n.version, title: n.title })}
                                        </span>
                                        <time dateTime={n.date}>{patchDate(n, lang)}</time>
                                        <HudIcon kind="next" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <>
                        <button type="button" className="btn small ghost patch-back" onClick={() => setPage('list')}>
                            <HudIcon kind="prev" />
                            {t('common.ui.back')}
                        </button>
                        {notes
                            .filter((n) => n.version === page)
                            .map((n) => (
                                <PatchVersion key={n.version} n={n} lang={lang} />
                            ))}
                    </>
                )}
            </div>
        </div>
    );
}

const NEWS_STATE = { soccermonNews: 1 };
const isNews = (s: unknown) => !!s && typeof s === 'object' && 'soccermonNews' in s;

/**
 * A tela cheia das Novidades. Fecha no X, no Esc e no voltar do Android (uma entrada de histórico enquanto está
 * aberta, por cima da guarda de tela e da marca de aba). `fresh`: os cartões que ainda não tinham sido vistos quando
 * abriu (selo "Nova"); `onSeen` marca no save o cartão que apareceu.
 */
export function NewsScreen({
    cards,
    fresh,
    onSeen,
    onClose,
}: {
    cards: NewsCard[];
    fresh: ReadonlySet<string>;
    onSeen: (id: string) => void;
    onClose: () => void;
}) {
    const { t } = useT();
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<'news' | 'notes'>(cards.length ? 'news' : 'notes');
    const step = useRef<((d: number) => void) | null>(null);
    // o que fazer depois que a entrada do histórico sair (o botão do cartão: fecha e só então troca de tela)
    const after = useRef<(() => void) | null>(null);
    useEffect(() => {
        const h = window.history;
        if (!isNews(h.state)) h.pushState(NEWS_STATE, '');
        const onPop = () => {
            if (isNews(h.state)) return;
            onClose();
            const then = after.current;
            after.current = null;
            then?.();
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [onClose]);
    const leave = (then?: () => void) => {
        if (isNews(window.history.state)) {
            after.current = then ?? null;
            window.history.back();
        } else {
            onClose();
            then?.();
        }
    };
    const leaveNow = useRef(leave);
    leaveNow.current = leave;
    useEffect(() => {
        root.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') leaveNow.current();
            else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && step.current) {
                e.preventDefault();
                step.current(e.key === 'ArrowLeft' ? -1 : 1);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    if (tab !== 'news') step.current = null;
    const stopEv = (e: { stopPropagation: () => void }) => e.stopPropagation();
    return createPortal(
        <div
            ref={root}
            className="nfs"
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            tabIndex={-1}
            data-exit
            // o Phaser escuta mousedown na janela inteira: o toque aqui não chega na quadra embaixo
            onMouseDown={stopEv}
            onPointerDown={stopEv}
            onTouchStart={stopEv}
        >
            <header className="nfs-head">
                <h2 id={id} className="sr-only">
                    {t('home.news')}
                </h2>
                <fieldset className="bc-seg nfs-tabs" aria-label={t('home.newsFeed.tabs')}>
                    {cards.length > 0 && (
                        <button type="button" aria-pressed={tab === 'news'} onClick={() => setTab('news')}>
                            {t('home.newsFeed.aria')}
                        </button>
                    )}
                    <button type="button" aria-pressed={tab === 'notes'} onClick={() => setTab('notes')}>
                        {t('home.newsFeed.notes')}
                    </button>
                </fieldset>
                <button
                    type="button"
                    className="nfs-x"
                    aria-label={t('common.ui.close')}
                    title={t('common.ui.close')}
                    onClick={() => leave()}
                >
                    <HudIcon kind="close" />
                </button>
            </header>
            <div key={tab} className="nfs-body">
                {tab === 'news' ? (
                    <Carousel cards={cards} fresh={fresh} onSeen={onSeen} leave={leave} step={step} />
                ) : (
                    <Notes />
                )}
            </div>
        </div>,
        document.body,
    );
}
