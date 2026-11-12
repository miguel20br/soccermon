import { type CSSProperties, useMemo } from 'react';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { cupCounts, METALS } from '../../store/trophies';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { openDoor, openMetas } from '../doors';
import { playDoor } from '../kit/DoorWipe';
import { Crest, KitShirt } from '../profile/Crest';
import { hexCss, missionText } from '../profile/club';
import { useSaveView } from '../profile/TrainerTab';
import { ClockCtx, useSceneClock } from './clock';
import { closestMissions } from './metas';
import { BIG, floorZone, Mi, ROOM, SMALL } from './Room';
import { SceneHotspot } from './SceneHotspot';
import { sceneScale } from './sprite-scale';
import { useMq, useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

/** Bandeirinhas do varal na parede (12, alternando as duas cores do clube). */
const FLAGS = Array.from({ length: 12 }, (_, i) => i);

/**
 * Sede do clube (Perfil + Sala de troféus): a sala de madeira com o escudo na parede, o varal de bandeirinhas e o
 * tapete nas cores do clube, as taças em cima da vitrine e a lareira (só fora do celular). O botão principal abre as
 * Metas (missões e medalhas, numa folha por cima da Sede, `DoorSheets`) com a missão mais perto de sair. Os objetos da cena abrem o
 * resto: a vitrine é a Sala de troféus, o escudo é o Clube, o mural é Amigos e o armário é o Perfil.
 */
/** O mural de amigos (cortiça com 3 fotos presas), 30 x 24 pixels de arte no traço do kit. */
function Mural() {
    return (
        <svg className="sd-mural" viewBox="0 0 30 24" shapeRendering="crispEdges" aria-hidden>
            <rect width="30" height="24" fill="#3a2a22" />
            <rect x="1" y="1" width="28" height="22" fill="#8a5a32" />
            <rect x="2" y="2" width="26" height="20" fill="#c98a4b" />
            <path d="M5 4h1v1h-1zM20 3h1v1h-1zM12 18h1v1h-1zM25 15h1v1h-1zM8 15h1v1h-1z" fill="#a8703a" />
            <rect x="4" y="5" width="7" height="8" fill="#f4f1e6" />
            <rect x="5" y="6" width="5" height="4" fill="#6fa8dc" />
            <rect x="6" y="7" width="3" height="3" fill="#e8443a" />
            <rect x="13" y="7" width="7" height="8" fill="#f4f1e6" />
            <rect x="14" y="8" width="5" height="4" fill="#9bd36a" />
            <rect x="15" y="9" width="3" height="3" fill="#ffcb05" />
            <rect x="21" y="4" width="6" height="7" fill="#f4f1e6" />
            <rect x="22" y="5" width="4" height="3" fill="#f2a6c8" />
            <rect x="23" y="6" width="2" height="2" fill="#5a3b8c" />
            <rect x="21" y="13" width="6" height="5" fill="#fff3a0" />
            <path d="M22 14.5h4M22 16.5h3" stroke="#8a7f62" strokeWidth="1" />
            <path d="M7 4h1v1h-1zM16 6h1v1h-1zM23 3h1v1h-1zM23 12h1v1h-1z" fill="#e8443a" />
        </svg>
    );
}

export function Sede({ active, wild, near }: { active: boolean; wild: Wild[]; near: boolean }) {
    const { t, tn, d } = useT();
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    // o clube: 3 no celular pequeno, 4 no médio, até 6 no PC (o resto da lista fica fora)
    const w = useWild(
        clock,
        wild.slice(0, small ? 3 : big ? 6 : 4),
        floorZone(sceneScale(small, big)),
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
            <div className="amb-scene rm-scene sd-scene" style={vars}>
                <div className="amb-layer rm-room" style={{ '--depth': 0.25 } as CSSProperties}>
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    {near && (
                        <div className="rm-set">
                            <ol className="sd-flags" aria-hidden>
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
                            <SceneHotspot
                                k="glassCab"
                                x={4}
                                bottom={72}
                                label={t('home.amb.sedeTrophies')}
                                plate={8}
                                onClick={() => playDoor(() => openDoor('trophies'))}
                            />
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
                            <SceneHotspot
                                x={59}
                                bottom={58}
                                w={40}
                                h={44}
                                label={d.profile.tabs.clube}
                                onClick={() => openDoor('profile', 'clube')}
                            >
                                <Crest look={look} className="sd-crest" />
                            </SceneHotspot>
                            <SceneHotspot
                                x={101}
                                bottom={42}
                                w={30}
                                h={24}
                                label={d.profile.tabs.amigos}
                                onClick={() => openDoor('profile', 'amigos')}
                            >
                                <Mural />
                            </SceneHotspot>
                            <SceneHotspot
                                k="wardrobe"
                                x={131}
                                bottom={72}
                                label={t('profile.title')}
                                onClick={() => openDoor('profile')}
                            />
                            {/* fora do celular: a lareira acesa e a palmeira */}
                            <Mi k="fireplace" x={196} bottom={78} />
                            <i className="sd-fire" />
                            <Mi k="palm" x={266} bottom={80} />
                        </div>
                    )}
                    <div className="rm-walk" aria-hidden>
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
                <div className="rm-actions">
                    {/* a ação principal é o que não tem porta na cena: as Metas (Troféus é a vitrine, o contador e a porta) */}
                    <button type="button" className="btn big cup-go rm-go cb cb-blue" onClick={openMetas}>
                        <span className="cup-go-txt">
                            <b>{t('home.amb.sedeMetas')}</b>
                            <small>{goal ? missionText(goal.m) : t('home.amb.sedeBoard')}</small>
                        </span>
                        {goal && <em className="door-count">{`${goal.n}/${goal.goal}`}</em>}
                        <HudIcon kind="next" />
                    </button>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
