import { type CSSProperties, useEffect } from 'react';
import { create } from 'zustand';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer } from '../../store/missions';
import { titleClass } from '../../store/title-codes';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { openDoor } from '../doors';
import { Sheet } from '../kit/Sheet';
import { useCardShowcase } from './Album';
import { ClubTab } from './ClubTab';
import { Crest } from './Crest';
import { titleName, trainerLabel, useAvatar } from './club';
import { frameClass, MedalsTab, ShowcaseRow, useShowcase } from './Medals';
import { RedeemCode, TitlePicker, TrainerPicker, TrainerSprite } from './TrainerTab';

/**
 * Editar cartão (revisão dos menus, P1, 26/11): nome e avatar, personagem, título, uniforme e vitrine numa folha só,
 * com o cartão em cima mudando junto. Abre por cima de qualquer tela (`openCardEditor`): o Perfil, e quem mais quiser
 * levar pra cá (a Sede, o Álbum).
 */
const TABS = ['nome', 'personagem', 'titulo', 'uniforme', 'vitrine'] as const;
export type CardTab = (typeof TABS)[number];
const ICON: Record<CardTab, HudIconKind> = {
    nome: 'person',
    personagem: 'smile',
    titulo: 'crown',
    uniforme: 'flag',
    vitrine: 'cards',
};

export const useCardEditor = create<{ tab: CardTab | null }>(() => ({ tab: null }));
export const openCardEditor = (tab: CardTab = 'nome') => useCardEditor.setState({ tab });
const close = () => useCardEditor.setState({ tab: null });

/** O cartão como os outros veem, pequeno, no topo da folha: muda na hora com cada escolha. */
function CardPreview() {
    const profile = useGame((s) => s.profile);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const showcase = useShowcase();
    const title = activeTitle(profile);
    return (
        <div className="pf-ed-prev bc-surface" aria-hidden>
            <TrainerSprite id={activeTrainer(profile)} className="pf-ed-prev-tr" />
            <img
                className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(showcase.frame)}`}
                src={avatar.src}
                alt=""
                referrerPolicy="no-referrer"
            />
            <span className="pf-ed-prev-who">
                <b>{trainerLabel(profile, googleName)}</b>
                <span className={`pf-title-line${titleClass(title)}`}>{titleName(title)}</span>
                <span className="pf-clubline">
                    <Crest look={lookOfProfile(profile)} className="crest pf-crest" />
                    {profile.clubName || 'Pallet FC'} · <b>{profile.clubTag}</b>
                </span>
            </span>
            <ShowcaseRow items={showcase.items} className="pf-showcase" />
        </div>
    );
}

/** Vitrine: as 3 cartas (tocar tira ou leva pro Álbum) e os 3 destaques (as medalhas). */
function ShowcaseTab() {
    const { t } = useT();
    const { cards } = useCardShowcase();
    const updateProfile = useGame((s) => s.updateProfile);
    const album = () => {
        close();
        openDoor('collection', 'album');
    };
    return (
        <>
            <h3 className="bc-lbl">{t('profile.card.cards')}</h3>
            {cards.length > 0 && (
                <ul className="pf-cards pf-ed-cards" style={{ '--n': cards.length } as CSSProperties}>
                    {cards.map((c) => (
                        <li key={c.id}>
                            <FutCard
                                inst={c.inst}
                                size="sm"
                                modalActions={[
                                    {
                                        label: t('profile.binder.remove'),
                                        onClick: () =>
                                            updateProfile({
                                                cardShowcase: cards.map((x) => x.id).filter((x) => x !== c.id),
                                            }),
                                    },
                                    { label: t('profile.binder.organize'), onClick: album },
                                ]}
                            />
                        </li>
                    ))}
                </ul>
            )}
            <button type="button" className="k-sheetrow pf-ed-album" onClick={album}>
                <HudIcon kind="cards" />
                <b>{t('profile.edit.cardsPick')}</b>
                <HudIcon kind="next" />
            </button>
            <MedalsTab save={updateProfile} />
        </>
    );
}

export function CardEditor({ style }: { style?: CSSProperties }) {
    const tab = useCardEditor((s) => s.tab);
    const updateProfile = useGame((s) => s.updateProfile);
    const { t, d } = useT();
    // trocar de tela fecha a folha (como as outras portas)
    useEffect(() => useGame.subscribe((s, p) => s.screen !== p.screen && close()), []);
    return (
        <Sheet open={!!tab} onClose={close} title={t('profile.edit.open')} className="pf pf-sheet pf-ed" style={style}>
            <CardPreview />
            <div className="bc-tabs pf-ed-tabs" role="tablist" aria-label={t('profile.edit.tabsAria')}>
                {TABS.map((k) => (
                    <button
                        type="button"
                        role="tab"
                        key={k}
                        data-tab={k}
                        aria-selected={k === tab}
                        onClick={() => useCardEditor.setState({ tab: k })}
                    >
                        <HudIcon kind={ICON[k]} />
                        <span>{d.profile.edit.tabs[k]}</span>
                    </button>
                ))}
            </div>
            {/* a parte nova entra deslizando (nada teleporta); a chave remonta o formulário de cada parte */}
            <div className="pf-ed-body" role="tabpanel" key={tab}>
                {tab === 'nome' && <ClubTab part="trainer" />}
                {tab === 'personagem' && <TrainerPicker save={updateProfile} />}
                {tab === 'titulo' && (
                    <>
                        <TitlePicker save={updateProfile} />
                        <section className="pf-code-row">
                            <h3>{t('profile.picker.code')}</h3>
                            <RedeemCode />
                        </section>
                    </>
                )}
                {tab === 'uniforme' && <ClubTab part="club" />}
                {tab === 'vitrine' && <ShowcaseTab />}
            </div>
        </Sheet>
    );
}
