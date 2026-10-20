import { type CSSProperties, lazy, Suspense, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { DOOR_TABS, type DoorTab, initialTab } from '../doors';
import { DexTab } from '../profile/DexTab';
import { NewDot, newsCount, useNews } from '../profile/news';
import '../profile/profile.css';

const MoveLab = lazy(() => import('./MoveLab').then((m) => ({ default: m.MoveLab })));

type Tab = DoorTab<'collection'>;
const TAB_ICON: Record<Tab, HudIconKind> = { dex: 'dex', album: 'cards', golpedex: 'max' };

/** Coleção = o que eu coleciono (docs/planos/menus-e-sala.md): Pokédex, Álbum de figurinhas e Golpedex. */
export function Collection() {
    const go = useGame((s) => s.go);
    const [tab, setTab] = useState<Tab>(() => initialTab('collection'));
    const { t, d } = useT();
    const news = useNews();
    return (
        <div className="menu-screen pf">
            <MenuHead title={t('profile.collection')} icon="dex" onBack={() => go('home')} />
            <div
                className="pf-tabs bc-tabs"
                role="tablist"
                aria-label={t('profile.collection')}
                style={{ '--n': DOOR_TABS.collection.length } as CSSProperties}
            >
                {DOOR_TABS.collection.map((id) => (
                    <button
                        type="button"
                        role="tab"
                        key={id}
                        id={`col-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls={`col-panel-${id}`}
                        className={`pf-tab${tab === id ? ' active' : ''}`}
                        onClick={() => setTab(id)}
                    >
                        <HudIcon kind={TAB_ICON[id]} />
                        <span>{d.profile.tabs[id]}</span>
                        <NewDot on={id !== 'golpedex' && newsCount(news, id) > 0} />
                    </button>
                ))}
            </div>
            <div role="tabpanel" id={`col-panel-${tab}`} aria-labelledby={`col-tab-${tab}`}>
                {tab === 'golpedex' ? (
                    <Suspense fallback={<p className="muted">{t('common.ui.loading')}</p>}>
                        <MoveLab bare onExit={() => go('home')} />
                    </Suspense>
                ) : (
                    <DexTab view={tab} onView={setTab} />
                )}
            </div>
        </div>
    );
}
