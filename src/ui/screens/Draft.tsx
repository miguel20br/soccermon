import { useState } from 'react';
import { outOfPositionFactor, POSITION_LABEL, positionRating } from '../../engine/attributes';
import { DRAFT_ROUNDS } from '../../engine/draft';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { FUTSAL_SLOTS } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { type SlotRef, useGame } from '../../store/game-store';
import { cardSprite, PokeCard, TypeBadge } from '../components/PokeCard';
import { SLOT_XY } from './Lineup';

/** Nota do Pokémon numa vaga (banco usa a nota na posição natural). */
function ratingAt(inst: PokemonInstance, slot: SlotRef) {
    const view = viewInstance(inst);
    if (slot.zone === 'bench') return { rating: view.overall, off: false };
    const role = FUTSAL_SLOTS[slot.index];
    const factor = outOfPositionFactor(view.naturalPosition, role);
    return { rating: Math.round(positionRating(view.attributes, role) * factor), off: factor < 1 };
}

/**
 * Draft estilo "7 a 0": a cada rodada saem 3 Pokémon de qualquer posição;
 * você escolhe um e decide em qual vaga ele entra (quadra ou banco).
 */
export function Draft() {
    const { run, pick } = useGame();
    const [selected, setSelected] = useState<string | null>(null);
    if (!run || run.draftRound >= DRAFT_ROUNDS.length) return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const chosen = run.options.find((o) => o.uid === selected) ?? null;
    const filled = run.lineup.filter(Boolean).map((u) => byUid.get(u)!);
    const synergies = computeSynergies(filled);
    const avg = filled.length ? Math.round(filled.reduce((s, p) => s + viewInstance(p).overall, 0) / filled.length) : 0;

    const place = (slot: SlotRef) => {
        if (!chosen) return;
        playSfx('select');
        pick(chosen.uid, slot);
        setSelected(null);
    };

    const slotButton = (slot: SlotRef, uid: string, style?: React.CSSProperties) => {
        const label = slot.zone === 'bench' ? 'Banco' : POSITION_LABEL[FUTSAL_SLOTS[slot.index]];
        const key = `${slot.zone}-${slot.index}`;
        if (uid) {
            const inst = byUid.get(uid)!;
            const r = ratingAt(inst, slot);
            return (
                <div key={key} className="slot filled" style={style}>
                    <span className="pos-badge">{label}</span>
                    <img className="pixel" src={cardSprite(inst)} alt="" />
                    <span className="slot-name">{viewInstance(inst).displayName}</span>
                    <span className={`slot-rating${r.off ? ' warn' : ''}`}>{r.rating}</span>
                </div>
            );
        }
        const preview = chosen ? ratingAt(chosen, slot) : null;
        return (
            <button
                type="button"
                key={key}
                className={`slot empty${chosen ? ' target' : ''}`}
                style={style}
                disabled={!chosen}
                onClick={() => place(slot)}
                aria-label={chosen ? `Colocar ${viewInstance(chosen).displayName} como ${label}` : `${label} (vaga)`}
            >
                <span className="pos-badge">{label}</span>
                {chosen && preview ? (
                    <>
                        <img className="pixel ghost" src={cardSprite(chosen)} alt="" />
                        <span className={`slot-rating${preview.off ? ' warn' : ''}`}>
                            {preview.rating}
                            {preview.off && ' · fora'}
                        </span>
                    </>
                ) : (
                    <span className="slot-empty">vaga</span>
                )}
            </button>
        );
    };

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">
                        Rodada {run.draftRound + 1} de {DRAFT_ROUNDS.length}
                    </div>
                    <h1>
                        {chosen ? `Onde ${viewInstance(chosen).displayName} vai jogar?` : 'Escolha um dos 3 sorteados'}
                    </h1>
                </div>
                <div className="steps" role="img" aria-label="Progresso do draft">
                    {DRAFT_ROUNDS.map((r) => (
                        <span
                            key={r.index}
                            className={r.index < run.draftRound ? 'done' : r.index === run.draftRound ? 'now' : ''}
                        />
                    ))}
                </div>
            </div>

            <div className="draft-grid">
                <div className="options">
                    {run.options.map((o) => (
                        <div key={o.uid} className={`option${selected === o.uid ? ' chosen' : ''}`}>
                            <PokeCard
                                inst={o}
                                onClick={() => {
                                    playSfx('select');
                                    setSelected(selected === o.uid ? null : o.uid);
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="panel">
                    <h2>{run.teamName}</h2>
                    <p className="muted" style={{ marginTop: 0 }}>
                        {chosen
                            ? 'Clique numa vaga livre. O número é a nota dele naquela posição.'
                            : 'Selecione um Pokémon para ver onde ele rende mais.'}
                    </p>
                    <div className="court small-court">
                        {run.lineup.map((uid, i) =>
                            slotButton({ zone: 'lineup', index: i }, uid, {
                                left: `${SLOT_XY[i][0]}%`,
                                top: `${SLOT_XY[i][1]}%`,
                            }),
                        )}
                    </div>
                    <div className="bench">
                        {run.bench.map((uid, i) => slotButton({ zone: 'bench', index: i }, uid))}
                    </div>
                    <div className="row" style={{ marginTop: 12, gap: 8 }}>
                        {filled.length > 0 && <span className="muted">Média dos titulares: {avg}</span>}
                        {synergies.map((s) => (
                            <span key={s.type} className="row" style={{ gap: 4 }}>
                                <TypeBadge type={s.type} />
                                <span className="tactic-desc">
                                    ×{s.count} +{Math.round((s.bonus - 1) * 100)}%
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
