import { type CSSProperties, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { SNAP_STRIDE, type TeamSetup } from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { formationText, statusName } from '../../i18n';
import { useT } from '../../i18n/react';
import { boardAt, snapAt, whoAt } from '../match-view';
import { FormationBoard } from './FormationBoard';
import { cardSprite } from './PokeCard';

/** Ditto: na vaga ele aparece com a forma copiada; o selinho no canto diz que é ele. */
const DITTO = 132;

/** Recalcula a cada meio segundo de jogo (igual ao painel do time). */
const STEP_TICKS = 10;
/** Celular em pé: a prancheta fica embaixo da quadra, deitada (o ataque pra direita). */
const PORTRAIT = '(max-width: 1050px) and (orientation: portrait)';

export function useMedia(query: string): boolean {
    return useSyncExternalStore(
        (cb) => {
            const m = window.matchMedia(query);
            m.addEventListener('change', cb);
            return () => m.removeEventListener('change', cb);
        },
        () => window.matchMedia(query).matches,
    );
}

/** Prancheta mandada: formação e o uid de quem vai em cada vaga. */
export interface BoardPlan {
    formation: FormationId;
    order: string[];
}

/** Substituição mandada que ainda não aconteceu na tela. */
export interface SubPlan {
    outUid: string;
    inUid: string;
}

/** Mesmos jogadores (em qualquer ordem). */
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((u) => b.includes(u));

/**
 * Prancheta do técnico ao vivo: a formação com quem está em quadra agora (nota na vaga, fôlego, status, forma
 * evoluída) e o banco. Tocar num jogador seu chama `onMine` (a tela abre a substituição com ele ou o painel dele);
 * o rival é só leitura (abre o painel do jogador). Embaixo da quadra no celular em pé, ao lado no resto.
 *
 * Com `edit`, dá pra mudar a prancheta: a formação no seletor e, tocando num jogador em quadra e depois em outro, os
 * dois trocam de vaga (cada vaga mostra a nota do selecionado naquela posição). Nada vale antes do "Confirmar", e a
 * mudança entra na próxima bola parada. Com `onSub`, um em quadra e um do banco (em qualquer ordem) é a
 * substituição, na hora, sem painel: a troca mandada (`subs`) já aparece feita na prancheta, com o "Entra" no reserva.
 */
export function Prancheta({
    match,
    setups,
    side,
    tick,
    names,
    selectedUid,
    onMine,
    onSub,
    subs = [],
    edit,
}: {
    match: MatchResult;
    setups: [TeamSetup, TeamSetup];
    /** Seu lado na partida (no duelo o convidado é o 1). */
    side: 0 | 1;
    tick: number;
    names: [string, string];
    /** Já chega selecionado (o botão Substituir, a sugestão do intervalo): o próximo toque decide. */
    selectedUid?: { uid: string } | null;
    /** Toque num jogador seu quando não dá pra mudar nada: `idx` é a vaga dele na partida (null = banco). */
    onMine: (uid: string, idx: number | null) => void;
    /** Dá pra substituir agora: sai `outUid`, entra `inUid`. */
    onSub?: (outUid: string, inUid: string) => void;
    /** Trocas mandadas que ainda não aconteceram (aparecem feitas, sem toque até acontecerem ou serem desfeitas). */
    subs?: SubPlan[];
    /** Mudança de prancheta do seu time (sem isto, só leitura). */
    edit?: {
        /** Dá pra mandar ordem agora (tempo normal ou intervalo, sem outra ordem resimulando). */
        enabled: boolean;
        /** A última prancheta mandada que ainda não entrou em quadra. */
        pending: BoardPlan | null;
        onConfirm: (plan: BoardPlan) => void;
        /** Apito final (e pênaltis): nada mais muda; a dica só oferece ver o painel do jogador. */
        over?: boolean;
    };
}) {
    const { t, lang } = useT();
    const [team, setTeam] = useState<0 | 1>(side);
    /** Rascunho da prancheta (ainda não confirmado) e o jogador em quadra selecionado pra trocar de vaga. */
    const [draft, setDraft] = useState<BoardPlan | null>(null);
    const [pick, setPick] = useState<string | null>(selectedUid?.uid ?? null);
    useEffect(() => {
        if (selectedUid) setPick(selectedUid.uid);
    }, [selectedUid]);
    const horizontal = useMedia(PORTRAIT);
    const at = Math.floor(tick / STEP_TICKS) * STEP_TICKS;
    const mine = team === side;

    const view = useMemo(() => {
        const snap = snapAt(match.snapshots, at);
        const setup = setups[team];
        const all = [...setup.lineup, ...setup.bench];
        const byUid = new Map<string, PokemonInstance>(all.map((p) => [p.uid, p]));
        const idxOf = new Map<string, number>();
        const live = new Map<string, { energy: number; status: string | null; evolved: boolean; ditto: boolean }>();
        const lineup: string[] = [];
        // a prancheta de agora: formação e quem está em cada vaga (depois das mudanças de prancheta)
        const board = boardAt(match, setups, team, at);
        for (const idx of board.idx) {
            const who = whoAt(match, setups, idx, at);
            if (!who.inst) continue;
            // a forma de agora (evoluiu, Ditto transformado) aparece na vaga
            byUid.set(who.inst.uid, who.inst);
            idxOf.set(who.inst.uid, idx);
            const o = idx * SNAP_STRIDE;
            live.set(who.inst.uid, {
                energy: snap.p[o + 6] ?? 1,
                status: snap.p[o + 4] ? statusName(snap.p[o + 4], lang) : null,
                evolved: who.evolved,
                ditto: who.transformed,
            });
            lineup.push(who.inst.uid);
        }
        const out = new Set(
            match.events.flatMap((e) => (e.type === 'sub' && e.tick <= at && e.team === team ? [e.outUid] : [])),
        );
        const bench = all.map((p) => p.uid).filter((u) => !lineup.includes(u));
        return { byUid, idxOf, live, lineup, bench, out, formation: board.formation };
    }, [match, setups, team, at, lang]);

    const setup = setups[team];
    const live: BoardPlan = { formation: view.formation, order: view.lineup };
    // pendente ou rascunho que não bate mais com quem está em quadra (entrou alguém) não vale
    const pending = edit?.pending && sameSet(edit.pending.order, view.lineup) ? edit.pending : null;
    const base = pending ?? live;
    const editing = mine && !!edit;
    const plan = editing && draft && sameSet(draft.order, view.lineup) ? draft : null;
    const shown = editing ? (plan ?? base) : live;
    const changed = !!plan && (plan.formation !== base.formation || plan.order.join() !== base.order.join());
    const canEdit = editing && !!edit?.enabled;
    // troca mandada: quem sai e quem entra ficam parados até ela acontecer; na tela, ela já aparece feita
    const swapIn = new Map(subs.map((o) => [o.outUid, o.inUid]));
    const swapOut = new Map(subs.map((o) => [o.inUid, o.outUid]));
    const busy = (uid: string) => swapIn.has(uid) || swapOut.has(uid);
    const subbing = canEdit && !!onSub;
    const picked =
        canEdit && pick && !busy(pick) && (shown.order.includes(pick) || (subbing && view.bench.includes(pick)))
            ? pick
            : null;
    const pickedBench = picked && !shown.order.includes(picked) ? picked : null;
    const pickedInst = picked ? view.byUid.get(picked) : undefined;

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
            {editing && (
                <div className="pr-edit">
                    <label className="pr-formation">
                        <span>{t('match.board.formation')}</span>
                        <select
                            value={shown.formation}
                            disabled={!canEdit}
                            onChange={(e) => setDraft({ formation: e.target.value as FormationId, order: shown.order })}
                        >
                            {(Object.keys(FORMATIONS) as FormationId[]).map((id) => (
                                <option key={id} value={id}>
                                    {formationText(id, lang).name}
                                </option>
                            ))}
                        </select>
                    </label>
                    {changed && plan && (
                        <div className="pr-actions">
                            <button
                                type="button"
                                className="btn small primary"
                                disabled={!canEdit}
                                onClick={() => {
                                    setPick(null);
                                    edit?.onConfirm(plan);
                                }}
                            >
                                {t('match.board.confirm')}
                            </button>
                            <button
                                type="button"
                                className="btn small ghost"
                                onClick={() => {
                                    setDraft(null);
                                    setPick(null);
                                }}
                            >
                                {t('match.board.undo')}
                            </button>
                        </div>
                    )}
                </div>
            )}
            <FormationBoard
                formation={shown.formation}
                lineup={shown.order.map((u) => swapIn.get(u) ?? u)}
                bench={view.bench.map((u) => swapOut.get(u) ?? u)}
                byUid={view.byUid}
                captainUid={setup.captainUid}
                horizontal={horizontal}
                mirror={team === 1}
                projection={pickedInst ?? null}
                stateOf={(_, uid) =>
                    uid === picked ? 'selected' : mine && canEdit && uid && busy(uid) ? 'locked' : 'idle'
                }
                dimOf={(inst) => view.out.has(inst.uid)}
                slotAria={() =>
                    !mine ? t('match.board.tapRival') : canEdit ? t('match.board.tapEdit') : t('match.board.tapMine')
                }
                badgeOf={(inst) => {
                    if (swapOut.has(inst.uid)) return <span className="pr-evo">{t('match.board.subIn')}</span>;
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
                            {l.ditto && (
                                <img
                                    className="pr-ditto pixel"
                                    src={cardSprite({ speciesId: DITTO, shiny: false })}
                                    alt={t('match.board.ditto')}
                                    title={t('match.board.ditto')}
                                />
                            )}
                        </>
                    );
                }}
                onSlot={(ref, uid) => {
                    if (!uid) return;
                    const idx = ref.zone === 'lineup' ? (view.idxOf.get(uid) ?? null) : null;
                    if (!mine) {
                        if (idx !== null) EventBus.emit('match:inspect-request', idx);
                    } else if (!canEdit) onMine(uid, idx);
                    else if (ref.zone === 'bench') {
                        // reserva: com alguém em quadra marcado, entra no lugar dele; senão fica marcado
                        if (!subbing) return;
                        if (picked && !pickedBench) {
                            setPick(null);
                            onSub?.(picked, uid);
                        } else setPick(picked === uid ? null : uid);
                    } else if (pickedBench) {
                        setPick(null);
                        onSub?.(uid, pickedBench);
                    } else if (!picked || picked === uid) setPick(picked ? null : uid);
                    else {
                        // os dois trocam de vaga no rascunho
                        const order = [...shown.order];
                        const a = order.indexOf(picked);
                        const b = order.indexOf(uid);
                        [order[a], order[b]] = [order[b], order[a]];
                        setDraft({ formation: shown.formation, order });
                        setPick(null);
                    }
                }}
            />
            <small className="muted pr-hint">
                {!mine
                    ? t('match.board.hintRival')
                    : pickedInst
                      ? t(
                            pickedBench
                                ? 'match.board.hintIn'
                                : subbing
                                  ? 'match.board.hintSwap'
                                  : 'match.board.hintMove',
                            {
                                name: viewInstance(pickedInst).displayName,
                            },
                        )
                      : canEdit
                        ? t(subbing ? 'match.board.hintEdit' : 'match.board.hintEditNoSub')
                        : edit?.over
                          ? t('match.board.hintOver')
                          : t('match.board.hintMine')}
            </small>
        </div>
    );
}

/** Desktop: o painel do técnico fica na coluna da direita (mesmo corte do styles.css). */
export const WIDE = '(min-width: 1051px)';
