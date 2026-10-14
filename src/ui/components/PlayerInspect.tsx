import { useCallback, useEffect, useState } from 'react';
import type { Position } from '../../engine/attributes';
import { MOVES, species } from '../../engine/data';
import { EVO_THRESHOLD, evolutionTarget, evolveInstance, evoScore } from '../../engine/evolution';
import type { PokemonInstance } from '../../engine/instance';
import { attributeModifiers, moveModifiers } from '../../engine/modifiers';
import { moveProfile } from '../../engine/moves';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    FLAG_BUFF,
    FLAG_CHARGED,
    FLAG_DEBUFF,
    type MatchSnapshot,
    type PlayerStats,
    SNAP_STRIDE,
    TACTIC_LABEL,
    type Tactic,
    type TeamSetup,
} from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { useCardModal } from '../card-modal';
import { TYPE_COLOR } from '../type-colors';
import { FutCard } from './FutCard';

const STATUS_PT: Record<number, string> = {
    1: 'Paralisado: mais lento',
    2: 'Dormindo: não joga',
    3: 'Envenenado: perde fôlego',
    4: 'Queimado: chuta e tromba mais fraco',
    5: 'Congelado: não joga',
    6: 'Confuso: erra passe e chute',
    7: 'Apaixonado: não joga',
};

function snapAt(snaps: MatchSnapshot[], tick: number): MatchSnapshot {
    let lo = 0;
    let hi = snaps.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (snaps[mid].tick <= tick) lo = mid;
        else hi = mid;
    }
    return snaps[lo];
}

/** Quem está na vaga `idx` no tick, com a forma atual (trocas, evoluções e Transformar do Ditto até ali). */
function whoAt(m: MatchResult, setups: [TeamSetup, TeamSetup], idx: number, tick: number) {
    const team = m.roster[idx].team;
    let uid = m.roster[idx].uid;
    let since = 0;
    for (const e of m.events) {
        if (e.tick > tick) break;
        if (e.type === 'sub' && e.outIdx === idx) {
            uid = e.inUid;
            since = e.tick;
        }
    }
    const setup = setups[team];
    let inst: PokemonInstance | undefined = [...setup.lineup, ...setup.bench].find((p) => p.uid === uid);
    let evolved = false;
    let transformed = false;
    for (const e of m.events) {
        if (e.tick > tick) break;
        if (e.type === 'evolve' && e.uid === uid && inst) {
            inst = evolveInstance(inst, e.into);
            evolved = true;
        }
        // Ditto (Transformar): mesma espécie, nível, golpes e habilidade de quem ele copiou naquele momento
        // (match.ts: transformDittos já manda esse evento, só faltava a carta ouvir)
        if (e.type === 'transform' && e.by === idx && e.tick >= since && inst) {
            const copied = whoAt(m, setups, e.target, e.tick).inst;
            if (copied) {
                inst = {
                    ...inst,
                    speciesId: copied.speciesId,
                    level: copied.level,
                    moves: [...copied.moves],
                    ability: copied.ability,
                };
                transformed = true;
            }
        }
    }
    return { team, inst, since, evolved, transformed, role: m.roster[idx].role as Position };
}

/** Escalação do time no tick (trocas e evoluções até ali): é por ela que o motor conta sinergias e capitão. */
function lineupAt(m: MatchResult, setups: [TeamSetup, TeamSetup], team: 0 | 1, tick: number) {
    return m.roster.flatMap((r, idx) => (r.team === team ? (whoAt(m, setups, idx, tick).inst ?? []) : []));
}

