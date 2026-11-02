import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    MISSIONS,
    TRAINERS,
    trainerFrame,
    unlockedTrainers,
} from '../../store/missions';
import { clubColorHex, seenCount } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { cupCounts, METALS } from '../../store/trophies';
import { closestMissions } from '../ambientes/metas';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { useMenuBackOf } from '../components/MenuHead';
import { MenuIcon } from '../components/MenuIcon';
import { PixelTrophy } from '../components/PixelTrophy';
import { Trophy } from '../components/Trophy';
import { legacyDoor, openDoor } from '../doors';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { useCardShowcase } from '../profile/Album';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, hexCss, missionText, titleName, trainerLabel, useAvatar } from '../profile/club';
import { FriendsTab } from '../profile/FriendsTab';
import { frameClass, ShowcaseRow, useShowcase } from '../profile/Medals';
import { NewDot, useNews } from '../profile/news';
import { MissionSummary, TitlePicker, TrainerPicker, TrainerSprite, useSaveView } from '../profile/TrainerTab';
import '../profile/profile.css';
import '../profile/armario.css';

type SheetId = 'nome' | 'treinadores' | 'titulo' | 'missoes' | 'clube' | 'amigos';
const DEX_TOTAL = 151;
const FLAGS = Array.from({ length: 14 }, (_, i) => i);
/** `?aba=` (o quadro e os botões da Sede, links antigos `?perfil=`) que já abre uma Sheet. */
const ABA_SHEET: Record<string, SheetId> = { clube: 'clube', amigos: 'amigos', missoes: 'missoes' };

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
 * Perfil = o armário do vestiário (cara-de-jogo.md, decisão 9): uma tela sem rolar com o cartão do treinador (o que os
 * outros veem), as missões e as portas: Sala de troféus, Coleção, treinadores (figurinhas), título, clube e amigos.
 * Editar mora em Sheet: tocar no nome ou no avatar abre o nome e o avatar.
 */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const seen = useGame((s) => seenCount(s.dex));
    const titles = useGame((s) => Math.max(s.records.titles, s.hall.length));
    const googleName = useCloud((s) => s.user?.name ?? null);
    const avatar = useAvatar();
    const showcase = useShowcase();
    const { cards: shown } = useCardShowcase();
    const updateProfile = useGame((s) => s.updateProfile);
    const view = useSaveView();
    const { t, d } = useT();
    const news = useNews();
    const has = (prefix: string) => [...news].some((k) => k.startsWith(prefix));
    const cups = cupCounts(hall);
    const look = lookOfProfile(profile);
    const done = MISSIONS.filter((m) => view.done.has(m.id)).length;
    const near = useMemo(() => closestMissions(view, 6), [view]);
    const [sheet, setSheet] = useState<SheetId | null>(null);
    const close = () => setSheet(null);
    useMenuBackOf(() => go('home'));

    // link antigo (?perfil=medalhas, ?perfil=album…) que agora mora em outra porta; `?aba=clube|amigos|missoes` abre a
    // Sheet dela (uma vez: some da URL, pra voltar ao Perfil depois não abrir de novo)
    useEffect(() => {
        const to = legacyDoor();
        if (to) return openDoor(...to);
        const url = new URL(window.location.href);
        const id = ABA_SHEET[url.searchParams.get('aba') ?? url.searchParams.get('perfil') ?? ''];
        if (!id) return;
        setSheet(id);
        url.searchParams.delete('aba');
        url.searchParams.delete('perfil');
        window.history.replaceState(window.history.state, '', url);
    }, []);

    const vars = { ...clubVars(clubColorHex(profile.clubColor)), '--club2': hexCss(look.color2) } as CSSProperties;
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
                            aria-label={`${edit}: ${t('profile.club.yourName')}`}
                            onClick={() => setSheet('nome')}
                        >
                            {trainerLabel(profile, googleName)}
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

            <button
                type="button"
                className="pf-arm-missions bc-tile"
                aria-haspopup="dialog"
                onClick={() => setSheet('missoes')}
            >
                <b>{d.profile.tabs.missoes}</b>
                <span className={`k-bar${done >= MISSIONS.length ? ' full' : ''}`} aria-hidden>
                    <i style={{ width: `${(done / MISSIONS.length) * 100}%` }} />
                </span>
                <em className="door-count">
                    {done}/{MISSIONS.length}
                </em>
            </button>

            <nav className="pf-lockers" aria-label={t('profile.title')}>
                <Locker
                    icon={<Trophy size={32} />}
                    title={d.home.doors.trophies[0]}
                    count={titles || undefined}
                    onClick={() => openDoor('trophies')}
                />
                <Locker
                    icon={<MenuIcon kind="dex" />}
                    title={d.home.doors.collection[0]}
                    count={`${seen}/${DEX_TOTAL}`}
                    onClick={() => openDoor('collection')}
                />
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
                <Locker
                    icon={<Crest look={look} className="crest" />}
                    title={d.profile.tabs.clube}
                    count={profile.clubTag}
                    dot={has('kit:')}
                    onClick={() => setSheet('clube')}
                />
                <Locker
                    icon={<HudIcon kind="friends" />}
                    title={d.profile.tabs.amigos}
                    onClick={() => setSheet('amigos')}
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
            </Sheet>
            <Sheet
                open={sheet === 'missoes'}
                onClose={close}
                title={d.profile.tabs.missoes}
                className="pf pf-sheet"
                style={vars}
            >
                <MissionSummary />
                <ul className="pf-near">
                    {near.map((g) => (
                        <li key={g.m.id}>
                            <span>{missionText(g.m)}</span>
                            <span className="k-bar">
                                <i style={{ width: `${(g.n / g.goal) * 100}%` }} />
                                <b>
                                    {g.n}/{g.goal}
                                </b>
                            </span>
                        </li>
                    ))}
                </ul>
            </Sheet>
            <Sheet
                open={sheet === 'clube'}
                onClose={close}
                title={d.profile.tabs.clube}
                className="pf pf-sheet"
                style={vars}
            >
                <ClubTab part="club" />
            </Sheet>
            <Sheet
                open={sheet === 'amigos'}
                onClose={close}
                title={d.profile.tabs.amigos}
                className="pf pf-sheet"
                style={vars}
            >
                <FriendsTab />
            </Sheet>
        </Stage>
    );
}
