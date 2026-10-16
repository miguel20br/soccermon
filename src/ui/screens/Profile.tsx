import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { HallList } from '../components/HallParade';
import { MenuHead } from '../components/MenuHead';
import { ClubTab } from '../profile/ClubTab';
import { clubVars, trainerLabel, useAvatar } from '../profile/club';
import { DexTab } from '../profile/DexTab';
import { NumbersTab } from '../profile/NumbersTab';
import '../profile/profile.css';

type Tab = 'clube' | 'dex' | 'hall' | 'numeros';
const TABS: Tab[] = ['clube', 'dex', 'hall', 'numeros'];

/** Perfil: seu clube, a Pokédex e os números da carreira. */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const records = useGame((s) => s.records);
    const career = useGame((s) => s.career);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const [tab, setTab] = useState<Tab>('clube');
    const { t, d } = useT();

    return (
        <div className="menu-screen pf" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title={t('profile.title')} icon="profile" onBack={() => go('home')} />

            <header className="panel pf-head">
                <img
                    className={`pf-avatar${avatar.google ? '' : ' pixel'}`}
                    src={avatar.src}
                    alt=""
                    referrerPolicy="no-referrer"
                />
                <div className="pf-who">
                    <h2>{trainerLabel(profile, googleName)}</h2>
                    <span className="pf-clubline">
                        <i aria-hidden />
                        {profile.clubName || 'Pallet FC'} · <b>{profile.clubTag}</b>
                    </span>
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

            <div className="pf-tabs" role="tablist" aria-label={t('profile.title')}>
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
                        {d.profile.tabs[id]}
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`pf-panel-${tab}`} aria-labelledby={`pf-tab-${tab}`}>
                {tab === 'clube' && <ClubTab />}
                {tab === 'dex' && <DexTab />}
                {tab === 'hall' && <HallList />}
                {tab === 'numeros' && <NumbersTab onOpenDex={() => setTab('dex')} />}
            </div>
        </div>
    );
}
