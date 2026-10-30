import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { AGENCY, fxTypeOf, type MaxCharge, maxCharge, maxMinLevel } from '../../engine/agency';
import { species } from '../../engine/data';
import { maxFxType } from '../../engine/match';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { MAX_SIGNATURE } from '../../engine/signature-moves';
import { has } from '../../engine/sponsors';
import { isAgencyOrder, type MatchEvent, type MatchOrder, type MaxGrade, type TeamSetup } from '../../engine/state';
import { useT } from '../../i18n/react';
import { captainAt, MAX_CUE_EARLY, MAX_CUE_LATCH, maxCallCueNear, maxCueNear, roleAt } from '../match-view';
import { holdRing, maxTap } from '../max-beat';
import { useSwapMotion } from '../swap-motion';
import { TYPE_COLOR, TYPE_DARK_TEXT } from '../type-colors';
import { HudIcon, hex } from './MatchHud';
import { TypeIcon } from './TypeIcon';
import './sideline.css';

/**
 * Beira da quadra (agência do técnico, ligada pra todos desde a 0.9.6): pedido de
 * tempo, goleiro-linha, golpe máximo do capitão e a ordem dos pênaltis. A copa e o duelo usam as mesmas peças; o estado
 * sai dos eventos da partida (o que já passou na tela) e das ordens que ainda não entraram.
 */

export interface AgencyView {
    timeoutUsed: boolean;
    timeoutPending: boolean;
    flyOn: boolean;
    /** Troca do goleiro-linha mandada que ainda não entrou (o valor novo), ou null. */
    flyPending: boolean | null;
    max: MaxCharge;
    /** Golpe máximo pedido que ainda não saiu: a ordem não entrou ou está armada ("chamando" o capitão). */
    maxPending: boolean;
    /** Botão do golpe máximo aceso no quadro da tela (`maxCueAt`): chamando o capitão ou na hora certa. */
    maxCue: MaxCueKind;
    /** Golpe máximo por tipo: o efeito do N3 do capitão (a prévia no botão). */
    fxType?: string;
    /** O jogador tocou em "Esperar" (`maxWaitNext`): o aviso fica apagado. */
    maxWaiting?: boolean;
    /** Tipo do capitão (`capTypeAt`): a cor do botão no N3. */
    capType?: string;
}

/** Estado da beira da quadra de um time no tick da tela. `cue`: é a hora do golpe máximo (`maxCueAt`). */
export function agencyView(
    events: readonly MatchEvent[],
    orders: readonly MatchOrder[],
    side: 0 | 1,
    tick: number,
    cue: MaxCueKind = false,
): AgencyView {
    const mine = orders.filter((o) => o.team === side && isAgencyOrder(o));
    const past = events.filter((e) => e.tick <= tick);
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
        timeoutUsed: timeouts.some((e) => halfOf(e.tick) === half),
        timeoutPending: !!lastTo && halfOf(lastTo.tick) === half && !timeouts.some((e) => e.tick >= lastTo.tick),
        flyOn,
        flyPending: flyWant !== flyOn ? flyWant : null,
        max: maxCharge(events, side, tick, 5),
        // armada até sair (qualquer evento `max` do time depois da ordem) ou passar `maxArmTicks`
        maxPending: mine.some(
            (o) =>
                o.kind === 'max' &&
                tick < o.tick + AGENCY.maxArmTicks &&
                !past.some((e) => e.type === 'max' && e.team === side && e.tick >= o.tick),
        ),
        maxCue: cue,
    };
}

/**
 * O botão do golpe máximo do time `side` acende no quadro `tick`: em todo ataque com capitão de linha ("chamar o
 * capitão", `maxCallCue`), ou na hora certa: capitão de linha com a bola na zona, ou rival na zona do goleiro capitão.
 * A hora certa acende `MAX_CUE_EARLY` antes (o toque um pouco cedo não se perde: a ordem fica armada e o golpe sai no
 * próximo chute ou defesa da zona) e fica `MAX_CUE_LATCH` depois (a quadra entra em câmera lenta antes ainda,
 * MatchScene `maxCueNow`).
 */
