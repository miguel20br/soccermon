import { useState } from 'react';
import { formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { playSfx } from '../../game/audio';
import { clubName, itemDesc, itemName, stageName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { FormationBoard } from '../components/FormationBoard';
import { ExpandIcon, FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { TmCard, TmTeachPanel } from '../components/TmTeach';
import { TypeIcon } from '../components/TypeIcon';
import { Tip } from '../help/Tip';
import { type ItemFit, itemFit } from '../item-fit';

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
    const { run, claimReward, skipReward, rerollReward } = useGame();
    const [chosen, setChosen] = useState<number | null>(null);
    const { lang, t, tn } = useT();
    if (run?.status !== 'reward') return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const reward = chosen !== null ? run.rewards[chosen] : null;
    const squad = [...run.lineup, ...run.bench].map((u) => byUid.get(u)!).filter(Boolean);
    const targets =
        reward?.kind === 'pokemon'
            ? run.bench.map((u) => byUid.get(u)!).filter((p) => p && p.uid !== run.captainUid)
            : squad;
    const pick = (i: number) => {
        playSfx('select');
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

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">
                        {t('reward.nextStage', { stage: stageName(run.stage + 1, lang) || t('reward.cup') })}
                    </div>
                    <h1>
                        {reward
                            ? reward.kind === 'pokemon'
                                ? t('reward.whoLeaves')
                                : reward.kind === 'tm'
                                  ? t('reward.whoLearns')
                                  : t('reward.whoHolds')
                            : t('reward.choose')}
                    </h1>
                </div>
                <div className="row">
                    <button
                        type="button"
                        className="btn small"
                        disabled={run.rerolls <= 0}
                        onClick={() => {
                            playSfx('select');
                            rerollReward();
                            setChosen(null);
                        }}
                    >
                        {t('reward.reroll', { n: run.rerolls })}
                    </button>
                    <button type="button" className="btn small ghost" onClick={skipReward}>
                        {t('reward.skip')}
                    </button>
                </div>
            </div>

            <Tip id="reward-pick">{t('reward.tip')}</Tip>

            <div className="reward-grid">
                {run.rewards.map((r, i) => (
                    <div
                        key={r.kind === 'item' ? r.item : r.kind === 'tm' ? `tm-${r.move}` : r.inst.uid}
                        className={`option${r.kind === 'tm' ? ' option-tm' : ''}`}
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
                                    label: t(chosen === i ? 'reward.chosen' : r.from ? 'reward.sign' : 'reward.pick'),
                                    primary: true,
                                    onClick: () => {
                                        playSfx('select');
                                        setChosen(chosen === i ? null : i);
                                    },
                                }}
                            />
                        ) : r.kind === 'tm' ? (
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
                    </div>
                ))}
            </div>

            {reward?.kind === 'tm' && (
                <TmTeachPanel
                    move={reward.move}
                    team={squad}
                    onTeach={(uid, slot) => {
                        playSfx('select');
                        claimReward(chosen!, uid, slot);
                    }}
                />
            )}
            {reward && reward.kind !== 'tm' && (
                <div className="panel reward-pick">
                    <h2>{t(reward.kind === 'pokemon' ? 'reward.swapWhich' : 'reward.giveTo')}</h2>
                    <div className="squad-strip">
                        {targets.map((p) => (
                            <button
                                key={p.uid}
                                type="button"
                                className={`mini target-btn${fitOf(p)?.count === 0 ? ' dim' : ''}`}
                                onClick={() => {
                                    playSfx('select');
                                    claimReward(chosen!, p.uid);
                                }}
                            >
                                <img className="pixel" src={cardSprite(p)} alt="" />
                                <span>
                                    <b>{viewInstance(p).displayName}</b>
                                    {fitItem && fitOf(p) && (
                                        <FitBadge fit={fitOf(p)!} item={fitItem} text={fitText(fitOf(p)!)} full />
                                    )}
                                    {p.item && (
                                        <span className="muted">
                                            {t(
                                                reward.kind === 'pokemon'
                                                    ? 'reward.itemGoesToNew'
                                                    : 'reward.replacesItem',
                                                {
                                                    item: itemName(p.item),
                                                },
                                            )}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="panel reward-team">
                <h2>{t('reward.yourTeam')}</h2>
                <p className="muted" style={{ marginTop: 0 }}>
                    {reward?.kind === 'pokemon'
                        ? t('reward.positionsHint', { name: viewInstance(reward.inst).displayName })
                        : t('reward.compare')}
                </p>
                <p className="muted reward-open-hint">
                    <ExpandIcon />
                    {t('reward.openCard')}
                </p>
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
                    projection={reward?.kind === 'pokemon' ? reward.inst : null}
                    onSlot={(ref, uid) => {
                        const inst = byUid.get(uid);
                        if (!inst) return;
                        playSfx('select');
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
        </>
    );
}
