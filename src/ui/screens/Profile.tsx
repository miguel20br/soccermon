import { type CSSProperties, lazy, type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import { cloudEnabled, signInWithGoogle, useCloud } from '../../cloud/cloud';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { duelWins } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { activeTitle, activeTrainer, trainerFrame } from '../../store/missions';
import { clubColorHex, seenCount } from '../../store/profile';
import { titleClass } from '../../store/title-codes';
import { cupCounts, METALS } from '../../store/trophies';
import { levelOfDone, type PathStep, trainerPath } from '../ambientes/metas';
import { backTarget } from '../back-nav';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { useMenuBackOf } from '../components/MenuHead';
import { PixelTrophy } from '../components/PixelTrophy';
import { type DoorSheet, legacyDoor, metasLink, openDoor, openMetas, openSheet, useDoorSheet } from '../doors';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { useCardShowcase } from '../profile/Album';
import { CardEditor, openCardEditor } from '../profile/CardEditor';
import { ClubTab } from '../profile/ClubTab';
import { Crest } from '../profile/Crest';
import { clubVars, hexCss, titleName, trainerLabel, trainerName, useAvatar } from '../profile/club';
import { FriendsTab } from '../profile/FriendsTab';
import { PencilIcon } from '../profile/icons';
import { frameClass, ShowcaseRow, useShowcase } from '../profile/Medals';
import { MyStats, StatsStrip } from '../profile/MyStats';
import { NewDot, useNews } from '../profile/news';
import { OrnamentRow, ornamentIds } from '../profile/ornaments';
import { TrainerSprite, useSaveView } from '../profile/TrainerTab';
import { UltimateLegacy } from '../ultimate/Legacy';
import '../profile/profile.css';
import '../profile/armario.css';

type SheetId = 'numeros' | 'legado';
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
            <CardEditor style={vars} />
        </>
    );
}

/** O desenho do prêmio de um passo do Caminho: o treinador, a coroa do título, o cinturão ou a sala. */
function PrizeArt({ s }: { s: PathStep }) {
    if (s.prize.kind === 'belt') return <PixelTrophy kind="cinturao" metal={s.prize.metal} />;
    if (s.prize.kind === 'room') return <HudIcon kind="building" />;
    return s.prize.m.trainer ? <TrainerSprite id={s.prize.m.trainer} /> : <HudIcon kind="crown" />;
}

/**
 * O nível no cartão (revisão dos menus, P2): o número, a barra larga das missões até o próximo e o próximo prêmio do
 * Caminho do treinador. Tocar abre as Metas no Caminho.
 */
function LevelCard() {
    const { t, d } = useT();
    const done = useGame((s) => s.profile.missionsDone);
    const wins = useGame((s) => duelWins(s.records, s.duels));
    const titles = useGame((s) => Math.max(s.records.titles, s.hall.length));
    const view = useSaveView();
    const lv = levelOfDone(done);
    const { steps, next } = useMemo(() => trainerPath(view, done, wins, titles), [view, done, wins, titles]);
    const prize = steps[next];
    const prizeName = (s: PathStep) =>
        s.prize.kind === 'mission'
            ? s.prize.m.trainer
                ? trainerName(s.prize.m.trainer)
                : titleName(s.prize.m.title ?? '')
            : s.prize.kind === 'belt'
              ? t('trophies.belt', { n: s.goal })
              : d.trophies.level[s.prize.level];
    return (
        <button
            type="button"
            className="pf-level bc-tile"
            onClick={openMetas}
            aria-label={t('profile.level.aria', { n: lv.level })}
        >
            <span className="pf-level-star res-lv">
                <b className="cb-num">{lv.level}</b>
            </span>
            <span className="pf-level-main">
                <b>{t('profile.card.level', { n: lv.level })}</b>
                <span className="k-bar pf-level-bar">
                    <i style={{ width: `${(lv.n / lv.goal) * 100}%` }} />
                </span>
                <small>{t('profile.level.missions', { n: lv.n, goal: lv.goal })}</small>
            </span>
            {prize && (
                <span className="pf-level-prize">
                    <small>{t('profile.level.next')}</small>
                    <span className="pf-level-art">
                        <PrizeArt s={prize} />
                    </span>
                    <b>{prizeName(prize)}</b>
                    <em className="k-num">
                        {prize.n}/{prize.goal}
                    </em>
                </span>
            )}
        </button>
    );
}

/** Um atalho do Perfil: ícone, nome e o número (ou nada). */
function Shortcut({
    icon,
    title,
    count,
    onClick,
}: {
    icon: HudIconKind;
    title: string;
    count?: ReactNode;
    onClick: () => void;
}) {
    return (
        <button type="button" className="pf-short bc-tile" onClick={onClick}>
            <HudIcon kind={icon} />
            <b>{title}</b>
            {count !== undefined && <em className="door-count">{count}</em>}
        </button>
    );
}

