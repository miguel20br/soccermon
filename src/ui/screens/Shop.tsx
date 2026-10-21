import { useState } from 'react';
import { itemSprite } from '../../engine/items';
import { interestOf, rerollPrice, type ShopOffer } from '../../engine/shop';
import { MAX_SPONSORS } from '../../engine/sponsors';
import { playSfx } from '../../game/audio';
import { itemDesc, itemName, stageName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { CardPack, packLookOf } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { Money, SponsorCard, SponsorSlots } from '../components/SponsorCard';
import { TmCard } from '../components/TmTeach';
import { TypeIcon } from '../components/TypeIcon';
import { TYPE_COLOR } from '../type-colors';
import { GainTarget } from './Reward';
import '../shop.css';

const offerKey = (o: ShopOffer) =>
    o.kind === 'pokemon'
        ? o.inst.uid
        : o.kind === 'pack'
          ? `pack-${o.type}`
          : o.kind === 'item'
            ? o.item
            : o.kind === 'tm'
              ? `tm-${o.move}`
              : `sp-${o.id}`;

/**
 * Mercado da Copa rápida (docs/planos/copa-roguelike-plano.md): depois da recompensa de cada vitória. O ₽ da vitória
 * entra, a vitrine sai pela seed da copa; compra o que quiser e segue. Pokémon, item e MT usam o mesmo painel da
 * recompensa (quem sai, quem recebe); pacote abre e você fica com 1; Patrocínio ocupa uma das 3 vagas.
 */
export function Shop() {
    const { run, buyOffer, claimPack, rerollShop, leaveShop } = useGame();
    const [chosen, setChosen] = useState<number | null>(null);
    const [packPick, setPackPick] = useState<number | null>(null);
    const { lang, t } = useT();
    const shop = run?.shop;
    if (run?.status !== 'shop' || !shop) return null;
    const money = run.money ?? 0;
    const sponsors = run.sponsors ?? [];
    const offer = chosen !== null ? shop.offers[chosen] : null;
    const packOffer = shop.offers.find((o) => o.kind === 'pack');
    const packName = packOffer?.kind === 'pack' ? t('shop.pack', { type: typeName(packOffer.type, lang) }) : '';
    const reroll = rerollPrice(shop.rerolls, sponsors);
    const cap = interestOf(Number.POSITIVE_INFINITY, sponsors);
    const e = shop.earned;
    const earnedLines = (
        [
            ['win', e.win],
            ['goals', e.goals],
            ['clean', e.clean],
            ['bonus', e.bonus],
            ['interest', e.interest],
        ] as const
    ).filter(([, n]) => n > 0);

    const choose = (i: number) => {
        const o = shop.offers[i];
        playSfx('select');
        // pacote e Patrocínio com vaga livre: compra direto (não há quem escolher)
        if (o.kind === 'pack' || (o.kind === 'sponsor' && sponsors.length < MAX_SPONSORS)) {
            buyOffer(i);
            setChosen(null);
            setPackPick(null);
        } else {
            setChosen(chosen === i ? null : i);
            // no celular o painel de quem recebe fica embaixo da vitrine: rola até ele
            requestAnimationFrame(() =>
                document.querySelector('.reward-pick')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
            );
        }
    };
    const buyLabel = (o: ShopOffer, i: number) =>
        shop.sold.includes(i)
            ? t('shop.sold')
            : money < o.price
              ? t('shop.short', { n: o.price - money })
              : t('shop.buy', { n: o.price });

    return (
        <>
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">
                    {t('shop.before', { stage: stageName(run.stage + 1, lang) || t('reward.cup') })}
                </span>
                <div className="draft-title">
                    <h1>{t('shop.title')}</h1>
                    <Money n={money} className="shop-wallet" />
                </div>
                <div className="row">
                    <button
                        type="button"
                        className="btn small"
                        disabled={money < reroll || !!shop.pack}
                        onClick={() => {
                            playSfx('select');
                            rerollShop();
                            setChosen(null);
                        }}
                    >
                        <HudIcon kind="reroll" />
                        {reroll === 0 ? t('shop.rerollFree') : t('shop.reroll', { n: reroll })}
                    </button>
                    <button
                        type="button"
                        className="btn small primary"
                        disabled={!!shop.pack}
                        onClick={() => {
                            playSfx('select');
                            leaveShop();
                        }}
                    >
                        {t('shop.leave')}
                        <HudIcon kind="next" />
                    </button>
                </div>
            </div>

            <div className="panel shop-earned">
                <span className="shop-earned-title">{t('shop.earned.title')}</span>
                {earnedLines.map(([k, n]) => (
                    <span key={k} className="shop-earned-line">
                        {t(`shop.earned.${k}`)} <b>+{t('shop.money', { n })}</b>
                    </span>
                ))}
                <span className="muted shop-earned-hint">{t('shop.interestHint', { cap })}</span>
            </div>

            <div className="panel shop-sponsors">
                <h2>
                    {t('shop.sponsors')} <span className="muted">{t('shop.slots', { n: sponsors.length })}</span>
                </h2>
                <SponsorSlots sponsors={sponsors} />
            </div>

            {shop.pack ? (
                <div className="panel shop-pack">
                    <h2>{t('shop.packPick')}</h2>
                    <CardPack
                        sealed
                        look={packLookOf(shop.pack)}
                        label={packName}
                        revealKey={shop.pack.map((c) => c.uid).join()}
                    >
                        <div className="shop-grid">
                            {shop.pack.map((inst, i) => (
                                <div key={inst.uid} className="shop-offer">
                                    <FutCard
                                        inst={inst}
                                        selected={packPick === i}
                                        action={{
                                            label: t(packPick === i ? 'reward.chosen' : 'reward.pick'),
                                            primary: true,
                                            onClick: () => {
                                                playSfx('select');
                                                setPackPick(packPick === i ? null : i);
                                            },
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardPack>
                    {packPick !== null && (
                        <GainTarget
                            key={`pack-${packPick}`}
                            gain={{ kind: 'pokemon', inst: shop.pack[packPick], price: 0 }}
                            run={run}
                            onClaim={(uid) => {
                                claimPack(packPick, uid);
                                setPackPick(null);
                            }}
                        />
                    )}
                </div>
            ) : (
                <>
                    <div className="shop-grid">
                        {shop.offers.map((o, i) => {
                            const sold = shop.sold.includes(i);
                            return (
                                <div
                                    key={offerKey(o)}
                                    className={`shop-offer${sold ? ' sold' : ''}${chosen === i ? ' chosen' : ''}`}
                                >
                                    <OfferCard
                                        offer={o}
                                        selected={chosen === i}
                                        team={run.picks}
                                        packSize={sponsors.includes('safari') ? 4 : 3}
                                        onPick={() => !sold && money >= o.price && choose(i)}
                                    />
                                    <button
                                        type="button"
                                        className="btn small shop-buy"
                                        disabled={sold || money < o.price}
                                        aria-pressed={chosen === i}
                                        onClick={() => choose(i)}
                                    >
                                        {buyLabel(o, i)}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {offer?.kind === 'sponsor' && (
                        <div className="panel reward-pick" data-exit>
                            <h2>{t('shop.full')}</h2>
                            <SponsorSlots
                                sponsors={sponsors}
                                onPick={(id) => {
                                    playSfx('select');
                                    buyOffer(chosen!, id);
                                    setChosen(null);
                                }}
                            />
                        </div>
                    )}
                    {offer && offer.kind !== 'sponsor' && offer.kind !== 'pack' && (
                        <GainTarget
                            key={chosen}
                            gain={offer}
                            run={run}
                            onClaim={(uid, slot, passTo) => {
                                buyOffer(chosen!, uid, slot, passTo);
                                setChosen(null);
                            }}
                        />
                    )}
                </>
            )}
        </>
    );
}

/** A carta de cada coisa da vitrine (o botão de comprar fica embaixo, igual pra todas). */
function OfferCard({
    offer: o,
    selected,
    team,
    packSize,
    onPick,
}: {
    offer: ShopOffer;
    selected: boolean;
    team: Parameters<typeof TmCard>[0]['team'];
    packSize: number;
    onPick: () => void;
}) {
    const { lang, t } = useT();
    if (o.kind === 'pokemon') return <FutCard inst={o.inst} selected={selected} />;
    if (o.kind === 'sponsor') return <SponsorCard id={o.id} />;
    if (o.kind === 'tm')
        return <TmCard move={o.move} leader={o.leader} team={team} selected={selected} onClick={onPick} />;
    if (o.kind === 'pack')
        return (
            <div className="sp-card shop-pack-card" style={{ '--fam': TYPE_COLOR[o.type] } as React.CSSProperties}>
                <span className="sp-fam">{t('shop.kind.pack')}</span>
                <span className="sp-emblem">
                    <TypeIcon type={o.type} />
                </span>
                <b className="sp-name">{t('shop.pack', { type: typeName(o.type, lang) })}</b>
                <span className="sp-desc">{t('shop.packDesc', { n: packSize, type: typeName(o.type, lang) })}</span>
            </div>
        );
    return (
        <div className={`card item-card${selected ? ' selected' : ''}`}>
            <span className="tier-label">{t('reward.item')}</span>
            <img className="pixel item-art" src={itemSprite(o.item)} alt="" />
            <b className="card-name">{itemName(o.item)}</b>
            <span className="tactic-desc">{itemDesc(o.item, lang)}</span>
        </div>
    );
}
