import { useCallback, useEffect, useState } from 'react';
import { MOVES, species } from '../../engine/data';
import { EVO_THRESHOLD, evolutionTarget, evoScore } from '../../engine/evolution';
import { attributeModifiers, moveModifiers } from '../../engine/modifiers';
import { moveProfile } from '../../engine/moves';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { FLAG_BUFF, FLAG_CHARGED, FLAG_DEBUFF, SNAP_STRIDE, type Tactic, type TeamSetup } from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { modLabel, moveModLabel, moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useCardModal } from '../card-modal';
import { lineupAt, snapAt, statsUntil, whoAt } from '../match-view';
import { TYPE_COLOR } from '../type-colors';
import { FutCard } from './FutCard';

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
    const { t, d, lang } = useT();
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

    // status: o que ele faz agora (Apaixonado só aparece aqui)
    const statusText = status === 7 ? t('team.inspect.infatuated') : d.common.statusEffect[status];
    const live: { up: boolean; text: string }[] = [];
    if (flags & FLAG_BUFF) live.push({ up: true, text: t('team.inspect.buffed') });
    if (flags & FLAG_DEBUFF) live.push({ up: false, text: t('team.inspect.debuffed') });
    if (flags & FLAG_CHARGED) live.push({ up: true, text: t('team.inspect.charged') });
    if (statusText) live.push({ up: false, text: statusText });
    if (fatigue > 0) live.push({ up: false, text: t('team.inspect.fatigue', { n: fatigue }) });
    if (behind >= 3) live.push({ up: true, text: t('team.inspect.grit', { n: behind }) });
    live.push({ up: true, text: t('team.inspect.tactic', { tactic: d.common.tactic[tactics[who.team]] }) });

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e o botão cobrem o teclado
        <div className="modal-backdrop" onClick={close} role="presentation">
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
            <div
                className="modal panel inspect-panel"
                role="dialog"
                aria-modal="true"
                aria-label={t('team.inspect.aria', { name: inst.nickname ?? species(inst.speciesId).name })}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="inspect-grid">
                    <div className="inspect-left">
                        <FutCard inst={inst} position={who.role} captain={inst.uid === setup.captainUid} />
                        <div className="inspect-energy">
                            <span>{t('team.inspect.stamina')}</span>
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
                                <span>{t('team.inspect.evolution')}</span>
                                <span className="bar">
                                    <i style={{ width: `${evoPct}%` }} />
                                </span>
                                <b>{evoPct}%</b>
                            </div>
                        )}
                        {target && !who.evolved && !who.transformed && (
                            <div className="muted inspect-note">
                                {t('team.inspect.evolveNote', { name: species(target).name })}
                            </div>
                        )}
                        {who.evolved && <div className="muted inspect-note">{t('team.inspect.evolved')}</div>}
                        {who.transformed && !who.evolved && (
                            <div className="muted inspect-note">
                                {t('team.inspect.ditto', { name: species(inst.speciesId).name })}
                            </div>
                        )}
                    </div>
                    <div className="inspect-right">
                        <h2>{inst.nickname ?? species(inst.speciesId).name}</h2>
                        <h3>{t('team.inspect.now')}</h3>
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
                                        {modLabel(m, lang)}
                                    </div>
                                );
                            })}
                        </div>
                        <h3>{t('team.inspect.inMatch')}</h3>
                        <div className="inspect-stats">
                            {(
                                [
                                    [d.team.inspect.stats.goals, stats.goals],
                                    [d.team.inspect.stats.assists, stats.assists],
                                    [d.team.inspect.stats.shots, stats.shots],
                                    [d.team.inspect.stats.passes, stats.passes],
                                    [d.team.inspect.stats.tackles, `${stats.tacklesWon}/${stats.tackles}`],
                                    [d.team.inspect.stats.interceptions, stats.interceptions],
                                    [d.team.inspect.stats.saves, stats.saves],
                                    [d.team.inspect.stats.moves, stats.movesUsed],
                                ] as [string, string | number][]
                            ).map(([label, v]) => (
                                <div key={label}>
                                    <b>{v}</b>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                        <h3>{t('team.inspect.moves')}</h3>
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
                                        <b>{moveName(m)}</b>
                                        <span>
                                            {locked
                                                ? t('team.inspect.locked')
                                                : left === 0
                                                  ? t('team.inspect.used')
                                                  : `${left}x`}
                                        </span>
                                        {boost && <em className="attr-mod up">▲ {moveModLabel(boost, lang)}</em>}
                                    </div>
                                );
                            })}
                        </div>
                        <button type="button" className="btn primary" onClick={close}>
                            {t('team.inspect.back')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
