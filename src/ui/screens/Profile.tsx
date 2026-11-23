import { type CSSProperties, lazy, type ReactNode, Suspense, useEffect, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    TRAINERS,
    trainerFrame,
    unlockedTrainers,
} from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { cupCounts, METALS } from '../../store/trophies';
import { backTarget } from '../back-nav';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { useMenuBackOf } from '../components/MenuHead';
import { PixelTrophy } from '../components/PixelTrophy';
import { type DoorSheet, legacyDoor, metasLink, openDoor, openMetas, openSheet, useDoorSheet } from '../doors';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { useCardShowcase } from '../profile/Album';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, hexCss, titleName, trainerLabel, useAvatar } from '../profile/club';
import { FriendsTab } from '../profile/FriendsTab';
import { PencilIcon } from '../profile/icons';
import { frameClass, ShowcaseRow, useShowcase } from '../profile/Medals';
import { MyStats, StatsStrip } from '../profile/MyStats';
import { NewDot, useNews } from '../profile/news';
import { RedeemCode, TitlePicker, TrainerPicker, TrainerSprite } from '../profile/TrainerTab';
import '../profile/profile.css';
import '../profile/armario.css';

type SheetId = 'nome' | 'treinadores' | 'titulo' | 'numeros';
const FLAGS = Array.from({ length: 14 }, (_, i) => i);
/** `?aba=` (links antigos `?perfil=`) que abre a folha do Clube ou dos Amigos. As missões moram nas Metas. */
const ABA_SHEET: Record<string, DoorSheet> = { clube: 'clube', amigos: 'amigos' };
const MetasSheet = lazy(() => import('../ambientes/MetasSheet'));

/** As cores do clube nas folhas (o varal, o escudo, os botões). */
function useClubVars(): CSSProperties {
    const profile = useGame((s) => s.profile);
    const look = lookOfProfile(profile);
    return { ...clubVars(clubColorHex(profile.clubColor)), '--club2': hexCss(look.color2) } as CSSProperties;
}

/**
 * Clube, Amigos e Metas (`openSheet`, doors.ts): folhas por cima da tela em que a pessoa está, no App. Fechar fica
 * nela; trocar de tela fecha a folha (o "Desafiar" dos Amigos vai pro Duelo).
 */
export function DoorSheets() {
    const open = useDoorSheet((s) => s.open);
    const { d } = useT();
    const vars = useClubVars();
    const close = () => openSheet(null);
    useEffect(() => useGame.subscribe((s, p) => s.screen !== p.screen && openSheet(null)), []);
    return (
        <>
            <Sheet
                open={open === 'clube'}
                onClose={close}
                title={d.profile.tabs.clube}
                className="pf pf-sheet"
                style={vars}
            >
                <ClubTab part="club" />
            </Sheet>
            <Sheet
                open={open === 'amigos'}
                onClose={close}
                title={d.profile.tabs.amigos}
                className="pf pf-sheet"
                style={vars}
            >
                <FriendsTab />
            </Sheet>
            {open === 'metas' && (
                <Suspense fallback={null}>
                    <MetasSheet onClose={close} style={vars} />
                </Suspense>
            )}
        </>
    );
}

/** Uma porta do armário: ícone, nome e o número (ou o valor de agora). */
function Locker({
    icon,
    title,
    count,
    dot,
    onClick,
}: {
    icon: ReactNode;
    title: string;
    count?: ReactNode;
    dot?: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button" className="pf-locker bc-tile" onClick={onClick}>
            <span className="pf-locker-ic">{icon}</span>
            <span className="pf-locker-txt">
                <b>{title}</b>
                {count !== undefined && <em className="door-count">{count}</em>}
            </span>
            <NewDot on={!!dot} />
        </button>
    );
}