/**
 * Perfil = o armário do vestiário da Sede (cara-de-jogo.md, decisão 9; revisão dos menus de 26/11, P1–P3): uma tela
 * sem rolar com o cartão (o que os outros veem), o nível, os seus números, atalhos e, sem conta, o "Salvar na nuvem".
 * Editar o cartão é uma folha só (`CardEditor`): tocar no nome, no avatar, no personagem ou em "Editar cartão".
 * Voltar leva pra tela de onde ele abriu (`backTarget`).
 */
export function Profile() {
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const dex = useGame((s) => s.dex);
    const googleName = useCloud((s) => s.user?.name ?? null);
    const signedIn = useCloud((s) => !!s.user);
    const avatar = useAvatar();
    const showcase = useShowcase();
    const { cards: shown } = useCardShowcase();
    const updateProfile = useGame((s) => s.updateProfile);
    const { t } = useT();
    const news = useNews();
    const has = (prefix: string) => [...news].some((k) => k.startsWith(prefix));
    const cups = cupCounts(hall);
    const cupTotal = METALS.reduce((n, m) => n + cups[m], 0);
    const look = lookOfProfile(profile);
    const legacy = useGame((s) => s.ultimate.legacy);
    const hasLegacy = !!legacy.seasons.length || !!legacy.ornaments.length;
    const [sheet, setSheet] = useState<SheetId | null>(null);
    const [busy, setBusy] = useState(false);
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
    const editDot = has('av:') || has('tr:') || has('ti:');
    const name = trainerLabel(profile, googleName);

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
                {/* o personagem em pé, grande (tocar troca); o avatar vai ao lado do nome */}
                <button
                    type="button"
                    className="pf-edit pf-hero"
                    aria-label={`${t('profile.edit.open')}: ${t('profile.edit.tabs.personagem')}`}
                    onClick={() => openCardEditor('personagem')}
                >
                    <TrainerSprite id={activeTrainer(profile)} className="pf-hero-tr" />
                </button>
                <div className="pf-who">
                    <h2>
                        <button
                            type="button"
                            className="pf-edit pf-name"
                            aria-label={`${t('profile.club.editName')}: ${name}`}
                            title={t('profile.club.editName')}
                            onClick={() => openCardEditor('nome')}
                        >
                            <img
                                className={`pf-avatar pf-name-av${avatar.google ? '' : ' pixel'}${frameClass(showcase.frame)}`}
                                src={avatar.src}
                                alt=""
                                referrerPolicy="no-referrer"
                            />
                            <span>{name}</span>
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
                    <OrnamentRow ids={ornamentIds(legacy)} />
                    {cupTotal > 0 && (
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
                    <button
                        type="button"
                        className="btn ghost small pf-editcard-open"
                        aria-label={t('profile.edit.open')}
                        onClick={() => openCardEditor(shown.length ? 'nome' : 'vitrine')}
                    >
                        <PencilIcon className="pf-ico" />
                        <span className="pf-editcard-txt">{t('profile.edit.open')}</span>
                        <NewDot on={editDot} />
                    </button>
                </div>
                {/* vitrine de cartas no cartão: tocar abre a carta (tirar ou organizar no Álbum); vazia leva pra Vitrine */}
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
                    <button type="button" className="pf-cards-empty" onClick={() => openCardEditor('vitrine')}>
                        <HudIcon kind="max" />
                        {t('profile.card.addCards')}
                    </button>
                )}
            </header>

            <LevelCard />

            {/* seus números (somam as copas e o Time Ultimate): a faixa abre a folha inteira */}
            <StatsStrip onOpen={() => setSheet('numeros')} />

            <nav className="pf-shorts" aria-label={t('profile.shortcuts.aria')}>
                <Shortcut
                    icon="cup"
                    title={t('profile.shortcuts.trophies')}
                    count={cupTotal || undefined}
                    onClick={() => openDoor('trophies')}
                />
                <Shortcut
                    icon="dex"
                    title={t('profile.shortcuts.collection')}
                    count={`${seenCount(dex)}/151`}
                    onClick={() => openDoor('collection')}
                />
                <Shortcut icon="friends" title={t('profile.shortcuts.friends')} onClick={() => openSheet('amigos')} />
                {hasLegacy && (
                    <Shortcut
                        icon="medal"
                        title={t('profile.picker.legacy')}
                        count={legacy.seasons.length || undefined}
                        onClick={() => setSheet('legado')}
                    />
                )}
            </nav>

            {/* sem conta: o save só existe neste aparelho. O login de sempre (o Google volta pra cá) */}
            {cloudEnabled && !signedIn && (
                <button
                    type="button"
                    className="pf-cloud bc-tile"
                    disabled={busy}
                    onClick={() => {
                        // junção: openAccount() da menus-a
                        setBusy(true);
                        signInWithGoogle().catch(() => setBusy(false));
                    }}
                >
                    <HudIcon kind="upload" />
                    <span>
                        <b>{t('profile.cloud.save')}</b>
                        <small>{t('profile.cloud.hint')}</small>
                    </span>
                    <HudIcon kind="next" />
                </button>
            )}

            <Sheet
                open={sheet === 'legado'}
                onClose={close}
                title={t('profile.picker.legacy')}
                className="pf pf-sheet"
                style={vars}
            >
                <UltimateLegacy />
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
