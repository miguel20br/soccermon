import { useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { playSfx } from '../../game/audio';
import { stageLabel, useGame } from '../../store/game-store';
import { cardSprite, PokeCard } from '../components/PokeCard';

/**
 * Recompensa após vitória (estilo Slay the Spire): 1 de 3 — reforço para o banco ou item —,
 * ou pular e ganhar +1 reroll.
 */
export function Reward() {
    const { run, claimReward, skipReward, rerollReward } = useGame();
    const [chosen, setChosen] = useState<number | null>(null);
    if (run?.status !== 'reward') return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const reward = chosen !== null ? run.rewards[chosen] : null;
    const targets =
        reward?.kind === 'pokemon'
            ? run.bench.map((u) => byUid.get(u)!).filter((p) => p && p.uid !== run.captainUid)
            : [...run.lineup, ...run.bench].map((u) => byUid.get(u)!).filter(Boolean);

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">Vitória! Próxima fase: {stageLabel(run.stage + 1)}</div>
                    <h1>
                        {reward
                            ? reward.kind === 'pokemon'
                                ? 'Quem sai do banco?'
                                : 'Quem vai segurar o item?'
                            : 'Escolha uma recompensa'}
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
                        ↻ Sortear de novo ({run.rerolls})
                    </button>
                    <button type="button" className="btn small ghost" onClick={skipReward}>
                        Pular (+1 reroll)
                    </button>
                </div>
            </div>

            <div className="reward-grid">
                {run.rewards.map((r, i) => (
                    <div key={r.kind === 'item' ? r.item : r.inst.uid} className="option">
                        {r.kind === 'pokemon' ? (
                            <PokeCard
                                inst={r.inst}
                                selected={chosen === i}
                                onClick={() => {
                                    playSfx('select');
                                    setChosen(chosen === i ? null : i);
                                }}
                            />
                        ) : (
                            <button
                                type="button"
                                className={`card item-card${chosen === i ? ' selected' : ''}`}
                                onClick={() => {
                                    playSfx('select');
                                    setChosen(chosen === i ? null : i);
                                }}
                            >
                                <span className="tier-label">Item</span>
                                <img className="pixel item-art" src={itemSprite(r.item)} alt="" />
                                <b className="card-name">{ITEMS[r.item].name}</b>
                                <span className="tactic-desc">{ITEMS[r.item].desc}</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {reward && (
                <div className="panel">
                    <h2>{reward.kind === 'pokemon' ? 'Trocar por qual reserva?' : 'Entregar para…'}</h2>
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
                                            {reward.kind === 'pokemon'
                                                ? ` (${ITEMS[p.item]?.name} vai para o reforço)`
                                                : ` (troca a ${ITEMS[p.item]?.name})`}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
