import { type CSSProperties, type KeyboardEvent, useEffect, useId } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer } from '../../store/missions';
import { titleClass } from '../../store/title-codes';
import { useCardModal } from '../card-modal';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { CARD_TABS, type CardTab, openDoor, useCardEditor } from '../doors';
import { Sheet } from '../kit/Sheet';
import { ShowcaseEditor, useCardShowcase } from './Album';
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
const ICON: Record<CardTab, HudIconKind> = {
    nome: 'person',
    personagem: 'smile',
    titulo: 'crown',
    uniforme: 'flag',
    vitrine: 'cards',
};

/**
 * O nome e o nome do clube só conferem se já são de outra conta ao sair do campo (onBlur). No iOS tocar num botão não
 * tira o foco do campo: trocar de aba ou fechar a folha desmontava o campo sem o blur e o nome repetido ficava.
 */
const blurField = () => (document.activeElement as HTMLElement | null)?.blur?.();
const setTab = (tab: CardTab) => {
    blurField();
    useCardEditor.setState({ tab });
};
const close = () => {
    blurField();
    useCardEditor.setState({ tab: null, incoming: null });
};

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

/**
 * Vitrine: as 3 cartas no editor do Álbum (tirar no x, arrastar ou tocar em duas pra trocar; com a vitrine cheia, o
 * "Pôr na vitrine" do Álbum chega aqui com a carta nova) e os 3 destaques (as medalhas).
 */
function ShowcaseTab() {
    const { t } = useT();
    const { cards } = useCardShowcase();
    const incoming = useCardEditor((s) => s.incoming);
    const updateProfile = useGame((s) => s.updateProfile);
    const openCard = useCardModal((s) => s.open);
    const album = () => {
        close();
        openDoor('collection', 'album');
    };
    return (
        <>
            <h3 className="bc-lbl">{t('profile.card.cards')}</h3>
            <div className={`pf-ed-cards bd-showcase${incoming ? ' picking' : ''}`}>
                <ShowcaseEditor
                    shown={cards}
                    incoming={incoming}
                    onOpen={(c) => openCard(c.inst)}
                    onSave={(ids) => updateProfile({ cardShowcase: ids })}
                    onCancel={() => useCardEditor.setState({ incoming: null })}
                />
            </div>
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
    const id = useId();
    // abas do jeito do teclado (WAI-ARIA): só a escolhida no Tab, as setas (e Home/End) andam entre elas
    const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const n = CARD_TABS.length;
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        const k = CARD_TABS[(to + n) % n];
        setTab(k);
        e.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-tab="${k}"]`)?.focus();
    };
    // trocar de tela fecha a folha (como as outras portas)
    useEffect(() => useGame.subscribe((s, p) => s.screen !== p.screen && close()), []);
    return (
        <Sheet open={!!tab} onClose={close} title={t('profile.edit.open')} className="pf pf-sheet pf-ed" style={style}>
            <CardPreview />
            <div className="bc-tabs pf-ed-tabs" role="tablist" aria-label={t('profile.edit.tabsAria')}>
                {CARD_TABS.map((k, i) => (
                    <button
                        type="button"
                        role="tab"
                        key={k}
                        id={`${id}-${k}`}
                        data-tab={k}
                        aria-selected={k === tab}
                        aria-controls={`${id}-painel`}
                        tabIndex={k === tab ? 0 : -1}
                        onClick={() => setTab(k)}
                        onKeyDown={(e) => onKey(e, i)}
                    >
                        <HudIcon kind={ICON[k]} />
                        <span>{d.profile.edit.tabs[k]}</span>
                    </button>
                ))}
            </div>
            {/* a parte nova entra deslizando (nada teleporta); a chave remonta o formulário de cada parte */}
            <div
                className="pf-ed-body"
                role="tabpanel"
                id={`${id}-painel`}
                aria-labelledby={tab ? `${id}-${tab}` : undefined}
                key={tab}
            >
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