export function maxCueAt(m: MatchResult, setups: [TeamSetup, TeamSetup], side: 0 | 1, tick: number): MaxCueKind {
    const cap = captainAt(m, setups, side, tick).idx;
    if (cap === null || !m.snapshots.length) return false;
    const role = roleAt(m, setups, cap, tick);
    if (maxCharge(m.events, side, tick, 5).level < maxMinLevel(role)) return false;
    if (maxCueNear(m.snapshots, tick - MAX_CUE_LATCH, tick + MAX_CUE_EARLY, side, cap, role)) return 'hora';
    return maxCallCueNear(m.snapshots, tick, side, role) && 'call';
}

/** Por que o botão acendeu: `call` (ataque do time, chamando o capitão) ou `hora` (a hora certa, com câmera lenta). */
export type MaxCueKind = false | 'call' | 'hora';

/** Efeito do N3 do capitão do time `side`: a mesma regra do motor (a assinatura dos 12 ou `maxFxType`). */
export function capFxType(
    m: MatchResult,
    setups: [TeamSetup, TeamSetup],
    side: 0 | 1,
    tick: number,
): string | undefined {
    const cap = captainAt(m, setups, side, tick);
    const inst = [...setups[side].lineup, ...setups[side].bench].find((p) => p.uid === cap.uid);
    if (!inst || !cap.speciesId) return undefined;
    return MAX_SIGNATURE[inst.speciesId] ?? maxFxType(inst.moves, cap.speciesId, species(cap.speciesId).types);
}

/** Tipo (o 1º) do capitão do time `side`: a cor do golpe máximo no N3, igual à aura dele na quadra. */
export function capTypeAt(m: MatchResult, setups: [TeamSetup, TeamSetup], side: 0 | 1, tick: number) {
    const id = captainAt(m, setups, side, tick).speciesId;
    return id ? species(id).types[0] : undefined;
}

/**
 * Prévia do efeito do tipo no botão (decisão 1: só vale no N3; no N1 e no N2 o ícone fica apagado, pra o jogador saber
 * o que está esperando).
 */
function FxBadge({ view }: { view: AgencyView }) {
    const { d } = useT();
    if (!view.fxType) return null;
    const name = d.match.agency.maxFx[view.fxType]?.[0] ?? view.fxType;
    return (
        <span
            className={`sl-fx${view.max.level >= 3 ? ' on' : ''}`}
            title={d.match.agency.maxFxPreview.replace('{x}', name)}
        >
            <TypeIcon type={fxTypeOf(view.fxType)} size={14} />
        </span>
    );
}

/** Golpe máximo pronto e na hora certa (o botão acende). */
export const maxLit = (v: AgencyView) =>
    v.maxCue && v.max.level >= 1 && !v.max.active && !v.maxPending && !v.maxWaiting;

/**
 * Toque no golpe máximo: a nota (e o som dela) sai da distância até o anel encostar no `pointerdown` (o `click` chega
 * depois de soltar o dedo e comeria a janela); teclado e leitor de tela tocam no `click`.
 */
function useMaxTap(onMax: (q: MaxGrade) => void, lit: boolean) {
    const down = useRef<MaxGrade | null>(null);
    return {
        onPointerDown: () => {
            if (lit) down.current = maxTap();
        },
        tap: () => {
            const q = down.current ?? maxTap();
            down.current = null;
            onMax(q);
        },
    };
}

/**
 * Cara do botão por nível (C1): o N1 fica no amarelo; o N2 é laranja (no CSS, `data-lv`); o N3 vai na cor do tipo do
 * capitão (a mesma da aura dele na quadra), com a tinta legível por cima.
 */
