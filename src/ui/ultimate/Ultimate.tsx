import { type CSSProperties, useMemo, useState } from 'react';
import { cupRival } from '../../engine/cup';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import { evoReady } from '../../store/ultimate/evolutions';
import { eventAt, objectiveById } from '../../store/ultimate/objectives';
import {
    BIG_FLOOR_N,
    FICHAS,
    FLOOR_METAL,
    GYM_LEVEL,
    ICON_ODDS,
    LEVELS,
    type Level,
    METAL_ODDS,
    OPEN_POINTS,
    PACK_MAX,
    REPEAT_POINTS,
    SHINY_ODDS,
    STARTERS,
    TEAM_SIZE,
} from '../../store/ultimate/rules';
import {
    canPlay,
    gymReady,
    homeTeam,
    nextPackIn,
    orderIndex,
    type PackKind,
    type PackOpen,
    packsReady,
    refill,
    teamAverage,
    ultimateRival,
    ultimateSeed,
} from '../../store/ultimate/ultimate';
import { KantoBadge } from '../components/BadgeCase';
import { CardPack, isBigCard, PackArt, packLookOf } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { MonIcon } from '../components/MonIcon';
import { cardSprite } from '../components/PokeCard';
import { METAL, type Metal, metalLabel, metalOf } from '../rarity';
import { LineupEditor } from '../screens/Lineup';
import { simulateMatch } from '../sim-client';
import { Chemistry } from './Chemistry';
import { hms, useNow } from './clock';
import { Goals, useReward } from './Goals';
import { Gyms, SeasonBar } from './Season';
import { Shop } from './Shop';
import './ultimate.css';

type Tab = 'packs' | 'collection' | 'team' | 'goals' | 'play';
const TABS: Tab[] = ['packs', 'collection', 'team', 'goals', 'play'];
const TAB_ICON: Record<Tab, HudIconKind> = {
    packs: 'cards',
    collection: 'dex',
    team: 'team',
    goals: 'medal',
    play: 'play',
};
const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const pct = (p: number, lang: string) =>
    `${(Math.round(p * 1000) / 10).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}%`;

/**
 * Time Ultimate (0.9.31, atrás de `?lab=ultimate`): pacotes, coleção, time e jogo contra a IA, numa tela de abas.
 * Os números vêm de src/store/ultimate/rules.ts (proposta, falta o ok do Miguel).
 */
