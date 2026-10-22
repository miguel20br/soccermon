import { useEffect, useState } from 'react';
import { formationOf } from '../../engine/formations';
import { itemSprite } from '../../engine/items';
import { interestOf, rerollPrice, type ShopOffer } from '../../engine/shop';
import { editionOf } from '../../engine/specials';
import { MAX_SPONSORS } from '../../engine/sponsors';
import { itemDesc, itemName, stageName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { isLong } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, PackArt, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { Money, SponsorCard, SponsorSlots } from '../components/SponsorCard';
import { TmCard } from '../components/TmTeach';
import { useHeld } from '../use-held';
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
    const { run: live, buyOffer, claimPack, skipPack, rerollShop, leaveShop } = useGame();
    const run = useHeld(live?.status === 'shop' && live.shop ? live : null);
    // save estragado (Mercado sem vitrine): segue pra escalação em vez de tela vazia
    useEffect(() => {
        if (live?.status === 'shop' && !live.shop) leaveShop();
    }, [live, leaveShop]);
    const [chosen, setChosen] = useState<number | null>(null);
    const [packPick, setPackPick] = useState<number | null>(null);
    const { lang, t } = useT();
    const shop = run?.shop;
    if (run?.status !== 'shop' || !shop) return null;
    const money = run.money ?? 0;
    const sponsors = run.sponsors ?? [];
    const offer = chosen !== null ? shop.offers[chosen] : null;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
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
    // Pokémon que já está no time (veio do pacote): não compra outro da mesma espécie
    const owned = (o: ShopOffer) => o.kind === 'pokemon' && run.picks.some((p) => p.speciesId === o.inst.speciesId);
    const buyable = (o: ShopOffer, i: number) => !shop.sold.includes(i) && !owned(o) && money >= o.price;
    const buyLabel = (o: ShopOffer, i: number) =>
        shop.sold.includes(i)
            ? t('shop.sold')
            : owned(o)
              ? t('shop.owned')
              : money < o.price
                ? t('shop.priceShort', { price: o.price, n: o.price - money })
                : t('shop.buy', { n: o.price });
    // o que não dá pra comprar fica óbvio sem tocar: cadeado, preço riscado e a carta apagada (o motivo vai no rótulo)
    const cant = (o: ShopOffer, i: number) => !shop.sold.includes(i) && !buyable(o, i);

    const shelf = (kinds: ShopOffer['kind'][]) =>
        shop.offers.map((o, i) => ({ o, i })).filter(({ o }) => kinds.includes(o.kind));
    const offerTile = ({ o, i }: { o: ShopOffer; i: number }) => {
        const sold = shop.sold.includes(i);
        return (
            <div
                key={offerKey(o)}
                className={`shop-offer k-${o.kind}${sold ? ' sold' : ''}${cant(o, i) ? ' cant' : ''}${chosen === i ? ' chosen' : ''}`}
            >
                <OfferCard
                    offer={o}
                    lack={sold ? 0 : Math.max(0, o.price - money)}
                    selected={chosen === i}
                    team={run.picks}
                    packSize={sponsors.includes('safari') ? 4 : 3}
                    onPick={() => buyable(o, i) && choose(i)}
                />
                <button
                    type="button"
                    className="btn small outline shop-buy"
                    disabled={!buyable(o, i)}
                    aria-pressed={chosen === i}
                    onClick={() => choose(i)}
                >
                    {cant(o, i) && <HudIcon kind="lock" />}
                    {buyLabel(o, i)}
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">
                    {isLong(run)
                        ? t('longCup.title')
                        : t('shop.before', { stage: stageName(run.stage + 1, lang) || t('reward.cup') })}
                </span>
                <div className="draft-title">
                    <h1>{t('shop.title')}</h1>
                    <Money n={money} className="shop-wallet" />
                </div>
                <button
                    type="button"
                    className="btn small"
                    disabled={money < reroll || !!shop.pack}
                    onClick={() => {
                        rerollShop();
                        setChosen(null);
                    }}
                >
                    <HudIcon kind="reroll" />
                    {reroll === 0 ? t('shop.rerollFree') : t('shop.reroll', { n: reroll })}
                </button>
            </div>

            <div className="panel shop-earned">
                <span className="shop-earned-title">
                    {t(e.win > 0 ? 'shop.earned.title' : 'shop.earned.titleInterest')}
                </span>
                {earnedLines.map(([k, n]) => (
                    <span key={k} className="shop-earned-line">
                        {t(`shop.earned.${k}`)} <b>+{t('shop.money', { n })}</b>
                    </span>
                ))}
                <span className="muted shop-earned-hint">{t('shop.interestHint', { cap })}</span>
            </div>

            {shop.pack ? (
                <div className="panel shop-pack">
                    <h2>{t('shop.packPick')}</h2>
                    <CardPack
                        sealed
                        look={packLookOf(shop.pack)}
                        label={packName}
                        type={packOffer?.kind === 'pack' ? packOffer.type : undefined}
                        revealKey={shop.pack.map((c) => c.uid).join()}
                    >
                        <div className="shop-grid">
                            {shop.pack.map((inst, i) => (
                                <div
                                    key={inst.uid}
                                    data-cry={inst.speciesId}
                                    className={`shop-offer cpack-card${isBigCard(inst) ? ' big' : ''}${editionOf(inst) ? ' walk' : ''}`}
                                >
                                    <FutCard
                                        inst={inst}
                                        selected={packPick === i}
                                        action={{
                                            label: t(packPick === i ? 'reward.chosen' : 'reward.pick'),
                                            primary: true,
                                            onClick: () => {
                                                setPackPick(packPick === i ? null : i);
                                            },
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardPack>
                    <button
                        type="button"
                        className="btn small ghost shop-pack-skip"
                        onClick={() => {
                            setPackPick(null);
                            skipPack();
                        }}
                    >
                        {t('shop.packSkip')}
                    </button>
                    {packPick !== null ? (
                        <GainTarget
                            key={`pack-${packPick}`}
                            gain={{ kind: 'pokemon', inst: shop.pack[packPick], price: 0 }}
                            run={run}
                            onClaim={(uid) => {
                                claimPack(packPick, uid);
                                setPackPick(null);
                            }}
                        />
                    ) : (
                        // o time à vista enquanto escolhe (do lado no PC, embaixo no celular), pra comparar
                        <div className="panel reward-team shop-pack-team">
                            <h2>{t('reward.yourTeam')}</h2>
                            <FormationBoard
                                formation={run.formation}
                                lineup={run.lineup}
                                bench={run.bench}
                                byUid={byUid}
                                captainUid={run.captainUid}
                                onSlot={(ref, uid) => {
                                    const inst = byUid.get(uid);
                                    if (!inst) return;
                                    useCardModal.getState().open(inst, {
                                        position:
                                            ref.zone === 'lineup'
                                                ? formationOf(run.formation).slots[ref.index]
                                                : undefined,
                                        captain: inst.uid === run.captainUid,
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* prateleiras: Pokémon, pacote e item, Patrocínio (antes tudo junto numa grade só confundia) */}
                    <div className="shop-shelves">
                        <section className="shop-shelf">
                            <h2 className="shop-shelf-title">{t('shop.shelf.mons')}</h2>
                            <div className="shop-grid">{shelf(['pokemon']).map(offerTile)}</div>
                        </section>
                        <section className="shop-shelf">
                            <h2 className="shop-shelf-title">{t('shop.shelf.gear')}</h2>
                            <div className="shop-grid">{shelf(['pack', 'item', 'tm']).map(offerTile)}</div>
                        </section>
                        <section className="shop-shelf shelf-sponsor">
                            <h2 className="shop-shelf-title">
                                {t('shop.sponsors')}{' '}
                                <span className="muted">{t('shop.slots', { n: sponsors.length })}</span>
                            </h2>
                            <p className="shop-shelf-hint">{t('shop.sponsorsHint')}</p>
                            {shelf(['sponsor']).map(offerTile)}
                            <SponsorSlots sponsors={sponsors} />
                        </section>
                    </div>

                    {offer?.kind === 'sponsor' && (
                        <div className="panel reward-pick" data-exit>
                            <h2>{t('shop.full')}</h2>
                            <SponsorSlots
                                sponsors={sponsors}
                                onPick={(id) => {
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
            {/* a ação que avança mora embaixo: Seguir. Com o pacote aberto ele espera a escolha (e diz por quê) */}
            <div className="bc-thumbbar">
                {shop.pack && (
                    <p className="tb-hint" id="shop-leave-why">
                        {t('shop.packPick')}
                    </p>
                )}
                <button
                    type="button"
                    className="btn primary"
                    disabled={!!shop.pack}
                    aria-describedby={shop.pack ? 'shop-leave-why' : undefined}
                    onClick={() => {
                        leaveShop();
                    }}
                >
                    {t('shop.leave')}
                    <HudIcon kind="next" />
                </button>
            </div>
        </>
    );
}

/** A carta de cada coisa da vitrine (o botão de comprar fica embaixo, igual pra todas). */
function OfferCard({
    offer: o,
    lack,
    selected,
    team,
    packSize,
    onPick,
}: {
    offer: ShopOffer;
    lack: number;
    selected: boolean;
    team: Parameters<typeof TmCard>[0]['team'];
    packSize: number;
    onPick: () => void;
}) {
    const { lang, t } = useT();
    if (o.kind === 'pokemon') return <FutCard inst={o.inst} selected={selected} />;
    if (o.kind === 'sponsor') return <SponsorCard id={o.id} price={o.price} lack={lack} />;
    if (o.kind === 'tm')
        return <TmCard move={o.move} leader={o.leader} team={team} selected={selected} onClick={onPick} />;
    if (o.kind === 'pack')
        return (
            <div className="shop-pack-offer">
                <PackArt look="" type={o.type} label={t('shop.pack', { type: typeName(o.type, lang) })} />
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