function levelLook(view: AgencyView): { 'data-lv': number; style?: CSSProperties } {
    const lv = view.max.level;
    const type = lv >= 3 ? (view.capType ?? null) : null;
    const c = type ? TYPE_COLOR[type] : undefined;
    return {
        'data-lv': lv,
        style: c
            ? ({
                  '--lvc': c,
                  '--lvink': TYPE_DARK_TEXT.has(type as string) ? 'var(--bc-ink)' : '#fff',
              } as CSSProperties)
            : undefined,
    };
}

/** Gomos da barra (o rótulo do botão mostra o nível). */
const maxLevelLabel = (lv: number, tpl: string) => tpl.replace('{n}', String(lv));

/** Os botões do técnico (na aba Tática e na barra do desktop). */
export function SidelineControls({
    view,
    canAct,
    onTimeout,
    onFlyGk,
    onMax,
    onPens,
}: {
    view: AgencyView;
    canAct: boolean;
    onTimeout?: () => void;
    onFlyGk: (on: boolean) => void;
    onMax: (q: MaxGrade) => void;
    /** Duelo: abre a ordem dos pênaltis (na copa ela aparece sozinha antes da disputa). */
    onPens?: () => void;
}) {
    const { d } = useT();
    const a = d.match.agency;
    const lit = maxLit(view) && canAct;
    const tap = useMaxTap(onMax, lit);
    const look = levelLook(view);
    return (
        <div className="sl">
            <div className="bc-row">
                <span className="bc-lbl">
                    <HudIcon kind="shout" />
                    {a.title}
                </span>
            </div>
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
                                ? `${view.flyPending ? a.flyGkOn : a.flyGkOff}…`
                                : view.flyOn
                                  ? a.flyGkOn
                                  : a.flyGkOff}
                        </small>
                    </span>
                </button>
                <button
                    type="button"
                    className={`sl-btn sl-max lv3${lit ? ' ready' : view.max.level >= 1 ? ' full' : ''}${view.max.active ? ' live' : ''}`}
                    title={`${a.maxHint} ${a.maxBeatHint}`}
                    aria-keyshortcuts="M"
                    // aria-disabled e não disabled: fica no Tab e o leitor acha o botão antes de ele acender
                    aria-disabled={!lit}
                    onPointerDown={tap.onPointerDown}
                    onClick={() => lit && tap.tap()}
                    data-lv={look['data-lv']}
                    style={{ ...look.style, '--fill': view.max.charge } as CSSProperties}
                >
                    <HudIcon kind="max" />
                    <span>
                        <b>{a.max}</b>
                        <small>
                            {view.max.active
                                ? a.maxActive
                                : view.maxPending
                                  ? a.maxCalling
                                  : lit
                                    ? a.maxReady
                                    : maxLevelLabel(view.max.level, a.maxLevel)}
                        </small>
                    </span>
                    <FxBadge view={view} />
                    <i className="sl-fill" aria-hidden />
                </button>
                {/* o leitor de tela avisa quando acende (o texto do botão muda a cada %; aqui só a hora certa) */}
                <span className="sr-only" aria-live="polite">
                    {lit ? `${a.max}: ${a.maxReady} (${maxLevelLabel(view.max.level, a.maxLevel)})` : ''}
                </span>
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

/**
 * O golpe máximo na barra de baixo (celular): sempre à vista, a barra enchendo por dentro e o nível. Antes ele morava
 * só na aba Tática, abaixo da quadra: pra ver a barra o jogador descia a tela e perdia a partida (e o aviso grande, que
 * fica na quadra). Tocar antes de acender diz quando acende, em vez de não fazer nada.
 */
export function MaxThumb({ view, canAct, onMax }: { view: AgencyView; canAct: boolean; onMax: (q: MaxGrade) => void }) {
    const { d } = useT();
    const a = d.match.agency;
    const lit = maxLit(view) && canAct;
    const tap = useMaxTap(onMax, lit);
    const look = levelLook(view);
    const [why, setWhy] = useState(false);
    useEffect(() => {
        if (!why) return;
        const id = window.setTimeout(() => setWhy(false), 2500);
        return () => clearTimeout(id);
    }, [why]);
    const live = view.max.active || view.maxPending;
    return (
        // a cor do N3 no invólucro: o botão e o anel (irmão dele) herdam
        <span className="bc-maxwrap" style={look.style}>
            <button
                type="button"
                className={`bc-maxthumb${lit ? ' ready' : ''}${live ? ' live' : ''}`}
                aria-keyshortcuts="M"
                aria-disabled={!lit}
                aria-label={`${a.max}: ${live ? a.maxActive : lit ? a.maxReady : maxLevelLabel(view.max.level, a.maxLevel)}`}
                onPointerDown={tap.onPointerDown}
                onClick={() => (lit ? tap.tap() : !live && setWhy(true))}
                data-lv={look['data-lv']}
                style={{ '--fill': view.max.charge } as CSSProperties}
            >
                <i className="bc-maxthumb-fill" aria-hidden />
                <HudIcon kind="max" />
                <b aria-hidden>{maxLevelLabel(view.max.level, a.maxLevelShort)}</b>
            </button>
            {lit && <QteRing key={view.maxCue || ''} duck={view.maxCue === 'hora'} />}
            {why && (
                <span className="bc-maxwhy" role="status" data-exit>
                    {a.maxWhen}
                </span>
            )}
        </span>
    );
}

/**
 * O botão grande do golpe máximo em cima da quadra: só aparece na hora certa (o da aba Tática acende junto), pra
 * dar tempo de tocar de qualquer aba. `onWait` (só na copa): o "Esperar" ao lado apaga o aviso e a câmera lenta.
 */
export function MaxCueButton({
    view,
    canAct,
    onMax,
    onWait,
}: {
    view: AgencyView;
    canAct: boolean;
    onMax: (q: MaxGrade) => void;
    onWait?: () => void;
}) {
    const { d } = useT();
    const a = d.match.agency;
    const lit = canAct && maxLit(view);
    const tap = useMaxTap(onMax, lit);
    if (!lit) return null;
    return (
        <div className="sl-cue-row" data-exit>
            <button
                type="button"
                className="sl-cue lv3"
                aria-keyshortcuts="M"
                title={a.maxBeatHint}
                onPointerDown={tap.onPointerDown}
                onClick={tap.tap}
                {...levelLook(view)}
            >
                <span className="sl-ring-at">
                    <QteRing key={view.maxCue || ''} duck={view.maxCue === 'hora'} />
                    <HudIcon kind="max" />
                </span>
                <b className="sl-cue-name">{a.max}</b>
                <small className="sl-cue-lv">{maxLevelLabel(view.max.level, a.maxLevelShort)}</small>
                <FxBadge view={view} />
            </button>
            {onWait && (
                <button
                    type="button"
                    className="sl-cue sl-wait"
                    aria-keyshortcuts={a.maxWaitKey}
                    title={view.max.level >= 3 ? a.maxWaitHint3 : a.maxWaitHint}
                    onClick={onWait}
                >
                    <b>{a.maxWait}</b>
                </button>
            )}
        </div>
    );
}

/**
 * Anel do QTE (um tiro só): nasce grande quando o botão acende e fecha UMA vez, encostando no 1 do compasso (a hora
 * do perfeito, `holdRing`); depois some. Anda por `requestAnimationFrame` direto no estilo (nada de render do React):
 * `--q` vai de 0 (nasceu) a 1 (encostou).
 */
function QteRing({ duck }: { duck: boolean }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const r = holdRing(duck);
        let raf = 0;
        const loop = () => {
            const now = performance.now();
            const el = ref.current;
            if (el) {
                el.style.setProperty('--q', Math.min(1, (now - r.start) / Math.max(1, r.at - r.start)).toFixed(3));
                if (now >= r.at) el.classList.add('hit');
            }
            if (now < r.at + 400) raf = requestAnimationFrame(loop);
        };
        loop();
        return () => {
            cancelAnimationFrame(raf);
            r.release();
        };
    }, [duck]);
    return <span ref={ref} className="sl-ring" aria-hidden />;
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
                const c = maxCharge(events, team, tick, 5);
                const state = c.active ? 'live' : c.charge >= 1 ? 'full' : '';
                return (
                    <div
                        key={team}
                        className={`sl-maxbar lv3 t${team} ${state}`}
                        style={{ '--tc': hex(colors[team]), '--fill': c.charge } as CSSProperties}
                    >
                        <i />
                    </div>
                );
            })}
        </div>
    );
}

