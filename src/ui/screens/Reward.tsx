import { useState } from 'react';
import { formationOf } from '../../engine/formations';
import type { PokemonInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import type { Reward as RewardDef } from '../../engine/rewards';
import type { ShopOffer } from '../../engine/shop';
import { editionOf } from '../../engine/specials';
import { clubName, itemDesc, itemName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { type RunState, useGame } from '../../store/game-store';
import { currentNode, isLong } from '../../store/long-cup';
import { useCardModal } from '../card-modal';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { ExpandIcon, FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { TmCard, TmTeachPanel } from '../components/TmTeach';
import { TypeIcon } from '../components/TypeIcon';
import { Tip, useFirstCup } from '../help/Tip';
import { type ItemFit, itemFit } from '../item-fit';
import { readCount, writeCount } from '../local-count';
import { useHeld } from '../use-held';

/** Quantas telas de recompensa a pessoa já abriu (neste navegador): da 7ª em diante, a abertura é rápida. */
const PACKS_KEY = 'soccermon-packs-opened';
const FAST_AFTER = 6;

const rewardKey = (r: RewardDef) => (r.kind === 'item' ? r.item : r.kind === 'tm' ? `tm-${r.move}` : r.inst.uid);

/** Selo "quantos golpes este item aproveita": ícone do tipo (ou do item) + número; `full` mostra o texto. */
function FitBadge({ fit, item, text, full }: { fit: ItemFit; item: string; text: string; full?: boolean }) {
    return (
        <span className={`fit-badge${fit.count === 0 ? ' none' : ''}${full ? ' full' : ''}`} title={text}>
            {fit.type ? <TypeIcon type={fit.type} /> : <img className="pixel" src={itemSprite(item)} alt="" />}
            {full ? text : fit.count}
        </span>
    );
}

/**
 * Recompensa após vitória (estilo Slay the Spire): 1 de 3 — reforço para o banco, item ou MT do ginásio —,
 * ou pular e ganhar +1 reroll.
 */
export function Reward() {
    const { run: live, claimReward, skipReward, rerollReward } = useGame();
    const run = useHeld(live?.status === 'reward' ? live : null);
    const [chosen, setChosen] = useState<number | null>(null);
    const { lang, t, tn } = useT();
    const firstCup = useFirstCup();
    // a festa encurta: da 7ª tela de recompensa em diante, o pacote abre rápido e as cartas saem quase juntas
    const [fast] = useState(() => (readCount(PACKS_KEY) ?? 0) >= FAST_AFTER);
    if (run?.status !== 'reward') return null;
    const countOpen = () => writeCount(PACKS_KEY, (readCount(PACKS_KEY) ?? 0) + 1);
    const mons = run.rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst] : []));
    // treino de técnica da Rota (ninguém evolui): pacote do treino, só itens
    const training = isLong(run) && !run.group && currentNode(run)?.kind === 'treino';

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const reward = chosen !== null ? run.rewards[chosen] : null;
    const squad = [...run.lineup, ...run.bench].map((u) => byUid.get(u)!).filter(Boolean);
    const pick = (i: number) => {
        setChosen(chosen === i ? null : i);
    };
    // item que depende dos golpes (tipo, King's Rock): quantos golpes de cada um ele aproveita
    const fitItem = reward?.kind === 'item' ? reward.item : null;
    const fitOf = (p: PokemonInstance) => (fitItem ? itemFit(fitItem, p) : null);
    const fitText = (f: ItemFit) =>
        f.type
            ? tn('reward.fit.typeCount', f.count, { type: typeName(f.type, lang) })
            : tn('reward.fit.hitCount', f.count);
    const sampleFit = fitItem && squad[0] ? fitOf(squad[0]) : null;
    const slots = formationOf(run.formation).slots;
    const openCard = useCardModal.getState().open;
    const title = reward
        ? reward.kind === 'pokemon'
            ? t('reward.whoLeaves')
            : reward.kind === 'tm'
              ? t('reward.whoLearns')
              : t('reward.whoHolds')
        : t('reward.choose');

    return (
        <>
            {/* a fase fica só na barra da copa; sortear e pular moram juntos na barra de baixo */}
            <div className="draft-head bc-screenhead">
                <div className="draft-title">
                    <h1>{title}</h1>
                </div>
            </div>

            <CardPack
                sealed
                autoOpen
                fast={fast}
                look={packLookOf(mons)}
                label={t(training ? 'reward.pack.training' : 'reward.pack.label')}
                revealKey={run.rewards.map(rewardKey).join()}
                onOpen={countOpen}
            >
                <div className="reward-grid">
                    {run.rewards.map((r, i) => (
                        <div
                            key={rewardKey(r)}
                            data-cry={r.kind === 'pokemon' ? r.inst.speciesId : undefined}
                            className={`option cpack-card${r.kind === 'tm' ? ' option-tm' : ''}${
                                r.kind === 'pokemon' && isBigCard(r.inst) ? ' big' : ''
                            }${!fast && r.kind === 'pokemon' && editionOf(r.inst) ? ' walk' : ''}`}
                        >
                            {r.kind === 'pokemon' ? (
                                <FutCard
                                    inst={r.inst}
                                    selected={chosen === i}
                                    ribbon={
                                        r.from
                                            ? t('reward.fromClub', { club: clubName(r.from, lang) })
                                            : t('reward.reinforcement')
                                    }
                                    action={{
                                        label: t(
                                            chosen === i ? 'reward.chosen' : r.from ? 'reward.sign' : 'reward.pick',
                                        ),
                                        primary: true,
                                        onClick: () => {
                                            setChosen(chosen === i ? null : i);
                                        },
                                    }}
                                />
                            ) : (
                                // item e MT com o mesmo botão "Escolher" da carta do Pokémon (antes parecia que só o
                                // Pokémon dava pra escolher)
                                <div className="fut-wrap">
                                    {r.kind === 'tm' ? (
                                        <TmCard
                                            move={r.move}
                                            leader={r.leader}
                                            team={squad}
                                            selected={chosen === i}
                                            onClick={() => pick(i)}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className={`card item-card${chosen === i ? ' selected' : ''}`}
                                            onClick={() => pick(i)}
                                        >
                                            <span className="tier-label">{t('reward.item')}</span>
                                            <img className="pixel item-art" src={itemSprite(r.item)} alt="" />
                                            <b className="card-name">{itemName(r.item)}</b>
                                            <span className="tactic-desc">{itemDesc(r.item, lang)}</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn small confirm fut-action"
                                        aria-pressed={chosen === i}
                                        onClick={() => pick(i)}
                                    >
                                        {t(chosen === i ? 'reward.chosen' : 'reward.pick')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardPack>
            {/* a dica fica embaixo das opções que ela explica (só na 1ª copa) */}
            {!reward && !training && <Tip id="reward-pick">{t('reward.tip')}</Tip>}

            {reward && (
                <GainTarget
                    key={chosen}
                    gain={reward}
                    run={run}
                    onClaim={(uid, slot, passTo) => claimReward(chosen!, uid, slot, passTo)}
                />
            )}
            {/* com Pokémon ou item escolhido, a prancheta de escolher fica no lugar desta */}
            {(!reward || reward.kind === 'tm') && (
                <div className="panel reward-team">
                    <h2>{t('reward.yourTeam')}</h2>
                    {firstCup && (
                        <>
                            <p className="muted" style={{ marginTop: 0 }}>
                                {t('reward.compare')}
                            </p>
                            <p className="muted reward-open-hint">
                                <ExpandIcon />
                                {t('reward.openCard')}
                            </p>
                        </>
                    )}
                    {fitItem && sampleFit && (
                        <p className="reward-fit-legend">
                            <FitBadge fit={{ ...sampleFit, count: 1 }} item={fitItem} text="" />
                            {sampleFit.type
                                ? t('reward.fit.typeLegend', {
                                      item: itemName(fitItem),
                                      type: typeName(sampleFit.type, lang),
                                  })
                                : t('reward.fit.hitLegend', { item: itemName(fitItem) })}
                        </p>
                    )}
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        onSlot={(ref, uid) => {
                            const inst = byUid.get(uid);
                            if (!inst) return;
                            openCard(inst, {
                                position: ref.zone === 'lineup' ? slots[ref.index] : undefined,
                                captain: inst.uid === run.captainUid,
                            });
                        }}
                        badgeOf={(p) => {
                            const f = fitOf(p);
                            // na quadra só quem aproveita ganha o selo (quem não aproveita já fica apagado)
                            return f?.count && fitItem ? <FitBadge fit={f} item={fitItem} text={fitText(f)} /> : null;
                        }}
                        dimOf={(p) => fitOf(p)?.count === 0}
                        slotAria={(p) => {
                            const f = fitOf(p);
                            return `${f ? `, ${fitText(f)}` : ''}${t('reward.openAria')}`;
                        }}
                    />
                </div>
            )}
            {/* pular é discreto (fantasma à esquerda); sortear de novo à direita */}
            <div className="bc-thumbbar reward-bar">
                <button type="button" className="btn ghost" onClick={skipReward}>
                    {t('reward.skip')}
                </button>
                <button
                    type="button"
                    className="btn"
                    disabled={run.rerolls <= 0}
                    onClick={() => {
                        rerollReward();
                        setChosen(null);
                    }}
                >
                    <HudIcon kind="reroll" />
                    {t('reward.reroll', { n: run.rerolls })}
                </button>
            </div>
        </>
    );
}

/** O que a recompensa (ou a compra do Mercado) pede: quem sai do banco, quem aprende a MT ou quem segura o item. */
export function GainTarget({
    gain: reward,
    run,
    onClaim,
}: {
    gain: Exclude<RewardDef | ShopOffer, { kind: 'pack' | 'sponsor' }>;
    run: RunState;
    onClaim: (uid: string, forgetSlot?: number, passTo?: string) => void;
}) {
    // item novo pra quem já segura um: quem vai segurar o novo (falta escolher pra quem vai o antigo)
    const [holder, setHolder] = useState<string | null>(null);
    const { lang, t, tn } = useT();
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const squad = [...run.lineup, ...run.bench].map((u) => byUid.get(u)!).filter(Boolean);
    const targets =
        reward.kind === 'pokemon'
            ? run.bench.map((u) => byUid.get(u)!).filter((p) => p && p.uid !== run.captainUid)
            : squad;
    const holding = holder ? byUid.get(holder) : null;
    // 2º passo do item: quem segurava já tinha um item, falta escolher quem fica com o antigo
    const passing = reward.kind === 'item' && !!holding?.item;
    const canPick = new Set((passing ? squad.filter((p) => p.uid !== holder) : targets).map((p) => p.uid));
    const fitItem = reward.kind === 'item' ? reward.item : null;
    const fitOf = (p: PokemonInstance) => (fitItem ? itemFit(fitItem, p) : null);
    const fitText = (f: ItemFit) =>
        f.type
            ? tn('reward.fit.typeCount', f.count, { type: typeName(f.type, lang) })
            : tn('reward.fit.hitCount', f.count);
    return (
        <>
            {reward.kind === 'tm' && (
                <TmTeachPanel
                    move={reward.move}
                    team={squad}
                    onTeach={(uid, slot) => {
                        onClaim(uid, slot);
                    }}
                />
            )}
            {reward.kind !== 'tm' && (
                // na prancheta: toca em quem sai do banco / em quem segura o item; se ele já tem item, toca em quem
                // fica com o antigo (ou descarta). As cartas que podem ser escolhidas acendem, as outras apagam.
                <div className="panel reward-pick" data-exit>
                    <h2>
                        {passing
                            ? t('reward.passTitle', { item: itemName(holding!.item!) })
                            : t(reward.kind === 'pokemon' ? 'reward.swapWhich' : 'reward.giveTo')}
                    </h2>
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        projection={reward.kind === 'pokemon' ? reward.inst : null}
                        stateOf={(_ref, uid) => (uid === holder ? 'selected' : canPick.has(uid) ? 'target' : 'locked')}
                        onSlot={(_ref, uid) => {
                            if (!canPick.has(uid)) return;
                            if (passing) onClaim(holder!, undefined, uid);
                            else if (reward.kind === 'item' && byUid.get(uid)?.item) setHolder(uid);
                            else onClaim(uid);
                        }}
                        badgeOf={(p) => {
                            const f = fitOf(p);
                            return f?.count && fitItem && !passing ? (
                                <FitBadge fit={f} item={fitItem} text={fitText(f)} />
                            ) : null;
                        }}
                        dimOf={(p) => !passing && fitOf(p)?.count === 0}
                        slotAria={(p) =>
                            p.item
                                ? `, ${t(reward.kind === 'pokemon' ? 'reward.itemGoesToNew' : passing ? 'reward.replacesItem' : 'reward.passesItem', { item: itemName(p.item) })}`
                                : ''
                        }
                    />
                    {passing && (
                        <div className="row reward-pass-actions">
                            <button
                                type="button"
                                className="btn small ghost"
                                onClick={() => {
                                    onClaim(holder!);
                                }}
                            >
                                {t('reward.discardItem', { item: itemName(holding!.item!) })}
                            </button>
                            <button type="button" className="btn small ghost" onClick={() => setHolder(null)}>
                                {t('common.ui.back')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
