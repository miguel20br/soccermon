import { type CSSProperties, type ReactNode, useRef, useState } from 'react';
import { AGENCY, type MaxCharge, maxCharge, SHOUT_KINDS, type Shout, shoutAt } from '../../engine/agency';
import { isAgencyOrder, type MatchEvent, type MatchOrder } from '../../engine/state';
import { useT } from '../../i18n/react';
import { useSwapMotion } from '../swap-motion';
import { HudIcon, type HudIconKind, hex } from './MatchHud';
import './sideline.css';

/**
 * Beira da quadra (agência do técnico, EXPERIMENTO atrás de Configurações → Experimentos ou `?agencia=1`): gritos,
 * pedido de tempo, goleiro-linha, golpe máximo do capitão e a ordem dos pênaltis. A copa e o duelo usam as mesmas
 * peças; o estado sai dos eventos da partida (o que já passou na tela) e das ordens que ainda não entraram.
 */

export const SHOUT_ICON: Record<Shout, HudIconKind> = {
    attack: 'offensive',
    lock: 'defensive',
    calm: 'calm',
    press: 'press',
};

export interface AgencyView {
    shout: Shout | null;
    shoutsLeft: number;
    shoutReady: boolean;
    timeoutUsed: boolean;
    timeoutPending: boolean;
    flyOn: boolean;
    /** Troca do goleiro-linha esperando a bola parada (o valor novo), ou null. */
    flyPending: boolean | null;
    max: MaxCharge;
    maxPending: boolean;
}

/** Estado da beira da quadra de um time no tick da tela. */
export function agencyView(
    events: readonly MatchEvent[],
    orders: readonly MatchOrder[],
    side: 0 | 1,
    tick: number,
): AgencyView {
    const mine = orders.filter((o) => o.team === side && isAgencyOrder(o));
    const past = events.filter((e) => e.tick <= tick);
    const shouts = past.filter((e) => e.type === 'shout' && e.team === side);
    const pendingShouts = mine.filter((o) => o.kind === 'shout' && o.tick > tick).length;
    const used = shouts.length + pendingShouts;
    const last = shouts.at(-1);
    const ht = events.find((e) => e.type === 'halftime')?.tick;
    const halfOf = (t: number) => (ht !== undefined && t > ht ? 2 : 1);
    const half = halfOf(tick);
    const timeouts = past.filter((e) => e.type === 'timeout' && e.team === side);
    const lastTo = mine.filter((o) => o.kind === 'timeout').at(-1);
    const flyEv = past.filter((e) => e.type === 'flyGk' && e.team === side).at(-1);
    const flyOn = flyEv?.type === 'flyGk' ? flyEv.on : false;
    const lastFly = mine.filter((o) => o.kind === 'flyGk').at(-1);
    const flyWant = lastFly?.kind === 'flyGk' ? lastFly.on : flyOn;
    return {
        shout: shoutAt(events, side, tick),
        shoutsLeft: Math.max(0, AGENCY.shoutLimit - used),
        shoutReady:
            used < AGENCY.shoutLimit && !pendingShouts && (!last || tick >= last.tick + AGENCY.shoutCooldownTicks),
        timeoutUsed: timeouts.some((e) => halfOf(e.tick) === half),
        timeoutPending: !!lastTo && halfOf(lastTo.tick) === half && !timeouts.some((e) => e.tick >= lastTo.tick),
        flyOn,
        flyPending: flyWant !== flyOn ? flyWant : null,
        max: maxCharge(events, side, tick),
        maxPending: mine.some((o) => o.kind === 'max' && o.tick > tick),
    };
}

