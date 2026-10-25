import { type CSSProperties, useState } from 'react';
import { useT } from '../../i18n/react';
import { ligaCountdown } from '../../league/rules';
import { duelWins } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { nextBelt } from './metas';
import { BIG, floorZone, SMALL, Tile } from './Room';
import { useMq, useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

/** Quem pode aparecer em silhueta do outro lado da quadra ("quem vai encarar?"), um por abertura. */
const LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';
const RIVALS = [6, 9, 3, 94, 149, 130, 65, 68, 143, 59, 26, 112];

/**
 * Arena (Duelo): uma quadra de rua à noite, o seu Pokémon de um lado e uma silhueta do outro, o muro com o neon do
 * Arcade da semana (o Game Corner de Celadon) e o poste aceso. A meta é o próximo cinturão do Duelo; o botão principal
 * é Desafiar. Dupla 2x2 e Arcade chegando; a Liga com a contagem.
 */
export function Arena({ active, wild }: { active: boolean; wild: Wild[] }) {
    const { t } = useT();
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const wide = useMq(LANDSCAPE);
    // os Pokémon ambiente ficam na beira da quadra (o meio é do duelo); deitado, só do lado direito (os botões ficam
    // à esquerda)
    const w = useWild(
        clock,
        wild,
        floorZone(
            small ? 1 : big ? 3 : 2,
            wide
                ? (x, y) => x > 0.54 && (Math.abs(x - 0.73) > 0.14 || y > 0.75)
                : (x, y) => x < 0.24 || x > 0.76 || y > 0.72,
        ),
    );
    const go = useGame((s) => s.go);
    const avatar = useGame((s) => s.profile.avatar);
    const wins = useGame((s) => duelWins(s.records, s.duels));
    const [rival] = useState(() => RIVALS[Math.floor(Math.random() * RIVALS.length)]);
    const mine = avatar.kind === 'pokemon' ? avatar.speciesId : 25;
    const belt = nextBelt(wins);
    const liga = ligaCountdown();
    const scale = small ? 1 : big ? 3 : 2;

    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene ar-scene" aria-hidden>
                <div className="amb-layer ar-sky" style={{ '--depth': 0.6 } as CSSProperties}>
                    <i className="es-stars" />
                </div>
                <div className="amb-layer ar-street" style={{ '--depth': 0.25 } as CSSProperties}>
                    <div className="ar-wall">
                        <i className="ar-fence" />
                        <div className="ar-neon">
                            <b>{t('home.amb.soonArcade')}</b>
                            <small>{t('home.amb.neonWeek')}</small>
                            <em className="ar-tape">{t('home.soonRibbon')}</em>
                        </div>
                        <i className="ar-lamp" />
                    </div>
                    <div className="ar-court">
                        <svg className="ar-lines" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
                            <rect x="4" y="4" width="192" height="92" />
                            <line x1="100" y1="4" x2="100" y2="96" />
                        </svg>
                        <i className="ar-circle" />
                        <i className="ar-glow" />
                        <div className="ar-duel">
                            <span className="ar-side me">
                                <i className="es-shadow" />
                                <FieldSprite id={mine} anim="Idle" dir={2} scale={scale} play={active} />
                            </span>
                            <b className="ar-vs">VS</b>
                            <span className="ar-side rival">
                                <i className="es-shadow" />
                                <FieldSprite id={rival} anim="Idle" dir={6} scale={scale} play={active} />
                                {/* o mesmo sprite, invisível, só pra pôr o "?" em cima da cabeça (a silhueta apaga tudo dentro dela) */}
                                <FieldSprite
                                    id={rival}
                                    anim="Idle"
                                    dir={6}
                                    scale={scale}
                                    play={false}
                                    className="ar-head"
                                >
                                    <i className="ar-ask">?</i>
                                </FieldSprite>
                            </span>
                        </div>
                        <div className="ar-walk">
                            <WildZone wild={w} zone="floor" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="amb-ui rm-ui ar-ui">
                <header className="rm-head">
                    <h2>{t('home.amb.arenaTitle')}</h2>
                    <span className="rt-badges" title={belt ? t('trophies.belt', { n: belt.goal }) : undefined}>
                        <PixelTrophy kind="cinturao" metal={belt?.metal ?? 'ouro'} className="rm-belt" />
                        {belt ? `${belt.n}/${belt.goal}` : t('trophies.duelWins', { n: wins })}
                    </span>
                </header>
                <div className="rm-actions">
                    <button type="button" className="btn big cup-go rm-go primary" onClick={() => go('duel')}>
                        <span className="cup-go-txt">
                            <b>{t('home.amb.arenaGo')}</b>
                            <small>{t('home.amb.arenaLine')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    <div className="amb-tiles three">
                        <Tile icon="players" title={t('home.amb.soon2x2')} sub={t('home.soonRibbon')} soon />
                        <Tile icon="dice" title={t('home.amb.soonArcade')} sub={t('home.soonRibbon')} soon />
                        {liga ? (
                            <Tile
                                icon="cup"
                                title={t('liga.home.ligaTag')}
                                sub={t('home.amb.ligaOpens', { d: liga.d })}
                                soon
                            />
                        ) : (
                            <Tile icon="cup" title={t('liga.home.ligaTag')} onClick={() => go('liga')} />
                        )}
                    </div>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