export function Ultimate() {
    const { t, d } = useT();
    const go = useGame((s) => s.go);
    const u = useGame((s) => s.ultimate);
    // voltando da partida, abre no prêmio
    const [tab, setTab] = useState<Tab>(() => (u.last && !u.last.seen ? 'play' : u.cards.length ? 'team' : 'packs'));
    return (
        <div className="menu-screen ut">
            <MenuHead title={t('ultimate.title')} hud="cards" onBack={() => go('home')} tag={t('ultimate.preview')} />
            <section className="panel ut-wallet bc-surface bc-stripe" aria-live="polite">
                <span>
                    <HudIcon kind="coin" />
                    <b className="cb-num">
                        <CountUp to={u.fichas} />
                    </b>
                    <small>{t('ultimate.fichas')}</small>
                </span>
                <span>
                    <HudIcon kind="sparkle" />
                    <b className="cb-num">{u.packPoints}</b>
                    <small>{t('ultimate.pointsShort')}</small>
                </span>
                <span>
                    <HudIcon kind="cards" />
                    <b className="cb-num">{u.cards.length}</b>
                    <small>{t('ultimate.cards')}</small>
                </span>
            </section>
            <SeasonBar />
            <div
                className="pf-tabs k-tabs"
                role="tablist"
                aria-label={t('ultimate.title')}
                style={{ '--n': TABS.length } as CSSProperties}
            >
                {TABS.map((id) => (
                    <button
                        type="button"
                        role="tab"
                        key={id}
                        id={`ut-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls={`ut-panel-${id}`}
                        className={`pf-tab${tab === id ? ' active' : ''}`}
                        onClick={() => setTab(id)}
                    >
                        <HudIcon kind={TAB_ICON[id]} />
                        <span>{d.ultimate.tabs[id]}</span>
                    </button>
                ))}
            </div>
            <div
                key={tab}
                className="ut-panel"
                role="tabpanel"
                id={`ut-panel-${tab}`}
                aria-labelledby={`ut-tab-${tab}`}
            >
                {tab === 'packs' ? (
                    <Packs />
                ) : tab === 'collection' ? (
                    <Collection />
                ) : tab === 'team' ? (
                    <Team onPacks={() => setTab('packs')} />
                ) : tab === 'goals' ? (
                    <Goals />
                ) : (
                    <Play onPacks={() => setTab('packs')} onGoals={() => setTab('goals')} />
                )}
            </div>
            <EvolutionOverlay />
        </div>
    );
}

// --------------------------------------------------------------------------------------------------- pacotes

function Packs() {
    const { t, tn } = useT();
    const u = useGame((s) => s.ultimate);
    const openPack = useGame((s) => s.ultimateOpenPack);
    const now = useNow();
    const [open, setOpen] = useState<(PackOpen & { kind: PackKind }) | null>(null);
    const clock = refill(u, now);
    const next = nextPackIn(u, now);
    const ready = packsReady(u, now);
    const openKind = (kind: PackKind) => {
        const r = openPack(undefined, kind);
        setOpen(r && { ...r, kind });
    };
    return (
        <>
            {open ? (
                <section className="panel ut-open">
                    <CardPack
                        sealed
                        autoOpen
                        look={packLookOf(open.cards)}
                        label={open.kind === 'big' ? t('ultimate.packs.big') : t('ultimate.packs.mini')}
                        revealKey={open.cards.map((c) => c.uid).join()}
                    >
                        <div className="reward-grid">
                            {open.cards.map((c, i) => (
                                <div
                                    key={c.uid}
                                    data-cry={c.speciesId}
                                    className={`option cpack-card${isBigCard(c) ? ' big' : ''}`}
                                >
                                    <FutCard
                                        inst={c}
                                        ribbon={
                                            open.points[i]
                                                ? t('ultimate.packs.repeat', { n: open.points[i] })
                                                : t('ultimate.packs.fresh')
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </CardPack>
                    <button type="button" className="btn confirm wide" onClick={() => setOpen(null)}>
                        {t('ultimate.packs.keep')}
                    </button>
                </section>
            ) : (
                <section className="panel ut-pack bc-surface">
                    <PackArt look="" label={t('ultimate.packs.mini')} />
                    <div className="ut-pack-info">
                        <b>{t('ultimate.packs.mini')}</b>
                        <span className="ut-dots">
                            {Array.from({ length: PACK_MAX }, (_, i) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: as vagas de pacote são fixas
                                <i key={i} aria-hidden className={i < clock.packs ? 'on' : undefined} />
                            ))}
                            <small>{t('ultimate.packs.stored', { n: clock.packs, max: PACK_MAX })}</small>
                        </span>
                        {u.extraPacks > 0 && (
                            <small className="ut-extra">
                                <HudIcon kind="sparkle" />
                                {tn('ultimate.packs.extra', u.extraPacks)}
                            </small>
                        )}
                        <small className="ut-timer">
                            <HudIcon kind="stopwatch" />
                            {next === null ? t('ultimate.packs.full') : t('ultimate.packs.next', { time: hms(next) })}
                        </small>
                        <button
                            type="button"
                            className="btn confirm"
                            disabled={ready < 1}
                            onClick={() => openKind('mini')}
                        >
                            {ready < 1 ? t('ultimate.packs.none') : t('ultimate.packs.open')}
                        </button>
                    </div>
                </section>
            )}
            {!open && (
                <section className="panel ut-pack ut-big bc-surface">
                    <PackArt look="" label={t('ultimate.packs.big')} />
                    <div className="ut-pack-info">
                        <b>{t('ultimate.packs.big')}</b>
                        <small className="muted">{t('ultimate.packs.bigHint')}</small>
                        <small className={u.bigPacks ? 'ut-extra' : 'muted'}>
                            {u.bigPacks ? tn('ultimate.packs.bigHave', u.bigPacks) : t('ultimate.packs.bigNone')}
                        </small>
                        {u.bigPacks > 0 && (
                            <button type="button" className="btn confirm" onClick={() => openKind('big')}>
                                {t('ultimate.packs.open')}
                            </button>
                        )}
                    </div>
                </section>
            )}
            {!open && <Shop />}
            <Odds />
        </>
    );
}

/** As chances do pacote, sempre à vista (é o contrário do pacote do FUT). */
function Odds() {
    const { t, d, lang } = useT();
    const event = eventAt(useNow());
    return (
        <section className="panel ut-odds bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="dice" />
                {t('ultimate.packs.odds')}
            </h2>
            <span className="bc-lbl">{t('ultimate.packs.perCard')}</span>
            <ul className="ut-metals">
                {METALS.map((m) => (
                    <li key={m} style={{ '--mc': METAL[m].color } as CSSProperties}>
                        <i aria-hidden />
                        <span>{metalLabel(m)}</span>
                        <b>{pct(METAL_ODDS[m], lang)}</b>
                    </li>
                ))}
            </ul>
            <p className="ut-rule">
                <HudIcon kind="check" />
                {t('ultimate.packs.floor', { metal: metalLabel(FLOOR_METAL) })}
            </p>
            <p className="ut-rule">
                <HudIcon kind="sparkle" />
                {t('ultimate.packs.editions', { shiny: pct(SHINY_ODDS, lang), icon: pct(ICON_ODDS, lang) })}
            </p>
            <p className="ut-rule">
                <HudIcon kind="reroll" />
                {t('ultimate.packs.repeatRule')}:{' '}
                {METALS.map((m) => `${metalLabel(m)} ${REPEAT_POINTS[m]}`).join(' · ')}
            </p>
            <p className="ut-rule">
                <HudIcon kind="sparkle" />
                {t('ultimate.packs.openRule', { n: OPEN_POINTS })}
            </p>
            <p className="ut-rule">
                <HudIcon kind="cards" />
                {t('ultimate.packs.bigRule', { n: BIG_FLOOR_N, metal: metalLabel(FLOOR_METAL) })}
            </p>
            {event && (
                <p className="ut-rule ut-rule-event">
                    <HudIcon kind="sparkle" />
                    {t('ultimate.packs.eventRule', {
                        name: d.ultimate.events[event.id] ?? event.id,
                        pct: pct(event.cardOdds, lang),
                    })}
                </p>
            )}
        </section>
    );
}

// --------------------------------------------------------------------------------------------------- coleção

function Collection() {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const cards = useMemo(
        () => [...u.cards].sort((a, b) => viewInstance(b).overall - viewInstance(a).overall),
        [u.cards],
    );
    if (!cards.length) return <p className="panel ut-empty">{t('ultimate.collection.empty')}</p>;
    return (
        <div className="ut-cards">
            {cards.map((c) => {
                const i = u.team.order.indexOf(c.uid);
                return (
                    <FutCard
                        key={c.uid}
                        inst={c}
                        size="sm"
                        captain={c.uid === u.team.captainUid}
                        ribbon={
                            i < 0
                                ? undefined
                                : i < STARTERS
                                  ? t('ultimate.collection.starter')
                                  : t('ultimate.collection.bench')
                        }
                    />
                );
            })}
        </div>
    );
}

// ------------------------------------------------------------------------------------------------------ time

function Team({ onPacks }: { onPacks: () => void }) {
    const { t, tn } = useT();
    const u = useGame((s) => s.ultimate);
    const setTeam = useGame((s) => s.ultimateTeam);
    const setMember = useGame((s) => s.ultimateSetMember);
    const clubName = useGame((s) => s.profile.clubName);
    const byUid = useMemo(() => new Map(u.cards.map((c) => [c.uid, c])), [u.cards]);
    const order = u.team.order;
    if (order.length < STARTERS)
        return (
            <section className="panel ut-empty">
                <b>{tn('ultimate.team.need', STARTERS - order.length)}</b>
                <p className="muted">{t('ultimate.team.needHint')}</p>
                <button type="button" className="btn confirm" onClick={onPacks}>
                    {t('ultimate.play.toPacks')}
                </button>
            </section>
        );
    return (
        <LineupEditor
            title={t('team.lineup.title', { team: clubName || t('ultimate.title') })}
            formation={u.team.formation}
            lineup={order.slice(0, STARTERS)}
            bench={order.slice(STARTERS, TEAM_SIZE)}
            byUid={byUid}
            captainUid={u.team.captainUid}
            tactic={u.team.tactic}
            cornerPlan={u.team.corner}
            cornerTakerUid={u.team.cornerTakerUid}
            locked={!!u.live}
            onFormation={(formation) => setTeam({ formation })}
            onSwap={(a, b) => setMember(orderIndex(a.zone, a.index), order[orderIndex(b.zone, b.index)])}
            onTactic={(tactic) => setTeam({ tactic })}
            onCorner={(p) =>
                setTeam({
                    ...(p.cornerPlan && { corner: p.cornerPlan }),
                    ...(p.cornerTakerUid !== undefined && { cornerTakerUid: p.cornerTakerUid }),
                })
            }
            side={
                <>
                    <Chemistry u={u} />
                    <Reserves />
                </>
            }
        />
    );
}

/** Reservas: as cartas da coleção fora do time. Toque numa e depois em quem sai. Embaixo, o capitão. */
function Reserves() {
    const { t, d } = useT();
    const u = useGame((s) => s.ultimate);
    const setTeam = useGame((s) => s.ultimateTeam);
    const setMember = useGame((s) => s.ultimateSetMember);
    const [pick, setPick] = useState<string | null>(null);
    const byUid = new Map(u.cards.map((c) => [c.uid, c]));
    const order = u.team.order;
    const reserves = u.cards
        .filter((c) => !order.includes(c.uid))
        .sort((a, b) => viewInstance(b).overall - viewInstance(a).overall);
    const picked = pick ? byUid.get(pick) : undefined;
    const slots = Array.from({ length: TEAM_SIZE }, (_, i) => order[i] ?? null);
    const name = (uid: string) => viewInstance(byUid.get(uid)!).displayName;
    const slotsNow = FORMATIONS[u.team.formation].slots;
    const where = (i: number) => (i < STARTERS ? d.common.posShort[slotsNow[i]] : t('ultimate.collection.bench'));
    return (
        <div className="panel ut-reserves bc-surface">
            <h2 className="bc-caption">
                {t('ultimate.team.reserves')} · {reserves.length}
            </h2>
            {reserves.length === 0 ? (
                <p className="muted">{t('ultimate.team.reservesEmpty')}</p>
            ) : (
                <>
                    <small className="muted">
                        {picked
                            ? t('ultimate.team.swapInto', { name: viewInstance(picked).displayName })
                            : t('ultimate.team.pickReserve')}
                    </small>
                    {picked ? (
                        <div className="ut-chips">
                            {slots.map((uid, i) => (
                                <button
                                    type="button"
                                    // biome-ignore lint/suspicious/noArrayIndexKey: as vagas do time são fixas
                                    key={i}
                                    className="btn k-chip ut-chip"
                                    disabled={!!u.live}
                                    onClick={() => {
                                        setMember(i, picked.uid);
                                        setPick(null);
                                    }}
                                >
                                    <small>{where(i)}</small>
                                    {uid ? (
                                        <>
                                            <MonIcon id={byUid.get(uid)!.speciesId} shiny={byUid.get(uid)!.shiny} />
                                            {name(uid)}
                                        </>
                                    ) : (
                                        t('ultimate.team.emptySlot')
                                    )}
                                </button>
                            ))}
                            <button type="button" className="btn ghost small" onClick={() => setPick(null)}>
                                {t('ultimate.team.cancel')}
                            </button>
                        </div>
                    ) : (
                        <div className="ut-chips">
                            {reserves.map((c) => (
                                <button
                                    type="button"
                                    key={c.uid}
                                    className="btn k-chip ut-chip"
                                    style={{ '--mc': METAL[metalOf(viewInstance(c).overall)].color } as CSSProperties}
                                    disabled={!!u.live}
                                    onClick={() => setPick(c.uid)}
                                >
                                    <MonIcon id={c.speciesId} shiny={c.shiny} />
                                    {viewInstance(c).displayName}
                                    <b>{viewInstance(c).overall}</b>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
            <label className="corner-taker ut-captain">
                <h3>
                    <HudIcon kind="armband" />
                    {t('ultimate.team.captain')}
                </h3>
                <select
                    value={u.team.captainUid ?? ''}
                    disabled={!!u.live}
                    onChange={(e) => setTeam({ captainUid: e.target.value || null })}
                >
                    {!u.team.captainUid && <option value="">{t('ultimate.team.captainNone')}</option>}
                    {order.slice(0, STARTERS).map((uid) => (
                        <option key={uid} value={uid}>
                            {name(uid)}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}

// ----------------------------------------------------------------------------------------------------- jogar

function Play({ onPacks, onGoals }: { onPacks: () => void; onGoals: () => void }) {
    const { t, tn, d, lang } = useT();
    const reward = useReward();
    const u = useGame((s) => s.ultimate);
    const profile = useGame((s) => s.profile);
    const [level, setLevel] = useState<Level>(() => u.last?.level ?? 'normal');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const home = useMemo(
        () => homeTeam(u, profile.clubName || 'Pallet FC', clubColorHex(profile.clubColor)),
        [u, profile.clubName, profile.clubColor],
    );
    const ready = canPlay(u);
    const avg = ready ? teamAverage(home) : 0;
    const rival = useMemo(
        () => (ready ? ultimateRival(u.salt, u.played, level, avg) : null),
        [ready, u.salt, u.played, level, avg],
    );

    /** Simula (a mesma seed e as ordens guardadas dão a mesma partida) e abre a quadra. */
    const kick = async () => {
        const s = useGame.getState();
        const live = s.ultimate.live;
        if (!live) return;
        setBusy(true);
        setError(null);
        try {
            const m = await simulateMatch(
                live.home,
                cupRival(live.rival, true),
                `${ultimateSeed(s.ultimate.salt, live.n)}-stage-0`,
                live.orders,
            );
            if (useGame.getState().screen !== 'ultimate') return;
            s.setMatch(m);
            s.go('ultimate-match');
        } catch {
            setError(t('ultimate.play.simError'));
        } finally {
            setBusy(false);
        }
    };
    const start = () => {
        if (!rival) return;
        useGame.getState().ultimateStart({ n: u.played, level, home, rival });
        void kick();
    };
    /** Desafio de líder: o clube dele, no Difícil, com a regra conferida na hora. */
    const challenge = (gym: string) => {
        if (!gymReady(u, gym)) return;
        const r = ultimateRival(u.salt, u.played, GYM_LEVEL, avg, gym);
        useGame.getState().ultimateStart({ n: u.played, level: GYM_LEVEL, home, rival: r, gym });
        void kick();
    };

    const last = u.last && !u.last.seen ? u.last : null;
    if (last)
        return (
            <section className={`panel ut-prize bc-surface bc-stripe is-${last.outcome}`}>
                <span className="bc-tag">{t('ultimate.result.title')}</span>
                <b className="ut-verdict cb-num">
                    {t(`ultimate.result.${last.outcome}`)} {last.score[0]}x{last.score[1]}
                </b>
                {last.shootout && (
                    <small>{t('ultimate.result.pens', { a: last.shootout[0], b: last.shootout[1] })}</small>
                )}
                <small className="muted">
                    {t('ultimate.result.vs', {
                        club: clubName(last.rival, lang),
                        level: last.gym
                            ? (d.profile.trainers[last.gym as TrainerId] ?? last.gym)
                            : d.ultimate.play.levels[last.level],
                    })}
                </small>
                <span className="ut-gain">
                    <HudIcon kind="coin" />
                    <CountUp from={0} to={last.fichas} ms={700} format={(n) => t('ultimate.result.gain', { n })} />
                </span>
                {last.badge && last.gym && (
                    <span className="ut-gain ut-badge">
                        <KantoBadge leader={last.gym as TrainerId} earned />
                        {t('ultimate.result.badge', { badge: d.profile.badges.names[last.gym] ?? last.gym })}
                    </span>
                )}
                {last.pass !== undefined && (
                    <small className="ut-extra">
                        <HudIcon kind="crown" />
                        {last.pass ? t('ultimate.result.pass', { n: last.pass }) : t('ultimate.result.passCap')}
                        {!!last.marks?.length &&
                            ` · ${tn('ultimate.result.marks', last.marks.length, { n: last.marks.join(', ') })}`}
                    </small>
                )}
                {last.ornament && (
                    <small className="ut-extra">
                        <HudIcon kind="sparkle" />
                        {t('ultimate.result.ornament', { name: d.ultimate.events[last.ornament] ?? last.ornament })}
                    </small>
                )}
                {!!last.objectives?.length && (
                    <div className="ut-prize-goals">
                        <span className="bc-lbl">{t('ultimate.result.objectives')}</span>
                        {last.objectives.map((id) => {
                            const o = objectiveById(id);
                            return (
                                o && (
                                    <small key={id}>
                                        <HudIcon kind="check" />
                                        {tn(`ultimate.goals.text.${o.kind}`, o.goal)} · {reward(o)}
                                    </small>
                                )
                            );
                        })}
                    </div>
                )}
                {u.evos.some(evoReady) && (
                    <button type="button" className="btn ghost small" onClick={onGoals}>
                        <HudIcon kind="sprout" />
                        {t('ultimate.result.evoReady')}
                    </button>
                )}
                <button type="button" className="btn confirm wide" onClick={() => useGame.getState().ultimateSeen()}>
                    {t('ultimate.result.next')}
                </button>
            </section>
        );
    if (u.live)
        return (
            <section className="panel ut-live bc-surface">
                <b>{t('ultimate.play.live')}</b>
                <small className="muted">
                    {clubName(u.live.rival.name, lang)} · {d.ultimate.play.levels[u.live.level]}
                </small>
                <button type="button" className="btn primary big wide" disabled={busy} onClick={() => void kick()}>
                    <i className="cb-shine" aria-hidden />
                    {busy ? t('ultimate.play.warming') : t('ultimate.play.resume')}
                </button>
                {error && <p className="error-text">{error}</p>}
            </section>
        );
    if (!ready || !rival)
        return (
            <section className="panel ut-empty">
                <b>{t('ultimate.play.needTeam')}</b>
                <button type="button" className="btn confirm" onClick={onPacks}>
                    {t('ultimate.play.toPacks')}
                </button>
            </section>
        );
    return (
        <>
            <section className="panel ut-level bc-surface">
                <h2 className="bc-caption">{t('ultimate.play.level')}</h2>
                <div className="bc-seg">
                    {LEVELS.map((lv) => (
                        <button
                            type="button"
                            key={lv}
                            aria-pressed={level === lv}
                            className={level === lv ? 'on' : undefined}
                            onClick={() => setLevel(lv)}
                        >
                            {d.ultimate.play.levels[lv]}
                        </button>
                    ))}
                </div>
                <span className="bc-lbl">{t('ultimate.play.prize')}</span>
                <table className="ut-prizes">
                    <thead>
                        <tr>
                            <th />
                            <th>{t('ultimate.play.win')}</th>
                            <th>{t('ultimate.play.draw')}</th>
                            <th>{t('ultimate.play.loss')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {LEVELS.map((lv) => (
                            <tr key={lv} className={level === lv ? 'on' : undefined}>
                                <th>{d.ultimate.play.levels[lv]}</th>
                                <td>{FICHAS[lv].win}</td>
                                <td>{FICHAS[lv].draw}</td>
                                <td>{FICHAS[lv].loss}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <small className="muted">{t('ultimate.play.prizeNote')}</small>
            </section>
            <section
                className="panel ut-rival bc-surface bc-stripe"
                style={{ '--tc': `#${rival.color.toString(16).padStart(6, '0')}` } as CSSProperties}
            >
                <span className="bc-lbl">{t('ultimate.play.rival')}</span>
                <b>{clubName(rival.name, lang)}</b>
                <span className="lg-squad">
                    {rival.lineup.map((p) => (
                        <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                    ))}
                </span>
                <small>
                    {t('ultimate.play.rivalAvg', { n: teamAverage(rival) })} · {t('ultimate.play.yourAvg', { n: avg })}
                </small>
                {u.played > 0 && (
                    <small className="muted">{t('ultimate.play.record', { w: u.wins, d: u.draws, l: u.losses })}</small>
                )}
            </section>
            <div className="bc-thumbbar">
                <button type="button" className="btn primary wide" disabled={busy} onClick={start}>
                    <i className="cb-shine" aria-hidden />
                    {busy ? t('ultimate.play.warming') : t('ultimate.play.go')}
                </button>
                {error && <p className="error-text">{error}</p>}
            </div>
            <Gyms u={u} busy={busy} onGo={challenge} />
        </>
    );
}
