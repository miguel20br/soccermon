import { useState } from 'react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { ArenaScene, RIVALS } from './Arena';
import { ClockCtx, useSceneClock } from './clock';
import { CourtFloor, clubVars, Floodlight, Stands } from './Estadio';
import { FieldSprite } from './FieldSprite';
import { avatarMon, type Mon } from './metas';
import { BIG, sceneScale, useMq, useSceneScale } from './sprite-scale';
import './ambientes.css';

/** O mesmo corte do Estádio: capitão 1x em tela pequena ou baixa. */
const SMALL_ES = '(max-width: 359px), (max-height: 700px)';

/**
 * Fundos de palco (cara-de-jogo.md, decisão 8): o lugar de verdade atrás das telas que moram nele. Vem num pedaço à
 * parte (React.lazy em kit/backdrop.tsx) com o CSS dos ambientes; tela cheia, atrás de tudo, sem toque.
 */
export function ArenaBackdrop({ rival, reveal }: { rival?: Mon | null; reveal?: boolean }) {
    const clock = useSceneClock(true);
    const scale = useSceneScale();
    const avatar = useGame((s) => s.profile.avatar);
    const [pick] = useState(() => RIVALS[Math.floor(Math.random() * RIVALS.length)]);
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-bd amb-bd-arena">
                <ArenaScene
                    me={avatarMon(avatar)}
                    rival={rival?.id ?? pick}
                    reveal={!!rival && reveal}
                    scale={scale}
                    active
                />
            </div>
        </ClockCtx.Provider>
    );
}

/**
 * O Estádio atrás da Copa do Dia: refletores, a torcida na cor do clube, o letreiro com o dia (`led`) e, no meio da
 * quadra, o Pokémon da figurinha de hoje (o prêmio à vista).
 */
export function EstadioBackdrop({ mon, led }: { mon: Mon; led: string }) {
    const clock = useSceneClock(true);
    const small = useMq(SMALL_ES);
    const big = useMq(BIG);
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-bd amb-bd-estadio">
                <div className="amb-scene es-scene" style={clubVars(club)}>
                    <div className="amb-layer es-sky">
                        <i className="es-stars" />
                        <i className="es-stars s2" />
                        <Floodlight side="l" />
                        <Floodlight side="r" />
                    </div>
                    <div className="amb-layer es-arena">
                        <Stands clubName={clubName} led={led} />
                        <div className="es-court">
                            <CourtFloor />
                            <i className="es-spot" />
                            <div className="es-captain">
                                <i className="es-shadow" />
                                <FieldSprite
                                    id={mon.id}
                                    shiny={mon.shiny}
                                    anim="Idle"
                                    dir={0}
                                    scale={sceneScale(small, big)}
                                    play
                                    className="es-mon"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClockCtx.Provider>
    );
}

/**
 * As bandas da quadra inteira no celular em pé (4x, 8x e Lances: a quadra é uma faixa no meio da caixa): a torcida de
 * cada time no lugar do fundo liso, a sua do outro lado (com a faixa) e a do rival na beira de cá, com o letreiro do
 * jogo colado na quadra. Fica atrás do canvas (Match.tsx, broadcast.css `.bc-stands`).
 */
export function CourtStands({ names, colors }: { names: [string, string]; colors: [number, number] }) {
    const led = `${names[0]} x ${names[1]}`.toUpperCase();
    return (
        <div className="bc-stands" aria-hidden>
            <div className="bc-stand-band far" style={clubVars(colors[0])}>
                <Stands clubName={names[0]} led={led} />
            </div>
            <i className="bc-stand-court" />
            <div className="bc-stand-band near" style={clubVars(colors[1])}>
                <Stands clubName={names[1]} led={led} />
            </div>
        </div>
    );
}