/** O que ele fez desde que entrou em campo até o tick (pelos eventos da partida). */
function statsUntil(m: MatchResult, idx: number, from: number, tick: number) {
    const s: PlayerStats = {
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passesCompleted: 0,
        tackles: 0,
        tacklesWon: 0,
        interceptions: 0,
        saves: 0,
        movesUsed: 0,
    };
    const used = new Map<string, number>();
    let wide = 0;
    for (const e of m.events) {
        if (e.tick > tick) break;
        if (e.tick < from) continue;
        if (e.type === 'goal' && e.by === idx && !e.ownGoal) s.goals++;
        if (e.type === 'goal' && e.assist === idx) s.assists++;
        if (e.type === 'shot' && e.by === idx) s.shots++;
        if (e.type === 'wide' && e.shooter === idx) wide++;
        if (e.type === 'pass' && e.by === idx) s.passes++;
        if (e.type === 'tackle' && e.by === idx) {
            s.tackles++;
            if (e.success) s.tacklesWon++;
        }
        if (e.type === 'interception' && e.by === idx) s.interceptions++;
        if (e.type === 'save' && e.by === idx) s.saves++;
        if (e.type === 'move' && e.by === idx) {
            s.movesUsed++;
            used.set(e.moveId, (used.get(e.moveId) ?? 0) + 1);
        }
    }
    // os eventos não dizem se o passe chegou: estimativa pela média do jogo
    s.passesCompleted = Math.round(s.passes * 0.85);
    s.shotsOnTarget = Math.max(0, s.shots - wide);
    return { stats: s, used };
}

/**
 * Painel de um jogador em campo (tocar no Pokémon): carta, fôlego, status, bônus/penalidades agora,
 * golpes restantes, o que fez na partida e quanto falta para evoluir. A partida espera até fechar.
 */
