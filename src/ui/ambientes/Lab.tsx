import { type CSSProperties, useMemo } from 'react';
import { SPECIES } from '../../engine/data';
import { LINKS } from '../../engine/links';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { albumCount, type Dex, gameMoveIds, isPlayed, movesMissing, seenCount } from '../../store/profile';
import { combosFoundOf, SECRET_TOTAL } from '../../store/secret-links';
import { HudIcon } from '../components/MatchHud';
import { openDoor } from '../doors';
import { trainerSrc } from '../tema';
import { TYPE_COLOR } from '../type-colors';
import { ClockCtx, useSceneClock } from './clock';
import { oakLine } from './metas';
import { floorZone, Mi, ROOM } from './Room';
import { SceneHotspot } from './SceneHotspot';
import { useSceneScale } from './sprite-scale';
import { useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

const DEX_TOTAL = 151;
/** Sinergias do Registro: as de história (sempre abertas) mais as secretas descobertas. */
const STORY_LINKS = LINKS.filter((l) => !l.secret).length;

/** O quadro dos 151 (revisão dos menus, L1): 19 x 8 casas de 4 px de arte, com 1 de vão e a moldura de 2. */
const COLS = 19;
const CELL = 5;
const BOARD_W = COLS * CELL + 3;
const BOARD_H = Math.ceil(DEX_TOTAL / COLS) * CELL + 3;

/**
 * A grade da Pokédex no chão (uma mesa de luz): falta = casa escura, visto = casa clara, jogou pelo seu time = acesa na
 * cor do tipo. Pixel art em SVG, sem texto.
 */
function DexBoard({ dex }: { dex: Dex }) {
    return (
        <svg className="lb-board rm-prop" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} shapeRendering="crispEdges" aria-hidden>
            <rect width={BOARD_W} height={BOARD_H} fill="#2e3b3a" />
            <rect x="1" y="1" width={BOARD_W - 2} height={BOARD_H - 2} fill="#14201f" />
            {SPECIES.slice(0, DEX_TOTAL).map((sp, i) => {
                const e = dex[sp.id];
                return (
                    <rect
                        key={sp.id}
                        x={2 + (i % COLS) * CELL}
                        y={2 + Math.floor(i / COLS) * CELL}
                        width="4"
                        height="4"
                        fill={isPlayed(e) ? (TYPE_COLOR[sp.types[0]] ?? '#ffcb05') : e ? '#9cbdb2' : '#26403d'}
                    />
                );
            })}
        </svg>
    );
}

/**
 * Laboratório do Carvalho (Coleção): a parede de estantes com o mapa, a bancada com o fichário aberto e a lousa, no
 * traço do kit da Sala de troféus. A meta é a Pokédex (x/151 no alto e na fala do Carvalho); o botão principal abre a
 * Pokédex, e os objetos da cena abrem cada parte: a estante é a Pokédex, o fichário é o Álbum, a lousa é a Golpedex, o
 * globo no chão são as Sinergias e o quadro dos 151 no chão também abre a Pokédex. O Carvalho fica em pé na sala.
 * `near`: a arte só baixa com a aba perto da tela.
 */
