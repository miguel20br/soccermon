import { type CSSProperties, useMemo } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { albumCount, gameMoveIds, movesFound, seenCount } from '../../store/profile';
import { HudIcon } from '../components/MatchHud';
import { openDoor } from '../doors';
import { ClockCtx, useSceneClock } from './clock';
import { BIG, floorZone, Mi, SMALL, Tile } from './Room';
import { useMq, useWild, WildZone } from './WildZone';
import type { Wild } from './wild';

const DEX_TOTAL = 151;

/**
 * Laboratório do Carvalho (Coleção): a parede de estantes com o mapa, a bancada com a Pokédex aberta e o computador
 * da Golpedex, no traço do kit da Sala de troféus. A meta é a Pokédex (x/151 no alto e na fala do Carvalho); o botão
 * principal abre a Pokédex, e Álbum e Golpedex ficam do lado. `near`: a arte só baixa com a aba perto da tela.
 */
export function Lab({ active, wild, near }: { active: boolean; wild: Wild[]; near: boolean }) {
    const { t, d } = useT();
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const w = useWild(clock, wild, floorZone(small ? 1 : big ? 3 : 2));
    const dex = useGame((s) => s.dex);
    const moves = useGame((s) => s.moves);
    const seen = seenCount(dex);
    const album = useMemo(() => albumCount(dex), [dex]);
    const found = useMemo(() => movesFound(moves, dex), [moves, dex]);
    const left = DEX_TOTAL - seen;

    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene rm-scene lb-scene" aria-hidden>
                <div className="amb-layer rm-room" style={{ '--depth': 0.25 } as CSSProperties}>
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    {near && (
                        <div className="rm-set">
                            {/* fora do celular (desktop, deitado): mais estante e o carrinho de amostras */}
                            <Mi k="cabinet" x={-136} bottom={72} />
                            <Mi k="shelf2" x={-72} bottom={72} />
                            <Mi k="shelf" x={0} bottom={72} />
                            <Mi k="map" x={66} bottom={42} />
                            <Mi k="deskBook" x={68} bottom={80} />
                            <Mi k="labPc" x={132} bottom={74} />
                            <Mi k="fridge" x={198} bottom={72} />
                            <Mi k="cart" x={230} bottom={74} />
                            <Mi k="palm" x={272} bottom={80} />
                            <i className="lb-balls" />
                        </div>
                    )}
                    <div className="rm-walk">
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
                <div className="rt-talk rm-talk">
                    <span className="rt-talk-face">
                        <img className="pixel" src="assets/trainers/oak.png" alt="" width="80" height="80" />
                    </span>
                    <p>
                        <b>{d.longCup.story.rota1.who}</b>{' '}
                        {left > 0 ? t('home.amb.labTalk', { n: left }) : t('home.amb.labTalkDone')}
                    </p>
                </div>
                <div className="rm-actions">
                    <button
                        type="button"
                        className="btn big cup-go rm-go primary"
                        onClick={() => openDoor('collection', 'dex')}
                    >
                        <span className="cup-go-txt">
                            <b>{t('home.amb.labGo')}</b>
                            <small>{t('home.amb.labSeen', { n: seen, total: DEX_TOTAL })}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    <div className="amb-tiles">
                        <Tile
                            icon="cards"
                            title={d.profile.tabs.album}
                            sub={`${album.got}/${album.total}`}
                            onClick={() => openDoor('collection', 'album')}
                        />
                        <Tile
                            icon="max"
                            title={d.profile.tabs.golpedex}
                            sub={`${found}/${gameMoveIds().size}`}
                            onClick={() => openDoor('collection', 'golpedex')}
                        />
                    </div>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
