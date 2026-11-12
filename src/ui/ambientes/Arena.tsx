import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { playCry } from '../../game/audio';
import { useT } from '../../i18n/react';
import { ligaCountdown, ligaTeaser } from '../../league/rules';
import { duelWins } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { DuelHistory } from '../duel/DuelHistory';
import { Sheet } from '../kit/Sheet';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { type Mon, myMon, nextBelt } from './metas';
import { floorZone, Tile } from './Room';
import { useSceneScale } from './sprite-scale';
import { type Blockers, useMq, useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

/** Quem pode aparecer em silhueta do outro lado da quadra ("quem vai encarar?"), um por abertura. */
const LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';
/** Na quadra, os de volta contornam os dois do duelo, a bola, o VS e o poste. */
const ARENA: Blockers = { props: '.ar-side .fs-sprite:not(.ar-head), .ar-ball, .ar-vs, .ar-lamp' };
export const RIVALS = [6, 9, 3, 94, 149, 130, 65, 68, 143, 59, 26, 112];

/**
 * Arena (Duelo): uma quadra de rua à noite, o seu Pokémon de um lado e uma silhueta do outro, o muro e o poste aceso.
 * (o Arcade saiu: ainda não tem data). A meta é o próximo cinturão do Duelo; o botão principal
 * é Desafiar. A Liga, na semana antes de abrir, é um letreiro no muro com a contagem (tocar abre a Liga); antes, nada.
 */
export function Arena({ active, wild }: { active: boolean; wild: Wild[] }) {
    const { t, tn } = useT();
    const clock = useSceneClock(active);
    const scale = useSceneScale();
    const wide = useMq(LANDSCAPE);
    // os Pokémon ambiente ficam na beira da quadra (o meio é do duelo); deitado, só do lado direito (os botões ficam
    // à esquerda)
    const w = useWild(
        clock,
        wild,
        floorZone(
            scale,
            wide
                ? (x, y) => x > 0.54 && (Math.abs(x - 0.73) > 0.14 || y > 0.75)
                : (x, y) => x < 0.24 || x > 0.76 || y > 0.72,
        ),
        undefined,
        ARENA,
    );
    const go = useGame((s) => s.go);
    const avatar = useGame((s) => s.profile.avatar);
    const duels = useGame((s) => s.duels);
    const wins = useGame((s) => duelWins(s.records, s.duels));
    const [history, setHistory] = useState(false);
    const [rival] = useState(() => RIVALS[Math.floor(Math.random() * RIVALS.length)]);
    const mine = myMon(
        useGame((s) => s.run),
        avatar,
    );
    const belt = nextBelt(wins);
    // o letreiro só na semana antes de abrir; aberta, vira o tile
    const liga = ligaTeaser();
    const ligaOpen = !ligaCountdown();
    // os dois do duelo na escala da cena, a mesma dos de volta (revisão de arte: nada de 4x ao lado de 3x)

    return (
        <ClockCtx.Provider value={clock}>
            <ArenaScene
                me={mine}
                rival={rival}
                scale={scale}
                active={active}
                sign={
                    liga && (
                        // o letreiro da Liga fechada: a contagem no muro, ao lado do neon do Arcade
                        <button
                            type="button"
                            className="ar-liga"
                            aria-label={t('home.amb.ligaSoon', { d: liga.d })}
                            onClick={() => go('liga')}
                        >
                            <b>
                                <HudIcon kind="crown" />
                                {t('liga.home.ligaTag')}
                            </b>
                            <small>{t('home.amb.ligaSign', { d: liga.d })}</small>
                        </button>
                    )
                }
            >
                <WildZone wild={w} zone="floor" />
            </ArenaScene>
            <div className="amb-ui rm-ui ar-ui">
                <header className="rm-head">
                    <h2>{t('home.amb.arenaTitle')}</h2>
                    <span className="rt-badges" title={belt ? t('trophies.belt', { n: belt.goal }) : undefined}>
                        <PixelTrophy kind="cinturao" metal={belt?.metal ?? 'ouro'} className="rm-belt" />
                        {belt
                            ? t('home.amb.beltCount', { n: belt.n, goal: belt.goal })
                            : t('trophies.duelWins', { n: wins })}
                    </span>
                </header>
                <div className="rm-actions">
                    <button type="button" className="btn big cup-go rm-go cb cb-gold" onClick={() => go('duel')}>
                        <span className="cup-go-txt">
                            <b>{t('home.amb.arenaGo')}</b>
                            <small>{t('home.amb.arenaLine')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    {/* o Arcade e a Liga fechada ficam no muro (neon e letreiro): o tile repetia. Seus duelos: o histórico
                        e o placar contra cada amigo, que antes só apareciam no fim de um duelo */}
                    {(ligaOpen || duels.length > 0) && (
                        <div className="amb-tiles">
                            {duels.length > 0 && (
                                <Tile
                                    icon="friends"
                                    title={t('duel.result.history')}
                                    sub={tn('duel.result.count', duels.length)}
                                    onClick={() => setHistory(true)}
                                />
                            )}
                            {ligaOpen && (
                                <Tile icon="crown" title={t('liga.home.ligaTag')} onClick={() => go('liga')} />
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Sheet
                open={history}
                onClose={() => setHistory(false)}
                title={t('duel.result.history')}
                className="duel-history"
            >
                <DuelHistory duels={duels} />
            </Sheet>
        </ClockCtx.Provider>
    );
}

/**
 * A cena da Arena sem os botões: o muro com o neon, o poste e a quadra com os dois do duelo. A aba da Home põe os
 * Pokémon de volta em `children`; o Duelo e a Liga usam de fundo do palco (Backdrops.tsx). `reveal`: o rival aparece
 * (a Liga mostra o capitão do fantasma); sem ele, silhueta com "?". `sign`: o letreiro da Liga no muro (só na aba);
 * é o único pedaço da cena que o leitor de tela vê.
 */
export function ArenaScene({
    me,
    rival,
    reveal = false,
    scale,
    active,
    sign,
    children,
}: {
    sign?: ReactNode;
    me: Mon;
    rival: number;
    reveal?: boolean;
    scale: number;
    active: boolean;
    children?: ReactNode;
}) {
    // tocar na silhueta mostra quem é, por um instante
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        if (!seen) return;
        const id = window.setTimeout(() => setSeen(false), 1600);
        return () => window.clearTimeout(id);
    }, [seen]);
    return (
        <div className="amb-scene ar-scene" style={{ '--sc': scale } as CSSProperties}>
            <div className="amb-layer ar-sky" style={{ '--depth': 0.6 } as CSSProperties} aria-hidden>
                <i className="es-stars" />
            </div>
            <div className="amb-layer ar-street" style={{ '--depth': 0.25 } as CSSProperties}>
                <div className="ar-wall">
                    <i className="ar-fence" />
                    <i className="ar-lamp" />
                    {sign}
                </div>
                <div className="ar-court" aria-hidden>
                    {/* a quadra de rua inteira: piso pintado, linhas, as duas áreas, pênalti, escanteios e os gols */}
                    <svg className="ar-lines" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
                        <rect className="ar-paint" x="4" y="4" width="192" height="92" />
                        <rect x="4" y="4" width="192" height="92" />
                        <line x1="100" y1="4" x2="100" y2="96" />
                        <path d="M4 26 C 34 26 34 74 4 74 M196 26 C 166 26 166 74 196 74" />
                        <path d="M4 10 A 6 6 0 0 0 10 4 M190 4 A 6 6 0 0 0 196 10 M196 90 A 6 6 0 0 0 190 96 M10 96 A 6 6 0 0 0 4 90" />
                        <path className="ar-spot" d="M40 50 h0.01 M160 50 h0.01 M100 50 h0.01" />
                        <path className="ar-goal" d="M4 41 H0 V59 H4 M196 41 H200 V59 H196" />
                    </svg>
                    <i className="ar-circle" />
                    <i className="ar-glow" />
                    <img className="ar-ball" src="assets/ui/ball.svg" alt="" width="16" height="16" />
                    <div className="ar-duel">
                        <span className="ar-side me">
                            <i className="es-shadow" />
                            <FieldSprite id={me.id} shiny={me.shiny} anim="Idle" dir={2} scale={scale} play={active} />
                        </span>
                        <b className="ar-vs">VS</b>
                        <span className={`ar-side rival${seen || reveal ? ' seen' : ''}`}>
                            <i className="es-shadow" />
                            <FieldSprite id={rival} anim="Idle" dir={6} scale={scale} play={active} />
                            {/* o mesmo sprite, invisível, só pra pôr o "?" em cima da cabeça (a silhueta apaga tudo dentro dela) */}
                            <FieldSprite id={rival} anim="Idle" dir={6} scale={scale} play={false} className="ar-head">
                                <i className="ar-ask">?</i>
                            </FieldSprite>
                            {/* biome-ignore lint/a11y/noStaticElementInteractions: enfeite da cena (aria-hidden) */}
                            {/* biome-ignore lint/a11y/useKeyWithClickEvents: idem, sem foco nem função */}
                            <i
                                className="ar-tap"
                                onClick={() => {
                                    if (seen) return;
                                    setSeen(true);
                                    playCry(rival, useGame.getState().settings.cries, 0.5);
                                }}
                            />
                        </span>
                    </div>
                    {children && <div className="ar-walk">{children}</div>}
                </div>
            </div>
        </div>
    );
}
