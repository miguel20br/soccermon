import { useState } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { TACTIC_LABEL, type Tactic } from '../../engine/state';
import { computeSynergies } from '../../engine/synergy';
import { playSfx } from '../../game/audio';
import { playerTeam, type SlotRef, stageLabel, useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { LinkChips } from '../components/LinkChips';
import { cardSprite, TypeBadge } from '../components/PokeCard';
import { simulateMatch } from '../sim-client';

export const TACTIC_DESC: Record<Tactic, string> = {
    balanced: 'Sem bônus nem custo.',
    offensive: 'Linhas altas e mais chutes. Cansa mais e abre espaço atrás.',
    defensive: 'Bloco baixo: melhor desarme e leitura. Ataca pouco.',
    counter: 'Pivô espera lá na frente; passes e arrancadas mais rápidos.',
};

export function Lineup() {
    const { run, swapSlots, setTactic, setFormation, moveItem, setMatch, go, abandonRun, lockMatch } = useGame();
    const [error, setError] = useState<string | null>(null);
    const openCard = useCardModal((s) => s.open);
    const [selected, setSelected] = useState<SlotRef | null>(null);
    const [detail, setDetail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    if (!run) return null;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const opponent = run.opponents[run.stage];
    const detailInst = byUid.get(detail ?? run.lineup[0]) ?? run.picks[0];
    const synergies = computeSynergies(run.lineup.map((u) => byUid.get(u)!));
    const links = computeLinks(run.lineup.map((u) => byUid.get(u)!));
    const holders = run.picks.filter((p) => p.uid !== detailInst?.uid);

    const locked = !!run.lockedTeam;
    const captainBenched = !!run.captainUid && run.bench.includes(run.captainUid);

    const onSlot = (ref: SlotRef, uid: string) => {
        setDetail(uid);
        if (locked) return;
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
        const seed = run.seed;
        const stage = run.stage;
        // a partida trava o time: sair no meio e voltar retoma a mesma partida
        // save da 0.6 não tinha manualSubs: nada automático no time do jogador
        const team = run.lockedTeam ? { ...run.lockedTeam, manualSubs: true } : playerTeam(run);
        lockMatch(team);
        setLoading(true);
        setError(null);
        try {
            // retomando: as mesmas ordens do técnico (tática/substituições) dão a mesma partida
            const live = useGame.getState().run?.live;
            const orders = live?.stage === stage ? live.orders : [];
            const result = await simulateMatch(team, opponent, `${seed}-stage-${stage}`, orders);
            // só abre a partida se o jogador ainda está nesta tela, nesta run e nesta fase
            const now = useGame.getState();
            if (now.screen !== 'lineup' || now.run?.seed !== seed || now.run.stage !== stage) return;
            setMatch(result);
            go('match');
        } catch {
            setError('Não foi possível simular a partida. Tente de novo (recarregue a página se persistir).');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="formation-tabs">
                        {Object.values(FORMATIONS).map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                className={`btn small${run.formation === f.id ? ' active' : ''}`}
                                disabled={locked}
                                onClick={() => setFormation(f.id)}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                    <p className="muted" style={{ marginTop: 8 }}>
                        Toque em dois jogadores para trocá-los de vaga (inclusive com o banco).
                    </p>
                    <FormationBoard
                        formation={run.formation}
                        lineup={run.lineup}
                        bench={run.bench}
                        byUid={byUid}
                        captainUid={run.captainUid}
                        projection={
                            selected
                                ? byUid.get((selected.zone === 'lineup' ? run.lineup : run.bench)[selected.index])
                                : null
                        }
                        stateOf={(ref) =>
                            selected?.zone === ref.zone && selected.index === ref.index ? 'selected' : 'idle'
                        }
                        onSlot={onSlot}
                        footer={
                            <p className="muted center" style={{ fontSize: 11, marginBottom: 0 }}>
                                Na partida, toque em Substituir para trocar quem cansou: a troca entra na próxima saída
                                de bola.
                            </p>
                        }
                    />
                </div>

                <div className="side-stack">
                    <div className="panel">
                        <h2>
                            {stageLabel(run.stage)}: {opponent.name}
                        </h2>
                        <div className="opponent-strip">
                            {opponent.lineup.map((p) => (
                                <button
                                    key={p.uid}
                                    type="button"
                                    className="scout-btn"
                                    onClick={() => openCard(p, { note: `Adversário: ${opponent.name}` })}
                                    aria-label={`Ver carta de ${viewInstance(p).displayName}`}
                                >
                                    <img className="pixel" src={cardSprite(p)} alt="" />
                                </button>
                            ))}
                        </div>
                        <p className="muted" style={{ fontSize: 11 }}>
                            {FORMATIONS[opponent.formation ?? '1-2-1'].name} · {TACTIC_LABEL[opponent.tactic]} · Média{' '}
                            {Math.round(
                                opponent.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) /
                                    opponent.lineup.length,
                            )}
                        </p>
                        <button type="button" className="btn primary wide" onClick={play} disabled={loading}>
                            {loading
                                ? 'Aquecendo…'
                                : locked
                                  ? 'Voltar para a partida'
                                  : `Jogar ${stageLabel(run.stage).toLowerCase()}`}
                        </button>
                        {locked && (
                            <p className="tactic-desc">
                                Partida em andamento: escalação e tática ficam travadas até o apito final.
                            </p>
                        )}
                        {error && <p className="error-text">{error}</p>}
                    </div>

                    <div className="panel">
                        <h2>Tática</h2>
                        <div className="tactics">
                            {(Object.keys(TACTIC_LABEL) as Tactic[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`btn small${run.tactic === t ? ' active' : ''}`}
                                    disabled={locked}
                                    onClick={() => setTactic(t)}
                                >
                                    {TACTIC_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        <p className="tactic-desc">{TACTIC_DESC[run.tactic]} Dá para mudar durante o jogo.</p>
                        {captainBenched && (
                            <p className="error-text">O capitão está no banco: a aura dele só vale em quadra.</p>
                        )}
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
                        <h3 style={{ marginTop: 12 }}>Sinergias de história</h3>
                        {links.length === 0 ? (
                            <p className="tactic-desc">
                                Duplas e grupos famosos (Mew + Mewtwo, Pássaros Lendários, Equipe Rocket…) ganham bônus
                                juntos e podem soltar um combo: passe de um, chute do outro.
                            </p>
                        ) : (
                            <div className="row" style={{ gap: 6 }}>
                                <LinkChips links={links} />
                            </div>
                        )}
                    </div>

                    {detailInst && (
                        <>
                            <div className="detail-card">
                                <FutCard inst={detailInst} captain={detailInst.uid === run.captainUid} />
                                <p className="tactic-desc center">Toque na carta para ver tudo sobre o Pokémon.</p>
                            </div>
                            {detailInst.item && (
                                <div className="panel item-move">
                                    <img className="pixel" src={itemSprite(detailInst.item)} alt="" />
                                    <span>
                                        <b>{ITEMS[detailInst.item]?.name}</b> — {ITEMS[detailInst.item]?.desc}
                                    </span>
                                    <label className="muted">
                                        Passar para{' '}
                                        <select
                                            value=""
                                            disabled={locked}
                                            onChange={(e) => e.target.value && moveItem(detailInst.uid, e.target.value)}
                                        >
                                            <option value="">…</option>
                                            {holders.map((h) => (
                                                <option key={h.uid} value={h.uid}>
                                                    {viewInstance(h).displayName}
                                                    {h.item ? ` (troca com ${ITEMS[h.item]?.name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            )}
                        </>
                    )}

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
