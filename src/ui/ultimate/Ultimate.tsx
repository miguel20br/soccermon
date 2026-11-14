import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { dailyDay } from '../../store/daily';
import { useGame } from '../../store/game-store';
import { utNow } from '../../store/ultimate/clock';
import { evoReady } from '../../store/ultimate/evolutions';
import { eventAhead, eventAt } from '../../store/ultimate/objectives';
import {
    BIG_FLOOR_N,
    FLOOR_METAL,
    ICON_ODDS,
    METAL_ODDS,
    OPEN_FICHAS,
    PACK_MAX,
    REPEAT_FICHAS,
    SHINY_ODDS,
} from '../../store/ultimate/rules';
import { lastDayPrizes, seasonN } from '../../store/ultimate/season';
import {
    nextPackIn,
    type PackKind,
    packsReady,
    pendingFull,
    stackCount,
    type UtPick,
} from '../../store/ultimate/ultimate';
import { PackArt } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { ConfirmSheet } from '../kit/Sheet';
import { METAL, type Metal, metalLabel } from '../rarity';
import { Club, type ClubSeg } from './Club';
import { hms, useNow } from './clock';
import { ULTIMATE_OPENS_AT } from './flag';
import { FirstSteps, Goals } from './Goals';
import { Home, type UtTab } from './Home';
import { type UtOpened, UtPackMoment } from './PackMoment';
import { UtPickMoment, usePickName } from './PickMoment';
import { Play } from './Play';
import { SeasonBar } from './Season';
import { Shop } from './Shop';
import './ultimate.css';
import { backTarget } from '../back-nav';

const TABS: UtTab[] = ['home', 'play', 'club', 'shop', 'goals'];
const TAB_ICON: Record<UtTab, HudIconKind> = {
    home: 'stadium',
    play: 'play',
    club: 'team',
    shop: 'bag',
    goals: 'medal',
};
const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const pct = (p: number, lang: string) =>
    `${(Math.round(p * 1000) / 10).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}%`;

/**
 * Time Ultimate (atrás de `?lab=ultimate`), no esqueleto do UT do FC (ut-menus-e-pendentes.md, opção B; ultimate-fc.md,
 * retorno de 09/11): Início (o hub em blocos), Jogar (os modos), Clube (Elenco, cartas e Pendentes), Loja e Metas, na
 * barra embaixo.
 */