/**
 * Perfil = o armário do vestiário da Sede (cara-de-jogo.md, decisão 9; menos-e-mais.md, B3): uma tela sem rolar com o
 * cartão do treinador (o que os outros veem), os seus números, treinadores (figurinhas) e título. Voltar leva pra tela de
 * onde ele abriu (`backTarget`).
 * Editar mora em Sheet: tocar no nome ou no avatar abre o nome e o avatar.
 */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const showcase = useShowcase();
    const { cards: shown } = useCardShowcase();
    const updateProfile = useGame((s) => s.updateProfile);
    const { t } = useT();
    const news = useNews();
    const has = (prefix: string) => [...news].some((k) => k.startsWith(prefix));
    const cups = cupCounts(hall);
    const look = lookOfProfile(profile);
    const [sheet, setSheet] = useState<SheetId | null>(null);
    const close = () => setSheet(null);
    // voltar leva pra onde o Perfil abriu (a Sede pelo armário, o Estádio pela barra de cima…), nunca pra outra
    useMenuBackOf(() => go(backTarget('profile') ?? 'home'));

    // link antigo (?perfil=album…) que agora mora em outra porta; missões e medalhas vão pras Metas da Sede;
    // `?aba=clube|amigos` abre a folha dela (uma vez: some da URL, pra voltar ao Perfil depois não abrir de novo)
    useEffect(() => {
        if (metasLink(window.location.search)) return openMetas();
        const to = legacyDoor();
        if (to) return openDoor(...to);
        const url = new URL(window.location.href);
        const id = ABA_SHEET[url.searchParams.get('aba') ?? url.searchParams.get('perfil') ?? ''];
        if (!id) return;
        openSheet(id);
        url.searchParams.delete('aba');
        url.searchParams.delete('perfil');
        window.history.replaceState(window.history.state, '', url);
    }, []);

    const vars = useClubVars();
    const edit = t('profile.club.trainerTitle');

    return (
        <Stage
            className="pf pf-arm"
            style={vars}
            scene={
                // o vestiário da Sede: parede de madeira, o varal nas cores do clube e o piso
                <>
                    <i className="pf-arm-wall" />
                    <ol className="pf-arm-flags">
                        {FLAGS.map((i) => (
                            <li key={i} />
                        ))}
                    </ol>
                    <i className="pf-arm-floor" />
                </>
            }
        >
            <header className={`panel pf-head bc-surface bc-stripe${trainerFrame(activeTrainer(profile))}`}>
                <button
                    type="button"
                    className="pf-duo pf-edit"
                    aria-label={`${edit}: ${t('profile.club.avatar')}`}
                    onClick={() => setSheet('nome')}
                >
                    <TrainerSprite id={activeTrainer(profile)} className="pf-duo-trainer" />
                    <img
                        className={`pf-avatar${avatar.google ? '' : ' pixel'}${frameClass(showcase.frame)}`}
                        src={avatar.src}
                        alt=""
                        referrerPolicy="no-referrer"
                    />
                    <NewDot on={has('av:')} />
                </button>
                <div className="pf-who">
                    <h2>
                        <button
                            type="button"
                            className="pf-edit pf-name"
                            aria-label={`${t('profile.club.editName')}: ${trainerLabel(profile, googleName)}`}
                            title={t('profile.club.editName')}
                            onClick={() => setSheet('nome')}
                        >
                            <span>{trainerLabel(profile, googleName)}</span>
                            <PencilIcon className="pf-ico pf-pencil" />
                        </button>
                    </h2>
                    <span className={`pf-title-line${titleClass(activeTitle(profile))}`}>
                        {titleName(activeTitle(profile))}
                    </span>
                    <span className="pf-clubline">
                        <Crest look={look} className="crest pf-crest" />
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
                {/* vitrine de cartas no cartão: tocar abre a carta (tirar ou organizar no Álbum); vazia leva pro Álbum */}
                {shown.length ? (
                    <ul
                        className="pf-cards"
                        aria-label={t('profile.card.cards')}
                        style={{ '--n': shown.length } as CSSProperties}
                    >
                        {shown.map((c) => (
                            <li key={c.id}>
                                <FutCard
                                    inst={c.inst}
                                    size="sm"
                                    modalActions={[
                                        {
                                            label: t('profile.binder.remove'),
                                            onClick: () =>
                                                updateProfile({
                                                    cardShowcase: shown.map((x) => x.id).filter((x) => x !== c.id),
                                                }),
                                        },
                                        {
                                            label: t('profile.binder.organize'),
                                            onClick: () => openDoor('collection', 'album'),
                                        },
                                    ]}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <button type="button" className="pf-cards-empty" onClick={() => openDoor('collection', 'album')}>
                        <HudIcon kind="max" />
                        {t('profile.card.addCards')}
                    </button>
                )}
            </header>

            {/* seus números (o que o amigo vê de você, e mais): a faixa abre a folha inteira */}
            <StatsStrip onOpen={() => setSheet('numeros')} />

            {/* o Perfil é o seu cartão: aqui só o que é de você (treinador e título). Troféus, Clube e Metas moram
                na Sede, Amigos na barra de cima; a Coleção, no Laboratório */}
            <nav className="pf-lockers" aria-label={t('profile.title')}>
                <Locker
                    icon={<TrainerSprite id={activeTrainer(profile)} />}
                    title={t('profile.picker.trainer')}
                    count={`${unlockedTrainers(profile).length}/${TRAINERS.length}`}
                    dot={has('tr:')}
                    onClick={() => setSheet('treinadores')}
                />
                <Locker
                    icon={<HudIcon kind="crown" />}
                    title={t('profile.picker.title')}
                    count={earnedTitles(profile).length}
                    dot={has('ti:')}
                    onClick={() => setSheet('titulo')}
                />
            </nav>

            <Sheet open={sheet === 'nome'} onClose={close} title={edit} className="pf pf-sheet" style={vars}>
                <ClubTab part="trainer" />
            </Sheet>
            <Sheet
                open={sheet === 'treinadores'}
                onClose={close}
                title={t('profile.picker.trainer')}
                className="pf pf-sheet"
                style={vars}
            >
                <TrainerPicker save={updateProfile} />
            </Sheet>
            <Sheet
                open={sheet === 'titulo'}
                onClose={close}
                title={t('profile.picker.title')}
                className="pf pf-sheet"
                style={vars}
            >
                <TitlePicker save={updateProfile} />
                {/* o código de título, onde o título aparece (antes morava nas Configurações) */}
                <section className="pf-code-row">
                    <h3>{t('profile.picker.code')}</h3>
                    <RedeemCode />
                </section>
            </Sheet>
            <Sheet
                open={sheet === 'numeros'}
                onClose={close}
                title={t('profile.stats.title')}
                className="pf pf-sheet pf-mine-sheet"
                style={vars}
            >
                <MyStats />
            </Sheet>
        </Stage>
    );
}
