import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, trainerFrame } from '../../store/missions';
import type { NewsTab } from '../../store/news';
import { clubColorHex } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { HallList } from '../components/HallParade';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, titleName, trainerLabel, useAvatar } from '../profile/club';
import { DexTab } from '../profile/DexTab';
import { FriendsTab } from '../profile/FriendsTab';
import { frameClass, MedalsTab, ShowcaseRow, useShowcase } from '../profile/Medals';
import { NumbersTab } from '../profile/NumbersTab';
import { NewDot, NewsBar, newsCount, useNews } from '../profile/news';
import { useMyInfo, usePlayerCard } from '../profile/PlayerCard';
import { MissionsTab, TrainerSprite } from '../profile/TrainerTab';
import '../profile/profile.css';

type Tab = 'clube' | 'medalhas' | 'missoes' | 'dex' | 'amigos' | 'hall' | 'numeros';
const TABS: Tab[] = ['clube', 'medalhas', 'missoes', 'dex', 'amigos', 'hall', 'numeros'];
const NEWS_TABS: Tab[] = ['clube', 'medalhas', 'dex'];
const TAB_ICON: Record<Tab, HudIconKind> = {
    clube: 'defensive',
    medalhas: 'medal',
    missoes: 'flag',
    dex: 'dex',
    amigos: 'friends',
    hall: 'cup',
    numeros: 'chart',
};

/** Perfil: seu clube, a Pokédex e os números da carreira. */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const records = useGame((s) => s.records);
    const career = useGame((s) => s.career);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const updateProfile = useGame((s) => s.updateProfile);
    const showcase = useShowcase();
    const myInfo = useMyInfo();
    const openCard = usePlayerCard((s) => s.open);
    // ?perfil=medalhas abre direto na aba (atalho pros prints e pro Miguel); ?perfil=album (ou o fichario de antes)
    // abre o Álbum na Pokédex
    const q = new URLSearchParams(window.location.search).get('perfil');
    const albumQ = q === 'album' || q === 'fichario';
    const [tab, setTab] = useState<Tab>(() => (albumQ ? 'dex' : q && TABS.includes(q as Tab) ? (q as Tab) : 'clube'));
    const { t, d } = useT();
    const news = useNews();

    return (
        <div className="menu-screen pf" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title={t('profile.title')} icon="profile" onBack={() => go('home')} />

            <header className={`panel pf-head bc-surface bc-stripe${trainerFrame(activeTrainer(profile))}`}>
                <div className="pf-duo">
                    <TrainerSprite id={activeTrainer(profile)} className="pf-duo-trainer" />
                    <img
                        className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(showcase.frame)}`}
                        src={avatar.src}
                        alt=""
                        referrerPolicy="no-referrer"
                    />
                </div>
                <div className="pf-who">
                    <h2>{trainerLabel(profile, googleName)}</h2>
                    <span className={`pf-title-line${titleClass(activeTitle(profile))}`}>
                        {titleName(activeTitle(profile))}
                    </span>
                    <span className="pf-clubline">
                        <Crest look={lookOfProfile(profile)} className="crest pf-crest" />
                        {profile.clubName || 'Pallet FC'} · <b>{profile.clubTag}</b>
                    </span>
                    <ShowcaseRow items={showcase.items} className="pf-showcase" />
                </div>
                <dl className="pf-quick">
                    <div>
                        <dt>{t('profile.quick.cups')}</dt>
                        <dd>{records.cups}</dd>
                    </div>
                    <div>
                        <dt>{t('profile.quick.titles')}</dt>
                        <dd>{records.titles}</dd>
                    </div>
                    <div>
                        <dt>{t('profile.quick.goals')}</dt>
                        <dd>{career.goalsFor}</dd>
                    </div>
                </dl>
                <button type="button" className="btn small pf-public" onClick={() => openCard(myInfo)}>
                    <HudIcon kind="person" />
                    {t('profile.card.open')}
                </button>
            </header>

            <div className="pf-tabs bc-tabs" role="tablist" aria-label={t('profile.title')}>
                {TABS.map((id) => (
                    <button
                        type="button"
                        role="tab"
                        key={id}
                        id={`pf-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls={`pf-panel-${id}`}
                        className={`pf-tab${tab === id ? ' active' : ''}`}
                        onClick={() => setTab(id)}
                    >
                        <HudIcon kind={TAB_ICON[id]} />
                        <span>{d.profile.tabs[id]}</span>
                        <NewDot on={NEWS_TABS.includes(id) && newsCount(news, id as NewsTab) > 0} />
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`pf-panel-${tab}`} aria-labelledby={`pf-tab-${tab}`}>
                {NEWS_TABS.includes(tab) && <NewsBar key={tab} tab={tab as NewsTab} />}
                {tab === 'clube' && <ClubTab />}
                {tab === 'medalhas' && <MedalsTab save={updateProfile} />}
                {tab === 'missoes' && <MissionsTab />}
                {tab === 'dex' && <DexTab initial={albumQ ? 'album' : 'dex'} />}
                {tab === 'amigos' && <FriendsTab />}
                {tab === 'hall' && <HallList />}
                {tab === 'numeros' && <NumbersTab onOpenDex={() => setTab('dex')} />}
            </div>
        </div>
    );
}