export function Ultimate() {
    const { t, d } = useT();
    const go = useGame((s) => s.go);
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    // entra sempre no Início (o destaque e o número na aba já avisam dos pacotes; retorno de 09/11)
    const [tab, setTab] = useState<UtTab>('home');
    const [seg, setSeg] = useState<ClubSeg>('squad');
    // virou a temporada (ou a partida aberta acabou): zera o modo e guarda o legado
    const roll = useGame((s) => s.ultimateSeason);
    const n = seasonN(now);
    const live = !!u.live;
    // biome-ignore lint/correctness/useExhaustiveDependencies: `n` e `live` são o gatilho da virada
    useEffect(() => roll(), [n, live, roll]);
    // troca de aba volta pro topo (a barra embaixo é fixa; a página nova nasce do começo)
    // biome-ignore lint/correctness/useExhaustiveDependencies: `tab` é o gatilho
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [tab]);
    // o pacote aberto (tela cheia por cima de tudo): da Loja ou do "Abrir agora" do pós-jogo
    const openMany = useGame((s) => s.ultimateOpenMany);
    const [pack, setPack] = useState<UtOpened | null>(null);
    const [pick, setPick] = useState<UtPick | null>(null);
    const [full, setFull] = useState(false);
    /** Abre `n` pacotes do tipo (sem `n` = Abrir todos). */
    const openKind = (kind: PackKind, n?: number) => {
        if (pendingFull(useGame.getState().ultimate)) {
            setFull(true);
            return;
        }
        const r = openMany(kind, n);
        setPack(r && { ...r, kind });
    };
    const toClub = (s: ClubSeg) => {
        setSeg(s);
        setTab('club');
    };
    const toPending = () => toClub('pending');
    // último dia da temporada com prêmio pendente: aviso uma vez por dia (Brasília), com atalho pros Pendentes
    const lastDay = lastDayPrizes(now, u.pending);
    const [warn, setWarn] = useState(false);
    const today = dailyDay(new Date(now));
    const warned = lastDay > 0;
    useEffect(() => {
        if (!warned) return;
        const key = 'soccermon-ut-lastday';
        try {
            if (localStorage.getItem(key) === today) return;
            localStorage.setItem(key, today);
        } catch {
            // sem storage: avisa a cada entrada
        }
        setWarn(true);
    }, [warned, today]);
    // o número em cima da aba: o que espera você ali (como no FC)
    const count: Partial<Record<UtTab, number>> = {
        club: u.pending.length,
        home: lastDay,
        shop: stackCount(u, now),
        goals: u.evos.filter(evoReady).length,
    };
    const at = TABS.indexOf(tab);
    return (
        <div className="menu-screen ut ut-hub">
            <MenuHead
                title={t('ultimate.title')}
                hud="cards"
                onBack={() => go(backTarget('ultimate') ?? 'home')}
                // "Prévia" só antes da estreia (dev e prévias); depois de 27/11 o modo é de verdade
                tag={utNow() < ULTIMATE_OPENS_AT ? t('ultimate.preview') : undefined}
                side={
                    // a carteira no canto de cima, em toda aba (como as moedas do FC)
                    <span className="ut-wallet" aria-live="polite">
                        <span className="k-res" role="img" aria-label={`${u.fichas} ${t('ultimate.fichas')}`}>
                            <HudIcon kind="coin" />
                            <b className="cb-num">
                                <CountUp to={u.fichas} />
                            </b>
                        </span>
                    </span>
                }
            />
            <div
                key={tab}
                className="ut-panel"
                role="tabpanel"
                id={`ut-panel-${tab}`}
                aria-labelledby={`ut-tab-${tab}`}
            >
                {tab === 'home' ? (
                    <Home onTab={setTab} onPending={toPending} onSquad={() => toClub('squad')} />
                ) : tab === 'play' ? (
                    <Play onPacks={() => setTab('shop')} />
                ) : tab === 'club' ? (
                    <Club seg={seg} onSeg={setSeg} onPacks={() => setTab('shop')} />
                ) : tab === 'shop' ? (
                    <Packs onOpen={openKind} onPick={setPick} />
                ) : (
                    <>
                        <SeasonBar />
                        <Goals />
                    </>
                )}
            </div>
            <nav className="ut-nav" aria-label={t('ultimate.title')}>
                <div className="ut-tabs" role="tablist" style={{ '--n': TABS.length, '--pos': at } as CSSProperties}>
                    <i className="ut-ind" aria-hidden />
                    {TABS.map((id) => (
                        <button
                            type="button"
                            role="tab"
                            key={id}
                            id={`ut-tab-${id}`}
                            aria-selected={tab === id}
                            aria-controls={`ut-panel-${id}`}
                            className={`ut-tab${tab === id ? ' on' : ''}`}
                            onClick={() => setTab(id)}
                        >
                            <span className="ut-tab-ic">
                                <HudIcon kind={TAB_ICON[id]} />
                                {!!count[id] && (
                                    <i className="ut-dot ut-count" aria-hidden>
                                        {Math.min(99, count[id])}
                                    </i>
                                )}
                            </span>
                            <span className="ut-tab-lbl">{d.ultimate.tabs[id]}</span>
                        </button>
                    ))}
                </div>
            </nav>
            {pack && (
                <UtPackMoment
                    key={pack.packs.map((p) => p.cards[0]?.uid).join()}
                    open={pack}
                    onClose={() => setPack(null)}
                    onPending={() => {
                        setPack(null);
                        toPending();
                    }}
                />
            )}
            {pick && <UtPickMoment key={pick.uid} pick={pick} onClose={() => setPick(null)} />}
            <ConfirmSheet
                open={full}
                onClose={() => setFull(false)}
                title={t('ultimate.pending.fullTitle')}
                text={t('ultimate.pending.fullText', { n: u.pending.length })}
                confirm={t('ultimate.pending.fullGo')}
                calm
                onConfirm={toPending}
            />
            <ConfirmSheet
                open={warn}
                onClose={() => setWarn(false)}
                title={t('ultimate.pending.lastDayTitle')}
                text={t('ultimate.pending.lastDayText', { n: lastDay })}
                confirm={t('ultimate.pending.lastDayGo')}
                calm
                onConfirm={toPending}
            />
            <EvolutionOverlay />
        </div>
    );
}

