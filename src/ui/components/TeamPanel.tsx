import { useMemo, useState } from 'react';
import { species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import { ratePlayer } from '../../engine/match-stats';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { SNAP_STRIDE, type TeamSetup } from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { statusName } from '../../i18n';
import { useT } from '../../i18n/react';
import { snapAt, statsUntil, whoAt } from '../match-view';
import { cardSprite } from './PokeCard';

/** Recalcula a cada meio segundo de jogo (o relógio da partida atualiza bem mais rápido que isso). */
const STEP_TICKS = 10;

/**
 * Painel de técnico na partida: quem está em quadra (fôlego, status, gols, assistências e nota parcial) e o
 * banco, do seu time ou do rival. Só mostra; trocas continuam no botão Substituir. Tocar num jogador abre o
 * painel dele (PlayerInspect) e pausa a partida.
 */
export function TeamPanel({
    match,
    setups,
    tick,
    teamNames,
    interactive,
    side = 0,
    startOpen = true,
}: {
    match: MatchResult;
    setups: [TeamSetup, TeamSetup];
    tick: number;
    teamNames: [string, string];
    /** Falso depois do apito final (a quadra não abre mais o painel do jogador). */
    interactive: boolean;
    /** Aba que abre primeiro: o seu time (no duelo o convidado é o 1). */
    side?: 0 | 1;
    /** Começa recolhida (no desktop com a prancheta ao lado, a tabela repetiria o time). */
    startOpen?: boolean;
}) {
    const [team, setTeam] = useState<0 | 1>(side);
    const [open, setOpen] = useState(startOpen);
    const { t, d, lang } = useT();
    const at = Math.floor(tick / STEP_TICKS) * STEP_TICKS;

    const view = useMemo(() => {
        const snap = snapAt(match.snapshots, at);
        const conceded = snap.score[team === 0 ? 1 : 0];
        const setup = setups[team];
        const all = [...setup.lineup, ...setup.bench];
        const rows = match.roster.flatMap((r, idx) => {
            if (r.team !== team) return [];
            const who = whoAt(match, setups, idx, at);
            if (!who.inst) return [];
            const o = idx * SNAP_STRIDE;
            const { stats } = statsUntil(match, idx, who.since, at);
            return [
                {
                    idx,
                    inst: who.inst,
                    // Ditto transformado mantém o nome (como na narração), com o sprite de quem copiou
                    name: viewInstance(all.find((p) => p.uid === who.inst?.uid) ?? who.inst).displayName,
                    copied: who.transformed ? species(who.inst.speciesId).name : null,
                    role: who.role,
                    energy: snap.p[o + 6] ?? 1,
                    status: snap.p[o + 4] ? statusName(snap.p[o + 4], lang) : null,
                    goals: stats.goals,
                    assists: stats.assists,
                    rating: ratePlayer(stats, who.role, null, who.role === 'GK' ? conceded : 0),
                },
            ];
        });
        const onCourt = new Set(rows.map((r) => r.inst.uid));
        const left = new Set(
            match.events.flatMap((e) => (e.type === 'sub' && e.tick <= at && e.team === team ? [e.outUid] : [])),
        );
        const bench = all.filter((p) => !onCourt.has(p.uid)).map((p) => ({ inst: p, out: left.has(p.uid) }));
        return { rows, bench };
    }, [match, setups, team, at, lang]);

    return (
        <div className={`panel team-panel${open ? '' : ' collapsed'}`}>
            <div className="tp-head">
                <div className="tp-tabs" role="tablist" aria-label={t('team.panel.team')}>
                    {([0, 1] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            role="tab"
                            aria-selected={team === t}
                            className={`tp-tab${team === t ? ' active' : ''}`}
                            onClick={() => {
                                setTeam(t);
                                setOpen(true);
                            }}
                        >
                            {teamNames[t]}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="tp-toggle"
                    aria-expanded={open}
                    aria-label={open ? t('team.panel.collapse') : t('team.panel.expand')}
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? '▲' : '▼'}
                </button>
            </div>
            {open && (
                <>
                    <div className="tp-row tp-labels" aria-hidden>
                        <span />
                        <span>{t('team.panel.onCourt')}</span>
                        <span>{t('team.panel.stamina')}</span>
                        <span title={t('team.panel.goals')}>G</span>
                        <span title={t('team.panel.assists')}>A</span>
                        <span>{t('team.panel.rating')}</span>
                    </div>
                    {view.rows.map((r) => (
                        <button
                            key={r.idx}
                            type="button"
                            className="tp-row"
                            disabled={!interactive}
                            onClick={() => EventBus.emit('match:inspect-request', r.idx)}
                            aria-label={t('team.panel.open', { name: r.name })}
                        >
                            <img className="pixel" src={cardSprite(r.inst)} alt="" />
                            <span className="tp-name">
                                <b>{r.name}</b>
                                <small>
                                    {d.common.pos[r.role]}
                                    {r.copied && t('team.panel.became', { name: r.copied })}
                                    {r.status && <em> · {r.status}</em>}
                                </small>
                            </span>
                            <span
                                className="tp-energy"
                                title={t('team.panel.staminaPct', { n: Math.round(r.energy * 100) })}
                            >
                                <i
                                    style={{
                                        width: `${Math.round(r.energy * 100)}%`,
                                        background:
                                            r.energy > 0.6 ? '#58c26b' : r.energy > 0.35 ? '#ffcb05' : '#ff6b4c',
                                    }}
                                />
                            </span>
                            <span className={r.goals ? 'tp-num on' : 'tp-num'}>{r.goals || '–'}</span>
                            <span className={r.assists ? 'tp-num on' : 'tp-num'}>{r.assists || '–'}</span>
                            <span className={`tp-rating${r.rating >= 7.5 ? ' good' : r.rating <= 5.5 ? ' bad' : ''}`}>
                                {r.rating.toFixed(1)}
                            </span>
                        </button>
                    ))}
                    {view.bench.length > 0 && (
                        <div className="tp-bench">
                            <span className="muted">{t('team.panel.bench')}</span>
                            {view.bench.map((b) => (
                                <span key={b.inst.uid} className={`tp-sub${b.out ? ' out' : ''}`}>
                                    <img className="pixel" src={cardSprite(b.inst)} alt="" />
                                    {viewInstance(b.inst).displayName}
                                    {b.out && <small>{t('team.panel.subbedOff')}</small>}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