/** Na quadra: goleiro-linha, defesa máxima valendo e a faixa do tempo pedido (dura o efeito todo). */
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
                const fly = past.filter((e) => e.type === 'flyGk' && e.team === team).at(-1);
                const max = maxCharge(events, team, tick, 5);
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
                if (!tags.length) return null;
                return (
                    <div
                        key={team}
                        className={`sl-side t${team}`}
                        style={{ '--tc': hex(colors[team]) } as CSSProperties}
                    >
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

/** Ticks depois do gol até o aviso da Charanga (deixa o "GOL!" passar) e até quando ele ainda pode entrar. */
const CHARANGA_DELAY = 30;
const CHARANGA_WINDOW = 400;

/**
 * Charanga de Pewter (a mesma regra do motor, `bonusesOf` em match.ts): o gol que deixou o time com ela perdendo agora
 * (estava empatado) liga a charanga. Devolve o time e o tick desse gol, enquanto o aviso ainda pode entrar.
 */
export function charangaGoalAt(
    events: readonly MatchEvent[],
    tick: number,
    setups: readonly [TeamSetup, TeamSetup],
): { team: 0 | 1; tick: number } | null {
    for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i];
        if (e.tick > tick - CHARANGA_DELAY) continue;
        if (e.tick < tick - CHARANGA_DELAY - CHARANGA_WINDOW) break;
        if (e.type !== 'goal') continue;
        const t = e.team === 0 ? 1 : 0;
        return has(setups[t].sponsors, 'charanga') && e.score[t] === e.score[e.team] - 1
            ? { team: t, tick: e.tick }
            : null;
    }
    return null;
}

