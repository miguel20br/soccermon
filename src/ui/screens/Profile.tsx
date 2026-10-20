import { type CSSProperties, useEffect, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, trainerFrame } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { cupCounts, METALS } from '../../store/trophies';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { PixelTrophy } from '../components/PixelTrophy';
import { DOOR_TABS, type DoorTab, initialTab, legacyDoor, openDoor } from '../doors';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, titleName, trainerLabel, useAvatar } from '../profile/club';
import { FriendsTab } from '../profile/FriendsTab';
import { frameClass, ShowcaseRow, useShowcase } from '../profile/Medals';
import { NewDot, newsCount, useNews } from '../profile/news';
import { TrainerSprite } from '../profile/TrainerTab';
import '../profile/profile.css';

type Tab = DoorTab<'profile'>;
const TAB_ICON: Record<Tab, HudIconKind> = { treinador: 'person', clube: 'defensive', amigos: 'friends' };

/**
 * Perfil = quem eu sou (docs/planos/menus-e-sala.md): o topo é o seu cartão público (o que os outros jogadores veem),
 * e as abas mudam o que ele mostra: Treinador (nome, avatar, treinador e título, com as missões que liberam cada
 * um), Clube (cor, escudo, uniforme, faixa) e Amigos.
 */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const showcase = useShowcase();
    const [tab, setTab] = useState<Tab>(() => initialTab('profile'));
    const { t, d } = useT();
    const news = useNews();
    const cups = cupCounts(hall);
    // link antigo (?perfil=medalhas, ?perfil=album…) que agora mora em outra porta
    useEffect(() => {
        const to = legacyDoor();
        if (to) openDoor(...to);
    }, []);

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
                    {METALS.some((m) => cups[m]) && (
                        <button
                            type="button"
                            className="pcard-cups pf-cups"
                            onClick={() => openDoor('trophies')}
                            aria-label={`${t('trophies.cardTrophies')}: ${METALS.map((m) => cups[m]).join(' · ')}`}
                        >
                            {METALS.map((m) =>
                                cups[m] ? (
                                    <span key={m} className="pcard-cup">
                                        <PixelTrophy kind="taca" metal={m} />
                                        <b>{t('trophies.times', { n: cups[m] })}</b>
                                    </span>
                                ) : null,
                            )}
                        </button>
                    )}
                </div>
                <small className="pf-public-hint">{t('profile.publicHint')}</small>
            </header>

            <div
                className="pf-tabs bc-tabs"
                role="tablist"
                aria-label={t('profile.title')}
                style={{ '--n': DOOR_TABS.profile.length } as CSSProperties}
            >
                {DOOR_TABS.profile.map((id) => (
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
                        <NewDot on={id !== 'amigos' && newsCount(news, id) > 0} />
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`pf-panel-${tab}`} aria-labelledby={`pf-tab-${tab}`}>
                {tab === 'treinador' && <ClubTab part="trainer" />}
                {tab === 'clube' && <ClubTab part="club" />}
                {tab === 'amigos' && <FriendsTab />}
            </div>
        </div>
    );
}
