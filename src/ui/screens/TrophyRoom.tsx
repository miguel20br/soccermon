import { type CSSProperties, useMemo, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { medalProgress } from '../../store/medals';
import { PLATINUM, platinumDone, platinumItems } from '../../store/missions';
import { albumCount, clubColorHex } from '../../store/profile';
import { BELTS, cupCounts, dailyCounts, fullWeeks, METALS, type MetalCount, roomLevel } from '../../store/trophies';
import { HallList } from '../components/HallParade';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import { DOOR_TABS, type DoorTab, initialTab, openDoor } from '../doors';
import { useCardShowcase } from '../profile/Album';
import { bannerText, clubVars } from '../profile/club';
import { MedalsTab, useMedalView } from '../profile/Medals';
import { NumbersTab } from '../profile/NumbersTab';
import { NewDot, newsCount, useNews } from '../profile/news';
import { PlatinumBlock } from '../profile/TrainerTab';
import { type Metal, metalOf } from '../rarity';
import { reduceMotionOn } from '../settings-sync';
import { RoomDialog } from '../trophy/RoomDialog';
import { RoomScene, type RoomTarget, type Spot } from '../trophy/RoomScene';
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
    const { t, d, lang } = useT();
    const go = useGame((s) => s.go);
    const career = useGame((s) => s.career);
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

    const metalName = (m: Metal) => t(`trophies.metal.${m}` as TKey);
    /** Só quando a pessoa pede (o botão da caixa): abre a aba e desliza até a seção, ou a outra porta. */
    const goTo = (to: RoomTarget) => {
        setSay(null);
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
    const [say, setSay] = useState<{ spot: Spot; target: RoomTarget } | null>(null);
    const list = (n: MetalCount) =>
        new Intl.ListFormat(lang === 'pt' ? 'pt-BR' : 'en', { type: 'conjunction' }).format(
            METALS.filter((m) => n[m]).map((m) => t('trophies.say.metalN', { n: n[m], metal: metalName(m) })),
        );
    /** O que a caixa diz de cada móvel, e pra onde o botão leva. */
    const talk = (spot: Spot): { text: string; action?: { label: string; to: RoomTarget } } => {
        const sum = (n: MetalCount) => n.bronze + n.prata + n.ouro;
        const last = hall[0];
        switch (spot) {
            case 'cups':
                return sum(cups)
                    ? {
                          text: t('trophies.say.cups', { list: list(cups) }),
                          action: { label: t('trophies.act.hall'), to: 'tr-copa' },
                      }
                    : { text: t('trophies.say.cupsNone') };
            case 'daily':
                return {
                    text: sum(days)
                        ? t('trophies.say.daily', { list: list(days), w: weeks })
                        : t('trophies.say.dailyNone'),
                    action: { label: t('trophies.act.daily'), to: 'tr-dia' },
                };
            case 'duel': {
                const next = BELTS.find((b) => duelWins < b.wins);
                return {
                    text: next
                        ? t('trophies.say.duel', { n: duelWins, next: next.wins })
                        : t('trophies.say.duelMax', { n: duelWins }),
                    action: { label: t('trophies.act.duel'), to: 'tr-duelo' },
                };
            }
            case 'liga':
                return { text: t('trophies.ligaHow') };
            case 'diploma': {
                const items = platinumItems(PLATINUM[0], view);
                return platinum
                    ? { text: t('trophies.say.diplomaDone') }
                    : {
                          text: t('trophies.say.diploma', {
                              k: items.filter((i) => i.n >= i.goal).length,
                              total: items.length,
                          }),
                          action: { label: t('trophies.act.platina'), to: 'tr-platina' },
                      };
            }
            case 'medals':
                return {
                    text: t('trophies.say.medals', {
                        n: medals.filter((m) => m.tier > 0).length,
                        total: medals.length,
                    }),
                    action: { label: t('trophies.act.medals'), to: 'medalhas' },
                };
            case 'pc':
                return {
                    text: t('trophies.say.pc', { m: career.matches, w: career.wins, g: career.goalsFor }),
                    action: { label: t('trophies.act.numbers'), to: 'numeros' },
                };
            case 'tv': {
                const fin = last?.scores.at(-1);
                return last && fin
                    ? {
                          text: t('trophies.say.tv', { club: last.club, a: fin[0], b: fin[1] }),
                          action: { label: t('trophies.act.hall'), to: 'tr-copa' },
                      }
                    : { text: t('trophies.say.tvNone') };
            }
            case 'books': {
                const a = albumCount(view.dex);
                return {
                    text: t('trophies.say.books', { got: a.got, total: a.total }),
                    action: { label: t('trophies.act.album'), to: 'album' },
                };
            }
            case 'glass':
                return {
                    text: t('trophies.say.glass', { n: glass.length }),
                    action: { label: t('trophies.act.album'), to: 'album' },
                };
            case 'flag':
                return {
                    text: t('trophies.say.flag', {
                        banner: bannerText(profile.banner, profile.clubName || 'Pallet FC'),
                    }),
                    action: { label: t('trophies.act.club'), to: 'clube' },
                };
        }
    };
    const said = say && talk(say.spot);

    return (
        <div className="menu-screen pf tr" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead title={t('trophies.title')} icon="liga" onBack={() => go('home')} />

            <RoomScene data={room} onPick={(target, spot) => setSay({ target, spot })}>
                {said && (
                    <RoomDialog
                        key={say.spot}
                        text={said.text}
                        action={said.action && { label: said.action.label, run: () => goTo(said.action!.to) }}
                        onClose={() => setSay(null)}
                    />
                )}
            </RoomScene>
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
