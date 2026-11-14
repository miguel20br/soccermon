import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { reduceMotionOn } from '../settings-sync';
import { Logo } from './LogoHits';
import { HudIcon } from './MatchHud';
import '../animacoes.css';

const CreditsParade = lazy(() => import('../screens/CreditsParade').then((m) => ({ default: m.CreditsParade })));

/** A lista sobe nisso (ms) e para no "Obrigado por jogar!"; a saída é um fade. */
const ROLL_MS = 12000;
const OUT_MS = 240;

/**
 * Créditos do título (animacoes-novas.md, A7), guardados pro fim do Modo História (`creditsOn`; a Rota não chama mais
 * desde 10/11): uma vez por save, curtos (~12 s), o elenco campeão andando
 * em PMD embaixo e "Música original: Soccermon". Toque em qualquer lugar segue; com Reduzir movimento a lista já
 * nasce parada.
 */
export function TitleCredits({
    team,
    squad,
    onDone,
}: {
    team: string;
    squad: { id: number; shiny?: boolean }[];
    onDone: () => void;
}) {
    const { t } = useT();
    const [still] = useState(reduceMotionOn);
    const [out, setOut] = useState(false);
    const clock = useSceneClock(!still);
    const fast = useRef(1);
    const close = () => {
        if (out) return;
        setOut(true);
        window.setTimeout(onDone, OUT_MS);
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: segue sozinho uma vez, um tempo depois de parar
    useEffect(() => {
        const id = window.setTimeout(close, (still ? 0 : ROLL_MS) + 3500);
        return () => clearTimeout(id);
    }, []);
    return (
        <ClockCtx.Provider value={clock}>
            <button
                type="button"
                className={`title-credits${out ? ' out' : ''}${still ? ' still' : ''}`}
                onClick={close}
                aria-label={t('settings.credits.rota.tap')}
            >
                <div className="tc-roll" style={{ animationDuration: `${ROLL_MS}ms` }}>
                    <Logo className="tc-logo" alt="Soccermon" idle />
                    <b className="tc-head">{t('settings.credits.rota.head')}</b>
                    <span className="tc-team">{team}</span>
                    <span>{t('settings.credits.rota.game')}</span>
                    <span className="tc-music">{t('settings.credits.rota.music')}</span>
                    <span>{t('settings.credits.rota.sprites')}</span>
                    <small>{t('settings.credits.rota.fan')}</small>
                    <b className="tc-thanks">{t('settings.credits.thanks')}</b>
                </div>
                {!still && (
                    <Suspense fallback={null}>
                        <div className="tc-parade">
                            <CreditsParade fast={fast} mons={squad} />
                        </div>
                    </Suspense>
                )}
                <small className="tc-tap">
                    {t('settings.credits.rota.tap')}
                    <HudIcon kind="skip" />
                </small>
            </button>
        </ClockCtx.Provider>
    );
}
