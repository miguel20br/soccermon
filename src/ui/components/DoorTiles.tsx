import type { CSSProperties, ReactNode } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { NEWS_DOORS } from '../../store/news';
import { seenCount } from '../../store/profile';
import { type Door, openDoor } from '../doors';
import { useAvatar } from '../profile/club';
import { NewDot, newsCount, useNews } from '../profile/news';
import { MenuIcon } from './MenuIcon';
import { Trophy } from './Trophy';

const DEX_TOTAL = 151;

/**
 * Portas pros menus (docs/planos/menus-e-sala.md), com o pontinho de novidade. Tudo mora no Perfil (pedido do
 * Miguel, 20/10): a Home tem só a porta do Perfil, e o Perfil tem as da Sala de troféus e da Coleção.
 */
export function DoorTiles({ which }: { which: Door[] }) {
    const { d, t } = useT();
    const news = useNews();
    const avatar = useAvatar();
    const seen = useGame((s) => seenCount(s.dex));
    const titles = useGame((s) => s.records.titles);
    const look: Record<Door, { icon: ReactNode; count?: string }> = {
        profile: {
            icon: (
                <img
                    className={`door-av${avatar.google ? '' : ' pixel'}`}
                    src={avatar.src}
                    alt=""
                    referrerPolicy="no-referrer"
                />
            ),
        },
        collection: { icon: <MenuIcon kind="dex" />, count: `${seen}/${DEX_TOTAL}` },
        trophies: { icon: <Trophy size={32} />, count: titles ? String(titles) : undefined },
    };
    // a porta do Perfil acende com a novidade de qualquer lugar lá dentro
    const fresh = (door: Door) =>
        (door === 'profile' ? (Object.keys(NEWS_DOORS) as Door[]) : [door]).some((x) =>
            NEWS_DOORS[x].some((tab) => newsCount(news, tab) > 0),
        );
    return (
        <nav className="doors" aria-label={t('home.doorsAria')} style={{ '--n': which.length } as CSSProperties}>
            {which.map((door) => {
                const [title, sub] = d.home.doors[door];
                const { icon, count } = look[door];
                return (
                    <button key={door} type="button" className="door bc-tile" onClick={() => openDoor(door)}>
                        {icon}
                        <span>
                            <b>{title}</b>
                            <small>{sub}</small>
                        </span>
                        {count && <em className="door-count">{count}</em>}
                        <NewDot on={fresh(door)} className="door-dot" />
                    </button>
                );
            })}
        </nav>
    );
}
