import { type CSSProperties, useEffect, useRef } from 'react';
import { CLUBS } from '../../engine/cup';
import { species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import type { TeamSetup } from '../../engine/state';
import { GYM_TM } from '../../engine/tm';
import { playSfx } from '../../game/audio';
import { clubName, formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { activeTrainer, leaderTrainerOf, type TrainerId, trainerFx, trainerSrc } from '../../store/missions';
import { rivalColor, tagFromName } from '../../store/profile';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
import { reduceMotionOn } from '../settings-sync';
import { cardSprite } from './PokeCard';
import './versus.css';

const AUTO_START_MS = 4500;
/** Quando o VS bate na tela (casa com o atraso + 60% de `vsp-slam` no versus.css). */
const SLAM_MS = 1000;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** Tamanho natural moderado: o Pikachu fica um pouco menor que o Dragonite, sem sumir. */
const sizeOf = (heightm: number) => Math.min(1.1, Math.max(0.86, 0.94 + 0.1 * Math.log2(Math.max(0.1, heightm))));
/** Faixa da média igual à das cartas: bronze ≤64, prata 65–74, ouro 75+. */
const tierOf = (n: number) => (n >= 75 ? 'gold' : n >= 65 ? 'silver' : 'bronze');

/**
 * Foto do time: o capitão na frente e no meio, os outros dois a dois atrás dele, cada fileira um pouco
 * mais alta e menor. dx/dy/h em unidades da altura do capitão (`--u` no CSS).
 */
const SLOTS = [
    { dx: 0, dy: 0, h: 1 },
    { dx: -0.62, dy: 0.14, h: 0.72 },
    { dx: 0.62, dy: 0.14, h: 0.72 },
    { dx: -1.08, dy: 0.3, h: 0.56 },
    { dx: 1.08, dy: 0.3, h: 0.56 },
];

function Squad({ team, trainer }: { team: TeamSetup; trainer?: TrainerId }) {
    const order = team.lineup
        .map((p) => ({ p, ovr: viewInstance(p).overall }))
        .sort((a, b) => Number(b.p.uid === team.captainUid) - Number(a.p.uid === team.captainUid) || b.ovr - a.ovr)
        .map(({ p }) => p);
    return (
        <div className={`vsp-squad${trainer ? ' has-trainer' : ''}`}>
            {/* o treinador fica na ponta de fora da foto, atrás dos Pokémon */}
            {trainer && (
                <img
                    className={`vsp-trainer${trainerFx(trainer)}`}
                    src={trainerSrc(trainer)}
                    alt=""
                    draggable={false}
                />
            )}
            {order.map((p, i) => {
                const s = SLOTS[Math.min(i, SLOTS.length - 1)];
                const style = {
                    '--dx': s.dx,
                    '--dy': s.dy,
                    '--h': s.h * sizeOf(species(p.speciesId).heightm),
                    // os de trás chegam primeiro, o capitão por último
                    '--d': `${0.3 + (order.length - 1 - i) * 0.08}s`,
                    zIndex: 10 - i,
                } as CSSProperties;
                return (
                    <img
                        key={p.uid}
                        className={`vsp-mon pixel row-${Math.ceil(i / 2)}`}
                        style={style}
                        src={cardSprite(p)}
                        alt={viewInstance(p).displayName}
                        draggable={false}
                    />
                );
            })}
        </div>
    );
}

/** Treinador de verdade do lado (duelo): avatar e título embaixo do nome do clube. */
export interface VsCoach {
    name: string;
    title?: string;
    /** Visual do título especial (classe title-shine/title-holo). */
    titleLook?: string;
    avatar?: string;
    avatarGoogle?: boolean;
}

function Side({
    team,
    side,
    name,
    tag,
    label,
    trainer,
    coach,
}: {
    team: TeamSetup;
    side: 'home' | 'away';
    name: string;
    tag: string;
    label: string;
    trainer?: TrainerId;
    coach?: VsCoach;
}) {
    const { t, d } = useT();
    const avg = lineupAverage(team.lineup, team.formation);
    return (
        <div className={`vsp-side is-${side}`}>
            <div className="vsp-half" />
            <div className="vsp-team">
                <div className="vsp-head">
                    <div className="vsp-crest" aria-hidden>
                        <span>{tag}</span>
                    </div>
                    <div className="vsp-info">
                        <div className="vsp-who">{label}</div>
                        <div className="vsp-name">{name}</div>
                        <div className="vsp-meta">
                            {formationText(formationOf(team.formation).id).name} · {d.common.tactic[team.tactic]}
                        </div>
                        {coach && (
                            <div className="vsp-coach">
                                {coach.avatar && (
                                    <img
                                        className={coach.avatarGoogle ? '' : 'pixel'}
                                        src={coach.avatar}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                    />
                                )}
                                <span>
                                    <b>{coach.name}</b>
                                    {coach.title && (
                                        <small>
                                            <span className={coach.titleLook || undefined}>{coach.title}</span>
                                        </small>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`vsp-avg ${tierOf(avg)}`}>
                        <b>{avg}</b>
                        <small>{t('match.vs.avgShort')}</small>
                    </div>
                </div>
                <Squad team={team} trainer={trainer} />
            </div>
        </div>
    );
}

/**
 * Tela de VERSUS antes de cada partida, estilo jogo de luta: a tela partida ao meio por uma linha de luz
 * (lado a lado deitado, em cima e embaixo em pé), cada lado na cor do clube com escudo, média e os cinco
 * titulares, e o VS batendo bem no centro (escala, tremor curto, clarão e som). A final contra a Liga
 * Índigo ganha VS dourado e raios. Tudo anima uma vez só. Começa sozinha ou ao tocar.
 */
export function VersusIntro({
    home,
    away,
    stage,
    ready,
    onDone,
    awayTrainer,
    awayLabel,
    awayTag,
    homeCoach,
    awayCoach,
    startsIn,
}: {
    home: TeamSetup;
    away: TeamSetup;
    stage: string;
    /** Duelo: treinador, rótulo e sigla do rival (na copa saem do ginásio). */
    awayTrainer?: TrainerId;
    awayLabel?: string;
    awayTag?: string;
    /** Duelo: os dois treinadores (nome, avatar e título). */
    homeCoach?: VsCoach;
    awayCoach?: VsCoach;
    /** Duelo: o apito é marcado pela sala (segundos que faltam); sem botão de começar. */
    startsIn?: number;
    /** A quadra terminou de carregar: só então começa a contagem para iniciar sozinho. */
    ready: boolean;
    onDone: () => void;
}) {
    // a função pode mudar a cada render da tela; o timer não pode reiniciar por isso
    const done = useRef(onDone);
    done.current = onDone;

    const club = CLUBS.find((c) => c.name === away.name);
    const final = club?.city === 'Indigo Plateau';

    // som do VS batendo; com "reduzir movimento" o VS já aparece no lugar, então o som vem junto
    useEffect(() => {
        playSfx('select');
        const slam = () => {
            playSfx('shot', final ? 0.5 : 0.7);
            if (final) playSfx('post', 0.6);
        };
        if (reduceMotionOn()) {
            slam();
            return;
        }
        const timer = window.setTimeout(slam, SLAM_MS);
        return () => clearTimeout(timer);
    }, [final]);

    const timed = startsIn !== undefined;
    useEffect(() => {
        if (!ready || timed) return;
        const timer = window.setTimeout(() => done.current(), AUTO_START_MS);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done.current();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', onKey);
        };
    }, [ready, timed]);

    // seu time sempre na cor do clube (Perfil); o rival no uniforme reserva se as cores baterem
    const homeColor = useClubColor();
    const profile = useGame((s) => s.profile);
    const { t } = useT();
    const awayName = clubName(away.name);
    const leader = GYM_TM[away.name]?.leader;
    const style = {
        '--home': hex(homeColor),
        '--away': hex(rivalColor(homeColor, away.color)),
    } as CSSProperties;

    return (
        <div
            className={`vs-overlay vsp${final ? ' is-final' : ''}`}
            style={style}
            role="dialog"
            aria-modal="true"
            aria-label={t('match.vs.aria', { home: home.name, away: awayName })}
        >
            <div className="vsp-scene">
                <Side
                    team={away}
                    side="away"
                    trainer={awayTrainer ?? leaderTrainerOf(away.name)}
                    name={awayName}
                    coach={awayCoach}
                    tag={awayTag ?? tagFromName(awayName)}
                    label={
                        awayLabel ??
                        (final
                            ? t('match.vs.elite')
                            : leader && club
                              ? t('match.vs.leader', { leader, city: club.city })
                              : t('match.vs.rival'))
                    }
                />
                <Side
                    team={home}
                    side="home"
                    trainer={activeTrainer(profile)}
                    name={home.name}
                    coach={homeCoach}
                    tag={home.name === profile.clubName ? profile.clubTag : tagFromName(home.name)}
                    label={t('match.vs.yourTeam')}
                />
                {/* a linha de luz: traços sobrepostos do largo/transparente ao fino/branco (brilho sem filtro) */}
                <svg className="vsp-beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    {(
                        [
                            ['land', 54, -2, 46, 102],
                            ['port', -2, 53, 102, 47],
                        ] as const
                    ).map(([cls, x1, y1, x2, y2]) => (
                        <g key={cls} className={cls}>
                            {['glow-2', 'glow-1', 'core'].map((c) => (
                                <line key={c} className={c} x1={x1} y1={y1} x2={x2} y2={y2} />
                            ))}
                        </g>
                    ))}
                </svg>
                <div className="vsp-burst" aria-hidden />
                <div className="vsp-vs" aria-hidden>
                    VS
                </div>
                <div className="vs-stage vsp-stage">{final ? t('match.vs.final') : stage}</div>
            </div>
            <div className="vsp-flash" />
            {startsIn !== undefined ? (
                <div className="btn primary vs-start vs-countdown" role="status">
                    {ready ? t('match.vs.startsIn', { s: startsIn }) : t('match.vs.loading')}
                </div>
            ) : (
                <button type="button" className="btn primary vs-start" onClick={onDone}>
                    {ready ? t('match.vs.start') : t('match.vs.loading')}
                </button>
            )}
            {ready && startsIn === undefined && (
                <div className="vs-progress" style={{ animationDuration: `${AUTO_START_MS}ms` }} />
            )}
        </div>
    );
}
