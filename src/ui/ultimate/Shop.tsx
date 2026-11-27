import { type CSSProperties, useMemo, useState } from 'react';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { eventAt } from '../../store/ultimate/objectives';
import {
    BIG_FLOOR_N,
    FICHAS_PACK_PRICE,
    FLOOR_METAL,
    ICON_ODDS,
    METAL_ODDS,
    OPEN_FICHAS,
    PICK_BUY_N,
    PICK_FICHAS,
    PICK_PRICE,
    REPEAT_FICHAS,
    SHINY_ODDS,
} from '../../store/ultimate/rules';
import { cardPrice, pickable } from '../../store/ultimate/ultimate';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { Sheet } from '../kit/Sheet';
import { METAL, type Metal, metalLabel } from '../rarity';
import { useNow } from './clock';
import { usePickWarn } from './PickMoment';
import { PackImg, packArt } from './pack-art';

const METALS: Metal[] = ['bronze', 'prata', 'ouro'];

/** Nota da espécie como ela sai na loja (nível 50, sem edição). */
const overallOf = (id: number) =>
    viewInstance({ ...createInstance(id, new Rng('loja', String(id))), shiny: false }).overall;

/**
 * Loja do Time Ultimate: Pacote Mini extra, Pick e a carta escolhida, tudo com Fichas (a carta é a proteção contra
 * azar). Preços em rules.ts (proposta, falta o ok do Miguel).
 */
