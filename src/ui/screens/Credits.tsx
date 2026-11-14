import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { rich, useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { backTarget } from '../back-nav';
import { AboutFooter } from '../components/AboutFooter';
import { Logo } from '../components/LogoHits';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { reduceMotionOn } from '../reduce-motion';
import { uiZoom } from '../ui-zoom';

const CreditsParade = lazy(() => import('./CreditsParade').then((m) => ({ default: m.CreditsParade })));

/** Subida dos créditos (px/s) e quantas vezes mais rápido segurando. */
const SPEED = 38;
const FAST = 8;
const FADE_MS = 220;

/** Faixa de baixo da janela onde a lista some aos poucos (a máscara do styles.css, `.cr-view`). */
const FADE_PX = 40;
/** Onde a lista entra: logo acima da faixa que some, embaixo da janela. */
const startY = (view: HTMLElement) => view.clientHeight - FADE_PX;
/** Onde a subida para: o fim da lista logo acima da faixa que some (lista mais curta que a janela para no topo). */
const endY = (view: HTMLElement | null, roll: HTMLElement | null) =>
    Math.min(0, (view?.clientHeight ?? 0) - FADE_PX - (roll?.offsetHeight ?? 0));
const place = (roll: HTMLElement | null, y: number) => {
    if (roll) roll.style.transform = `translateY(${y.toFixed(1)}px)`;
};

/**
 * Créditos como os de fim de jogo: a lista sobe devagar com os Pokémon desfilando embaixo e a `ultima-partida`
 * tocando (music-sync); para com os links do rodapé na tela e vira página comum. Segurar acelera, Pular vai direto
 * pro fim, Tab num link também. Com "reduzir movimento" já nasce parada. A lista é uma só (o leitor de tela lê tudo
 * desde o começo; a subida é só `transform`).
 */
export function Credits() {
    const go = useGame((s) => s.go);
    const { t } = useT();
    const [done, setDone] = useState(reduceMotionOn);
    const [fading, setFading] = useState(false);
    const clock = useSceneClock(!done);
    const view = useRef<HTMLDivElement>(null);
    const roll = useRef<HTMLDivElement>(null);
    const y = useRef<number | null>(null);
    const fast = useRef(1);
    const top = useRef<number | null>(null);

    // a hora de virar página: guarda onde o rodapé está pra página nascer no mesmo lugar (sem pulo)
    const finish = useCallback(() => {
        top.current = roll.current?.getBoundingClientRect().top ?? null;
        setDone(true);
    }, []);

    useEffect(() => {
        if (done) return;
        return clock.sub((_t, dt) => {
            if (!view.current || !roll.current) return;
            const stop = endY(view.current, roll.current);
            y.current ??= startY(view.current);
            y.current = Math.max(stop, y.current - (SPEED * fast.current * dt) / 1000);
            place(roll.current, y.current);
            if (y.current <= stop) finish();
        });
    }, [clock, done, finish]);

    useLayoutEffect(() => {
        if (!done || top.current === null || !roll.current) return;
        const el = roll.current;
        el.style.transform = '';
        window.scrollBy(0, (el.getBoundingClientRect().top - top.current) / uiZoom());
        // o que a rolagem não alcança (a página acaba no rodapé, sem a faixa do desfile embaixo) desce animado
        const off = (top.current - el.getBoundingClientRect().top) / uiZoom(el);
        if (Math.abs(off) > 1)
            el.animate([{ transform: `translateY(${off}px)` }, { transform: 'none' }], {
                duration: 300,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            });
        top.current = null;
    }, [done]);

    // segurar acelera; soltar em qualquer lugar volta ao passo normal
    useEffect(() => {
        const up = () => {
            fast.current = 1;
        };
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        window.addEventListener('blur', up);
        return () => {
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            window.removeEventListener('blur', up);
        };
    }, []);

    // Pular: some, vai pro fim e volta (nada teleporta)
    const skip = () => {
        if (done || fading) return;
        setFading(true);
        window.setTimeout(() => {
            y.current = endY(view.current, roll.current);
            place(roll.current, y.current);
            finish();
            setFading(false);
        }, FADE_MS);
    };

    const rolling = !done;
    return (
        <div className={`menu-screen credits-screen${rolling ? ' cr-rolling' : ''}`}>
            <MenuHead
                title={t('settings.credits.title')}
                icon="credits"
                onBack={() => go(backTarget('credits') ?? 'home')}
            />
            <ClockCtx.Provider value={clock}>
                {/* segurar acelera; foco do teclado num link no meio da subida vai pro fim, onde dá pra ler e clicar */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: segurar é atalho; o Pular é o botão */}
                <div
                    className={`cr-stage${fading ? ' cr-out' : ''}`}
                    onPointerDown={() => {
                        if (rolling) fast.current = FAST;
                    }}
                    onContextMenu={(e) => rolling && e.preventDefault()}
                    onFocus={(e) => roll.current?.contains(e.target) && skip()}
                >
                    {rolling && (
                        <div className="cr-ctrl" data-exit>
                            <span className="cr-hint" aria-hidden>
                                {t('settings.credits.hold')}
                            </span>
                            <button
                                type="button"
                                className="btn small ghost cr-skip"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={skip}
                            >
                                {t('common.ui.skip')}
                                <HudIcon kind="skip" />
                            </button>
                        </div>
                    )}
                    <div className="cr-view" ref={view}>
                        <div className="cr-roll" ref={roll}>
                            <CreditsList />
                            <p className="cr-thanks">{t('settings.credits.thanks')}</p>
                            {/* os links de site e o aviso de direitos (saíram do fim das Configurações, cara-de-jogo.md decisão 12) */}
                            <AboutFooter lang={false} />
                        </div>
                    </div>
                    {rolling && (
                        <Suspense fallback={null}>
                            <div className="cr-parade-wrap" data-exit>
                                <CreditsParade fast={fast} />
                            </div>
                        </Suspense>
                    )}
                </div>
            </ClockCtx.Provider>
        </div>
    );
}

/** A lista dos créditos (a mesma da subida e da página parada). */
function CreditsList() {
    const { t } = useT();
    return (
        <>
            <section className="credits-card credits-hero">
                <Logo className="cr-logo" alt="Soccermon" />
                <img className="pixel" src="assets/cards/25.gif" alt="" />
                <p>
                    {rich(t('settings.credits.createdBy'), {
                        name: <b>Miguel Cunha</b>,
                        link: <a href="https://github.com/miguel20br">@miguel20br</a>,
                    })}
                </p>
                <p>{rich(t('settings.credits.nonProfit'), { np: <b>{t('settings.credits.np')}</b> })}</p>
            </section>
            <section className="credits-card">
                <h2>{t('settings.credits.spritesTitle')}</h2>
                <ul>
                    <li>
                        {rich(t('settings.credits.pmd'), {
                            link: (
                                <a href="https://github.com/PMDCollab/SpriteCollab">
                                    PMD Sprite Repository (PMDCollab)
                                </a>
                            ),
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.bw'), {
                            link: <a href="https://github.com/PokeAPI/sprites">PokeAPI/sprites</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.icons'), {
                            link: <a href="https://github.com/msikma/pokesprite">PokéSprite</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.holo'), {
                            link: <a href="https://github.com/simeydotme/pokemon-cards-css">pokemon-cards-css</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.cries'), {
                            link: <a href="https://github.com/PokeAPI/cries">PokeAPI/cries</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.particles'), {
                            link: <a href="https://play.pokemonshowdown.com">Pokémon Showdown</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.sfx'), {
                            link: <a href="https://github.com/KilledByAPixel/ZzFX">ZzFX</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.font'), {
                            link: <a href="https://github.com/quiple/galmuri">Galmuri</a>,
                        })}
                    </li>
                </ul>
            </section>
            <section className="credits-card">
                <h2>{t('settings.credits.dataTitle')}</h2>
                <ul>
                    <li>
                        {rich(t('settings.credits.dex'), {
                            pkmn: <a href="https://github.com/pkmn/ps">@pkmn/dex</a>,
                            showdown: <a href="https://github.com/smogon/pokemon-showdown">Pokémon Showdown</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.ptDesc'), {
                            link: <a href="https://github.com/pagefaultgames/pokerogue-locales">pokerogue-locales</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.dexText'), {
                            tcgdex: <a href="https://tcgdex.dev">TCGdex</a>,
                            pokeapi: <a href="https://pokeapi.co">PokeAPI</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.arch'), {
                            pac: <a href="https://github.com/keldaanCommunity/pokemonAutoChess">Pokémon Auto Chess</a>,
                            fs: (
                                <a href="https://github.com/tbleckert/football-simulator">
                                    tbleckert/football-simulator
                                </a>
                            ),
                            book: <i>Programming Game AI by Example</i>,
                        })}
                    </li>
                </ul>
            </section>
        </>
    );
}