export function PlayerInspect({
    match,
    setups,
    tactics,
}: {
    match: MatchResult;
    setups: [TeamSetup, TeamSetup];
    /** Tática atual de cada time. */
    tactics: [Tactic, Tactic];
}) {
    const [open, setOpen] = useState<{ idx: number; tick: number } | null>(null);
    const close = useCallback(() => {
        setOpen(null);
        EventBus.emit('match:inspect-close');
    }, []);

    useEffect(() => {
        const onInspect = (req: { idx: number; tick: number }) => setOpen(req);
        EventBus.on('match:inspect', onInspect);
        return () => {
            EventBus.off('match:inspect', onInspect);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        // com a carta completa aberta por cima, o Esc fecha só ela
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !useCardModal.getState().inst && close();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    // não achou o Pokémon (save antigo?): fecha em vez de deixar a partida parada sem painel
    // biome-ignore lint/correctness/useExhaustiveDependencies: depende só de qual painel foi aberto
    useEffect(() => {
        if (open && !whoAt(match, setups, open.idx, open.tick).inst) close();
    }, [open]);

    if (!open) return null;

    const { idx, tick } = open;
    const who = whoAt(match, setups, idx, tick);
    const inst = who.inst;
    if (!inst) return null;
    const setup = setups[who.team];
    const snap = snapAt(match.snapshots, tick);
    const o = idx * SNAP_STRIDE;
    const status = snap.p[o + 4];
    const flags = snap.p[o + 5];
    const energy = snap.p[o + 6] ?? 1;
    const { stats, used } = statsUntil(match, idx, who.since, tick);
    // a escalação de agora (com trocas e evoluções), igual à do motor
    const lineupNow = lineupAt(match, setups, who.team, tick);
    const captain = lineupNow.find((p) => p.uid === setup.captainUid) ?? null;
    const mods = attributeModifiers(inst, { lineup: lineupNow, captain, role: who.role });
    const behind = snap.score[who.team === 0 ? 1 : 0] - snap.score[who.team];
    // mesma conta do motor (effective.ts: 0.72 + 0.28 × fôlego)
    const fatigue = Math.round(0.28 * (1 - energy) * 100);
    const target = evolutionTarget(inst.speciesId, inst.uid);
    const evoPct = Math.min(100, Math.round((evoScore(stats, who.role) / EVO_THRESHOLD) * 100));
    const moveMods = moveModifiers(inst);

    const live: { up: boolean; text: string }[] = [];
    if (flags & FLAG_BUFF) live.push({ up: true, text: 'Reforçado por um golpe (atributos acima do normal)' });
    if (flags & FLAG_DEBUFF) live.push({ up: false, text: 'Enfraquecido por um golpe do rival' });
    if (flags & FLAG_CHARGED) live.push({ up: true, text: 'Golpe carregado para o próximo chute ou desarme' });
    if (STATUS_PT[status]) live.push({ up: false, text: STATUS_PT[status] });
    if (fatigue > 0) live.push({ up: false, text: `Cansaço: −${fatigue}% em tudo` });
    if (behind >= 3) live.push({ up: true, text: `Garra (perdendo por ${behind}): cresce no jogo` });
    live.push({ up: true, text: `Tática: ${TACTIC_LABEL[tactics[who.team]]}` });

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e o botão cobrem o teclado
        <div className="modal-backdrop" onClick={close} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
            <div
                className="modal panel inspect-panel"
                role="dialog"
                aria-modal="true"
                aria-label={`Jogador ${inst.nickname ?? species(inst.speciesId).name}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="inspect-grid">
                    <div className="inspect-left">
                        <FutCard inst={inst} position={who.role} captain={inst.uid === setup.captainUid} />
                        <div className="inspect-energy">
                            <span>Fôlego</span>
                            <span className="bar">
                                <i
                                    style={{
                                        width: `${Math.round(energy * 100)}%`,
                                        background: energy > 0.6 ? '#58c26b' : energy > 0.35 ? '#ffcb05' : '#ff6b4c',
                                    }}
                                />
                            </span>
                            <b>{Math.round(energy * 100)}%</b>
                        </div>
                        {target && !who.evolved && !who.transformed && (
                            <div className="inspect-energy evo">
                                <span>Evolução</span>
                                <span className="bar">
                                    <i style={{ width: `${evoPct}%` }} />
                                </span>
                                <b>{evoPct}%</b>
                            </div>
                        )}
                        {target && !who.evolved && !who.transformed && (
                            <div className="muted inspect-note">
                                Jogando bem para a posição, evolui para {species(target).name} na próxima bola parada.
                            </div>
                        )}
                        {who.evolved && <div className="muted inspect-note">Já evoluiu nesta partida.</div>}
                        {who.transformed && !who.evolved && (
                            <div className="muted inspect-note">
                                Ditto (Transformar): virou {species(inst.speciesId).name} nesta partida e não evolui.
                            </div>
                        )}
                    </div>
                    <div className="inspect-right">
                        <h2>{inst.nickname ?? species(inst.speciesId).name}</h2>
                        <h3>Agora</h3>
                        <div className="mod-list">
                            {live.map((l) => (
                                <div key={l.text} className={`mod-row ${l.up ? 'up' : 'down'}`}>
                                    <span>{l.up ? '▲' : '▼'}</span>
                                    {l.text}
                                </div>
                            ))}
                            {mods.map((m) => {
                                const up = (m.add ?? 0) > 0 || (m.factor ?? 1) > 1;
                                return (
                                    <div key={m.label} className={`mod-row ${up ? 'up' : 'down'}`}>
                                        <span>{up ? '▲' : '▼'}</span>
                                        {m.label}
                                    </div>
                                );
                            })}
                        </div>
                        <h3>Na partida</h3>
                        <div className="inspect-stats">
                            {(
                                [
                                    ['Gols', stats.goals],
                                    ['Assist.', stats.assists],
                                    ['Chutes', stats.shots],
                                    ['Passes', stats.passes],
                                    ['Desarmes', `${stats.tacklesWon}/${stats.tackles}`],
                                    ['Intercept.', stats.interceptions],
                                    ['Defesas', stats.saves],
                                    ['Golpes', stats.movesUsed],
                                ] as [string, string | number][]
                            ).map(([label, v]) => (
                                <div key={label}>
                                    <b>{v}</b>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                        <h3>Golpes</h3>
                        <div className="inspect-moves">
                            {inst.moves.map((m) => {
                                const data = MOVES[m];
                                if (!data) return null;
                                const left = Math.max(0, moveProfile(m).uses - (used.get(m) ?? 0));
                                const locked = moveMods.some((mm) => mm.moveId === m && mm.factor === 0);
                                const boost = moveMods.find((mm) => mm.moveId === m && mm.factor > 1);
                                return (
                                    <div
                                        key={m}
                                        className={`inspect-move${left === 0 || locked ? ' spent' : ''}`}
                                        style={{ borderColor: TYPE_COLOR[data.type] }}
                                    >
                                        <b>{data.name}</b>
                                        <span>{locked ? 'travado' : left === 0 ? 'já usado' : `${left}x`}</span>
                                        {boost && <em className="attr-mod up">▲ {boost.label}</em>}
                                    </div>
                                );
                            })}
                        </div>
                        <button type="button" className="btn primary" onClick={close}>
                            Voltar à partida
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