/** "A CHARANGA ENTROU": aviso curto na quadra com o bumbo (entra e sai em 240 ms; o resto do tempo fica parado). */
export function CharangaCue({
    events,
    tick,
    setups,
    colors,
}: {
    events: readonly MatchEvent[];
    tick: number;
    setups: readonly [TeamSetup, TeamSetup];
    colors: [number, number];
}) {
    const { d } = useT();
    const [done, setDone] = useState<number | null>(null);
    const on = charangaGoalAt(events, tick, setups);
    if (!on || on.tick === done) return null;
    return (
        <div
            key={on.tick}
            className="sl-charanga"
            style={{ '--tc': hex(colors[on.team]) } as CSSProperties}
            role="status"
            onAnimationEnd={() => setDone(on.tick)}
        >
            <HudIcon kind="drum" />
            <b>{d.match.agency.charanga}</b>
        </div>
    );
}

/** Painel do pedido de tempo (a partida para): troca, prancheta e voltar. */
export function TimeoutPanel({
    children,
    canSub,
    onSub,
    onBack,
}: {
    children?: ReactNode;
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
                <button type="button" className="btn outline" disabled={!canSub} onClick={onSub}>
                    {t('match.substitute')}
                </button>
                <button type="button" className="btn confirm" onClick={onBack}>
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
                    className="btn confirm"
                    disabled={busy}
                    onClick={() => onConfirm(list.map((p) => p.uid))}
                >
                    {a.confirm}
                </button>
            </div>
        </div>
    );
}