// --------------------------------------------------------------------------------------------------- pacotes

export type ShopSeg = 'mine' | 'buy';

/**
 * Loja (ultimate-fc.md, decidido em 09/11): abre em **Meus pacotes · N** (a pilha guardada, um tipo por linha com "x2",
 * Abrir 1 / Abrir todos, o relógio do grátis) e o outro segmento é **Comprar** (Mini, Pick e escolher carta, tudo com
 * Fichas, as chances). Nada abre sozinho: o pacote ganho espera aqui até a temporada virar.
 */
function Packs({ onOpen, onPick }: { onOpen: (kind: PackKind, n?: number) => void; onPick: (p: UtPick) => void }) {
    const { t, d, lang } = useT();
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const [seg, setSeg] = useState<ShopSeg>('mine');
    const n = stackCount(u, now);
    const next = nextPackIn(u, now);
    const mini = packsReady(u, now);
    const ahead = eventAhead(now);
    return (
        <>
            <div className="bc-seg ut-shop-seg" role="tablist">
                {(['mine', 'buy'] as const).map((id) => (
                    <button
                        type="button"
                        role="tab"
                        key={id}
                        aria-selected={seg === id}
                        className={seg === id ? 'on' : undefined}
                        onClick={() => setSeg(id)}
                    >
                        {id === 'mine' ? t('ultimate.stack.mine', { n }) : t('ultimate.stack.buy')}
                    </button>
                ))}
            </div>
            <div key={seg} className="ut-seg-panel">
                {seg === 'mine' ? (
                    <>
                        {n === 0 ? (
                            <section className="panel bc-surface ut-empty ut-stack-empty">
                                <b>{t('ultimate.stack.empty')}</b>
                                {next !== null && (
                                    <small className="ut-timer">
                                        <HudIcon kind="stopwatch" />
                                        {t('ultimate.packs.next', { time: hms(next) })}
                                    </small>
                                )}
                                <button type="button" className="btn" onClick={() => setSeg('buy')}>
                                    {t('ultimate.stack.toBuy')}
                                </button>
                            </section>
                        ) : (
                            <ul className="panel bc-surface ut-stack">
                                {/* os Picks primeiro (é o mais gostoso), o mesmo tipo junto com "x2" */}
                                {pickGroups(u.picks).map((g) => (
                                    <PickRow key={g[0].uid} picks={g} onPick={onPick} />
                                ))}
                                {mini > 0 && (
                                    <StackRow
                                        kind="mini"
                                        n={mini}
                                        title={t('ultimate.packs.mini')}
                                        hint={t('ultimate.stack.miniHint', { metal: metalLabel(FLOOR_METAL) })}
                                        onOpen={onOpen}
                                    >
                                        <small className="ut-timer">
                                            <HudIcon kind="stopwatch" />
                                            {next === null
                                                ? t('ultimate.packs.full', { max: PACK_MAX })
                                                : t('ultimate.stack.next', { time: hms(next), max: PACK_MAX })}
                                        </small>
                                    </StackRow>
                                )}
                                {u.bigPacks > 0 && (
                                    <StackRow
                                        kind="big"
                                        n={u.bigPacks}
                                        title={t('ultimate.packs.big')}
                                        hint={t('ultimate.stack.bigHint', {
                                            n: BIG_FLOOR_N,
                                            metal: metalLabel(FLOOR_METAL),
                                        })}
                                        onOpen={onOpen}
                                    />
                                )}
                            </ul>
                        )}
                        {ahead && (
                            <p className="ut-rule ut-rule-event ut-stack-event">
                                <HudIcon kind="sparkle" />
                                {t('ultimate.stack.event', {
                                    name: d.ultimate.events[ahead.id] ?? ahead.id,
                                    from: dayMonth(ahead.start, lang),
                                    to: dayMonth(ahead.end - 1, lang),
                                })}
                            </p>
                        )}
                        <FirstSteps compact />
                        {n > 0 && mini === 0 && next !== null && (
                            <small className="ut-timer ut-stack-clock">
                                <HudIcon kind="stopwatch" />
                                {t('ultimate.packs.next', { time: hms(next) })}
                            </small>
                        )}
                    </>
                ) : (
                    <>
                        <Shop />
                        <Odds />
                    </>
                )}
            </div>
        </>
    );
}

