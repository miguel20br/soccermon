import { type CSSProperties, useMemo } from 'react';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { cupCounts, METALS } from '../../store/trophies';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { openDoor } from '../doors';
import { playDoor } from '../kit/DoorWipe';
import { Crest, KitShirt } from '../profile/Crest';
import { hexCss, missionText } from '../profile/club';
import { useSaveView } from '../profile/TrainerTab';
import { ClockCtx, useSceneClock } from './clock';
import { closestMissions } from './metas';
import { BIG, floorZone, Mi, ROOM, SMALL, Tile } from './Room';
import { useMq, useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

/** Bandeirinhas do varal na parede (12, alternando as duas cores do clube). */
const FLAGS = Array.from({ length: 12 }, (_, i) => i);

/**
 * Sede do clube (Perfil + Sala de troféus): a sala de madeira com o escudo na parede, o varal de bandeirinhas e o
 * tapete nas cores do clube, as taças em cima da vitrine e a lareira. A meta é o bilhete da missão mais perto de
 * sair; o botão principal abre a Sala de troféus. Treinador, Clube e Amigos ficam embaixo.
 */
export function Sede({ active, wild, near }: { active: boolean; wild: Wild[]; near: boolean }) {
    const { t, tn, d } = useT();
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    // o clube: 3 no celular pequeno, 4 no médio, até 6 no PC (o resto da lista fica fora)
    const w = useWild(
        clock,
        wild.slice(0, small ? 3 : big ? 6 : 4),
        floorZone(small ? 1 : big ? 3 : 2),
        undefined,
        ROOM,
    );
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const titles = useGame((s) => Math.max(s.records.titles, s.hall.length));
    const view = useSaveView();
    const look = lookOfProfile(profile);
    const cups = useMemo(() => cupCounts(hall), [hall]);
    const goal = useMemo(() => closestMissions(view, 1)[0], [view]);
    const club = profile.clubName || 'Pallet FC';
    const vars = { '--club': hexCss(look.color), '--club2': hexCss(look.color2) } as CSSProperties;

    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene rm-scene sd-scene" style={vars} aria-hidden>
                <div className="amb-layer rm-room" style={{ '--depth': 0.25 } as CSSProperties}>
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    {near && (
                        <div className="rm-set">
                            <ol className="sd-flags">
                                {FLAGS.map((i) => (
                                    <li key={i} />
                                ))}
                            </ol>
                            <i className="sd-rug" />
                            <Mi k="plant" x={-72} bottom={76} />
                            <Mi k="lamp" x={-38} bottom={74} />
                            <span className="sd-frame">
                                <KitShirt look={look} className="sd-shirt" />
                            </span>
                            <Mi k="glassCab" x={0} bottom={72} />
                            {METALS.some((m) => cups[m] > 0) ? (
                                <span className="sd-cups">
                                    {METALS.filter((m) => cups[m] > 0).map((m) => (
                                        <PixelTrophy key={m} kind="taca" metal={m} />
                                    ))}
                                </span>
                            ) : (
                                // ainda sem taça: o lugar da 1ª reservado na vitrine, com a plaquinha
                                <>
                                    <span className="sd-cups empty">
                                        <PixelTrophy kind="taca" metal="ouro" ghost />
                                    </span>
                                    <span className="sd-plaque">{t('home.amb.sedeFirst')}</span>
                                </>
                            )}
                            <Crest look={look} className="sd-crest" />
                            <Mi k="fireplace" x={124} bottom={78} />
                            <i className="sd-fire" />
                            <Mi k="palm" x={196} bottom={80} />
                        </div>
                    )}
                    <div className="rm-walk">
                        <WildZone wild={w} zone="floor" />
                    </div>
                </div>
            </div>
            <div className="amb-ui rm-ui sd-ui" style={vars}>
                <header className="rm-head">
                    <h2 title={t('home.amb.sedeOf', { club })}>
                        <Crest look={look} className="crest sd-head-crest" />
                        <span className="rm-full">{t('home.amb.sedeOf', { club })}</span>
                        {/* deitado e estreito: só o nome do clube (o escudo já diz que é a Sede) */}
                        <span className="rm-short">{club}</span>
                    </h2>
                    <span className="rt-badges" title={tn('home.amb.sedeTitles', titles)}>
                        <PixelTrophy kind="taca" metal="ouro" ghost={!titles} className="rm-belt" />
                        {titles}
                    </span>
                </header>
                {goal && (
                    <button
                        type="button"
                        className="sd-board"
                        aria-label={t('home.amb.sedeBoard')}
                        onClick={() => openDoor('profile', 'missoes')}
                    >
                        <span>{missionText(goal.m)}</span>
                        <small>
                            {goal.n}/{goal.goal}
                        </small>
                        <span className="sd-bar" aria-hidden>
                            <i style={{ width: `${(goal.n / goal.goal) * 100}%` }} />
                        </span>
                    </button>
                )}
                <div className="rm-actions">
                    <button
                        type="button"
                        className="btn big cup-go rm-go cb cb-green"
                        onClick={() => playDoor(() => openDoor('trophies'))}
                    >
                        <span className="cup-go-txt">
                            <b>{d.home.doors.trophies[0]}</b>
                            <small>{tn('home.amb.sedeTitles', titles)}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    <div className="amb-tiles three">
                        <Tile
                            icon="person"
                            title={d.profile.tabs.treinador}
                            onClick={() => openDoor('profile', 'treinador')}
                        />
                        <Tile
                            icon="armband"
                            title={d.profile.tabs.clube}
                            onClick={() => openDoor('profile', 'clube')}
                        />
                        <Tile
                            icon="friends"
                            title={d.profile.tabs.amigos}
                            onClick={() => openDoor('profile', 'amigos')}
                        />
                    </div>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
