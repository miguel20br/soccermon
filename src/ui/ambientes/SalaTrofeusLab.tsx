import { type CSSProperties, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { type MedalProgress, medalProgress } from '../../store/medals';
import { KANTO_BADGES } from '../../store/missions';
import { BELTS, cupCounts, dailyCounts, fullWeeks, METALS, type MetalCount, roomLevel } from '../../store/trophies';
import { BadgeCase, KantoBadge } from '../components/BadgeCase';
import { HallList } from '../components/HallParade';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { PixelTrophy } from '../components/PixelTrophy';
import { TopActions } from '../components/TopActions';
import { Crest, KitShirt } from '../profile/Crest';
import { hexCss, missionText } from '../profile/club';
import { MEDAL_GLYPH, MedalDisc, MedalsTab, useMedalView } from '../profile/Medals';
import { useSaveView } from '../profile/TrainerTab';
import type { Metal } from '../rarity';
import { uiZoom } from '../ui-zoom';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { closestMissions } from './metas';
import { TABS } from './nav';
import { BIG, floorZone, Mi, ROOM, SMALL, Tile } from './Room';
import { TopBar } from './TopBar';
import { Bubble, useMq, useWild, WildZone } from './WildZone';
import { clubWild, dirOf, rollWild, type Wild } from './wild';
import './ambientes.css';
import '../profile/profile.css';
import './sala-trofeus-lab.css';

/**
 * Laboratório (só dev e prévias): 3 conceitos pra juntar a Sede com a Sala de troféus, `?lab=sala-trofeus&v=a|b|c`.
 * `&novo=1` mostra o jogador sem nada; `&lento=1` deixa o zoom do toque 8x mais lento (print do meio da animação).
 * Descartável: nada daqui vai pro ar sem o ok do Miguel.
 */
type Piece = 'copa' | 'dia' | 'insignias' | 'medalhas' | 'duelo';
const zero = (): MetalCount => ({ bronze: 0, prata: 0, ouro: 0 });

/** O que a sala mostra, tirado do save (ou vazio, no `&novo=1`). */
function useRecords(novo: boolean) {
    const hall = useGame((s) => s.hall);
    const daily = useGame((s) => s.daily);
    const records = useGame((s) => s.records);
    const done = useGame((s) => s.profile.missionsDone);
    const view = useMedalView();
    return useMemo(() => {
        const medals = medalProgress(view);
        if (novo)
            return {
                hall: [] as typeof hall,
                cups: zero(),
                days: zero(),
                weeks: 0,
                duelWins: 0,
                badges: [] as string[],
                medals: medals.map((m): MedalProgress => ({ ...m, value: 0, tier: 0 })),
                titles: 0,
            };
        return {
            hall,
            cups: cupCounts(hall),
            days: dailyCounts(daily),
            weeks: fullWeeks(daily),
            duelWins: duelWinsOf(records, view.duels),
            badges: KANTO_BADGES.filter((id) => done.includes(id)),
            medals,
            titles: Math.max(records.titles, hall.length),
        };
    }, [novo, hall, daily, records, done, view]);
}
type Rec = ReturnType<typeof useRecords>;

/** A casca da Home (barra de cima, um painel, a barra de abas com a Sede acesa), sem o arrasto. */
function Shell({ ms, children }: { ms: number; children: ReactNode }) {
    const { d } = useT();
    const ICON: Record<(typeof TABS)[number], HudIconKind> = {
        lab: 'flask',
        rota: 'map',
        estadio: 'stadium',
        arena: 'friends',
        sede: 'building',
    };
    return (
        <div className="amb" style={{ '--pos': 0, '--n': TABS.length, '--sx-ms': `${ms}ms` } as CSSProperties}>
            <div className="amb-top k-topbar">
                <TopBar />
                <TopActions help={() => {}} profile={false} />
            </div>
            <div className="amb-stage">
                <section className="amb-panel amb-sede on" style={{ '--i': 0 } as CSSProperties}>
                    {children}
                </section>
            </div>
            <nav className="amb-bar">
                <div className="amb-tabs">
                    <i className="amb-ind" aria-hidden style={{ '--pos': TABS.indexOf('sede') } as CSSProperties} />
                    {TABS.map((id) => (
                        <button key={id} type="button" className={`amb-tab amb-tab-${id}${id === 'sede' ? ' on' : ''}`}>
                            <span className="amb-tab-ic">
                                <HudIcon kind={ICON[id]} />
                            </span>
                            <span className="amb-tab-lbl">{d.home.amb.tabs[id]}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}

/** Peça tocável da cena, em pixels de arte (como o `Mi`): o pé na linha `y + h`. */
function Spot({
    id,
    x,
    y,
    w,
    h,
    on,
    label,
    pick,
    z,
    className = '',
    children,
}: {
    id: Piece;
    x: number;
    y: number;
    w: number;
    h: number;
    on?: Piece | null;
    label: string;
    pick: (id: Piece, el: HTMLElement) => void;
    /** Camada (padrão: pela linha do pé). */
    z?: number;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            className={`sx-spot ${className}${on === id ? ' on' : ''}`}
            style={{ '--x': x, '--y': y, '--w': w, '--h': h, zIndex: z ?? y + h } as CSSProperties}
            aria-label={label}
            onClick={(e) => pick(id, e.currentTarget)}
        >
            {children}
        </button>
    );
}

/** Um lugar da estante: o troféu (ou a silhueta num pedestal que chama) e a plaquinha com quantos. */
function Slot({
    kind,
    metal,
    n,
    next,
}: {
    kind: 'taca' | 'medalhao' | 'cinturao';
    metal: Metal;
    n: number;
    next?: boolean;
}) {
    return (
        <span className={`sx-slot sx-${kind}${n ? '' : ' empty'}${next ? ' next' : ''}`}>
            <PixelTrophy kind={kind} metal={metal} ghost={!n} />
            <b className="sx-plate">{n ? `×${n}` : ''}</b>
        </span>
    );
}

/** Cortiça com as medalhas presas (vazio = furo de alfinete). */
function MedalBoard({ medals }: { medals: MedalProgress[] }) {
    return (
        <span className="sx-cork">
            {medals.map(({ medal, tier }) =>
                tier ? (
                    <MedalDisc key={medal.id} glyph={MEDAL_GLYPH[medal.id] ?? 'pokebola'} tier={tier} />
                ) : (
                    <i key={medal.id} className="sx-pin" />
                ),
            )}
        </span>
    );
}

/** O estojo das 8 insígnias pendurado na parede. */
function BadgeFrame({ got }: { got: string[] }) {
    return (
        <span className="sx-badges">
            {KANTO_BADGES.map((id) => (
                <KantoBadge key={id} leader={id} earned={got.includes(id)} />
            ))}
        </span>
    );
}

/** O conteúdo do Hall de cada peça (o que hoje é a Sala de troféus), num painel por cima da sala. */
function Detail({ piece, rec, closing, onClose }: { piece: Piece; rec: Rec; closing: boolean; onClose: () => void }) {
    const { t, d } = useT();
    const updateProfile = useGame((s) => s.updateProfile);
    const metal = (m: Metal) => t(`trophies.metal.${m}` as TKey);
    const title: Record<Piece, string> = {
        copa: t('trophies.cardTrophies'),
        dia: t('trophies.sections.dia'),
        duelo: t('trophies.sections.duelo'),
        insignias: t('profile.badges.title'),
        medalhas: d.trophies.tabs.medalhas,
    };
    const row = (kind: 'taca' | 'medalhao', n: MetalCount, name: string, how: string) => (
        <ul className="sx-row">
            {METALS.map((m) => (
                <li key={m} className={n[m] ? '' : 'ghost'}>
                    <PixelTrophy kind={kind} metal={m} ghost={!n[m]} />
                    <b>{t(name as TKey, { metal: metal(m) })}</b>
                    <small>{n[m] ? t('trophies.times', { n: n[m] }) : t(`${how}.${m}` as TKey)}</small>
                </li>
            ))}
        </ul>
    );
    return (
        <aside className={`sx-detail panel${closing ? ' out' : ''}`} aria-label={title[piece]}>
            <header>
                <h2>{title[piece]}</h2>
                <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.ui.close')}>
                    <HudIcon kind="close" />
                </button>
            </header>
            <div className="sx-detail-body">
                {piece === 'copa' && (
                    <>
                        {row('taca', rec.cups, 'trophies.cup', 'trophies.cupHow')}
                        <h3 className="bc-lbl">{t('trophies.hallTitle')}</h3>
                        <HallList only={rec.hall.map((h) => h.id)} />
                    </>
                )}
                {piece === 'dia' && row('medalhao', rec.days, 'trophies.daily', 'trophies.dailyHow')}
                {piece === 'duelo' && (
                    <ul className="sx-row">
                        {BELTS.map((b) => (
                            <li key={b.wins} className={rec.duelWins >= b.wins ? '' : 'ghost'}>
                                <PixelTrophy kind="cinturao" metal={b.metal} ghost={rec.duelWins < b.wins} />
                                <b>{t('trophies.belt', { n: b.wins })}</b>
                                <small>{t('trophies.beltHow', { n: b.wins, have: rec.duelWins })}</small>
                            </li>
                        ))}
                    </ul>
                )}
                {piece === 'insignias' && <BadgeCase earned={rec.badges} />}
                {piece === 'medalhas' && <MedalsTab save={updateProfile} />}
            </div>
        </aside>
    );
}

/** Abre e fecha o painel do Hall com saída (nada teleporta). */
function useDetail(ms: number) {
    const [piece, setPiece] = useState<Piece | null>(null);
    const [closing, setClosing] = useState(false);
    const close = () => {
        setClosing(true);
        window.setTimeout(() => {
            setPiece(null);
            setClosing(false);
        }, ms);
    };
    return { piece, closing, open: setPiece, close };
}

/** O cabeçalho da Sede (placa com escudo, nome e títulos), igual ao do ar. */
function Head({ titles }: { titles: number }) {
    const { t, tn } = useT();
    const profile = useGame((s) => s.profile);
    const look = lookOfProfile(profile);
    const club = profile.clubName || 'Pallet FC';
    return (
        <header className="rm-head">
            <h2>
                <Crest look={look} className="crest sd-head-crest" />
                <span className="rm-full">{t('home.amb.sedeOf', { club })}</span>
                <span className="rm-short">{club}</span>
            </h2>
            <span className="rt-badges" title={tn('home.amb.sedeTitles', titles)}>
                <PixelTrophy kind="taca" metal="ouro" ghost={!titles} className="rm-belt" />
                {titles}
            </span>
        </header>
    );
}

/** Nível da sala como plaquinha com barra (o que hoje fica embaixo da Sala de troféus). */
function LevelPlate({ titles, hint }: { titles: number; hint?: string }) {
    const { t } = useT();
    const lvl = roomLevel(titles);
    return (
        <div className="sx-level">
            <span>
                <b>{t('trophies.levelLine', { n: lvl.n, name: t(`trophies.level.${lvl.level}` as TKey) })}</b>
                {hint && <small>{hint}</small>}
            </span>
            {lvl.next && (
                <span className="k-bar" aria-hidden>
                    <i style={{ width: `${(titles / lvl.next) * 100}%` }} />
                    <b>
                        {titles}/{lvl.next}
                    </b>
                </span>
            )}
        </div>
    );
}

function Tiles() {
    const { d } = useT();
    return (
        <div className="amb-tiles three">
            <Tile icon="person" title={d.profile.tabs.treinador} />
            <Tile icon="armband" title={d.profile.tabs.clube} />
            <Tile icon="friends" title={d.profile.tabs.amigos} />
        </div>
    );
}

function MissionBoard() {
    const { t } = useT();
    const view = useSaveView();
    const goal = useMemo(() => closestMissions(view, 1)[0], [view]);
    if (!goal) return null;
    return (
        <button type="button" className="sd-board" aria-label={t('home.amb.sedeBoard')}>
            <span>{missionText(goal.m)}</span>
            <small>
                {goal.n}/{goal.goal}
            </small>
            <span className="sd-bar" aria-hidden>
                <i style={{ width: `${(goal.n / goal.goal) * 100}%` }} />
            </span>
        </button>
    );
}

/** Quem anda na sala: o clube (mais usados) ou, sem partida, o sorteio da Sede. */
function useClubList(novo: boolean): Wild[] {
    const dex = useGame((s) => s.dex);
    const [rolled] = useState(() => rollWild('sede', () => false));
    return useMemo(() => {
        const club = novo ? [] : clubWild(dex);
        return club.length ? club : rolled;
    }, [novo, dex, rolled]);
}

/* ============================================================================ A: uma sala, troféu é móvel */

function ConceptA({ rec, novo, ms }: { rec: Rec; novo: boolean; ms: number }) {
    const { t, d } = useT();
    const clock = useSceneClock(true);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const list = useClubList(novo);
    const w = useWild(clock, list.slice(0, small ? 3 : big ? 5 : 4), floorZone(small ? 1 : big ? 3 : 2), undefined, {
        ...ROOM,
        feet: '.mi, .sx-feet',
    });
    const look = lookOfProfile(useGame((s) => s.profile));
    const vars = { '--club': hexCss(look.color), '--club2': hexCss(look.color2) } as CSSProperties;
    const det = useDetail(ms);
    const room = useRef<HTMLDivElement>(null);
    const [cam, setCam] = useState<CSSProperties>({});
    const pick = (id: Piece, el: HTMLElement) => {
        const layer = room.current;
        if (!layer) return;
        // a câmera chega perto da peça: o centro dela vai pro alto da tela (celular) ou pra esquerda (PC, painel à
        // direita); px da tela / zoom da raiz = px do CSS
        const z = uiZoom();
        const r = el.getBoundingClientRect();
        const l = layer.getBoundingClientRect();
        const cx = (r.left + r.width / 2 - l.left) / z;
        const cy = (r.top + r.height / 2 - l.top) / z;
        const lw = l.width / z;
        const lh = l.height / z;
        const wide = lw >= 900;
        const s = wide ? 1.7 : 2.3;
        const tx = (wide ? lw * 0.3 : lw / 2) - cx;
        const ty = (wide ? lh * 0.5 : lh * 0.27) - cy;
        setCam({ transformOrigin: `${cx}px ${cy}px`, transform: `translate(${tx}px, ${ty}px) scale(${s})` });
        det.open(id);
    };
    const close = () => {
        setCam({});
        det.close();
    };
    const firstCup = METALS.find((m) => !rec.cups[m]);
    const firstDay = METALS.find((m) => !rec.days[m]);
    const firstBelt = BELTS.find((b) => rec.duelWins < b.wins);
    const zoomed = det.piece && !det.closing;

    return (
        <ClockCtx.Provider value={clock}>
            <div className={`amb-scene rm-scene sd-scene sx-a${zoomed ? ' sx-zoomed' : ''}`} style={vars}>
                <div ref={room} className="amb-layer rm-room sx-cam" style={cam}>
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    <div className="rm-set">
                        <ol className="sd-flags">
                            {Array.from({ length: 12 }, (_, i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: enfeite fixo
                                <li key={i} />
                            ))}
                        </ol>
                        <i className="sd-rug" />
                        <span className="sd-frame">
                            <KitShirt look={look} className="sd-shirt" />
                        </span>
                        <Mi k="plant" x={-72} bottom={76} />
                        <Mi k="lamp" x={-38} bottom={74} />
                        {/* estante de pé: taças em cima, medalhões da Copa do Dia embaixo */}
                        <Spot
                            id="copa"
                            x={1}
                            y={2}
                            w={58}
                            h={74}
                            on={det.piece}
                            label={t('trophies.spots.cups')}
                            pick={pick}
                            className="sx-shelf sx-feet"
                        >
                            <span className="sx-tier">
                                {METALS.map((m) => (
                                    <Slot key={m} kind="taca" metal={m} n={rec.cups[m]} next={m === firstCup} />
                                ))}
                            </span>
                            <span className="sx-tier">
                                {METALS.map((m) => (
                                    <Slot key={m} kind="medalhao" metal={m} n={rec.days[m]} next={m === firstDay} />
                                ))}
                            </span>
                            {!rec.titles && <span className="sx-first">{t('home.amb.sedeFirst')}</span>}
                        </Spot>
                        {/* o pedaço da estante que leva pra Copa do Dia (a fileira de baixo) */}
                        <Spot
                            id="dia"
                            x={4}
                            y={40}
                            w={52}
                            h={30}
                            on={det.piece}
                            label={t('trophies.spots.daily')}
                            pick={pick}
                            z={80}
                            className="sx-hit"
                        >
                            {null}
                        </Spot>
                        <Crest look={look} className="sd-crest sx-crest" />
                        <Spot
                            id="insignias"
                            x={65}
                            y={38}
                            w={60}
                            h={26}
                            on={det.piece}
                            label={t('profile.badges.title')}
                            pick={pick}
                            className="sx-badgecase"
                        >
                            <BadgeFrame got={rec.badges} />
                        </Spot>
                        <Spot
                            id="medalhas"
                            x={131}
                            y={3}
                            w={58}
                            h={44}
                            on={det.piece}
                            label={t('trophies.spots.medals')}
                            pick={pick}
                            className="sx-board"
                        >
                            <MedalBoard medals={rec.medals} />
                        </Spot>
                        <Spot
                            id="duelo"
                            x={132}
                            y={51}
                            w={56}
                            h={26}
                            on={det.piece}
                            label={t('trophies.spots.duel')}
                            pick={pick}
                            className="sx-vitrine sx-feet"
                        >
                            {BELTS.map((b) => (
                                <Slot
                                    key={b.wins}
                                    kind="cinturao"
                                    metal={b.metal}
                                    n={rec.duelWins >= b.wins ? 1 : 0}
                                    next={b === firstBelt && !!rec.titles}
                                />
                            ))}
                        </Spot>
                        <Mi k="fireplace" x={200} bottom={78} />
                        <i className="sd-fire sx-fire" />
                        <Mi k="palm" x={272} bottom={80} />
                    </div>
                    <div className="rm-walk">
                        <WildZone wild={w} zone="floor" />
                    </div>
                </div>
            </div>
            <div className={`amb-ui rm-ui sd-ui sx-ui${zoomed ? ' sx-hide' : ''}`} style={vars}>
                <Head titles={rec.titles} />
                <div className="rm-actions">
                    {!novo && <MissionBoard />}
                    <LevelPlate titles={rec.titles} hint={d.trophies.card.hint} />
                    <Tiles />
                </div>
            </div>
            {det.piece && <Detail piece={det.piece} rec={rec} closing={det.closing} onClose={close} />}
        </ClockCtx.Provider>
    );
}

/* ============================================================================ B: dois andares (casa em corte) */

/** O passeio de quem sobe pra olhar a taça (pixels de arte da casa; `pose` = parado de costas, com coração). */
const TOUR: { x: number; y: number; ms: number; pose?: boolean }[] = [
    { x: 96, y: 176, ms: 2600 },
    { x: 184, y: 158, ms: 0 },
    { x: 156, y: 68, ms: 0 },
    { x: 36, y: 66, ms: 3200, pose: true },
    { x: 156, y: 68, ms: 0 },
    { x: 184, y: 158, ms: 0 },
];
/** Pixels de arte por segundo andando. */
const SPEED = 34;
const LEGS = TOUR.map((p, i) => {
    const q = TOUR[(i + 1) % TOUR.length];
    return { p, q, walk: (Math.hypot(q.x - p.x, q.y - p.y) / SPEED) * 1000 };
});
const PERIOD = LEGS.reduce((s, l) => s + l.p.ms + l.walk, 0);
function tourAt(t: number) {
    let k = t % PERIOD;
    for (const { p, q, walk } of LEGS) {
        if (k < p.ms)
            return {
                x: p.x,
                y: p.y,
                anim: p.pose ? ('Pose' as const) : ('Idle' as const),
                dir: p.pose ? 4 : 0,
                heart: !!p.pose,
            };
        k -= p.ms;
        if (k < walk) {
            const f = k / walk;
            return {
                x: p.x + (q.x - p.x) * f,
                y: p.y + (q.y - p.y) * f,
                anim: 'Walk' as const,
                dir: dirOf(q.x - p.x, q.y - p.y),
                heart: false,
            };
        }
        k -= walk;
    }
    return { x: TOUR[0].x, y: TOUR[0].y, anim: 'Idle' as const, dir: 0, heart: false };
}

/** O Pokémon que sobe a escada de vez em quando pra olhar a taça. */
function Visitor({ wild, scale }: { wild: Wild; scale: number }) {
    const clock = useContext(ClockCtx);
    const el = useRef<HTMLSpanElement>(null);
    const [pose, setPose] = useState(() => tourAt(0));
    useEffect(() => {
        if (!clock) return;
        let key = '';
        return clock.sub((t) => {
            const s = tourAt(t);
            const node = el.current;
            if (node) {
                node.style.setProperty('--x', String(s.x));
                node.style.setProperty('--y', String(s.y));
                // no mezanino passa atrás do guarda-corpo; embaixo, na frente de tudo
                node.style.zIndex = s.y < 80 ? '3' : '200';
            }
            const k = `${s.anim}${s.dir}${s.heart}`;
            if (k !== key) {
                key = k;
                setPose(s);
            }
        });
    }, [clock]);
    return (
        <span ref={el} className="sx-visitor" style={{ '--x': pose.x, '--y': pose.y } as CSSProperties}>
            <FieldSprite id={wild.id} shiny={wild.shiny} anim={pose.anim} dir={pose.dir} scale={scale}>
                {pose.heart && <Bubble kind="heart" />}
            </FieldSprite>
        </span>
    );
}

function ConceptB({ rec, novo, ms }: { rec: Rec; novo: boolean; ms: number }) {
    const { t } = useT();
    const clock = useSceneClock(true);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const all = useClubList(novo);
    const [visitor, ...rest] = all;
    const w = useWild(clock, rest.slice(0, small ? 2 : big ? 4 : 3), floorZone(small ? 1 : big ? 3 : 2), undefined, {
        feet: '.mi',
        props: '.sx-stairs-foot',
    });
    const look = lookOfProfile(useGame((s) => s.profile));
    const vars = { '--club': hexCss(look.color), '--club2': hexCss(look.color2) } as CSSProperties;
    const det = useDetail(ms);
    const pick = (id: Piece) => det.open(id);
    const firstCup = METALS.find((m) => !rec.cups[m]);
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene sx-b" style={vars}>
                {/* faixas de ponta a ponta: parede de cima (galeria), mezanino, viga, parede de baixo, chão */}
                <i className="sx-band sx-up-wall" />
                <i className="sx-band sx-mezz" />
                <i className="sx-band sx-beam" />
                <i className="sx-band sx-down-wall" />
                <i className="sx-band sx-down-floor" />
                <div className="sx-house">
                    {/* andar de cima: a galeria */}
                    <i className="sx-lights" />
                    {METALS.map((m, i) => (
                        <Spot
                            key={m}
                            id="copa"
                            x={6 + i * 18}
                            y={22}
                            w={16}
                            h={36}
                            label={t('trophies.cup', { metal: t(`trophies.metal.${m}` as TKey) })}
                            pick={pick}
                            z={1}
                            className="sx-pedestal"
                        >
                            <Slot kind="taca" metal={m} n={rec.cups[m]} next={m === firstCup} />
                        </Spot>
                    ))}
                    <Spot
                        id="insignias"
                        x={64}
                        y={6}
                        w={60}
                        h={26}
                        label={t('profile.badges.title')}
                        pick={pick}
                        z={1}
                        className="sx-badgecase"
                    >
                        <BadgeFrame got={rec.badges} />
                    </Spot>
                    <Spot
                        id="dia"
                        x={66}
                        y={38}
                        w={56}
                        h={20}
                        label={t('trophies.spots.daily')}
                        pick={pick}
                        z={1}
                        className="sx-vitrine low"
                    >
                        {METALS.map((m) => (
                            <Slot key={m} kind="medalhao" metal={m} n={rec.days[m]} />
                        ))}
                    </Spot>
                    <Spot
                        id="medalhas"
                        x={131}
                        y={4}
                        w={56}
                        h={42}
                        label={t('trophies.spots.medals')}
                        pick={pick}
                        z={1}
                        className="sx-board"
                    >
                        <MedalBoard medals={rec.medals} />
                    </Spot>
                    <i className="sx-rail" />
                    <i className="sx-rail r" />
                    {/* a escada da direita, do chão até o mezanino */}
                    <span className="sx-stairs" aria-hidden>
                        {Array.from({ length: 11 }, (_, k) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: degraus fixos
                            <i key={k} style={{ '--k': k } as CSSProperties} />
                        ))}
                    </span>
                    <i className="sx-stairs-foot" />
                    {/* andar de baixo: a sala do time */}
                    <ol className="sd-flags sx-flags">
                        {Array.from({ length: 12 }, (_, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: enfeite fixo
                            <li key={i} />
                        ))}
                    </ol>
                    <Crest look={look} className="sx-crest-b" />
                    <span className="sd-frame sx-frame-b">
                        <KitShirt look={look} className="sd-shirt" />
                    </span>
                    <Mi k="lamp" x={2} bottom={130} />
                    <Mi k="plant" x={108} bottom={130} />
                    <i className="sd-rug sx-rug-b" />
                    {visitor && <Visitor wild={visitor} scale={small ? 1 : big ? 3 : 2} />}
                </div>
                <div className="sx-b-walk">
                    <WildZone wild={w} zone="floor" />
                </div>
            </div>
            <div className="amb-ui rm-ui sx-ui sx-ui-b" style={vars}>
                <Head titles={rec.titles} />
                <div className="rm-actions">
                    <LevelPlate titles={rec.titles} />
                    <Tiles />
                </div>
            </div>
            {det.piece && <Detail piece={det.piece} rec={rec} closing={det.closing} onClose={det.close} />}
        </ClockCtx.Provider>
    );
}

/* ============================================================================ C: o pódio (um troféu em foco) */

function Featured({ piece, rec }: { piece: Piece; rec: Rec }) {
    const best = (n: MetalCount) => [...METALS].reverse().find((m) => n[m]) ?? 'ouro';
    if (piece === 'copa') return <PixelTrophy kind="taca" metal={best(rec.cups)} ghost={!rec.titles} />;
    if (piece === 'dia') {
        const m = best(rec.days);
        return <PixelTrophy kind="medalhao" metal={m} ghost={!rec.days[m]} />;
    }
    if (piece === 'duelo') {
        const b = [...BELTS].reverse().find((x) => rec.duelWins >= x.wins);
        return <PixelTrophy kind="cinturao" metal={b?.metal ?? 'bronze'} ghost={!b} />;
    }
    if (piece === 'insignias') {
        const last = rec.badges.at(-1);
        return <KantoBadge leader={(last ?? KANTO_BADGES[0]) as (typeof KANTO_BADGES)[number]} earned={!!last} />;
    }
    const top = [...rec.medals].sort((a, b) => b.tier - a.tier)[0];
    return <MedalDisc glyph={MEDAL_GLYPH[top.medal.id] ?? 'pokebola'} tier={top.tier} />;
}

function ConceptC({ rec, novo, ms }: { rec: Rec; novo: boolean; ms: number }) {
    const { t, d, lang } = useT();
    const clock = useSceneClock(true);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const list = useClubList(novo);
    const w = useWild(clock, list.slice(0, small ? 3 : big ? 5 : 4), floorZone(small ? 1 : big ? 3 : 2), undefined, {
        ...ROOM,
        feet: '.mi, .sx-feet',
    });
    const look = lookOfProfile(useGame((s) => s.profile));
    const vars = { '--club': hexCss(look.color), '--club2': hexCss(look.color2) } as CSSProperties;
    const det = useDetail(ms);
    const [focus, setFocus] = useState<Piece>('copa');
    const nBadges = rec.badges.length;
    const nMedals = rec.medals.filter((m) => m.tier > 0).length;
    const nDays = METALS.reduce((s, m) => s + rec.days[m], 0);
    const nBelts = BELTS.filter((b) => rec.duelWins >= b.wins).length;
    // a "foto do título": o capitão do último título posa do lado da taça
    const last = rec.hall[0];
    const cap = last && (last.squad.find((p) => p.captain) ?? last.squad[0]);
    const plaque: Record<Piece, [string, string]> = {
        copa: [
            t('trophies.cardTrophies'),
            last
                ? t('trophies.card.titleLine', {
                      date: new Date(last.date).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US'),
                      club: last.club,
                      a: last.scores.at(-1)?.[0] ?? 0,
                      b: last.scores.at(-1)?.[1] ?? 0,
                  })
                : t('trophies.say.cupsNone'),
        ],
        dia: [t('trophies.sections.dia'), nDays ? t('trophies.times', { n: nDays }) : t('trophies.say.dailyNone')],
        duelo: [t('trophies.sections.duelo'), t('trophies.duelWins', { n: rec.duelWins })],
        insignias: [t('profile.badges.title'), t('profile.badges.count', { n: nBadges, total: KANTO_BADGES.length })],
        medalhas: [d.trophies.tabs.medalhas, `${nMedals}/${rec.medals.length}`],
    };
    const shelf: { id: Piece; art: ReactNode; n: string; got: boolean }[] = [
        {
            id: 'copa',
            art: <PixelTrophy kind="taca" metal="ouro" ghost={!rec.titles} />,
            n: String(rec.titles),
            got: !!rec.titles,
        },
        {
            id: 'dia',
            art: <PixelTrophy kind="medalhao" metal="prata" ghost={!nDays} />,
            n: String(nDays),
            got: !!nDays,
        },
        {
            id: 'duelo',
            art: <PixelTrophy kind="cinturao" metal="bronze" ghost={!nBelts} />,
            n: `${nBelts}/3`,
            got: !!nBelts,
        },
        {
            id: 'insignias',
            art: <KantoBadge leader="brock" earned={nBadges > 0} />,
            n: `${nBadges}/8`,
            got: nBadges > 0,
        },
        {
            id: 'medalhas',
            art: <MedalDisc glyph="pokebola" tier={nMedals ? 2 : 0} />,
            n: `${nMedals}/${rec.medals.length}`,
            got: nMedals > 0,
        },
    ];
    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene rm-scene sd-scene sx-c" style={vars}>
                <div className="amb-layer rm-room">
                    <i className="rm-wall" />
                    <i className="rm-floor" />
                    <div className="rm-set">
                        <ol className="sd-flags">
                            {Array.from({ length: 12 }, (_, i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: enfeite fixo
                                <li key={i} />
                            ))}
                        </ol>
                        <Crest look={look} className="sx-crest-c" />
                        <Mi k="fireplace" x={124} bottom={78} />
                        <i className="sd-fire" />
                        <Mi k="plant" x={-40} bottom={76} />
                        <Mi k="palm" x={196} bottom={80} />
                        <span className="sd-frame">
                            <KitShirt look={look} className="sd-shirt" />
                        </span>
                        {/* a plaquinha do que está no pódio */}
                        <span className="sx-plaque">
                            <b>{plaque[focus][0]}</b>
                            <small>{plaque[focus][1]}</small>
                        </span>
                        <i className="sx-spot-light" />
                        <span className="sx-podium sx-feet">
                            <i />
                            <i />
                            <i />
                        </span>
                        <span key={focus} className="sx-hero">
                            <Featured piece={focus} rec={rec} />
                        </span>
                        {focus === 'copa' && cap && (
                            <span className="sx-cap">
                                <FieldSprite
                                    id={cap.speciesId}
                                    shiny={cap.shiny}
                                    anim="Pose"
                                    dir={0}
                                    scale={small ? 1 : big ? 3 : 2}
                                />
                            </span>
                        )}
                    </div>
                    <div className="rm-walk">
                        <WildZone wild={w} zone="floor" />
                    </div>
                </div>
            </div>
            <div className="amb-ui rm-ui sd-ui sx-ui sx-ui-c" style={vars}>
                <Head titles={rec.titles} />
                <div className="rm-actions">
                    <div className="sx-shelf-row" role="tablist">
                        {shelf.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                role="tab"
                                aria-selected={focus === s.id}
                                className={`sx-chip${focus === s.id ? ' on' : ''}${s.got ? '' : ' ghost'}`}
                                onClick={() => setFocus(s.id)}
                            >
                                {s.art}
                                <b className="cb-num">{s.n}</b>
                            </button>
                        ))}
                    </div>
                    <button type="button" className="btn big cup-go rm-go cb cb-green" onClick={() => det.open(focus)}>
                        <span className="cup-go-txt">
                            <b>{plaque[focus][0]}</b>
                            <small>{t('trophies.card.list')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    <Tiles />
                </div>
            </div>
            {det.piece && <Detail piece={det.piece} rec={rec} closing={det.closing} onClose={det.close} />}
        </ClockCtx.Provider>
    );
}

export function SalaTrofeusLab() {
    const q = new URLSearchParams(window.location.search);
    const v = q.get('v') ?? 'a';
    const novo = q.has('novo');
    const ms = q.has('lento') ? 2400 : 300;
    const rec = useRecords(novo);
    return (
        <Shell ms={ms}>
            {v === 'b' ? (
                <ConceptB rec={rec} novo={novo} ms={ms} />
            ) : v === 'c' ? (
                <ConceptC rec={rec} novo={novo} ms={ms} />
            ) : (
                <ConceptA rec={rec} novo={novo} ms={ms} />
            )}
        </Shell>
    );
}