/** Uma linha de Meus pacotes: a arte, o nome com "x2", o que vem dentro e Abrir 1 / Abrir todos. */
function StackRow({
    kind,
    n,
    title,
    hint,
    onOpen,
    children,
}: {
    kind: PackKind;
    n: number;
    title: string;
    hint: string;
    onOpen: (kind: PackKind, n?: number) => void;
    children?: ReactNode;
}) {
    const { t } = useT();
    return (
        <li className={`ut-stack-row is-${kind}`}>
            <span className="ut-stack-art">
                <PackArt look="" label={title} />
                {n > 1 && <PackArt look="" />}
            </span>
            <span className="ut-stack-info">
                <b>
                    {title} <span className="ut-stack-x cb-num">x{n}</span>
                </b>
                <small>{hint}</small>
                {children}
            </span>
            <span className="ut-stack-acts">
                {n > 1 && (
                    <button type="button" className="btn" onClick={() => onOpen(kind, 1)}>
                        {t('ultimate.stack.openOne')}
                    </button>
                )}
                <button
                    type="button"
                    className={`btn confirm${n > 1 ? ' ut-open-all' : ''}`}
                    onClick={() => onOpen(kind, n > 1 ? undefined : 1)}
                >
                    {n > 1 ? t('ultimate.stack.openAll', { n }) : t('ultimate.stack.open')}
                </button>
            </span>
        </li>
    );
}

/** Picks iguais (mesma origem e regra) numa linha só. */
const pickGroups = (picks: readonly UtPick[]) => {
    const by = new Map<string, UtPick[]>();
    for (const p of picks) {
        const k = [p.from, p.ref, p.n, p.min, p.exact, p.type, p.event].join('|');
        by.set(k, [...(by.get(k) ?? []), p]);
    }
    return [...by.values()];
};

/** Uma linha de Pick em Meus pacotes: o pacote do Pick, o nome, a regra e Escolher. */
function PickRow({ picks, onPick }: { picks: UtPick[]; onPick: (p: UtPick) => void }) {
    const { t } = useT();
    const name = usePickName()(picks[0]);
    const p = picks[0];
    return (
        <li className={`ut-stack-row is-pick from-${p.from}`}>
            <span className="ut-stack-art">
                <PackArt
                    look={p.event ? 'special' : p.min === 'ouro' ? 'gold' : ''}
                    label={t('ultimate.pick.short')}
                    type={p.type}
                />
                {picks.length > 1 && <PackArt look="" type={p.type} />}
            </span>
            <span className="ut-stack-info">
                <b>
                    {name.title} {picks.length > 1 && <span className="ut-stack-x cb-num">x{picks.length}</span>}
                </b>
                <small>{name.hint}</small>
            </span>
            <span className="ut-stack-acts">
                <button type="button" className="btn confirm" onClick={() => onPick(p)}>
                    {t('ultimate.pick.open')}
                </button>
            </span>
        </li>
    );
}

/** "15/12" (Brasília); em inglês, "12/15". */
const dayMonth = (at: number, lang: string) => {
    const d = new Date(at - 3 * 3600e3);
    const [dd, mm] = [d.getUTCDate(), d.getUTCMonth() + 1].map((x) => String(x).padStart(2, '0'));
    return lang === 'en' ? `${mm}/${dd}` : `${dd}/${mm}`;
};

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
                {METALS.map((m) => `${metalLabel(m)} ${REPEAT_FICHAS[m]}`).join(' · ')}
            </p>
            <p className="ut-rule">
                <HudIcon kind="sparkle" />
                {t('ultimate.packs.openRule', { n: OPEN_FICHAS })}
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