/** Os botões do técnico (na aba Tática e na barra do desktop). */
export function SidelineControls({
    view,
    canAct,
    onShout,
    onTimeout,
    onFlyGk,
    onMax,
    onPens,
    compact = false,
}: {
    view: AgencyView;
    canAct: boolean;
    onShout: (s: Shout) => void;
    onTimeout?: () => void;
    onFlyGk: (on: boolean) => void;
    onMax: () => void;
    /** Duelo: abre a ordem dos pênaltis (na copa ela aparece sozinha antes da disputa). */
    onPens?: () => void;
    /** Só os gritos (no painel do pedido de tempo). */
    compact?: boolean;
}) {
    const { t, d } = useT();
    const a = d.match.agency;
    const maxReady = view.max.charge >= 1 && !view.max.used && !view.max.active && !view.maxPending;
    const shouts = (
        <div className="sl-shouts">
            {SHOUT_KINDS.map((k) => (
                <button
                    key={k}
                    type="button"
                    className={`bc-tile sl-shout${view.shout === k ? ' on' : ''}`}
                    aria-pressed={view.shout === k}
                    title={a.shoutHint[k]}
                    disabled={!canAct || !view.shoutReady}
                    onClick={() => onShout(k)}
                >
                    <HudIcon kind={SHOUT_ICON[k]} />
                    <span>
                        <b>{a.shout[k]}</b>
                    </span>
                </button>
            ))}
        </div>
    );
    if (compact) return <div className="sl sl-compact">{shouts}</div>;
    return (
        <div className="sl">
            <div className="bc-row">
                <span className="bc-lbl">
                    <HudIcon kind="shout" />
                    {a.title}
                    <span className="sl-beta">{a.beta}</span>
                </span>
                <span className="bc-lbl sl-count">
                    {a.shouts}: {t('match.agency.shoutsLeft', { n: view.shoutsLeft })}
                    {!view.shoutReady && view.shoutsLeft > 0 && ` · ${a.shoutWait}`}
                </span>
            </div>
            {shouts}
            <div className={`sl-actions${onPens ? ' four' : ''}`}>
                {onTimeout && (
                    <button
                        type="button"
                        className="sl-btn"
                        title={a.timeoutHint}
                        disabled={!canAct || view.timeoutUsed || view.timeoutPending}
                        onClick={onTimeout}
                    >
                        <HudIcon kind="timeout" />
                        <span>
                            <b>{a.timeout}</b>
                            <small>
                                {view.timeoutPending
                                    ? a.timeoutPending
                                    : view.timeoutUsed
                                      ? a.timeoutUsed
                                      : a.timeoutPerHalf}
                            </small>
                        </span>
                    </button>
                )}
                <button
                    type="button"
                    className={`sl-btn${view.flyOn ? ' on' : ''}`}
                    aria-pressed={view.flyOn}
                    title={a.flyGkHint}
                    disabled={!canAct}
                    onClick={() => onFlyGk(!(view.flyPending ?? view.flyOn))}
                >
                    <HudIcon kind="flyGk" />
                    <span>
                        <b>{a.flyGk}</b>
                        <small>
                            {view.flyPending !== null
                                ? `${view.flyPending ? a.flyGkOn : a.flyGkOff} · ${a.timeoutPending}`
                                : view.flyOn
                                  ? a.flyGkOn
                                  : a.flyGkOff}
                        </small>
                    </span>
                </button>
                <button
                    type="button"
                    className={`sl-btn sl-max${maxReady && canAct ? ' ready' : ''}${view.max.active ? ' live' : ''}`}
                    title={a.maxHint}
                    disabled={!canAct || !maxReady}
                    onClick={onMax}
                    style={{ '--fill': view.max.used ? 1 : view.max.charge } as CSSProperties}
                >
                    <HudIcon kind="max" />
                    <span>
                        <b>{a.max}</b>
                        <small>
                            {view.max.used
                                ? a.maxUsed
                                : view.max.active || view.maxPending
                                  ? a.maxActive
                                  : maxReady
                                    ? a.maxReady
                                    : `${Math.floor(view.max.charge * 100)}%`}
                        </small>
                    </span>
                    <i className="sl-fill" aria-hidden />
                </button>
                {onPens && (
                    <button type="button" className="sl-btn" disabled={!canAct} onClick={onPens}>
                        <HudIcon kind="team" />
                        <span>
                            <b>{a.pens.title}</b>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}

/** Barrinha do golpe máximo de cada time, embaixo do placar (os dois lados veem a do rival). */
export function MaxBars({
    events,
    tick,
    colors,
}: {
    events: readonly MatchEvent[];
    tick: number;
    colors: [number, number];
}) {
    const { t } = useT();
    return (
        <div className="sl-maxbars" title={t('match.agency.maxHint')}>
            {([0, 1] as const).map((team) => {
                const c = maxCharge(events, team, tick);
                const state = c.used ? 'used' : c.active ? 'live' : c.charge >= 1 ? 'full' : '';
                return (
                    <div
                        key={team}
                        className={`sl-maxbar t${team} ${state}`}
                        style={{ '--tc': hex(colors[team]), '--fill': c.used ? 0 : c.charge } as CSSProperties}
                    >
                        <i />
                    </div>
                );
            })}
        </div>
    );
}

/** Na quadra: balão do grito, goleiro-linha, golpe máximo no ar e a faixa do tempo pedido (dura o efeito todo). */
export function SidelineOverlay({
    events,
    tick,
    colors,
    names,
}: {
    events: readonly MatchEvent[];
    tick: number;
    colors: [number, number];
    names: [string, string];
}) {
    const { d } = useT();
    const a = d.match.agency;
    const past = events.filter((e) => e.tick <= tick);
    const timeout = past.filter((e) => e.type === 'timeout').at(-1);
    const showTimeout = timeout && tick < timeout.tick + AGENCY.timeoutTicks + 40;
    return (
        <div className="sl-overlay" aria-hidden>
            {([0, 1] as const).map((team) => {
                const shout = shoutAt(events, team, tick);
                const fly = past.filter((e) => e.type === 'flyGk' && e.team === team).at(-1);
                const max = maxCharge(events, team, tick);
                const tags: ReactNode[] = [];
                if (fly?.type === 'flyGk' && fly.on)
                    tags.push(
                        <span key="fly" className="sl-tag">
                            <HudIcon kind="flyGk" />
                            {a.flyGk}
                        </span>,
                    );
                if (max.active)
                    tags.push(
                        <span key="max" className="sl-tag sl-tag-max">
                            <HudIcon kind="max" />
                            {a.max}
                        </span>,
                    );
                if (!shout && !tags.length) return null;
                return (
                    <div
                        key={team}
                        className={`sl-side t${team}`}
                        style={{ '--tc': hex(colors[team]) } as CSSProperties}
                    >
                        {shout && (
                            <div key={`${shout}-${team}`} className="sl-balloon">
                                <HudIcon kind={SHOUT_ICON[shout]} />
                                <b>{a.shout[shout]}</b>
                            </div>
                        )}
                        {tags}
                    </div>
                );
            })}
            {showTimeout && timeout.type === 'timeout' && (
                <div className="sl-timeout" style={{ '--tc': hex(colors[timeout.team]) } as CSSProperties}>
                    <HudIcon kind="timeout" />
                    <b>{a.timeoutPanel.title}</b>
                    <span>{names[timeout.team]}</span>
                </div>
            )}
        </div>
    );
}

/** Painel do pedido de tempo (a partida para): grito, troca, prancheta e voltar. */
export function TimeoutPanel({
    children,
    canSub,
    onSub,
    onBack,
}: {
    children: ReactNode;
    canSub: boolean;
    onSub: () => void;
    onBack: () => void;
}) {
    const { t, d } = useT();
    const a = d.match.agency.timeoutPanel;
    return (
        <div className="ht-panel sl-panel" role="dialog" aria-label={a.title}>
            <span className="ht-title">{a.title}</span>
            <p className="ht-tip">{a.sub}</p>
            {children}
            <div className="ht-actions">
                <button type="button" className="btn yellow" disabled={!canSub} onClick={onSub}>
                    {t('match.substitute')}
                </button>
                <button type="button" className="btn primary" onClick={onBack}>
                    {a.back}
                </button>
            </div>
        </div>
    );
}

export interface PenaltyTaker {
    uid: string;
    name: string;
    sprite: string;
    gk: boolean;
}

/** Ordem dos cobradores: tocar em um e depois em outro troca os dois; as setas sobem e descem (teclado). */
export function PenaltyOrderPanel({
    takers,
    onConfirm,
    onKeep,
    busy,
}: {
    /** Na ordem padrão (pelo chute); o goleiro no fim. */
    takers: PenaltyTaker[];
    onConfirm: (order: string[]) => void;
    onKeep: () => void;
    busy?: boolean;
}) {
    const { t, d } = useT();
    const a = d.match.agency.pens;
    const [list, setList] = useState(takers);
    const [pick, setPick] = useState<number | null>(null);
    const listRef = useRef<HTMLOListElement>(null);
    useSwapMotion(listRef, list.map((p) => p.uid).join());
    const swap = (i: number, j: number) => {
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        setList(next);
        setPick(null);
    };
    const tap = (i: number) => (pick === null ? setPick(i) : pick === i ? setPick(null) : swap(pick, i));
    return (
        <div className="ht-panel sl-panel" role="dialog" aria-label={a.title}>
            <span className="ht-title">{a.title}</span>
            <p className="ht-tip">{a.hint}</p>
            <ol className="sl-pens" ref={listRef}>
                {list.map((p, i) => (
                    <li key={p.uid} data-uid={p.uid} className={i < 5 ? 'in' : undefined}>
                        <span className="sl-pen-n">{i + 1}</span>
                        <button
                            type="button"
                            className={`sl-pen-who${pick === i ? ' on' : ''}`}
                            aria-pressed={pick === i}
                            onClick={() => tap(i)}
                        >
                            <img className="pixel" src={p.sprite} alt="" />
                            <b>{p.name}</b>
                            {p.gk && <small>{a.gk}</small>}
                        </button>
                        <button
                            type="button"
                            className="sl-arrow"
                            disabled={i === 0}
                            aria-label={t('match.agency.pens.up', { name: p.name })}
                            onClick={() => swap(i, i - 1)}
                        >
                            <HudIcon kind="up" />
                        </button>
                        <button
                            type="button"
                            className="sl-arrow"
                            disabled={i === list.length - 1}
                            aria-label={t('match.agency.pens.down', { name: p.name })}
                            onClick={() => swap(i, i + 1)}
                        >
                            <HudIcon kind="down" />
                        </button>
                    </li>
                ))}
            </ol>
            <div className="ht-actions">
                <button type="button" className="btn" disabled={busy} onClick={onKeep}>
                    {a.keep}
                </button>
                <button
                    type="button"
                    className="btn primary"
                    disabled={busy}
                    onClick={() => onConfirm(list.map((p) => p.uid))}
                >
                    {a.confirm}
                </button>
            </div>
        </div>
    );
}
