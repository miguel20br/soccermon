import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { MenuHead } from '../components/MenuHead';
import { ClubTab } from '../profile/ClubTab';
import { clubVars, trainerLabel, useAvatar } from '../profile/club';
import { DexTab } from '../profile/DexTab';
import { NumbersTab } from '../profile/NumbersTab';
import '../profile/profile.css';

type Tab = 'clube' | 'dex' | 'numeros';
const TABS: { id: Tab; label: string }[] = [
    { id: 'clube', label: 'Meu clube' },
    { id: 'dex', label: 'Pokédex' },
    { id: 'numeros', label: 'Números' },
];

/** Perfil: seu clube, a Pokédex e os números da carreira. */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const records = useGame((s) => s.records);
    const career = useGame((s) => s.career);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const [tab, setTab] = useState<Tab>('clube');

    return (
        <div className="menu-screen pf" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title="Perfil" icon="profile" onBack={() => go('home')} />

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
                        <dt>Copas</dt>
                        <dd>{records.cups}</dd>
                    </div>
                    <div>
                        <dt>Títulos</dt>
                        <dd>{records.titles}</dd>
                    </div>
                    <div>
                        <dt>Gols</dt>
                        <dd>{career.goalsFor}</dd>
                    </div>
                </dl>
            </header>

            <div className="pf-tabs" role="tablist" aria-label="Perfil">
                {TABS.map((t) => (
                    <button
                        type="button"
                        role="tab"
                        key={t.id}
                        id={`pf-tab-${t.id}`}
                        aria-selected={tab === t.id}
                        aria-controls={`pf-panel-${t.id}`}
                        className={`pf-tab${tab === t.id ? ' active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`pf-panel-${tab}`} aria-labelledby={`pf-tab-${tab}`}>
                {tab === 'clube' && <ClubTab />}
                {tab === 'dex' && <DexTab />}
                {tab === 'numeros' && <NumbersTab onOpenDex={() => setTab('dex')} />}
            </div>
        </div>
    );
}
