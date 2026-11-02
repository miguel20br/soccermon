import { useState } from 'react';
import { useGame } from '../../store/game-store';
import { ArenaScene, RIVALS } from './Arena';
import { ClockCtx, useSceneClock } from './clock';
import { avatarMon, type Mon } from './metas';
import { BIG, SMALL } from './Room';
import { useMq } from './WildZone';
import './ambientes.css';

/**
 * Fundos de palco (cara-de-jogo.md, decisão 8): o lugar de verdade atrás das telas que moram nele. Vem num pedaço à
 * parte (React.lazy em kit/backdrop.tsx) com o CSS dos ambientes; tela cheia, atrás de tudo, sem toque.
 */
export function ArenaBackdrop({ rival, reveal }: { rival?: Mon | null; reveal?: boolean }) {
    const clock = useSceneClock(true);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const avatar = useGame((s) => s.profile.avatar);
    const [pick] = useState(() => RIVALS[Math.floor(Math.random() * RIVALS.length)]);
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-bd amb-bd-arena">
                <ArenaScene
                    me={avatarMon(avatar)}
                    rival={rival?.id ?? pick}
                    reveal={!!rival && reveal}
                    scale={small ? 1 : big ? 3 : 2}
                    active
                />
            </div>
        </ClockCtx.Provider>
    );
}
