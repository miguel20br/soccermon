import { useState } from 'react';
import { outOfPositionFactor, POSITION_LABEL, positionRating } from '../../engine/attributes';
import { CUP_STAGES } from '../../engine/cup';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { FUTSAL_SLOTS, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { playerTeam, type SlotRef, stageLabel, useGame } from '../../store/game-store';
import { cardSprite, PokeCard, TypeBadge } from '../components/PokeCard';
import { simulateMatch } from '../sim-client';

// posições no mini-campo (vertical, ataque para cima), na ordem dos slots: GK, Fixo, Ala, Ala, Pivô
export const SLOT_XY: [number, number][] = [
    [50, 87],
    [50, 62],
    [20, 37],
    [80, 37],
    [50, 13],
];

const TACTIC_DESC: Record<Tactic, string> = {
    balanced: 'Sem bônus nem custo.',
    offensive: 'Linhas altas e mais chutes. Cansa mais e abre espaço atrás.',
    defensive: 'Bloco baixo: melhor desarme e leitura. Ataca pouco.',
    counter: 'Pivô espera lá na frente; passes e arrancadas mais rápidos.',
};

function slotRating(inst: PokemonInstance, slot: number) {
    const view = viewInstance(inst);
    const role = FUTSAL_SLOTS[slot];
    const factor = outOfPositionFactor(view.naturalPosition, role);
    return {
        rating: Math.round(positionRating(view.attributes, role) * factor),
        outOfPosition: factor < 1,
        natural: view.naturalPosition,
    };
}

export function Lineup() {
    const { run, swapSlots, setTactic, setMatch, go, abandonRun } = useGame();
    const [selected, setSelected] = useState<SlotRef | null>(null);
    const [detail, setDetail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    if (!run) return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const opponent = run.opponents[run.stage];
    const detailInst = byUid.get(detail ?? run.lineup[0]) ?? run.picks[0];
    const synergies = computeSynergies(run.lineup.map((u) => byUid.get(u)!));

    const clickSlot = (ref: SlotRef) => {
        const uid = (ref.zone === 'lineup' ? run.lineup : run.bench)[ref.index];
        setDetail(uid);
        if (!selected) {
            setSelected(ref);
            return;
        }
        if (selected.zone !== ref.zone || selected.index !== ref.index) {
            playSfx('select');
            swapSlots(selected, ref);
        }
        setSelected(null);
    };

    const play = async () => {
        setLoading(true);
        const result = await simulateMatch(playerTeam(run), opponent, `${run.seed}-stage-${run.stage}`);
        setMatch(result);
        setLoading(false);
        go('match');
    };

    const isSel = (zone: SlotRef['zone'], index: number) => selected?.zone === zone && selected.index === index;

    return (
        <>
            <div className="panel">
                <div className="cup-path">
                    {CUP_STAGES.map((label, i) => {
                        const res = run.results.find((r) => r.stage === i);
                        const cls = res ? (res.won ? 'won' : 'lost') : i === run.stage ? 'now' : '';
                        return (
                            <div key={label} className={`cup-step ${cls}`}>
                                <b>{label}</b>
                                <span className="muted">{run.opponents[i].name}</span>
                                {res && (
                                    <div>
                                        {res.score[0]} x {res.score[1]}
                                        {res.shootout && ` (pên. ${res.shootout[0]}x${res.shootout[1]})`}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="lineup-grid">
                <div className="panel">
                    <h2>Escalação — {run.teamName}</h2>
                    <p className="muted" style={{ marginTop: 0 }}>
                        Clique em dois jogadores para trocá-los de posição (inclusive com o banco).
                    </p>
                    <div className="court">
                        {run.lineup.map((uid, i) => {
                            const inst = byUid.get(uid)!;
                            const r = slotRating(inst, i);
                            return (
                                <button
                                    type="button"
                                    key={uid}
                                    className={`slot${isSel('lineup', i) ? ' selected' : ''}`}
                                    style={{ left: `${SLOT_XY[i][0]}%`, top: `${SLOT_XY[i][1]}%` }}
                                    onClick={() => clickSlot({ zone: 'lineup', index: i })}
                                >
                                    <span className="pos-badge">{POSITION_LABEL[FUTSAL_SLOTS[i]]}</span>
                                    <img className="pixel" src={cardSprite(inst)} alt="" />
                                    <span className="slot-name">{viewInstance(inst).displayName}</span>
                                    <span className={`slot-rating${r.outOfPosition ? ' warn' : ''}`}>
                                        {r.rating}
                                        {r.outOfPosition && ` · é ${POSITION_LABEL[r.natural]}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="bench">
                        {run.bench.map((uid, i) => {
                            const inst = byUid.get(uid)!;
                            return (
                                <button
                                    type="button"
                                    key={uid}
                                    className={`slot${isSel('bench', i) ? ' selected' : ''}`}
                                    onClick={() => clickSlot({ zone: 'bench', index: i })}
                                >
                                    <span className="pos-badge">Banco</span>
                                    <img className="pixel" src={cardSprite(inst)} alt="" />
                                    <span className="slot-name">{viewInstance(inst).displayName}</span>
                                    <span className="slot-rating">{viewInstance(inst).overall}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                        Reservas entram no intervalo no lugar de quem estiver cansado.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: 'var(--gap)', alignContent: 'start' }}>
                    <div className="panel">
                        <h2>Tática</h2>
                        <div className="tactics">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`btn small${run.tactic === t ? ' active' : ''}`}
                                    onClick={() => setTactic(t)}
                                >
                                    {TACTIC_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        <p className="tactic-desc">{TACTIC_DESC[run.tactic]}</p>
                        <h3 style={{ marginTop: 12 }}>Sinergias de tipo</h3>
                        {synergies.length === 0 ? (
                            <p className="tactic-desc">Escale 2+ titulares do mesmo tipo para ganhar bônus.</p>
                        ) : (
                            <div className="row" style={{ gap: 8 }}>
                                {synergies.map((s) => (
                                    <span key={s.type} className="row" style={{ gap: 4 }}>
                                        <TypeBadge type={s.type} />
                                        <span className="tactic-desc">
                                            ×{s.count} · +{Math.round((s.bonus - 1) * 100)}%
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="panel">
                        <h2>
                            {stageLabel(run.stage)}: {opponent.name}
                        </h2>
                        <div className="opponent-strip">
                            {opponent.lineup.map((p) => (
                                <img
                                    key={p.uid}
                                    className="pixel"
                                    src={cardSprite(p)}
                                    alt={p.speciesId.toString()}
                                    title={viewInstance(p).displayName}
                                />
                            ))}
                        </div>
                        <p className="muted" style={{ fontSize: 11 }}>
                            Tática: {TACTIC_LABEL[opponent.tactic]} · Média{' '}
                            {Math.round(
                                opponent.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) /
                                    opponent.lineup.length,
                            )}
                        </p>
                        <button
                            type="button"
                            className="btn primary"
                            style={{ width: '100%' }}
                            onClick={play}
                            disabled={loading}
                        >
                            {loading ? 'Aquecendo…' : `Jogar ${stageLabel(run.stage).toLowerCase()}`}
                        </button>
                    </div>

                    {detailInst && <PokeCard inst={detailInst} />}

                    <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                            if (confirm('Abandonar esta copa? O time será perdido.')) abandonRun();
                        }}
                    >
                        Abandonar copa
                    </button>
                </div>
            </div>
        </>
    );
}
