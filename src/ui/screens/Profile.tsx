import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, isGoldTrainer } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { HallList } from '../components/HallParade';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, titleName, trainerLabel, useAvatar } from '../profile/club';
import { DexTab } from '../profile/DexTab';
import { frameClass, MedalsTab, ShowcaseRow, useShowcase } from '../profile/Medals';
import { NumbersTab } from '../profile/NumbersTab';
import { MissionsTab, TrainerSprite } from '../profile/TrainerTab';
import '../profile/profile.css';

type Tab = 'clube' | 'medalhas' | 'missoes' | 'dex' | 'hall' | 'numeros';
const TABS: Tab[] = ['clube', 'medalhas', 'missoes', 'dex', 'hall', 'numeros'];
const TAB_ICON: Record<Tab, HudIconKind> = {
    clube: 'defensive',
    medalhas: 'medal',
    missoes: 'flag',
    dex: 'dex',
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
    // ?perfil=medalhas abre direto na aba (atalho pros prints e pro Miguel)
    const [tab, setTab] = useState<Tab>(() => {
        const q = new URLSearchParams(window.location.search).get('perfil') as Tab | null;
        return q && TABS.includes(q) ? q : 'clube';
    });
    const { t, d } = useT();

    return (
        <div className="menu-screen pf" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title={t('profile.title')} icon="profile" onBack={() => go('home')} />

            <header
                className={`panel pf-head bc-surface bc-stripe${isGoldTrainer(activeTrainer(profile)) ? ' gold-frame' : ''}`}
            >
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
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`pf-panel-${tab}`} aria-labelledby={`pf-tab-${tab}`}>
                {tab === 'clube' && <ClubTab />}
                {tab === 'medalhas' && <MedalsTab save={updateProfile} />}
                {tab === 'missoes' && <MissionsTab />}
                {tab === 'dex' && <DexTab />}
                {tab === 'hall' && <HallList />}
                {tab === 'numeros' && <NumbersTab onOpenDex={() => setTab('dex')} />}
            </div>
        </div>
    );
}
