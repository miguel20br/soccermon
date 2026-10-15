import { useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { playSfx } from '../../game/audio';
import { stageLabel, useGame } from '../../store/game-store';
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
                    <div className="muted">Vitória! Próxima fase: {stageLabel(run.stage + 1)}</div>
                    <h1>
                        {reward
                            ? reward.kind === 'pokemon'
                                ? 'Quem sai do banco?'
                                : reward.kind === 'tm'
                                  ? 'Quem aprende o golpe?'
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

            <Tip id="reward-pick">
                Dá pra contratar do time que você eliminou: o Pokémon novo entra no lugar de um reserva (e herda o item
                dele). A MT do ginásio ensina um golpe novo: você escolhe quem aprende e o que esquece. Pular não pega
                nada, mas dá +1 reroll.
            </Tip>

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
                                ribbon={r.from ? `Do ${r.from}` : 'Reforço'}
                                action={{
                                    label: chosen === i ? 'Escolhido' : r.from ? 'Contratar' : 'Escolher',
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
                                <span className="tier-label">Item</span>
                                <img className="pixel item-art" src={itemSprite(r.item)} alt="" />
                                <b className="card-name">{ITEMS[r.item].name}</b>
                                <span className="tactic-desc">{ITEMS[r.item].desc}</span>
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
            <div className="panel reward-team">
                <h2>Seu time</h2>
                <p className="muted" style={{ marginTop: 0 }}>
                    {reward?.kind === 'pokemon'
                        ? `Verde: posições em que ${viewInstance(reward.inst).displayName} joga bem · vermelho: fora de posição.`
                        : 'Compare com o seu elenco antes de escolher.'}
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
