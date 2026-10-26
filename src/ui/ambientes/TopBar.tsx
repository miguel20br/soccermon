import { type CSSProperties, useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle } from '../../store/missions';
import { seenCount } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { HudIcon } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { openDoor } from '../doors';
import { hexCss, titleName, trainerLabel, useAvatar } from '../profile/club';
import { frameClass, useShowcase } from '../profile/Medals';
import { NewDot, useNews } from '../profile/news';
import { reduceMotionOn } from '../settings-sync';
import { countAt } from './metas';

/** O número que sobe do 0 ao valor quando `run` liga (a aba aparece); com "reduzir movimento", já parado no valor. */
export function useCountUp(n: number, run = true): number {
    const [v, setV] = useState(() => (run && !reduceMotionOn() ? 0 : n));
    useEffect(() => {
        if (!run || reduceMotionOn()) {
            setV(n);
            return;
        }
        let raf = 0;
        const t0 = performance.now();
        const tick = (now: number) => {
            const x = countAt(n, now - t0);
            setV(x);
            if (x < n) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [n, run]);
    return v;
}

/** Número grande com contorno, subindo. */
export function Count({ n, run = true, className = '' }: { n: number; run?: boolean; className?: string }) {
    return <b className={`cb-num ${className}`}>{useCountUp(n, run)}</b>;
}

/**
 * A barra de cima dos ambientes (padrão Clash): o treinador (avatar, nome e título) à esquerda, os títulos ganhos e
 * a Pokédex em placas com o número grande. Cada placa abre o que conta: Perfil, Sala de troféus e Pokédex.
 */
export function TopBar() {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const titles = useGame((s) => Math.max(s.records.titles, s.hall.length));
    const seen = useGame((s) => seenCount(s.dex));
    const avatar = useAvatar();
    const frame = useShowcase().frame;
    const news = useNews();
    const name = trainerLabel(profile);
    const title = activeTitle(profile);
    return (
        <div className="amb-res">
            <button
                type="button"
                className="res-me"
                style={{ '--club': hexCss(lookOfProfile(profile).color) } as CSSProperties}
                onClick={() => go('profile')}
                aria-label={`${t('profile.title')}: ${name}`}
            >
                <img
                    className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(frame)}`}
                    src={avatar.src}
                    alt=""
                    referrerPolicy="no-referrer"
                />
                <span className="res-me-txt">
                    <b>{name}</b>
                    <small className={titleClass(title).trim()}>{titleName(title)}</small>
                </span>
                <NewDot on={news.size > 0} className="res-dot" />
            </button>
            <button
                type="button"
                className="res-chip res-cup"
                aria-label={t('home.amb.resTitles', { n: titles })}
                onClick={() => openDoor('trophies')}
            >
                <PixelTrophy kind="taca" metal="ouro" />
                <Count n={titles} />
            </button>
            <button
                type="button"
                className="res-chip res-dex"
                aria-label={t('home.amb.resDex', { n: seen })}
                onClick={() => openDoor('collection', 'dex')}
            >
                <HudIcon kind="dex" />
                <Count n={seen} />
            </button>
        </div>
    );
}
