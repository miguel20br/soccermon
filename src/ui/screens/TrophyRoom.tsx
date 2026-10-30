import { lazy, type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import { ROOM_H, ROOM_SPOTS, ROOM_W, type RoomSpot } from '../../game/room-spots';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { medalProgress } from '../../store/medals';
import { PLATINUM, platinumDone, platinumItems } from '../../store/missions';
import { albumCount, clubColorHex } from '../../store/profile';
import {
    BELTS,
    cupCounts,
    cupMetal,
    dailyCounts,
    dailyMetal,
    fullWeeks,
    METALS,
    roomLevel,
} from '../../store/trophies';
import { backTarget } from '../back-nav';
import { HallList } from '../components/HallParade';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import { initialTab, openDoor } from '../doors';
import { playDoor } from '../kit/DoorWipe';
import { Sheet as KitSheet } from '../kit/Sheet';
import { useCardShowcase } from '../profile/Album';
import { bannerText, clubVars } from '../profile/club';
import { MedalsTab, useMedalView } from '../profile/Medals';
import { NumbersTab } from '../profile/NumbersTab';
import { markSeen, newsCount, useNews } from '../profile/news';
import { PlatinumBlock } from '../profile/TrainerTab';
import type { Metal } from '../rarity';
import { RoomDialog } from '../trophy/RoomDialog';
import '../profile/profile.css';
import '../trophy-room.css';

const RoomStage = lazy(() => import('../trophy/RoomStage').then((m) => ({ default: m.RoomStage })));

/** Os objetos do quarto na ordem das setas do cartão (de cima pra baixo, da esquerda pra direita). */
const ORDER = [
    'platina',
    'hall',
    'clube',
    'dia',
    'medalhas',
    'duelo',
    'copa-bronze',
    'copa-prata',
    'copa-ouro',
    'liga',
    'album',
    'livros',
    'numeros',
    'tv',
] as const;
type Obj = (typeof ORDER)[number];

/** Botões-legenda embaixo do quarto: cada um leva ao objeto (e acende quando o foco está nele). */
const LEGEND: { label: LabelKey; to: Obj; has: readonly Obj[] }[] = [
    { label: 'copa', to: 'copa-bronze', has: ['copa-bronze', 'copa-prata', 'copa-ouro'] },
    { label: 'liga', to: 'liga', has: ['liga'] },
    { label: 'dia', to: 'dia', has: ['dia'] },
    { label: 'duelo', to: 'duelo', has: ['duelo'] },
    { label: 'medalhas', to: 'medalhas', has: ['medalhas'] },
    { label: 'hall', to: 'hall', has: ['hall', 'tv'] },
    { label: 'platina', to: 'platina', has: ['platina'] },
    { label: 'numeros', to: 'numeros', has: ['numeros'] },
    { label: 'colecao', to: 'album', has: ['album', 'livros'] },
    { label: 'clube', to: 'clube', has: ['clube'] },
];
type LabelKey = 'copa' | 'liga' | 'dia' | 'duelo' | 'medalhas' | 'hall' | 'platina' | 'numeros' | 'colecao' | 'clube';
/** Nome curto de cada objeto (o que aparece ao segurar e ao passar o mouse). */
const LABEL_OF: Record<Obj, LabelKey> = {
    platina: 'platina',
    hall: 'hall',
    clube: 'clube',
    dia: 'dia',
    medalhas: 'medalhas',
    duelo: 'duelo',
    'copa-bronze': 'copa',
    'copa-prata': 'copa',
    'copa-ouro': 'copa',
    liga: 'liga',
    album: 'colecao',
    livros: 'colecao',
    numeros: 'numeros',
    tv: 'hall',
};
/** Ao segurar, um nome por grupo (as 3 taças: um "Copa" só). */
const HOLD_LABELS: Obj[] = [
    'platina',
    'hall',
    'clube',
    'copa-prata',
    'liga',
    'dia',
    'medalhas',
    'duelo',
    'tv',
    'numeros',
    'album',
    'livros',
];
const TUTORIAL: { focus: Obj | null; key: 'step1' | 'step2' | 'step3' }[] = [
    { focus: 'copa-prata', key: 'step1' },
    { focus: 'medalhas', key: 'step2' },
    { focus: null, key: 'step3' },
];
const TUT_KEY = 'tut:sala';
const pos = (id: RoomSpot) => {
    const r = ROOM_SPOTS[id];
    return { left: `${((r.x + r.w / 2) / ROOM_W) * 100}%`, top: `${(r.y / ROOM_H) * 100}%` };
};
type Sheet = 'lista' | 'medalhas' | 'numeros' | 'hall';

/** Um troféu da lista: o desenho (silhueta se falta), o nome, quantos e como ganhar. */
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

/** Painel por cima da sala (medalhas, números, Hall da Fama, a lista de tudo). */
function SheetPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <KitSheet open onClose={onClose} title={title} className="tr-sheet-panel">
            {children}
        </KitSheet>
    );
}

