import { useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { playSfx } from '../../game/audio';
import { clubName, itemDesc, itemName, stageName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { TmCard, TmTeachPanel } from '../components/TmTeach';
import { Tip } from '../help/Tip';

/**
 * Recompensa após vitória (estilo Slay the Spire): 1 de 3 — reforço para o banco, item ou MT do ginásio —,
 * ou pular e ganhar +1 reroll.
 */
export function Reward() {
    const { run, claimReward, skipReward, rerollReward } = useGame();
    const [chosen, setChosen] = useState<number | null>(null);
    const { lang, t } = useT();
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
                                className="mini target-btn"
                                onClick={() => {
                                    playSfx('select');
                                    claimReward(chosen!, p.uid);
                                }}
                            >
                                <img className="pixel" src={cardSprite(p)} alt="" />
                                <span>
                                    <b>{viewInstance(p).displayName}</b>
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
                <FormationBoard
                    formation={run.formation}
                    lineup={run.lineup}
                    bench={run.bench}
                    byUid={byUid}
                    captainUid={run.captainUid}
                    projection={reward?.kind === 'pokemon' ? reward.inst : null}
                />
            </div>
        </>
    );
}