export function Shop() {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const buyPack = useGame((s) => s.ultimateBuyPack);
    const buyCard = useGame((s) => s.ultimateBuyCard);
    const buyPick = useGame((s) => s.ultimateBuyPick);
    const [boughtPick, setBoughtPick] = useState<Metal | null>(null);
    const [metal, setMetal] = useState<Metal>('bronze');
    const [pick, setPick] = useState<number | null>(null);
    const [got, setGot] = useState<PokemonInstance | null>(null);
    const list = useMemo(() => pickable(u, metal).sort((a, b) => overallOf(b) - overallOf(a) || a - b), [u, metal]);
    // a ouro sobe com a nota: a escolhida diz o preço; sem escolha, o do metal (o piso)
    const price = pick === null ? PICK_PRICE[metal] : cardPrice(pick);
    const short = price - u.fichas;
    const warn = usePickWarn();
    const [odds, setOdds] = useState(false);
    const tile = (art: string, title: string, hint: string, cost: number, buy: () => void) => (
        <article key={art} className="ut-tile">
            <PackImg art={art} />
            <span className="ut-tile-info">
                <b>{title}</b>
                <small>{hint}</small>
                <small className="ut-tile-price">
                    <HudIcon kind="coin" />
                    {t('ultimate.shop.price', { n: cost })}
                </small>
            </span>
            <button type="button" className="btn confirm" disabled={u.fichas < cost} onClick={buy}>
                {t('ultimate.shop.buy')}
            </button>
        </article>
    );
    return (
        <section className="panel ut-shop bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="bag" />
                {t('ultimate.shop.title')}
                <button type="button" className="btn ghost ut-odds-link" onClick={() => setOdds(true)}>
                    <HudIcon kind="dice" />
                    {t('ultimate.packs.odds')}
                </button>
            </h2>
            {/* a vitrine: no celular o Mini em destaque e os Picks numa prateleira de lado; no PC, a grade */}
            <div className="ut-vitrine">
                <div className="ut-vitrine-hero">
                    {tile(
                        packArt('mini'),
                        t('ultimate.packs.mini'),
                        t('ultimate.stack.miniHint', { metal: metalLabel(FLOOR_METAL) }),
                        FICHAS_PACK_PRICE,
                        () => buyPack(),
                    )}
                </div>
                <span className="bc-lbl ut-vitrine-lbl">
                    <HudIcon kind="cards" />
                    {t('ultimate.pick.buy')}
                </span>
                <div className="ut-shelf">
                    {METALS.map((m) =>
                        tile(
                            packArt(m),
                            t('ultimate.pick.metal', { metal: metalLabel(m) }),
                            `${t('ultimate.pick.of', { n: PICK_BUY_N })} · ${metalLabel(m)}`,
                            PICK_FICHAS[m],
                            () => buyPick(m) && setBoughtPick(m),
                        ),
                    )}
                </div>
            </div>
            <small className="muted">{t('ultimate.pick.buyHint')}</small>
            {METALS.map((m) => warn(m, PICK_BUY_N))
                .filter(Boolean)
                .map((w) => (
                    <small key={w} className="muted">
                        {w}
                    </small>
                ))}
            {boughtPick && (
                <p key={u.bought} className="ut-undo ut-got-line">
                    <HudIcon kind="bag" />
                    <span>{t('ultimate.pick.bought', { metal: metalLabel(boughtPick) })}</span>
                </p>
            )}
            <span className="bc-lbl">
                <HudIcon kind="sparkle" />
                {t('ultimate.shop.pick')}
            </span>
            <small className="muted">{t('ultimate.shop.pickHint')}</small>
            {got ? (
                <div className="ut-got">
                    <FutCard inst={got} ribbon={t('ultimate.packs.fresh')} />
                    <small>{t('ultimate.shop.got', { name: viewInstance(got).displayName })}</small>
                    <button type="button" className="btn confirm wide" onClick={() => setGot(null)}>
                        {t('ultimate.shop.ok')}
                    </button>
                </div>
            ) : (
                <>
                    <div className="bc-seg ut-seg">
                        {METALS.map((m) => (
                            <button
                                type="button"
                                key={m}
                                aria-pressed={metal === m}
                                className={metal === m ? 'on' : undefined}
                                style={{ '--mc': METAL[m].color } as CSSProperties}
                                onClick={() => {
                                    setMetal(m);
                                    setPick(null);
                                }}
                            >
                                {metalLabel(m)}{' '}
                                <small>
                                    {t('ultimate.shop.price', {
                                        n: m === 'ouro' ? `${PICK_PRICE[m]}+` : PICK_PRICE[m],
                                    })}
                                </small>
                            </button>
                        ))}
                    </div>
                    {list.length === 0 ? (
                        <p className="muted">{t('ultimate.shop.none')}</p>
                    ) : (
                        <div className="ut-chips ut-pick-list" key={metal}>
                            {list.map((id) => (
                                <button
                                    type="button"
                                    key={id}
                                    aria-pressed={pick === id}
                                    className={`btn k-chip ut-chip${pick === id ? ' on' : ''}`}
                                    style={{ '--mc': METAL[metal].color } as CSSProperties}
                                    onClick={() => setPick(pick === id ? null : id)}
                                >
                                    <MonIcon id={id} />
                                    {species(id).name}
                                    <b>{overallOf(id)}</b>
                                    {metal === 'ouro' && <small>{cardPrice(id)}</small>}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        className="btn confirm wide"
                        disabled={pick === null || short > 0}
                        onClick={() => {
                            if (pick === null) return;
                            setGot(buyCard(pick));
                            setPick(null);
                        }}
                    >
                        {short > 0
                            ? t('ultimate.shop.need', { n: short })
                            : pick === null
                              ? t('ultimate.shop.choose')
                              : t('ultimate.shop.confirm', { n: price, name: species(pick).name })}
                    </button>
                </>
            )}
            <Sheet
                open={odds}
                onClose={() => setOdds(false)}
                title={t('ultimate.packs.odds')}
                className="ut-odds-sheet"
            >
                <Odds />
            </Sheet>
        </section>
    );
}

const pct = (p: number, lang: string) =>
    `${(Math.round(p * 1000) / 10).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US')}%`;

/** As chances do pacote, abertas (é o contrário do pacote do FUT): na folha do link Chances da vitrine. */
function Odds() {
    const { t, d, lang } = useT();
    const event = eventAt(useNow());
    return (
        <div className="ut-odds">
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
        </div>
    );
}
