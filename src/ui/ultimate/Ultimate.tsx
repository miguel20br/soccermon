import { type CSSProperties, useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { utNow } from '../../store/ultimate/clock';
import { evoReady } from '../../store/ultimate/evolutions';
import { eventAt } from '../../store/ultimate/objectives';
import {
    BIG_FLOOR_N,
    FLOOR_METAL,
    ICON_ODDS,
    METAL_ODDS,
    OPEN_POINTS,
    PACK_MAX,
    REPEAT_POINTS,
    SHINY_ODDS,
} from '../../store/ultimate/rules';
import { seasonN } from '../../store/ultimate/season';
import {
    nextPackIn,
    type PackKind,
    type PackOpen,
    packsReady,
    pendingFull,
    refill,
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
import { UtPackMoment } from './PackMoment';
import { SeasonBar } from './Season';
import { Shop } from './Shop';
import { Squad } from './Squad';
import './ultimate.css';

const TABS: UtTab[] = ['home', 'squad', 'club', 'shop', 'goals'];
const TAB_ICON: Record<UtTab, HudIconKind> = {
    home: 'stadium',
    squad: 'team',
    club: 'cards',
    shop: 'bag',
    goals: 'medal',
};
const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const pct = (p: number, lang: string) =>
    `${(Math.round(p * 1000) / 10).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}%`;

/**
 * Time Ultimate (atrás de `?lab=ultimate`), no esqueleto do UT do FC (ut-menus-e-pendentes.md, opção B): Início (o
 * hub com o JOGAR), Elenco, Clube (cartas e Pendentes), Loja e Metas, na barra embaixo.
 */
export function Ultimate() {
    const { t, d } = useT();
    const go = useGame((s) => s.go);
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const [tab, setTab] = useState<UtTab>(() => (u.cards.length ? 'home' : 'shop'));
    const [seg, setSeg] = useState<ClubSeg>('cards');
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
    const openPack = useGame((s) => s.ultimateOpenPack);
    const [pack, setPack] = useState<(PackOpen & { kind: PackKind }) | null>(null);
    const [full, setFull] = useState(false);
    const openKind = (kind: PackKind) => {
        if (pendingFull(useGame.getState().ultimate)) {
            setFull(true);
            return;
        }
        const r = openPack(undefined, kind);
        setPack(r && { ...r, kind });
    };
    const toPending = () => {
        setSeg('pending');
        setTab('club');
    };
    const dot: Partial<Record<UtTab, boolean>> = {
        club: u.pending.length > 0,
        shop: packsReady(u, now) + u.bigPacks > 0,
        goals: u.evos.some(evoReady),
    };
    const at = TABS.indexOf(tab);
    return (
        <div className="menu-screen ut ut-hub">
            <MenuHead
                title={t('ultimate.title')}
                hud="cards"
                onBack={() => go('home')}
                // "Prévia" só antes da estreia (dev e prévias); depois de 27/11 o modo é de verdade
                tag={utNow() < ULTIMATE_OPENS_AT ? t('ultimate.preview') : undefined}
            />
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
            <div
                key={tab}
                className="ut-panel"
                role="tabpanel"
                id={`ut-panel-${tab}`}
                aria-labelledby={`ut-tab-${tab}`}
            >
                {tab === 'home' ? (
                    <Home onTab={setTab} onPending={toPending} onOpen={openKind} />
                ) : tab === 'squad' ? (
                    <Squad onPacks={() => setTab('shop')} onClub={() => setTab('club')} />
                ) : tab === 'club' ? (
                    <Club seg={seg} onSeg={setSeg} onSquad={() => setTab('squad')} />
                ) : tab === 'shop' ? (
                    <Packs onOpen={openKind} />
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
                                {dot[id] && <i className="ut-dot" aria-hidden />}
                            </span>
                            <span className="ut-tab-lbl">{d.ultimate.tabs[id]}</span>
                        </button>
                    ))}
                </div>
            </nav>
            {pack && (
                <UtPackMoment key={pack.cards.map((c) => c.uid).join()} open={pack} onClose={() => setPack(null)} />
            )}
            <ConfirmSheet
                open={full}
                onClose={() => setFull(false)}
                title={t('ultimate.pending.fullTitle')}
                text={t('ultimate.pending.fullText', { n: u.pending.length })}
                confirm={t('ultimate.pending.fullGo')}
                calm
                onConfirm={toPending}
            />
            <EvolutionOverlay />
        </div>
    );
}

// --------------------------------------------------------------------------------------------------- pacotes

function Packs({ onOpen }: { onOpen: (kind: PackKind) => void }) {
    const { t, tn } = useT();
    const u = useGame((s) => s.ultimate);
    const now = useNow();
    const clock = refill(u, now);
    const next = nextPackIn(u, now);
    const ready = packsReady(u, now);
    return (
        <>
            <FirstSteps compact />
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
                    <button type="button" className="btn confirm" disabled={ready < 1} onClick={() => onOpen('mini')}>
                        {ready < 1 ? t('ultimate.packs.none') : t('ultimate.packs.open')}
                    </button>
                </div>
            </section>
            <section className="panel ut-pack ut-big bc-surface">
                <PackArt look="" label={t('ultimate.packs.big')} />
                <div className="ut-pack-info">
                    <b>{t('ultimate.packs.big')}</b>
                    <small className="muted">{t('ultimate.packs.bigHint')}</small>
                    <small className={u.bigPacks ? 'ut-extra' : 'muted'}>
                        {u.bigPacks ? tn('ultimate.packs.bigHave', u.bigPacks) : t('ultimate.packs.bigNone')}
                    </small>
                    {u.bigPacks > 0 && (
                        <button type="button" className="btn confirm" onClick={() => onOpen('big')}>
                            {t('ultimate.packs.open')}
                        </button>
                    )}
                </div>
            </section>
            <Shop />
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
