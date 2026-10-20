import { type CSSProperties, useMemo, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { medalProgress } from '../../store/medals';
import { PLATINUM, platinumDone } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { BELTS, cupCounts, dailyCounts, fullWeeks, METALS, roomLevel } from '../../store/trophies';
import { HallList } from '../components/HallParade';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import { DOOR_TABS, type DoorTab, initialTab, openDoor } from '../doors';
import { useCardShowcase } from '../profile/Album';
import { clubVars } from '../profile/club';
import { MedalsTab, useMedalView } from '../profile/Medals';
import { NumbersTab } from '../profile/NumbersTab';
import { NewDot, newsCount, useNews } from '../profile/news';
import { PlatinumBlock } from '../profile/TrainerTab';
import { type Metal, metalOf } from '../rarity';
import { reduceMotionOn } from '../settings-sync';
import { RoomScene, type RoomTarget } from '../trophy/RoomScene';
import '../profile/profile.css';
import '../trophy-room.css';

type Tab = DoorTab<'trophies'>;
const TAB_ICON: Record<Tab, HudIconKind> = { trofeus: 'cup', medalhas: 'medal', numeros: 'chart' };

/** Um troféu da estante: o desenho (silhueta se falta), o nome, quantos e como ganhar. */
function TrophyCard({
    kind,
    metal,
    n,
    name,
    how,
}: {
    kind: ArtKind;
    metal: Metal;
    n: number;
    name: string;
    how: string;
}) {
    const { t } = useT();
    return (
        <li className={`tr-card${n ? '' : ' ghost'}`}>
            <PixelTrophy kind={kind} metal={metal} ghost={!n} />
            <b>{name}</b>
            <small>{n ? t('trophies.times', { n }) : how}</small>
        </li>
    );
}

/**
 * Sala de troféus = o que eu ganhei (docs/planos/menus-e-sala.md): o quarto em cima (tocar num móvel leva à seção
 * dele) e as abas Troféus (Copa com o Hall da Fama, Copa do Dia, Duelo, Liga, Platina), Medalhas (com os Destaques
 * do cartão) e Números.
 */
export function TrophyRoom() {
    const { t, d } = useT();
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const updateProfile = useGame((s) => s.updateProfile);
    const hall = useGame((s) => s.hall);
    const daily = useGame((s) => s.daily);
    const records = useGame((s) => s.records);
    const view = useMedalView();
    const glass = useCardShowcase().insts;
    const news = useNews();
    const [tab, setTab] = useState<Tab>(() => initialTab('trophies'));
    const [allHall, setAllHall] = useState(false);

    const cups = cupCounts(hall);
    const days = dailyCounts(daily);
    const weeks = fullWeeks(daily);
    const duelWins = duelWinsOf(records, view.duels);
    const medals = useMemo(() => medalProgress(view), [view]);
    const platinum = platinumDone(PLATINUM[0], view);
    const lvl = roomLevel(Math.max(records.titles, hall.length));
    const cap = hall[0] && (hall[0].squad.find((p) => p.captain) ?? hall[0].squad[0]);
    // o quarto se redesenha a cada render (240x160 pixels: custa nada)
    const room = {
        level: lvl.level,
        club: clubColorHex(profile.clubColor),
        cups,
        days,
        weeks,
        duelWins,
        medals,
        platinum,
        glass: glass.map((p) => metalOf(viewInstance(p).overall)),
        tv: cap ? { speciesId: cap.speciesId, shiny: cap.shiny } : null,
    };

    /** Móvel tocado: abre a aba e desliza até a seção (o que mora em outra porta abre lá). */
    const pick = (to: RoomTarget) => {
        if (to === 'album') return openDoor('collection', 'album');
        if (to === 'clube') return openDoor('profile', 'clube');
        const next: Tab = to === 'medalhas' || to === 'numeros' ? to : 'trofeus';
        setTab(next);
        requestAnimationFrame(() =>
            document
                .getElementById(to.startsWith('tr-') ? to : `tr-tab-${next}`)
                ?.scrollIntoView({ block: 'start', behavior: reduceMotionOn() ? 'auto' : 'smooth' }),
        );
    };
    const metalName = (m: Metal) => t(`trophies.metal.${m}` as TKey);

    return (
        <div className="menu-screen pf tr" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title={t('trophies.title')} icon="liga" onBack={() => go('home')} />

            <RoomScene data={room} onPick={pick} />
            <p className="tr-level">
                <b>{t('trophies.levelLine', { n: lvl.n, name: t(`trophies.level.${lvl.level}` as TKey) })}</b>
                <small>{lvl.next ? t('trophies.nextLevel', { n: lvl.next }) : t('trophies.maxLevel')}</small>
            </p>

            <div
                className="pf-tabs bc-tabs"
                role="tablist"
                aria-label={t('trophies.title')}
                style={{ '--n': DOOR_TABS.trophies.length } as CSSProperties}
            >
                {DOOR_TABS.trophies.map((id) => (
                    <button
                        type="button"
                        role="tab"
                        key={id}
                        id={`tr-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls={`tr-panel-${id}`}
                        className={`pf-tab${tab === id ? ' active' : ''}`}
                        onClick={() => setTab(id)}
                    >
                        <HudIcon kind={TAB_ICON[id]} />
                        <span>{d.trophies.tabs[id]}</span>
                        <NewDot on={id === 'medalhas' && newsCount(news, 'medalhas') > 0} />
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`tr-panel-${tab}`} aria-labelledby={`tr-tab-${tab}`}>
                {tab === 'medalhas' && <MedalsTab save={updateProfile} />}
                {tab === 'numeros' && <NumbersTab onOpenDex={() => openDoor('collection', 'dex')} />}
                {tab === 'trofeus' && (
                    <div className="tr-sections">
                        <section id="tr-copa" className="panel pf-card">
                            <h2>{t('trophies.sections.copa')}</h2>
                            <ul className="tr-cards">
                                {METALS.map((m) => (
                                    <TrophyCard
                                        key={m}
                                        kind="taca"
                                        metal={m}
                                        n={cups[m]}
                                        name={t('trophies.cup', { metal: metalName(m) })}
                                        how={t(`trophies.cupHow.${m}` as TKey)}
                                    />
                                ))}
                            </ul>
                            {hall.length > 0 && (
                                <>
                                    <h3 className="bc-lbl">{t('trophies.hallTitle')}</h3>
                                    <HallList only={allHall ? undefined : hall.slice(0, 3).map((h) => h.id)} />
                                    {hall.length > 3 && (
                                        <button
                                            type="button"
                                            className="btn tr-go"
                                            onClick={() => setAllHall(!allHall)}
                                        >
                                            {allHall
                                                ? t('trophies.hallLess')
                                                : t('trophies.hallAll', { n: hall.length })}
                                        </button>
                                    )}
                                </>
                            )}
                        </section>

                        <section id="tr-dia" className="panel pf-card">
                            <h2>{t('trophies.sections.dia')}</h2>
                            <ul className="tr-cards">
                                {METALS.map((m) => (
                                    <TrophyCard
                                        key={m}
                                        kind="medalhao"
                                        metal={m}
                                        n={days[m]}
                                        name={t('trophies.daily', { metal: metalName(m) })}
                                        how={t(`trophies.dailyHow.${m}` as TKey)}
                                    />
                                ))}
                                <TrophyCard
                                    kind="taca"
                                    metal="prata"
                                    n={weeks}
                                    name={t('trophies.week')}
                                    how={t('trophies.weekHow')}
                                />
                            </ul>
                            <button type="button" className="btn tr-go" onClick={() => go('daily')}>
                                {t('trophies.go.daily')}
                            </button>
                        </section>

                        <section id="tr-duelo" className="panel pf-card">
                            <h2>
                                {t('trophies.sections.duelo')}{' '}
                                <span className="pf-count">{t('trophies.duelWins', { n: duelWins })}</span>
                            </h2>
                            <ul className="tr-cards">
                                {BELTS.map((b) => (
                                    <TrophyCard
                                        key={b.wins}
                                        kind="cinturao"
                                        metal={b.metal}
                                        n={duelWins >= b.wins ? 1 : 0}
                                        name={t('trophies.belt', { n: b.wins })}
                                        how={t('trophies.beltHow', { n: b.wins, have: duelWins })}
                                    />
                                ))}
                            </ul>
                            <button type="button" className="btn tr-go" onClick={() => go('duel')}>
                                {t('trophies.go.duel')}
                            </button>
                        </section>

                        <section id="tr-liga" className="panel pf-card">
                            <h2>{t('trophies.sections.liga')}</h2>
                            <ul className="tr-cards">
                                <TrophyCard
                                    kind="taca"
                                    metal="ouro"
                                    n={0}
                                    name={t('trophies.liga')}
                                    how={t('trophies.ligaHow')}
                                />
                            </ul>
                        </section>

                        <div id="tr-platina">
                            {PLATINUM.map((p) => (
                                <PlatinumBlock key={p.gen} p={p} view={view} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
