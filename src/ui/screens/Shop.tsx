import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { formationOf } from '../../engine/formations';
import type { PokemonInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { interestOf, rerollPrice, type ShopOffer } from '../../engine/shop';
import { MAX_SPONSORS } from '../../engine/sponsors';
import { itemDesc, itemName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, PackArt, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { SponsorCard, SponsorSlots } from '../components/SponsorCard';
import { TmCard } from '../components/TmTeach';
import { useFirstCup } from '../help/Tip';
import { walkoutIndex } from '../kit/beats';
import { SheetRow } from '../kit/controls';
import { MomentStage, Walkout } from '../kit/MomentStage';
import { Sheet } from '../kit/Sheet';
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
    const [sponsorsOpen, setSponsorsOpen] = useState(false);
    const firstCup = useFirstCup();
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
              : money < o.price && o.kind !== 'sponsor' // o Patrocínio já diz "₽10 · falta ₽2" no contrato da carta
                ? t('shop.priceShort', { price: o.price, n: o.price - money })
                : o.kind === 'sponsor'
                  ? t('shop.buyPlain') // o preço já está no contrato da carta
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
                    className="btn small confirm shop-buy"
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
            {/* a fase e o ₽ ficam na barra da copa (revisao-caminho.md, itens 1 e 2) */}
            <div className="draft-head bc-screenhead">
                <div className="draft-title">
                    <h1>{t('shop.title')}</h1>
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

            <p className="shop-earned">
                {t(e.win > 0 ? 'shop.earned.title' : 'shop.earned.titleInterest')}{' '}
                <b>+{t('shop.money', { n: earnedLines.reduce((sum, [, n]) => sum + n, 0) })}</b>
                {firstCup && <span className="muted"> {t('shop.interestHint', { cap })}</span>}
            </p>

            {shop.pack ? (
                <PackMoment
                    pack={shop.pack}
                    label={packName}
                    type={packOffer?.kind === 'pack' ? packOffer.type : undefined}
                    pick={packPick}
                    onPick={setPackPick}
                    onSkip={() => {
                        setPackPick(null);
                        skipPack();
                    }}
                    team={
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
                                        ref.zone === 'lineup' ? formationOf(run.formation).slots[ref.index] : undefined,
                                    captain: inst.uid === run.captainUid,
                                });
                            }}
                        />
                    }
                    target={
                        packPick !== null && (
                            <GainTarget
                                key={`pack-${packPick}`}
                                gain={{ kind: 'pokemon', inst: shop.pack[packPick], price: 0 }}
                                run={run}
                                onClaim={(uid) => {
                                    claimPack(packPick, uid);
                                    setPackPick(null);
                                }}
                            />
                        )
                    }
                />
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
                        {/* patrocínios ocupavam meia tela: viram uma linha que abre a sheet (revisao-caminho.md item 8) */}
                        <button
                            type="button"
                            className="shop-sponsor-row"
                            aria-haspopup="dialog"
                            onClick={() => setSponsorsOpen(true)}
                        >
                            <HudIcon kind="briefcase" />
                            <b>{t('shop.sponsors')}</b>
                            <span className="muted">{t('shop.slots', { n: sponsors.length })}</span>
                            <HudIcon kind="next" />
                        </button>
                    </div>

                    <Sheet
                        open={sponsorsOpen}
                        onClose={() => {
                            setSponsorsOpen(false);
                            if (offer?.kind === 'sponsor') setChosen(null);
                        }}
                        title={`${t('shop.sponsors')} ${t('shop.slots', { n: sponsors.length })}`}
                        className="shop-sponsor-sheet"
                    >
                        <p>{t('shop.sponsorsHint')}</p>
                        {offer?.kind === 'sponsor' ? (
                            <div className="reward-pick">
                                <h3>{t('shop.full')}</h3>
                                <SponsorSlots
                                    sponsors={sponsors}
                                    onPick={(id) => {
                                        buyOffer(chosen!, id);
                                        setChosen(null);
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                {shelf(['sponsor']).map(offerTile)}
                                <SponsorSlots sponsors={sponsors} />
                            </>
                        )}
                    </Sheet>
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
                    className="btn confirm"
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

/**
 * O pacote da Copa em tela cheia (cara-de-jogo.md, decisão 4): abre num MomentStage, as cartas saem em leque com o tom
 * subindo e a melhor, se for ouro (75+) ou edição, fica guardada pro walkout em 3 batidas depois do leque (com Pular).
 * Escolher uma abre a sheet de quem sai do banco; "Não quero nenhuma" segue sem carta, como antes.
 */
function PackMoment({
    pack,
    label,
    type,
    pick,
    onPick,
    onSkip,
    team,
    target,
}: {
    pack: PokemonInstance[];
    label: string;
    type?: string;
    pick: number | null;
    onPick: (i: number | null) => void;
    onSkip: () => void;
    team: ReactNode;
    target: ReactNode;
}) {
    const { t } = useT();
    const walkAt = walkoutIndex(pack);
    // 'wait' = guardada até o leque acabar; 'on' = o walkout tocando; 'done' = já na mesa
    const [walk, setWalk] = useState<'wait' | 'on' | 'done'>(walkAt < 0 ? 'done' : 'wait');
    return (
        <MomentStage label={t('shop.packPick')} className="shop-pack-moment">
            <h2 className="k-moment-title shop-pack-title">{t('shop.packPick')}</h2>
            <CardPack
                sealed
                look={packLookOf(pack)}
                label={label}
                type={type}
                revealKey={pack.map((c) => c.uid).join()}
                onRevealed={() => walk === 'wait' && setWalk('on')}
            >
                <div className="k-pick3 shop-pick" style={{ '--k-n': pack.length } as CSSProperties}>
                    {pack.map((inst, i) => {
                        const held = i === walkAt && walk !== 'done';
                        return (
                            <div
                                key={inst.uid}
                                // a carta do walkout não grita nem brilha no leque: o momento dela vem depois
                                data-cry={i === walkAt ? undefined : inst.speciesId}
                                className={`shop-offer cpack-card${i !== walkAt && isBigCard(inst) ? ' big' : ''}${
                                    held ? ' walk-held' : i === walkAt ? ' k-pop' : ''
                                }`}
                            >
                                <FutCard
                                    inst={inst}
                                    selected={pick === i}
                                    action={{
                                        label: t(pick === i ? 'reward.chosen' : 'reward.pick'),
                                        primary: true,
                                        onClick: () => onPick(pick === i ? null : i),
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </CardPack>
            {walk === 'on' && <Walkout inst={pack[walkAt]} onDone={() => setWalk('done')} />}
            <SheetRow icon="team" label={t('reward.yourTeam')} title={t('reward.yourTeam')} className="reward-team-row">
                <div className="reward-team">{team}</div>
            </SheetRow>
            <button type="button" className="btn ghost shop-pack-skip" onClick={onSkip}>
                {t('shop.packSkip')}
            </button>
            <Sheet open={pick !== null} onClose={() => onPick(null)} title={t('reward.whoLeaves')}>
                {target}
            </Sheet>
        </MomentStage>
    );
}
