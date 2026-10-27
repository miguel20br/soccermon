import { type CSSProperties, useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { MISSIONS } from '../../store/missions';
import { hexCss, trainerLabel, useAvatar } from '../profile/club';
import { frameClass, useShowcase } from '../profile/Medals';
import { NewDot, useNews } from '../profile/news';
import { reduceMotionOn } from '../settings-sync';
import { countAt, trainerLevel } from './metas';
import '../kit/topbar.css';

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

/** Missões cumpridas que ainda existem na tabela (o nível não conta id de missão que saiu). */
const MISSION_IDS = new Set(MISSIONS.map((m) => m.id));

/**
 * A barra de cima (padrão Clash): só o treinador (avatar com a estrela do nível e nome), que abre o Perfil. Os contadores (troféus,
 * Pokédex) ficam no título de cada ambiente, uma vez só.
 */
export function TopBar() {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const avatar = useAvatar();
    const frame = useShowcase().frame;
    const news = useNews();
    const name = trainerLabel(profile);
    const lv = trainerLevel(profile.missionsDone.filter((id) => MISSION_IDS.has(id)).length);
    return (
        <div className="amb-res">
            <button
                type="button"
                className="res-me"
                style={{ '--club': hexCss(lookOfProfile(profile).color) } as CSSProperties}
                onClick={() => go('profile')}
                aria-label={`${t('profile.title')}: ${name} · ${t('home.amb.resLevel', { n: lv.level, x: lv.n, y: lv.goal })}`}
            >
                <img
                    className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(frame)}`}
                    src={avatar.src}
                    alt=""
                    referrerPolicy="no-referrer"
                />
                <span className="res-lv" aria-hidden>
                    <b className="cb-num">{lv.level}</b>
                </span>
                <span className="res-me-txt">
                    <b>{name}</b>
                </span>
                <NewDot on={news.size > 0} className="res-dot" />
            </button>
        </div>
    );
}