export function Lab({ active, wild, near }: { active: boolean; wild: Wild[]; near: boolean }) {
    const { t, tn, d } = useT();
    const clock = useSceneClock(active);
    const w = useWild(clock, wild, floorZone(useSceneScale()), undefined, ROOM);
    const dex = useGame((s) => s.dex);
    const moves = useGame((s) => s.moves);
    const seen = seenCount(dex);
    const album = useMemo(() => albumCount(dex), [dex]);
    const missingMoves = useMemo(() => movesMissing(moves, dex), [moves, dex]);
    const played = useMemo(() => SPECIES.slice(0, DEX_TOTAL).filter((sp) => isPlayed(dex[sp.id])).length, [dex]);
    const combos = useGame((s) => s.profile.combosFound);
    const links = STORY_LINKS + combosFoundOf({ combosFound: combos }).length;
    const left = DEX_TOTAL - seen;
    const moveTotal = gameMoveIds().size;
    const found = moveTotal - missingMoves.n;
    const line = useMemo(
        () => oakLine((id) => !!dex[id], album.total - album.got, moveTotal - found, SPECIES.slice(0, DEX_TOTAL)),
        [dex, album, found, moveTotal],
    );
    const talk =
        line.k === 'start'
            ? t('home.amb.labTalk', { n: line.n })
            : line.k === 'type'
              ? tn('home.amb.labTalkType', line.n, { type: typeName(line.type) })
              : line.k === 'album'
                ? tn('home.amb.labTalkAlbum', line.n)
                : line.k === 'moves'
                  ? `${tn('home.amb.labTalkMoves', line.n)}${missingMoves.tm ? ` ${tn('stats.lab.missingTm', missingMoves.tm)}` : ''}`
                  : t('home.amb.labTalkDone');

    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene rm-scene lb-scene">
                <div className="amb-layer rm-room" style={{ '--depth': 0.25 } as CSSProperties}>
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    {near && (
                        <div className="rm-set">
                            {/* fora do celular (desktop, deitado): mais estante e o carrinho de amostras */}
                            <Mi k="cabinet" x={-136} bottom={72} />
                            <Mi k="shelf2" x={-72} bottom={72} />
                            <SceneHotspot
                                k="shelf"
                                x={5}
                                bottom={72}
                                label={d.profile.tabs.dex}
                                sub={`${seen}/${DEX_TOTAL}`}
                                onClick={() => openDoor('collection', 'dex')}
                            />
                            <Mi k="map" x={68} bottom={42} />
                            <SceneHotspot
                                k="deskBook"
                                x={70}
                                bottom={80}
                                label={d.profile.tabs.album}
                                sub={`${album.got}/${album.total}`}
                                onClick={() => openDoor('collection', 'album')}
                            />
                            <SceneHotspot
                                k="labPc"
                                x={129}
                                bottom={74}
                                label={d.profile.tabs.golpedex}
                                sub={`${found}/${moveTotal}`}
                                onClick={() => openDoor('collection', 'golpedex')}
                            />
                            <Mi k="fridge" x={198} bottom={72} />
                            <Mi k="cart" x={230} bottom={74} />
                            <Mi k="palm" x={272} bottom={80} />
                            <i className="lb-balls" />
                            {/* o chão: o globo (Sinergias), o quadro dos 151 e o Carvalho em pé do lado da bancada */}
                            <div className="lb-floor">
                                {/* cada peça num ponto do chão (.lb-at-*): no PC elas saem pros lados da fala e do botão */}
                                <div className="lb-at lb-at-globe">
                                    <SceneHotspot
                                        k="globe"
                                        x={0}
                                        bottom={44}
                                        label={d.profile.tabs.sinergias}
                                        sub={`${links}/${STORY_LINKS + SECRET_TOTAL}`}
                                        onClick={() => openDoor('collection', 'sinergias')}
                                    />
                                </div>
                                <div className="lb-at lb-at-board">
                                    <SceneHotspot
                                        x={0}
                                        bottom={BOARD_H + 2}
                                        w={BOARD_W}
                                        h={BOARD_H}
                                        label={t('home.amb.labBoard')}
                                        sub={tn('home.amb.labBoardSub', played)}
                                        onClick={() => openDoor('collection', 'dex')}
                                    >
                                        <DexBoard dex={dex} />
                                    </SceneHotspot>
                                </div>
                                <img
                                    className="lb-oak rm-prop pixel"
                                    src={trainerSrc('oak')}
                                    alt=""
                                    width="80"
                                    height="80"
                                    draggable={false}
                                />
                            </div>
                        </div>
                    )}
                    <div className="rm-walk" aria-hidden>
                        <WildZone wild={w} zone="floor" />
                    </div>
                </div>
            </div>
            <div className="amb-ui rm-ui">
                <header className="rm-head">
                    <h2 title={t('home.amb.labTitle')}>
                        <span className="rm-full">{t('home.amb.labTitle')}</span>
                        <span className="rm-short">{t('home.amb.labShort')}</span>
                    </h2>
                    <span className="rt-badges" title={d.profile.tabs.dex}>
                        <HudIcon kind="dex" />
                        {seen}/{DEX_TOTAL}
                    </span>
                </header>
                {/* a fala fica sempre e muda com o progresso (antes sumia depois da 1ª visita) */}
                <div className="rt-talk rm-talk">
                    <span className="rt-talk-face">
                        <img className="pixel" src={trainerSrc('oak')} alt="" width="80" height="80" />
                    </span>
                    <p>
                        <b>{d.longCup.story.rota1.who}</b> {talk}
                    </p>
                </div>
                <div className="rm-actions">
                    <button
                        type="button"
                        className="btn big cup-go rm-go cb cb-blue"
                        onClick={() => openDoor('collection', 'dex')}
                    >
                        <span className="cup-go-txt">
                            <b>{t('home.amb.labGo')}</b>
                            <small>{left > 0 ? t('home.amb.labLeft', { n: left }) : t('home.amb.labFull')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
