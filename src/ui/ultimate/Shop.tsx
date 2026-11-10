import { type CSSProperties, useMemo, useState } from 'react';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { FICHAS_PACK_PRICE, PICK_BUY_N, PICK_FICHAS, PICK_PRICE } from '../../store/ultimate/rules';
import { pickable } from '../../store/ultimate/ultimate';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { METAL, type Metal, metalLabel } from '../rarity';
import { usePickWarn } from './PickMoment';

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
    const price = PICK_PRICE[metal];
    const short = price - u.fichas;
    const warn = usePickWarn();
    return (
        <section className="panel ut-shop bc-surface">
            <h2 className="bc-caption">
                <HudIcon kind="bag" />
                {t('ultimate.shop.title')}
            </h2>
            <div className="ut-shop-pack">
                <span>
                    <b>{t('ultimate.shop.pack')}</b>
                    <small>
                        <HudIcon kind="coin" />
                        {t('ultimate.shop.packPrice', { n: FICHAS_PACK_PRICE })}
                    </small>
                </span>
                <button
                    type="button"
                    className="btn confirm"
                    disabled={u.fichas < FICHAS_PACK_PRICE}
                    onClick={() => buyPack()}
                >
                    {t('ultimate.shop.buy')}
                </button>
            </div>
            <span className="bc-lbl">
                <HudIcon kind="cards" />
                {t('ultimate.pick.buy')}
            </span>
            <small className="muted">{t('ultimate.pick.buyHint')}</small>
            <div className="ut-chips ut-pick-buy">
                {METALS.map((m) => (
                    <button
                        type="button"
                        key={m}
                        className="btn k-chip ut-chip"
                        style={{ '--mc': METAL[m].color } as CSSProperties}
                        disabled={u.fichas < PICK_FICHAS[m]}
                        onClick={() => buyPick(m) && setBoughtPick(m)}
                    >
                        {metalLabel(m)} <small>{t('ultimate.shop.price', { n: PICK_FICHAS[m] })}</small>
                    </button>
                ))}
            </div>
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
                                {metalLabel(m)} <small>{t('ultimate.shop.price', { n: PICK_PRICE[m] })}</small>
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
        </section>
    );
}
