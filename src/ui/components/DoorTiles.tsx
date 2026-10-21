import type { CSSProperties, ReactNode } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { seenCount } from '../../store/profile';
import { type Door, openDoor } from '../doors';
import { useAvatar } from '../profile/club';
import { MenuIcon } from './MenuIcon';
import { Trophy } from './Trophy';

const DEX_TOTAL = 151;

/**
 * Portas pros menus (docs/planos/menus-e-sala.md): Perfil, Coleção e Sala de troféus na Home. Sem pontinho de
 * novidade aqui: a bolinha é uma só, no avatar do topo (docs/planos/pesquisa-layout-e-game-design.md, #10); lá dentro,
 * a aba que tem novidade e o NOVO no item.
 */
export function DoorTiles({ which }: { which: Door[] }) {
    const { d, t } = useT();
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
                    </button>
                );
            })}
        </nav>
    );
}
