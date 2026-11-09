import {
    type CSSProperties,
    lazy,
    type ReactNode,
    Suspense,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { formationOf } from '../../engine/formations';
import type { PokemonInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { interestOf, rerollPrice, type ShopOffer } from '../../engine/shop';
import { MAX_SPONSORS } from '../../engine/sponsors';
import { walkoutPick } from '../../game/walkout-plan';
import { itemDesc, itemName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { shopRerollTicket, useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, PackArt, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { SponsorCard, SponsorSlots } from '../components/SponsorCard';
import { TmCard } from '../components/TmTeach';
import { InfoSheet, SheetRow } from '../kit/controls';
import { MomentStage } from '../kit/MomentStage';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { reduceMotionOn } from '../settings-sync';
import { useHeld } from '../use-held';
import { GainTarget } from './Reward';
import '../shop.css';

// o walkout (e a cena do Phaser dele) só baixa quando um pacote do Mercado tem carta de walkout
const loadWalkout = () => import('../kit/WalkoutStage');
const Walkout = lazy(() => loadWalkout().then((m) => ({ default: m.Walkout })));

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
    const { lang, t } = useT();
    const shop = run?.shop;
    if (run?.status !== 'shop' || !shop) return null;
    const money = run.money ?? 0;
    const sponsors = run.sponsors ?? [];
    const offer = chosen !== null ? shop.offers[chosen] : null;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const packOffer = shop.offers.find((o) => o.kind === 'pack');
    const packName = packOffer?.kind === 'pack' ? t('shop.pack', { type: typeName(packOffer.type, lang) }) : '';
    // Rota: a troca grátis do Pular e o sorteio pagam a troca antes do ₽
    const ticket = shopRerollTicket(run);
    const reroll = ticket ? 0 : rerollPrice(shop.rerolls, sponsors);
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
            // quem recebe (ou qual Patrocínio sai, com as vagas cheias) abre numa sheet
            setChosen(chosen === i ? null : i);
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

    // o que entrou (vitória, gols, sem sofrer gol, Patrocínio, juros): a barra de cima conta o total; a conta fica no "?"
    const earnedSheet = (
        <InfoSheet title={t(e.win > 0 ? 'shop.earned.title' : 'shop.earned.titleInterest')}>
            <ul className="shop-earned-list">
                {earnedLines.map(([k, n]) => (
                    <li key={k}>
                        <span>{t(`shop.earned.${k}`)}</span>
                        <b className="money">+{t('shop.money', { n })}</b>
                    </li>
                ))}
            </ul>
            <p className="muted">{t('shop.interestHint', { cap })}</p>
        </InfoSheet>
    );

    return (
        <>
            {/* um palco que não rola (cara-de-jogo.md, Mercado): a vitrine numa prateleira e os Patrocínios na de baixo,
                cada uma corre de lado com a seta. O ₽ e a fase ficam na barra da copa */}
            <Stage
                className="shop-stage"
                action={
                    <>
                        {/* com o pacote aberto o Seguir espera; o momento por cima já diz "Escolha 1 carta do pacote"
                            (a dica aqui mudava a altura da barra e a vitrine pulava atrás) */}
                        {/* trocar a vitrine é o secundário (azul, à esquerda), como o Sortear da recompensa */}
                        <button
                            type="button"
                            className="btn shop-reroll"
                            aria-label={
                                ticket === 'reroll'
                                    ? t('shop.rerollTicketAria', { n: run.rerolls })
                                    : reroll === 0
                                      ? t('shop.rerollFree')
                                      : t('shop.reroll', { n: reroll })
                            }
                            disabled={money < reroll || !!shop.pack}
                            onClick={() => {
                                rerollShop();
                                setChosen(null);
                            }}
                        >
                            <HudIcon kind="reroll" />
                            {t('shop.rerollLabel')}
                            <span className="bc-tag">
                                {ticket === 'reroll'
                                    ? t('shop.rerollTicket')
                                    : reroll === 0
                                      ? t('shop.free')
                                      : t('shop.money', { n: reroll })}
                            </span>
                        </button>
                        <button
                            type="button"
                            className="btn confirm"
                            disabled={!!shop.pack}
                            onClick={() => {
                                leaveShop();
                            }}
                        >
                            {t('shop.leave')}
                            <HudIcon kind="next" />
                        </button>
                    </>
                }
            >
                <div className="draft-head bc-screenhead shop-head">
                    <div className="draft-title">
                        <h1>{t('shop.title')}</h1>
                        {earnedLines.length > 0 && earnedSheet}
                    </div>
                </div>
                {/* com o pacote aberto (o momento por cima) a vitrine fica atrás, sem foco nem toque */}
                <div className="shop-shelves-wrap" inert={!!shop.pack}>
                    {/* a vitrine: Contratações e Pacote e item lado a lado na mesma prateleira */}
                    <Rail className="shop-rack" label={t('shop.title')}>
                        <section className="shop-shelf">
                            <h2 className="shop-shelf-title">{t('shop.shelf.mons')}</h2>
                            <div className="shop-grid">{shelf(['pokemon']).map(offerTile)}</div>
                        </section>
                        <section className="shop-shelf">
                            <h2 className="shop-shelf-title">{t('shop.shelf.gear')}</h2>
                            {/* reward-pick3: o item e a MT no tamanho da carta, com o texto curto (as mesmas regras da recompensa) */}
                            <div className="shop-grid reward-pick3">{shelf(['pack', 'item', 'tm']).map(offerTile)}</div>
                        </section>
                    </Rail>
                    {/* os Patrocínios na prateleira de baixo (antes ficavam numa linha que abria a sheet); o nome
                            dela abre as 3 vagas */}
                    <section className="shop-shelf shop-sponsor-shelf">
                        <button
                            type="button"
                            className="shop-shelf-title shop-sponsor-row"
                            aria-haspopup="dialog"
                            onClick={() => setSponsorsOpen(true)}
                        >
                            <HudIcon kind="briefcase" />
                            <b>{t('shop.sponsors')}</b>
                            <span className="muted">{t('shop.slots', { n: sponsors.length })}</span>
                            <HudIcon kind="next" />
                        </button>
                        <Rail className="shop-sponsor-rail" label={t('shop.sponsors')}>
                            {shelf(['sponsor']).map(offerTile)}
                        </Rail>
                    </section>
                </div>
            </Stage>

            {shop.pack && (
                <PackMoment
                    pack={shop.pack}
                    label={packName}
                    type={packOffer?.kind === 'pack' ? packOffer.type : undefined}
                    pick={packPick}
                    onPick={setPackPick}
                    title={t(run.bench.includes('') ? 'reward.whereGoes' : 'reward.whoLeaves')}
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
            )}

            {/* as 3 vagas; com elas cheias, comprar outro abre aqui a escolha de quem sai */}
            <Sheet
                open={sponsorsOpen || offer?.kind === 'sponsor'}
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
                    <SponsorSlots sponsors={sponsors} />
                )}
            </Sheet>
            {/* Pokémon, item e MT: quem sai do banco, quem segura ou quem aprende, numa sheet (fechar = desfazer) */}
            <Sheet
                open={!!offer && offer.kind !== 'sponsor' && offer.kind !== 'pack'}
                onClose={() => setChosen(null)}
                title={
                    offer?.kind === 'pokemon'
                        ? t(run.bench.includes('') ? 'reward.whereGoes' : 'reward.whoLeaves')
                        : offer?.kind === 'tm'
                          ? t('reward.whoLearns')
                          : t('reward.whoHolds')
                }
                className="reward-sheet"
            >
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
            </Sheet>
        </>
    );
}

/**
 * Prateleira que corre de lado (padrão da loja do Balatro): o que não cabe fica à direita e a seta lateral leva até lá
 * (arrastar também). As setas só aparecem quando há o que ver daquele lado.
 */
function Rail({ children, className = '', label }: { children: ReactNode; className?: string; label: string }) {
    const { t } = useT();
    const track = useRef<HTMLDivElement>(null);
    const [edge, setEdge] = useState({ prev: false, next: false });
    const sync = useCallback(() => {
        const el = track.current;
        if (!el) return;
        const prev = el.scrollLeft > 4;
        const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
        setEdge((o) => (o.prev === prev && o.next === next ? o : { prev, next }));
    }, []);
    useLayoutEffect(() => {
        const el = track.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(el);
        for (const c of Array.from(el.children)) ro.observe(c);
        return () => ro.disconnect();
    }, [sync]);
    const step = (dir: -1 | 1) =>
        track.current?.scrollBy({
            left: dir * track.current.clientWidth * 0.8,
            behavior: reduceMotionOn() ? 'auto' : 'smooth',
        });
    return (
        <div className={`shop-rail ${className}`}>
            {/* biome-ignore lint/a11y/useSemanticElements: prateleira (rolagem de lado); fieldset traria estilo de formulário */}
            <div className="shop-rail-track" ref={track} onScroll={sync} role="group" aria-label={label}>
                {children}
            </div>
            <button
                type="button"
                className={`shop-rail-arrow prev${edge.prev ? ' on' : ''}`}
                aria-label={t('common.ui.prev')}
                tabIndex={edge.prev ? 0 : -1}
                aria-hidden={!edge.prev}
                onClick={() => step(-1)}
            >
                <HudIcon kind="prev" />
            </button>
            <button
                type="button"
                className={`shop-rail-arrow next${edge.next ? ' on' : ''}`}
                aria-label={t('common.ui.next')}
                tabIndex={edge.next ? 0 : -1}
                aria-hidden={!edge.next}
                onClick={() => step(1)}
            >
                <HudIcon kind="next" />
            </button>
        </div>
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
 * subindo e a melhor, se for ouro (75+) ou edição, fica guardada pro walkout do nível dela depois do leque (com Pular).
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
    title,
}: {
    pack: PokemonInstance[];
    label: string;
    type?: string;
    pick: number | null;
    onPick: (i: number | null) => void;
    onSkip: () => void;
    team: ReactNode;
    target: ReactNode;
    title: string;
}) {
    const { t } = useT();
    const walkAt = walkoutPick(pack);
    // 'wait' = guardada até o leque acabar; 'on' = o walkout tocando; 'done' = já na mesa
    const [walk, setWalk] = useState<'wait' | 'on' | 'done'>(walkAt < 0 ? 'done' : 'wait');
    useEffect(() => {
        if (walkAt >= 0)
            void loadWalkout()
                .then((m) => m.preloadWalkout())
                .catch(() => undefined);
    }, [walkAt]);
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
            {walk === 'on' && (
                <Suspense fallback={null}>
                    <Walkout inst={pack[walkAt]} onDone={() => setWalk('done')} />
                </Suspense>
            )}
            <SheetRow icon="team" label={t('reward.yourTeam')} title={t('reward.yourTeam')} className="reward-team-row">
                <div className="reward-team">{team}</div>
            </SheetRow>
            <button type="button" className="btn ghost shop-pack-skip" onClick={onSkip}>
                {t('shop.packSkip')}
            </button>
            <Sheet open={pick !== null} onClose={() => onPick(null)} title={title}>
                {target}
            </Sheet>
        </MomentStage>
    );
}
