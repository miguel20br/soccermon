import { useState } from 'react';
import { POSITION_LABEL } from '../../engine/attributes';
import { DRAFT_PICKS } from '../../engine/draft';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { type SlotRef, slotRole, useGame } from '../../store/game-store';
import { FormationBoard } from '../components/FormationBoard';
import { PokeCard, TypeBadge } from '../components/PokeCard';

/** Desenho mini da formação (bolinhas nas posições da UI). */
function FormationDiagram({ id }: { id: FormationId }) {
    const f = FORMATIONS[id];
    return (
        <svg viewBox="0 0 60 80" className="formation-diagram" aria-hidden>
            <rect x="1" y="1" width="58" height="78" rx="3" />
            <line x1="1" y1="40" x2="59" y2="40" />
            {f.ui.map(([x, y], i) => (
                <circle key={`${x}-${y}`} cx={(x / 100) * 60} cy={(y / 100) * 80} r={i === 0 ? 4 : 5} />
            ))}
        </svg>
    );
}

/**
 * Draft estilo "7 a 0": formação → capitão (1 de 3 raros, qualquer vaga) → a cada rodada você escolhe a
 * vaga e saem 3 Pokémon que jogam naquela posição.
 */
export function Draft() {
    const { run, chooseFormation, chooseSlot, pick, reroll } = useGame();
    const [selected, setSelected] = useState<string | null>(null);
    if (!run) return null;

    if (run.status === 'formation') {
        return (
            <>
                <div className="draft-head">
                    <div>
                        <div className="muted">Antes do draft</div>
                        <h1>Escolha a formação</h1>
                    </div>
                </div>
                <div className="formation-picker">
                    {Object.values(FORMATIONS).map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            className="panel formation-option"
                            onClick={() => {
                                playSfx('select');
                                chooseFormation(f.id);
                            }}
                        >
                            <FormationDiagram id={f.id} />
                            <b>{f.name}</b>
                            <span className="muted">{f.slots.map((s) => POSITION_LABEL[s]).join(' · ')}</span>
                            <span className="tactic-desc">{f.description}</span>
                        </button>
                    ))}
                </div>
            </>
        );
    }

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const isCaptain = run.status === 'captain';
    const chosen = isCaptain ? (run.options.find((o) => o.uid === selected) ?? null) : null;
    const filled = run.lineup.filter(Boolean).map((u) => byUid.get(u)!);
    const synergies = computeSynergies(filled);
    const avg = filled.length ? Math.round(filled.reduce((s, p) => s + viewInstance(p).overall, 0) / filled.length) : 0;
    const role = run.draftSlot ? slotRole(run, run.draftSlot) : null;
    const roleLabel = role === 'ANY' ? 'o banco' : role ? POSITION_LABEL[role] : '';

    const title = isCaptain
        ? chosen
            ? `Em que vaga ${viewInstance(chosen).displayName} vai jogar?`
            : 'Escolha seu capitão'
        : run.draftSlot
          ? `Escolha quem vai para ${roleLabel === 'o banco' ? roleLabel : `a vaga de ${roleLabel}`}`
          : 'Escolha uma posição para preencher';

    const hint = isCaptain
        ? chosen
            ? 'Toque numa vaga: o número é a nota dele ali.'
            : 'O capitão dá +3% ao time e +6% a quem divide tipo com ele.'
        : run.draftSlot
          ? 'Saíram 3 Pokémon que jogam nessa posição.'
          : 'Toque numa vaga livre na quadra ou no banco.';

    const onSlot = (slot: SlotRef, uid: string) => {
        if (uid) return;
        playSfx('select');
        if (isCaptain) {
            if (!chosen) return;
            pick(chosen.uid, slot);
            setSelected(null);
        } else {
            chooseSlot(slot);
        }
    };

    const slotState = (slot: SlotRef, uid: string) => {
        if (uid) return 'locked' as const;
        if (isCaptain) return chosen ? ('target' as const) : ('locked' as const);
        if (run.draftSlot) {
            return run.draftSlot.zone === slot.zone && run.draftSlot.index === slot.index ? 'selected' : 'locked';
        }
        return 'target' as const;
    };

    const showOptions = isCaptain || !!run.draftSlot;

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">
                        {isCaptain ? 'Capitão' : `Escolha ${run.draftRound + 1} de ${DRAFT_PICKS}`} ·{' '}
                        {FORMATIONS[run.formation].name}
                    </div>
                    <h1>{title}</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        {hint}
                    </p>
                </div>
                <div className="steps" role="img" aria-label="Progresso do draft">
                    {Array.from({ length: DRAFT_PICKS }, (_, i) => (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                            key={i}
                            className={i < run.draftRound ? 'done' : i === run.draftRound ? 'now' : ''}
                        />
                    ))}
                </div>
            </div>

            <div className="draft-grid">
                <div className="panel board-panel">
                    <h2>{run.teamName}</h2>
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        preview={chosen}
                        projection={chosen}
                        stateOf={slotState}
                        onSlot={onSlot}
                        footer={
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
                        }
                    />
                </div>

                {showOptions && (
                    <div className="draft-options">
                        <div className="row options-bar">
                            <span className="muted">
                                {isCaptain ? 'Candidatos a capitão' : `Opções para ${roleLabel}`}
                            </span>
                            <button
                                type="button"
                                className="btn small"
                                disabled={run.rerolls <= 0}
                                onClick={() => {
                                    playSfx('select');
                                    reroll();
                                    setSelected(null);
                                }}
                            >
                                ↻ Sortear de novo ({run.rerolls})
                            </button>
                        </div>
                        <div className="options">
                            {run.options.map((o) => (
                                <div key={o.uid} className="option">
                                    <PokeCard
                                        inst={o}
                                        position={role && role !== 'ANY' ? role : undefined}
                                        captain={isCaptain}
                                        selected={selected === o.uid}
                                        onClick={() => {
                                            playSfx('select');
                                            if (isCaptain) setSelected(selected === o.uid ? null : o.uid);
                                            else pick(o.uid);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
