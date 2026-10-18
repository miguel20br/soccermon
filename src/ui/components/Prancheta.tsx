import { type CSSProperties, useMemo, useState, useSyncExternalStore } from 'react';
import type { PokemonInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { SNAP_STRIDE, type TeamSetup } from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { statusName } from '../../i18n';
import { useT } from '../../i18n/react';
import { snapAt, whoAt } from '../match-view';
import { FormationBoard } from './FormationBoard';

/** Recalcula a cada meio segundo de jogo (igual ao painel do time). */
const STEP_TICKS = 10;
/** Celular em pé: a prancheta fica embaixo da quadra, deitada (o ataque pra direita). */
const PORTRAIT = '(max-width: 1050px) and (orientation: portrait)';

function useMedia(query: string): boolean {
    return useSyncExternalStore(
        (cb) => {
            const m = window.matchMedia(query);
            m.addEventListener('change', cb);
            return () => m.removeEventListener('change', cb);
        },
        () => window.matchMedia(query).matches,
    );
}

/**
 * Prancheta do técnico ao vivo: a formação com quem está em quadra agora (nota na vaga, fôlego, status, forma
 * evoluída) e o banco. Tocar num jogador seu chama `onMine` (a tela abre a substituição com ele ou o painel dele);
 * o rival é só leitura (abre o painel do jogador). Embaixo da quadra no celular em pé, ao lado no resto.
 */
export function Prancheta({
    match,
    setups,
    side,
    tick,
    names,
    selectedUid,
    onMine,
}: {
    match: MatchResult;
    setups: [TeamSetup, TeamSetup];
    /** Seu lado na partida (no duelo o convidado é o 1). */
    side: 0 | 1;
    tick: number;
    names: [string, string];
    selectedUid?: string | null;
    /** Toque num jogador seu: `idx` é a vaga dele na partida (null = banco). */
    onMine: (uid: string, idx: number | null) => void;
}) {
    const { t, lang } = useT();
    const [team, setTeam] = useState<0 | 1>(side);
    const horizontal = useMedia(PORTRAIT);
    const at = Math.floor(tick / STEP_TICKS) * STEP_TICKS;
    const mine = team === side;

    const view = useMemo(() => {
        const snap = snapAt(match.snapshots, at);
        const setup = setups[team];
        const all = [...setup.lineup, ...setup.bench];
        const byUid = new Map<string, PokemonInstance>(all.map((p) => [p.uid, p]));
        const idxOf = new Map<string, number>();
        const live = new Map<string, { energy: number; status: string | null; evolved: boolean }>();
        const lineup: string[] = [];
        for (const r of match.roster) {
            if (r.team !== team) continue;
            const who = whoAt(match, setups, r.idx, at);
            if (!who.inst) continue;
            // a forma de agora (evoluiu, Ditto transformado) aparece na vaga
            byUid.set(who.inst.uid, who.inst);
            idxOf.set(who.inst.uid, r.idx);
            const o = r.idx * SNAP_STRIDE;
            live.set(who.inst.uid, {
                energy: snap.p[o + 6] ?? 1,
                status: snap.p[o + 4] ? statusName(snap.p[o + 4], lang) : null,
                evolved: who.evolved,
            });
            lineup.push(who.inst.uid);
        }
        const out = new Set(
            match.events.flatMap((e) => (e.type === 'sub' && e.tick <= at && e.team === team ? [e.outUid] : [])),
        );
        const bench = all.map((p) => p.uid).filter((u) => !lineup.includes(u));
        return { byUid, idxOf, live, lineup, bench, out };
    }, [match, setups, team, at, lang]);

    const setup = setups[team];
    return (
        <div className={`panel prancheta${horizontal ? ' horizontal' : ''}`}>
            <div className="tp-tabs" role="tablist" aria-label={t('match.board.title')}>
                {([side, side === 0 ? 1 : 0] as const).map((tm) => (
                    <button
                        key={tm}
                        type="button"
                        role="tab"
                        aria-selected={team === tm}
                        className={`tp-tab${team === tm ? ' active' : ''}`}
                        title={names[tm]}
                        onClick={() => setTeam(tm)}
                    >
                        {tm === side ? t('match.board.mine') : t('match.board.rival')}
                    </button>
                ))}
            </div>
            <FormationBoard
                formation={setup.formation ?? '1-2-1'}
                lineup={view.lineup}
                bench={view.bench}
                byUid={view.byUid}
                captainUid={setup.captainUid}
                horizontal={horizontal}
                mirror={team === 1}
                stateOf={(_, uid) => (uid && uid === selectedUid ? 'selected' : 'idle')}
                dimOf={(inst) => view.out.has(inst.uid)}
                slotAria={() => (mine ? t('match.board.tapMine') : t('match.board.tapRival'))}
                badgeOf={(inst) => {
                    const l = view.live.get(inst.uid);
                    if (!l) return null;
                    return (
                        <>
                            <i
                                className={`pr-energy${l.energy > 0.6 ? '' : l.energy > 0.35 ? ' mid' : ' low'}`}
                                title={t('team.panel.staminaPct', { n: Math.round(l.energy * 100) })}
                                style={{ '--e': l.energy } as CSSProperties}
                            />
                            {l.status && <span className="pr-status">{l.status}</span>}
                            {l.evolved && <span className="pr-evo">{t('match.board.evolved')}</span>}
                        </>
                    );
                }}
                onSlot={(ref, uid) => {
                    if (!uid) return;
                    const idx = ref.zone === 'lineup' ? (view.idxOf.get(uid) ?? null) : null;
                    if (mine) onMine(uid, idx);
                    else if (idx !== null) EventBus.emit('match:inspect-request', idx);
                }}
            />
            <small className="muted pr-hint">{mine ? t('match.board.hintMine') : t('match.board.hintRival')}</small>
        </div>
    );
}