interface Card {
    title: string;
    badge?: string;
    metal?: Metal;
    lines: string[];
    action?: { label: string; run: () => void };
}

/**
 * Sala de troféus = o que eu ganhei (docs/planos/sala-brainstorm.md): o quarto em pixel art com luz é o menu. Tocar num
 * objeto: o resto escurece, a câmera chega perto e o cartão diz o que é, quantos, como ganhar e o histórico (setas
 * passam pro próximo). O que precisa de espaço (medalhas, números, Hall da Fama, a lista de tudo) abre num painel.
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
    // tutorial na primeira vez (fica no save; o "Como funciona" mostra de novo)
    const firstVisit = !profile.seen?.includes(TUT_KEY);
    const [focus, setFocus] = useState<Obj | null>(firstVisit ? TUTORIAL[0].focus : null);
    const [hover, setHover] = useState<Obj | null>(null);
    const [hold, setHold] = useState(false);
    const news = useNews();
    const [tut, setTut] = useState<number | null>(firstVisit ? 0 : null);
    const tutNext = () => {
        const n = (tut ?? 0) + 1;
        if (n >= TUTORIAL.length) {
            setTut(null);
            setFocus(null);
            markSeen([TUT_KEY], true);
        } else {
            setTut(n);
            setFocus(TUTORIAL[n].focus);
        }
    };
    // ?aba=medalhas|numeros (links antigos e prints) abre o painel direto
    const [sheet, setSheet] = useState<Sheet | null>(() => {
        const tab = initialTab('trophies');
        return tab === 'trofeus' ? null : tab;
    });

    const cups = cupCounts(hall);
    const days = dailyCounts(daily);
    const weeks = fullWeeks(daily);
    const duelWins = duelWinsOf(records, view.duels);
    const medals = useMemo(() => medalProgress(view), [view]);
    const platinum = platinumDone(PLATINUM[0], view);
    const titles = Math.max(records.titles, hall.length);
    const lvl = roomLevel(titles);
    const capOf = (h: (typeof hall)[number]) => h.squad.find((p) => p.captain) ?? h.squad[0];
    const metalName = (m: Metal) => t(`trophies.metal.${m}` as TKey);
    const date = (ms: number) => new Date(ms).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US');
    const titleLine = (h: (typeof hall)[number]) =>
        t('trophies.card.titleLine', {
            date: date(h.date),
            club: h.club,
            a: h.scores.at(-1)?.[0] ?? 0,
            b: h.scores.at(-1)?.[1] ?? 0,
        });
    const fmtList = (items: string[]) =>
        new Intl.ListFormat(lang === 'pt' ? 'pt-BR' : 'en', { type: 'conjunction' }).format(items);
    const night = (() => {
        const h = new Date().getHours();
        return h >= 18 || h < 6;
    })();
    const avatar = profile.avatar;
    const sceneKey = JSON.stringify([
        cups,
        days,
        weeks,
        duelWins,
        platinum,
        medals.map((m) => m.tier),
        hall.length,
        glass.length,
        profile.clubColor,
        avatar,
        night,
    ]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: o quarto só muda quando o que ele mostra muda (sceneKey)
    const scene = useMemo(
        () => ({
            night,
            club: `#${clubColorHex(profile.clubColor).toString(16).padStart(6, '0')}`,
            cups,
            days,
            weeks,
            belts: BELTS.map((b) => duelWins >= b.wins),
            platinum,
            pins: medals.map((m) => m.tier),
            polaroids: hall
                .slice(0, 4)
                .map((h) => ({ speciesId: capOf(h)?.speciesId ?? 25, shiny: !!capOf(h)?.shiny })),
            cards: glass.length,
            tv: hall[0] ? { speciesId: capOf(hall[0])?.speciesId ?? 25, shiny: !!capOf(hall[0])?.shiny } : null,
            fresh: [
                ...(newsCount(news, 'medalhas') > 0 ? ['medalhas'] : []),
                ...(newsCount(news, 'album') > 0 ? ['album', 'livros'] : []),
            ],
            mon:
                avatar.kind === 'pokemon'
                    ? { speciesId: avatar.speciesId, shiny: avatar.shiny === true }
                    : { speciesId: 25, shiny: false },
        }),
        [sceneKey],
    );

    /** O cartão do objeto: nome, selo (quantos), linhas (como ganhar, histórico) e o botão pra onde ele mora. */
    const info = (o: Obj): Card => {
        const last = hall[0];
        switch (o) {
            case 'copa-bronze':
            case 'copa-prata':
            case 'copa-ouro': {
                const m = o.slice(5) as Metal;
                const mine = hall.filter((h) => cupMetal(h) === m);
                return {
                    title: t('trophies.cup', { metal: metalName(m) }),
                    metal: m,
                    badge: mine.length ? t('trophies.times', { n: mine.length }) : t('trophies.card.none'),
                    lines: [t(`trophies.cupHow.${m}` as TKey), ...mine.slice(0, 3).map(titleLine)],
                    action: mine.length ? { label: t('trophies.act.hall'), run: () => setSheet('hall') } : undefined,
                };
            }
            case 'liga':
                return { title: t('trophies.liga'), badge: t('trophies.card.soon'), lines: [t('trophies.ligaHow')] };
            case 'dia': {
                const got = daily.filter((e) => dailyMetal(e)).slice(0, 3);
                const any = METALS.some((m) => days[m]);
                return {
                    title: t('trophies.sections.dia'),
                    lines: [
                        any
                            ? t('trophies.say.daily', {
                                  list: fmtList(
                                      METALS.filter((m) => days[m]).map((m) =>
                                          t('trophies.say.metalN', { n: days[m], metal: metalName(m) }),
                                      ),
                                  ),
                                  w: weeks,
                              })
                            : t('trophies.say.dailyNone'),
                        ...got.map(
                            (e) =>
                                `${e.day.split('-').reverse().join('/')} · ${t('trophies.daily', { metal: metalName(dailyMetal(e) as Metal) })}`,
                        ),
                    ],
                    action: { label: t('trophies.act.daily'), run: () => go('daily') },
                };
            }
            case 'duelo': {
                const next = BELTS.find((b) => duelWins < b.wins);
                return {
                    title: t('trophies.sections.duelo'),
                    badge: t('trophies.duelWins', { n: duelWins }),
                    lines: [
                        next
                            ? t('trophies.say.duel', { n: duelWins, next: next.wins })
                            : t('trophies.say.duelMax', { n: duelWins }),
                        ...BELTS.map(
                            (b) =>
                                `${t('trophies.belt', { n: b.wins })}: ${duelWins >= b.wins ? t('trophies.card.got') : `${duelWins}/${b.wins}`}`,
                        ),
                    ],
                    action: { label: t('trophies.act.duel'), run: () => go('duel') },
                };
            }
            case 'medalhas':
                return {
                    title: t('trophies.spots.medals'),
                    badge: `${medals.filter((m) => m.tier > 0).length}/${medals.length}`,
                    lines: [t('trophies.card.medalsLine')],
                    action: { label: t('trophies.act.medals'), run: () => setSheet('medalhas') },
                };
            case 'numeros':
                return {
                    title: t('trophies.spots.pc'),
                    lines: [t('trophies.say.pc', { m: career.matches, w: career.wins, g: career.goalsFor })],
                    action: { label: t('trophies.act.numbers'), run: () => setSheet('numeros') },
                };
            case 'hall':
            case 'tv':
                return {
                    title: t('trophies.hallTitle'),
                    badge: hall.length ? t('trophies.times', { n: hall.length }) : undefined,
                    lines: last ? hall.slice(0, 3).map(titleLine) : [t('trophies.say.tvNone')],
                    action: last ? { label: t('trophies.act.hall'), run: () => setSheet('hall') } : undefined,
                };
            case 'platina': {
                const items = platinumItems(PLATINUM[0], view);
                const k = items.filter((i) => i.n >= i.goal).length;
                return {
                    title: t('trophies.spots.diploma'),
                    badge: `${k}/${items.length}`,
                    lines: [
                        platinum
                            ? t('trophies.say.diplomaDone')
                            : t('trophies.say.diploma', { k, total: items.length }),
                    ],
                    action: platinum ? undefined : { label: t('trophies.act.platina'), run: () => setSheet('lista') },
                };
            }
            case 'album':
                return {
                    title: t('trophies.spots.glass'),
                    badge: `${glass.length}/3`,
                    lines: [t('trophies.say.glass', { n: glass.length })],
                    action: { label: t('trophies.act.album'), run: () => openDoor('collection', 'album') },
                };
            case 'livros': {
                const a = albumCount(view.dex);
                return {
                    title: t('trophies.spots.books'),
                    badge: `${a.got}/${a.total}`,
                    lines: [t('trophies.say.books', { got: a.got, total: a.total })],
                    action: { label: t('trophies.act.album'), run: () => openDoor('collection', 'album') },
                };
            }
            case 'clube':
                return {
                    title: t('trophies.spots.flag'),
                    lines: [
                        t('trophies.say.flag', {
                            banner: bannerText(profile.banner, profile.clubName || 'Pallet FC'),
                        }),
                    ],
                    action: { label: t('trophies.act.club'), run: () => openDoor('profile', 'clube') },
                };
        }
    };
    const card = focus && info(focus);
    const step = (k: number) => {
        if (!focus) return;
        const i = ORDER.indexOf(focus);
        setFocus(ORDER[(i + k + ORDER.length) % ORDER.length]);
    };
    // setas do teclado passam de objeto, Esc volta pro quarto inteiro
    useEffect(() => {
        if (!focus || sheet) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') step(1);
            else if (e.key === 'ArrowLeft') step(-1);
            else if (e.key === 'Escape') setFocus(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <div className="menu-screen pf tr" style={clubVars(clubColorHex(profile.clubColor))}>
            <MenuHead
                title={t('trophies.title')}
                hud="cup"
                onBack={() => (backTarget('trophies') === 'home' ? playDoor(() => go('home')) : go('profile'))}
            />

            <div className="room-wrap">
                <Suspense fallback={<div className="room-stage" />}>
                    <RoomStage
                        data={scene}
                        focus={focus}
                        onPick={(id) => {
                            if (tut !== null) return;
                            setFocus((cur) => (cur === id ? null : (id as Obj)));
                        }}
                        onHover={(id) => setHover(id as Obj | null)}
                        onHold={setHold}
                    />
                </Suspense>
                {/* nomes: de tudo ao segurar, do que está debaixo do mouse ao passar */}
                {!focus && (hold || hover) && (
                    <div className="room-labels" aria-hidden>
                        {(hold ? HOLD_LABELS : hover ? [hover] : []).map((id) => (
                            <span key={id} className="room-label" style={pos(id)}>
                                {d.trophies.labels[LABEL_OF[id]]}
                            </span>
                        ))}
                    </div>
                )}
                {tut !== null && (
                    <RoomDialog
                        key={tut}
                        text={t(`trophies.tut.${TUTORIAL[tut].key}`)}
                        action={{
                            label: tut < TUTORIAL.length - 1 ? t('trophies.tut.next') : t('trophies.tut.done'),
                            run: tutNext,
                        }}
                        onClose={tutNext}
                    />
                )}
                {card && tut === null && (
                    <aside className="room-card" data-exit aria-live="polite">
                        <button
                            type="button"
                            className="room-card-x"
                            onClick={() => setFocus(null)}
                            aria-label={t('common.ui.close')}
                        >
                            <HudIcon kind="close" />
                        </button>
                        {card.badge && (
                            <span className={`room-badge${card.metal ? ` m-${card.metal}` : ''}`}>{card.badge}</span>
                        )}
                        <b>{card.title}</b>
                        {card.lines.map((l) => (
                            <small key={l}>{l}</small>
                        ))}
                        <div className="room-card-row">
                            <button
                                type="button"
                                className="btn small"
                                onClick={() => step(-1)}
                                aria-label={t('trophies.card.prev')}
                            >
                                <HudIcon kind="prev" />
                            </button>
                            {card.action && (
                                <button type="button" className="btn small confirm" onClick={card.action.run}>
                                    {card.action.label}
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn small"
                                onClick={() => step(1)}
                                aria-label={t('trophies.card.next')}
                            >
                                <HudIcon kind="next" />
                            </button>
                        </div>
                    </aside>
                )}
            </div>

            <nav className="room-legend" aria-label={t('trophies.legendAria')}>
                {LEGEND.map((l) => {
                    const on = !!focus && l.has.includes(focus);
                    return (
                        <button
                            key={l.label}
                            type="button"
                            className={`room-chip${on ? ' on' : ''}`}
                            aria-pressed={on}
                            onClick={() => setFocus(on ? null : l.to)}
                            disabled={tut !== null}
                        >
                            {d.trophies.labels[l.label]}
                        </button>
                    );
                })}
            </nav>

            <div className="tr-summary">
                <span>
                    <b>{t('trophies.levelLine', { n: lvl.n, name: t(`trophies.level.${lvl.level}` as TKey) })}</b>
                    <small>{lvl.next ? t('trophies.nextLevel', { n: lvl.next }) : t('trophies.maxLevel')}</small>
                    {lvl.next && (
                        <span className="k-bar tr-level-bar" aria-hidden>
                            <i style={{ width: `${(titles / lvl.next) * 100}%` }} />
                            <b>
                                {titles}/{lvl.next}
                            </b>
                        </span>
                    )}
                </span>
                <span className="tr-summary-btns">
                    <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                            setTut(0);
                            setFocus(TUTORIAL[0].focus);
                        }}
                        title={t('trophies.tut.again')}
                    >
                        {t('trophies.tut.how')}
                    </button>
                    <button type="button" className="btn small" onClick={() => setSheet('lista')}>
                        {t('trophies.card.list')}
                    </button>
                </span>
            </div>

            {sheet === 'medalhas' && (
                <SheetPanel title={d.trophies.tabs.medalhas} onClose={() => setSheet(null)}>
                    <MedalsTab save={updateProfile} />
                </SheetPanel>
            )}
            {sheet === 'numeros' && (
                <SheetPanel title={d.trophies.tabs.numeros} onClose={() => setSheet(null)}>
                    <NumbersTab onOpenDex={() => openDoor('collection', 'dex')} />
                </SheetPanel>
            )}
            {sheet === 'hall' && (
                <SheetPanel title={t('trophies.hallTitle')} onClose={() => setSheet(null)}>
                    <HallList />
                </SheetPanel>
            )}
            {sheet === 'lista' && (
                <SheetPanel title={t('trophies.card.list')} onClose={() => setSheet(null)}>
                    <div className="tr-sections">
                        <section className="pf-card">
                            <h3 className="bc-lbl">{t('trophies.sections.copa')}</h3>
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
                        </section>
                        <section className="pf-card">
                            <h3 className="bc-lbl">{t('trophies.sections.dia')}</h3>
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
                        </section>
                        <section className="pf-card">
                            <h3 className="bc-lbl">{t('trophies.sections.duelo')}</h3>
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
                        </section>
                        {PLATINUM.map((p) => (
                            <PlatinumBlock key={p.gen} p={p} view={view} />
                        ))}
                    </div>
                </SheetPanel>
            )}
        </div>
    );
}
