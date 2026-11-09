import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { plural } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { utNow } from '../../store/ultimate/clock';
import { ClockCtx } from '../ambientes/clock';
import { CourtFloor } from '../ambientes/Estadio';
import { FieldSprite } from '../ambientes/FieldSprite';
import type { NewsArt, NewsCard, NewsTo } from '../news';
import { type PatchNotes, patchNotes } from '../patch-notes';
import { daysUntil, Scene, useMenuScene } from '../screens/ModeMenu';
import { reduceMotionOn } from '../settings-sync';
import { readUltimate } from '../ultimate/flag';
import { HudIcon } from './MatchHud';
import '../news-feed.css';

/*
 * O que abre no botão Novidades (pedaço preguiçoso, com as notas): o carrossel das Notícias (ui/news.ts) no topo e as
 * notas por versão embaixo. Pesquisa e decisões em docs/planos/noticias.md.
 */

/** Tempo de cada cartão no autoplay (para de vez no primeiro toque, tecla ou foco). */
const AUTO_MS = 6000;

/** As artes: cenas que o jogo já tem (Estádio e pacote do menu de modos) e duas montadas com os mesmos sprites. */
function Art({ art, big }: { art: NewsArt; big: boolean }) {
    const s = big ? 3 : 2;
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
                        <FieldSprite id={6} anim="Pose" dir={0} scale={s + 1} />
                    </span>
                    <img className="nf-ball" src="assets/ui/ball.svg" alt="" />
                </div>
                <i className="nf-bar top" />
                <i className="nf-bar bottom" />
            </div>
        );
    // o banco da Copa longa: três sentados e a vaga vazia esperando o próximo reforço, que vem chegando
    return (
        <div className="mm-sc nf-bench" aria-hidden>
            <div className="es-court nf-court">
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

/** Pra onde o botão leva; null = destino fechado (o botão some). */
function useDest(to: NewsTo | undefined, close: () => void): (() => void) | null {
    const go = useGame((s) => s.go);
    const screen = useGame((s) => s.screen);
    if (!to) return null;
    if (to === 'ultimate' && !readUltimate()) return null;
    const target = to === 'cup' ? 'home' : to;
    return () => {
        close();
        if (screen !== target) go(target);
    };
}

function Slide({
    c,
    i,
    n,
    fresh,
    big,
    close,
}: {
    c: NewsCard;
    i: number;
    n: number;
    fresh: boolean;
    big: boolean;
    close: () => void;
}) {
    const { t, d, lang } = useT();
    const dest = useDest(c.to, close);
    const wait = c.opensAt ? daysUntil(new Date(c.opensAt), new Date(utNow())) : 0;
    return (
        <article
            className="nf-card"
            aria-roledescription="slide"
            aria-label={`${t('home.newsFeed.slide', { i: i + 1, n })}: ${c.title[lang]}`}
        >
            <div className="nf-art">
                <Art art={c.art} big={big} />
                {fresh && <span className="novo-seal nf-new">{t('home.newsFeed.new')}</span>}
            </div>
            <div className="nf-body">
                <h3 className="nf-title">{c.title[lang]}</h3>
                <p className="nf-text">{c.text[lang]}</p>
                {(wait > 0 || dest) && (
                    <div className="nf-actions">
                        {wait > 0 && (
                            <span className="nf-when">
                                <HudIcon kind="stopwatch" />
                                {plural(d.home.modes.countdown, wait)}
                            </span>
                        )}
                        {dest && (
                            <button type="button" className="btn primary nf-go" onClick={dest}>
                                <HudIcon kind="play" />
                                {t('home.newsFeed.play')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

/**
 * O carrossel: arrastar com o dedo (scroll-snap nativo), setas, teclado (setas) e pontinhos. Autoplay calmo que para de
 * vez no primeiro toque; com Reduzir movimento, sem autoplay e a troca sem deslizar.
 */
function Carousel({
    cards,
    fresh,
    onSeen,
    close,
}: {
    cards: NewsCard[];
    fresh: ReadonlySet<string>;
    onSeen: (id: string) => void;
    close: () => void;
}) {
    const { t, lang } = useT();
    const { clock, big } = useMenuScene();
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
    const stop = () => setAuto(false);
    const onScroll = () => {
        const el = track.current;
        if (el?.clientWidth) setCur(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
    };
    return (
        <ClockCtx.Provider value={clock}>
            <section
                className="nf"
                aria-roledescription="carousel"
                aria-label={t('home.newsFeed.aria')}
                onPointerDown={stop}
                onWheel={stop}
                onFocus={stop}
                onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                    e.preventDefault();
                    stop();
                    goTo(cur + (e.key === 'ArrowLeft' ? -1 : 1));
                }}
            >
                <div ref={track} className="nf-track" onScroll={onScroll}>
                    {cards.map((c, i) => (
                        <Slide key={c.id} c={c} i={i} n={n} fresh={fresh.has(c.id)} big={big} close={close} />
                    ))}
                </div>
                {n > 1 && (
                    <>
                        <button
                            type="button"
                            className="nf-arrow prev"
                            aria-label={t('home.newsFeed.prev')}
                            onClick={() => goTo(cur - 1)}
                        >
                            <HudIcon kind="prev" />
                        </button>
                        <button
                            type="button"
                            className="nf-arrow next"
                            aria-label={t('home.newsFeed.next')}
                            onClick={() => goTo(cur + 1)}
                        >
                            <HudIcon kind="next" />
                        </button>
                        <div className="nf-dots">
                            {cards.map((c, i) => (
                                <button
                                    type="button"
                                    key={c.id}
                                    className={i === cur ? 'on' : ''}
                                    aria-label={c.title[lang]}
                                    aria-current={i === cur ? 'true' : undefined}
                                    onClick={() => goTo(i)}
                                    style={{ '--i': i } as CSSProperties}
                                />
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

/**
 * O miolo da folha das Novidades. `page` 'feed': o carrossel, a versão de agora e a lista de todas; uma versão: ela
 * inteira, com o voltar. `fresh`: os cartões que ainda não tinham sido vistos quando a folha abriu (selo "Nova").
 */
export function NewsFeed({
    page,
    setPage,
    cards,
    fresh,
    onSeen,
    close,
}: {
    page: string;
    setPage: (p: string) => void;
    cards: NewsCard[];
    fresh: ReadonlySet<string>;
    onSeen: (id: string) => void;
    close: () => void;
}) {
    const { t, lang } = useT();
    const notes = patchNotes(lang);
    return (
        // uma página por vez, entrando com fade (nada teleporta)
        <div key={page} className="patch-page">
            {page === 'feed' ? (
                <>
                    {cards.length > 0 && <Carousel cards={cards} fresh={fresh} onSeen={onSeen} close={close} />}
                    {notes[0] && <PatchPoster n={notes[0]} lang={lang} />}
                    <h3 className="nf-versions">{t('home.newsFeed.versions')}</h3>
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
                    <button type="button" className="btn small ghost patch-back" onClick={() => setPage('feed')}>
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
    );
}
