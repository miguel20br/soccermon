import { type CSSProperties, type ReactNode, type Ref, useEffect, useMemo, useState } from 'react';
import type { Position } from '../../engine/attributes';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { CORNER_PLANS } from '../../engine/runners/live-runner';
import { type CornerPlan, type Phase, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { dict, t } from '../../i18n';
import { useT } from '../../i18n/react';
import type { CommentLine } from '../commentary';
import { PRESSURE_BINS, pressureUntil } from '../match-view';
import { ratingAt } from '../rating';
import { cardSprite } from './PokeCard';
import './broadcast.css';

/**
 * Peças da tela de partida que a copa e o duelo dividem (placar de transmissão, barra de pressão, narração por
 * cima da quadra, painel do técnico em abas, tática, escanteio, substituição e narração): o mesmo DOM e o mesmo
 * CSS nos dois modos. O que é só de um modo (velocidades, "pular pro fim", emotes, pedido de velocidade) fica na
 * tela dele.
 */

export const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export interface Clock {
    tick: number;
    minute: number;
    half: number;
    score: [number, number];
    phase: Phase;
}

const MATCH_MIN = 40;

/** Relógio do placar em duas linhas: o minuto (ou Intervalo/Fim/Pênaltis) e o tempo; `text` = não é minuto. */
export interface ClockParts {
    main: string;
    sub: string;
    text: boolean;
    /** Quanto da partida já passou (0..1), pra barrinha embaixo do relógio. */
    progress: number;
}

export function clockParts(
    clock: Clock,
    over: boolean,
    shootout: [number, number] | null,
    /** A cena parou no intervalo (o último tick ainda chega com a fase de jogo). */
    halftime = false,
): ClockParts {
    if (halftime || clock.phase === 'halftime')
        return { main: t('match.halftime'), sub: '', text: true, progress: 0.5 };
    if (clock.phase === 'fulltime' || over)
        return {
            main: shootout ? t('match.penalties', { a: shootout[0], b: shootout[1] }) : t('match.fulltime'),
            sub: '',
            text: true,
            progress: 1,
        };
    return {
        main: `${Math.min(MATCH_MIN, Math.floor(clock.minute))}'`,
        sub: dict().match.half[clock.half - 1] ?? '',
        text: false,
        progress: Math.min(1, Math.max(0, clock.minute / MATCH_MIN)),
    };
}

/** Texto do relógio numa linha: intervalo, fim/pênaltis ou "19' · 1º tempo". */
export function clockLabel(clock: Clock, over: boolean, shootout: [number, number] | null, halftime = false): string {
    const p = clockParts(clock, over, shootout, halftime);
    return p.text ? p.main : t('match.clock', { min: Math.min(MATCH_MIN, Math.floor(clock.minute)), half: p.sub });
}

/** Relógio do placar (reage à troca de idioma). */
export function useClockParts(
    clock: Clock,
    over: boolean,
    shootout: [number, number] | null,
    halftime = false,
): ClockParts {
    useT();
    return clockParts(clock, over, shootout, halftime);
}

/**
 * Placar de transmissão: faixa na cor de cada time, sigla (o nome inteiro só no desktop), gols em caixa clara,
 * relógio no meio com a barrinha do tempo e a fase numa etiqueta em cima.
 */
export function Scoreboard({
    names,
    tags,
    colors,
    score,
    clock,
    stage,
    boardRef,
    className = '',
    coaches,
    children,
}: {
    names: [string, string];
    /** Siglas (3 letras) de cada time. */
    tags: [string, string];
    colors: [number, number];
    score: [number, number];
    clock: ClockParts;
    stage: string;
    boardRef?: Ref<HTMLDivElement>;
    className?: string;
    /** Duelo: o título de cada treinador embaixo do time (é pra se exibir). */
    coaches?: [ReactNode, ReactNode];
    children?: ReactNode;
}) {
    const team = (i: 0 | 1) => (
        <div className={`bc-tm${i ? ' away' : ''}`} style={{ '--tc': hex(colors[i]) } as CSSProperties}>
            <span className="bc-sig" title={names[i]}>
                {tags[i]}
            </span>
            <span className="bc-full">{names[i]}</span>
            {/* key muda no gol: o número remonta e dá o pulo com o brilho da cor do time (sb-pop) */}
            <b key={`${i}-${score[i]}`} className="bc-sc sb-n">
                {score[i]}
            </b>
        </div>
    );
    return (
        <div className={`scoreboard bc-bug${coaches ? ' has-coaches' : ''}${className}`} ref={boardRef}>
            <span className="bc-phase bc-tag">{stage}</span>
            {team(0)}
            <div className="bc-mid">
                <span className={`bc-clock${clock.text ? ' txt' : ''}`}>{clock.main}</span>
                {clock.sub && <span className="bc-half">{clock.sub}</span>}
                <span className="bc-prog">
                    <i style={{ width: `${Math.round(clock.progress * 100)}%` }} />
                </span>
            </div>
            {team(1)}
            {coaches && (
                <>
                    <div className="sb-coach">{coaches[0]}</div>
                    <div className="sb-coach away">{coaches[1]}</div>
                </>
            )}
            {children}
        </div>
    );
}

/**
 * Barra de pressão embaixo do placar (estilo "attack momentum"): o perigo de cada time a cada 2', o da esquerda
 * pra cima e o da direita pra baixo. Só até o minuto da tela: o que ainda não passou fica vazio.
 */
export function PressureBar({
    match,
    tick,
    minute,
    colors,
    over,
}: {
    match: MatchResult;
    tick: number;
    minute: number;
    colors: [number, number];
    over: boolean;
}) {
    const { t } = useT();
    // recalcula a cada ~1 s de jogo (o relógio da tela anda bem mais rápido)
    const step = Math.floor(tick / 20) * 20;
    const bins = useMemo(() => pressureUntil(match, step), [match, step]);
    const now = over ? PRESSURE_BINS : Math.floor((Math.min(minute, MATCH_MIN - 0.01) / MATCH_MIN) * PRESSURE_BINS);
    const top = Math.max(0.6, ...bins.flatMap((b) => b.xg));
    // raiz: um chute bom ainda aparece do lado de um gol feito (a barra conta o jogo, não mede xG)
    const h = (v: number) => (v > 0 ? Math.max(0.2, Math.sqrt(v / top)) : 0);
    return (
        <div
            className="bc-pressure"
            role="img"
            aria-label={t('match.pressure')}
            title={t('match.pressure')}
            style={{ '--c0': hex(colors[0]), '--c1': hex(colors[1]) } as CSSProperties}
        >
            {bins.map((b, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: colunas fixas (uma a cada 2')
                <span key={i} className={`pb${i > now ? ' fut' : ''}`}>
                    <b className={b.goals[0] ? 'g' : undefined} style={{ '--v': h(b.xg[0]) } as CSSProperties} />
                    <u className={b.goals[1] ? 'g' : undefined} style={{ '--v': h(b.xg[1]) } as CSSProperties} />
                </span>
            ))}
            {!over && (
                <i
                    className="pb-now"
                    style={{ '--x': Math.min(minute, MATCH_MIN) / MATCH_MIN } as CSSProperties}
                    aria-hidden
                />
            )}
        </div>
    );
}

/**
 * Última frase da narração numa faixa colada embaixo da quadra (fora dela: a caixa de texto do golpe e as faixas de
 * gol ficam livres). Passe e jogada miúda não trocam a faixa (em 8x ela piscaria sem parar).
 */
export function Ticker({ lines, colors }: { lines: (CommentLine & { id: number })[]; colors: [number, number] }) {
    const { t } = useT();
    const shown = lines.find((l) => l.tone !== 'minor');
    return (
        <div className="bc-ticker-wrap" aria-hidden>
            {shown ? (
                <div
                    key={shown.id}
                    className={`bc-ticker ${shown.tone}`}
                    style={
                        { '--team-color': shown.team !== null ? hex(colors[shown.team]) : undefined } as CSSProperties
                    }
                >
                    <span className="min">{Math.floor(shown.minute)}'</span>
                    <span className="txt">{shown.text}</span>
                </div>
            ) : (
                <div className="bc-ticker">
                    <span className="txt muted">{t('match.feedEmpty')}</span>
                </div>
            )}
        </div>
    );
}

/** Ícones desenhados do painel da partida (nada de emoji). */
const ICONS = {
    balanced: 'M12 4v16M6 20h12M4 8h16M4 8l-2.5 6h5zM20 8l-2.5 6h5z',
    offensive: 'M6 13l6-6 6 6M6 19l6-6 6 6',
    defensive: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
    counter: 'M13 2L5 13h6l-1 9 8-12h-6z',
    sub: 'M7 4v15M3 15l4 4 4-4M17 20V5M13 9l4-4 4 4',
    flag: 'M6 21V3M6 4h11l-3 4 3 4H6',
    skip: 'M4 5l8 7-8 7zM12 5l8 7-8 7z',
    board: 'M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 3h6v3H9zM9 11h6M9 15h4',
    team: 'M4 6h16M4 12h16M4 18h16',
    feed: 'M4 5h16v11H10l-6 4z',
    smile: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM8 14c1 2 2.4 3 4 3s3-1 4-3M9 9.5v.5M15 9.5v.5',
    // abas de fora da partida (resultado, perfil)
    players:
        'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .6 3.5 2.8 3.5 6',
    chart: 'M5 20V11M11 20V5M17 20v-7M2 20h20',
    cup: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8',
    dex: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM3 12h6.5M14.5 12H21M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
    // beira da quadra (agência do técnico, experimento)
    shout: 'M3 10v4h4l7 5V5L7 10zM17 9a4 4 0 0 1 0 6M19.5 6a8 8 0 0 1 0 12',
    calm: 'M3 10c3-3 6-3 9 0s6 3 9 0M3 16c3-3 6-3 9 0s6 3 9 0',
    press: 'M4 4l5 5M20 4l-5 5M4 20l5-5M20 20l-5-5M12 8v8M8 12h8',
    timeout: 'M4 5h16M12 5v15M8 20h8',
    flyGk: 'M12 21V8M7 13l5-5 5 5M5 4h14',
    max: 'M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 16.9l-5.9 3.3 1.3-6.6L2.5 9l6.6-.8z',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    // instrução de escanteio: bola alta, curta, varia
    cornerArea: 'M4 18c2-9 14-9 16 0M18 15l2 3 2-3',
    cornerShort: 'M3 14h11M10 10l4 4-4 4M19 7a2 2 0 1 1 0 .1',
    cornerMixed: 'M3 7h4l10 10h4M3 17h4l10-10h4M18 4l3 3-3 3M18 14l3 3-3 3',
} as const;
export type HudIconKind = keyof typeof ICONS;

export function HudIcon({ kind }: { kind: HudIconKind }) {
    return (
        <svg
            className="hud-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d={ICONS[kind]} />
        </svg>
    );
}

/** Abas do painel do técnico. */
export type CoachTab = 'tactic' | 'board' | 'team' | 'feed';
const TAB_KEY = 'soccermon-match-tab';
const TAB_ICON: Record<CoachTab, HudIconKind> = { tactic: 'balanced', board: 'board', team: 'team', feed: 'feed' };

/** A aba guardada, se ela existe neste layout (no desktop a Tática fica embaixo da quadra, sem aba). */
export function pickTab(stored: string | null, tabs: readonly CoachTab[], fallback: CoachTab): CoachTab {
    return tabs.includes(stored as CoachTab) ? (stored as CoachTab) : fallback;
}

/** Aba aberta do painel do técnico, lembrada entre as partidas (sem localStorage, só nesta tela). */
export function useCoachTab(tabs: readonly CoachTab[], fallback: CoachTab): [CoachTab, (tab: CoachTab) => void] {
    const [tab, setTab] = useState<string | null>(() => {
        try {
            return localStorage.getItem(TAB_KEY);
        } catch {
            return null;
        }
    });
    const pick = (next: CoachTab) => {
        setTab(next);
        try {
            localStorage.setItem(TAB_KEY, next);
        } catch {
            // aba anônima ou armazenamento bloqueado: lembra só nesta partida
        }
    };
    return [pickTab(tab, tabs, fallback), pick];
}

export function CoachTabs({
    tabs,
    active,
    onPick,
}: {
    tabs: readonly CoachTab[];
    active: CoachTab;
    onPick: (tab: CoachTab) => void;
}) {
    const { t } = useT();
    return (
        <div className="bc-tabs" role="tablist" aria-label={t('match.coach.title')}>
            {tabs.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={tab === active}
                    className={tab === active ? 'on' : undefined}
                    onClick={() => onPick(tab)}
                >
                    <HudIcon kind={TAB_ICON[tab]} />
                    <span>{t(`match.coach.${tab}`)}</span>
                </button>
            ))}
        </div>
    );
}

/**
 * Painel da substituição: quem está em quadra (posição e fôlego) e o banco à vista desde o começo. Dá pra começar por
 * quem sai (depois quem entra, com a nota na vaga dele) ou por quem entra (depois quem sai).
 */
export function SubPanel({
    panelRef,
    subOut,
    setSubOut,
    onClose,
    onField,
    benchNow,
    byUid,
    slots,
    energyAt,
    nameOf,
    onPick,
}: {
    panelRef?: Ref<HTMLDivElement>;
    subOut: string | null;
    setSubOut: (uid: string | null) => void;
    onClose: () => void;
    onField: string[];
    benchNow: string[];
    byUid: Map<string, PokemonInstance>;
    slots: readonly Position[];
    /** Fôlego (0..1) agora de quem está na vaga `i`. */
    energyAt: (i: number) => number;
    nameOf: (uid: string) => string;
    onPick: (outUid: string, inUid: string) => void;
}) {
    const { t, d } = useT();
    /** Quem entra, quando o técnico começa pelo banco. */
    const [inFirst, setInFirst] = useState<string | null>(null);
    const picking = subOut ?? inFirst;
    return (
        <div className="panel sub-panel" ref={panelRef}>
            <div className="sub-head">
                <b>
                    {subOut
                        ? t('match.whoIn', { name: nameOf(subOut) })
                        : inFirst
                          ? t('match.whoOutFor', { name: nameOf(inFirst) })
                          : t('match.whoOut')}
                </b>
                <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => (subOut ? setSubOut(null) : inFirst ? setInFirst(null) : onClose())}
                >
                    {picking ? t('common.ui.back') : t('common.ui.close')}
                </button>
            </div>
            <div className="sub-list">
                {(subOut ? benchNow : onField).map((uid) => {
                    const p = byUid.get(uid);
                    if (!p) return null;
                    // quem sai: posição e fôlego agora; quem entra: a nota na vaga de quem sai
                    const slot = onField.indexOf(subOut ?? uid);
                    const role = slots[slot];
                    const r = role ? ratingAt(p, role) : null;
                    const energy = subOut ? null : energyAt(slot);
                    return (
                        <button
                            key={uid}
                            type="button"
                            className="sub-pick"
                            onClick={() =>
                                subOut ? onPick(subOut, uid) : inFirst ? onPick(uid, inFirst) : setSubOut(uid)
                            }
                        >
                            <img className="pixel" src={cardSprite(p)} alt="" />
                            <span>{nameOf(uid)}</span>
                            <small className={`slot-rating ${r?.fit ?? ''}`}>
                                {role && `${d.common.pos[role]} `}
                                {r?.display ?? viewInstance(p).overall}
                            </small>
                            {energy !== null && (
                                <i
                                    className="sub-energy"
                                    title={t('team.panel.staminaPct', { n: Math.round(energy * 100) })}
                                    style={{ '--e': energy } as CSSProperties}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            {!subOut && benchNow.length > 0 && (
                <>
                    <span className="sub-bench-lbl">{t('common.ui.bench')}</span>
                    <div className="sub-list">
                        {benchNow.map((uid) => {
                            const p = byUid.get(uid);
                            if (!p) return null;
                            const v = viewInstance(p);
                            return (
                                <button
                                    key={uid}
                                    type="button"
                                    className={`sub-pick bench${inFirst === uid ? ' on' : ''}`}
                                    aria-pressed={inFirst === uid}
                                    onClick={() => setInFirst(inFirst === uid ? null : uid)}
                                >
                                    <img className="pixel" src={cardSprite(p)} alt="" />
                                    <span>{nameOf(uid)}</span>
                                    <small className="slot-rating">
                                        {`${d.common.pos[v.naturalPosition]} ${v.overall}`}
                                    </small>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

/** Quem do seu time está mais cansado (só avisa no botão Substituir; nada troca sozinho). */
export interface TiredHint {
    name: string;
    energy: number;
    sprite: string;
}

/** Abaixo disso o botão Substituir avisa quem está cansado. */
export const TIRED_HINT = 0.5;

/** No intervalo, abaixo disso o painel sugere trocar quem está mais cansado. */
export const HT_SUGGEST = 0.8;

/** Sugestão de troca do intervalo: o mais cansado em quadra, se dá pra trocar e ele está abaixo de HT_SUGGEST. */
export function subSuggestion<T extends { energy: number }>(field: T[], canSub: boolean): T | null {
    if (!canSub) return null;
    const most = [...field].sort((a, b) => a.energy - b.energy)[0];
    return most && most.energy < HT_SUGGEST ? most : null;
}

/** Régua da peça (ataque, defesa) de 0 a 3: só pra ler rápido, o efeito de verdade fica no motor. */
export const TACTIC_METER: Record<Tactic, [number, number]> = {
    balanced: [2, 2],
    offensive: [3, 1],
    defensive: [1, 3],
    counter: [2, 2],
};
const CORNER_ICON: Record<CornerPlan, HudIconKind> = { area: 'cornerArea', short: 'cornerShort', mixed: 'cornerMixed' };
/** Quanto tempo o aviso da tática nova fica embaixo das peças. */
const TACTIC_NOTE_MS = 3500;

function Dots({ n, cls }: { n: number; cls: string }) {
    return (
        <span className={`bc-dots ${cls}`} aria-hidden>
            {[0, 1, 2].map((i) => (
                <i key={i} className={i < n ? 'on' : undefined} />
            ))}
        </span>
    );
}

/**
 * Tática (estilos em peças com ícone, sem limite de trocas), escanteio e o botão Substituir. Cada peça diz em
 * palavras simples o que muda, com a régua ATQ/DEF e o selo "Valendo" na ativa; ao tocar sobe um aviso curto.
 */
export function TacticControls({
    tactic,
    corner,
    canChange,
    pending,
    error,
    onTactic,
    onCorner,
    subOpen,
    canSub,
    onToggleSub,
    tired,
}: {
    tactic: Tactic;
    corner: CornerPlan;
    canChange: boolean;
    pending: boolean;
    error?: string | null;
    onTactic: (t: Tactic) => void;
    onCorner: (c: CornerPlan) => void;
    subOpen: boolean;
    canSub: boolean;
    onToggleSub: () => void;
    tired?: TiredHint | null;
}) {
    const { t, d } = useT();
    const [note, setNote] = useState<Tactic | null>(null);
    useEffect(() => {
        if (!note) return;
        const id = window.setTimeout(() => setNote(null), TACTIC_NOTE_MS);
        return () => clearTimeout(id);
    }, [note]);
    return (
        <div className="bc-tactic">
            <div className="bc-row row-style">
                <span className="bc-lbl">{t('match.coach.style')}</span>
                {pending && <span className="bc-lbl">{t('match.changing')}</span>}
            </div>
            <div className="bc-styles">
                {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => {
                    const [atk, def] = TACTIC_METER[tc];
                    return (
                        <button
                            key={tc}
                            type="button"
                            className={`bc-tile tac-tile${tactic === tc ? ' on' : ''}`}
                            aria-pressed={tactic === tc}
                            disabled={!canChange}
                            onClick={() => {
                                if (tc !== tactic) setNote(tc);
                                onTactic(tc);
                            }}
                        >
                            {tactic === tc && <span className="tac-on">{t('match.coach.active')}</span>}
                            <span className="tac-head">
                                <HudIcon kind={tc} />
                                <b>{d.common.tactic[tc]}</b>
                            </span>
                            <small>{d.match.coach.styleShort[tc]}</small>
                            <span
                                className="tac-meter"
                                role="img"
                                aria-label={t('match.coach.meter', { a: atk, d: def })}
                            >
                                {t('match.coach.atk')}
                                <Dots n={atk} cls="atk" />
                                {t('match.coach.def')}
                                <Dots n={def} cls="def" />
                            </span>
                        </button>
                    );
                })}
            </div>
            {note && (
                <p key={note} className="tac-note" role="status">
                    <b>{d.common.tactic[note]}!</b> {t('match.coach.changed')}
                </p>
            )}
            {error && <span className="error-text">{error}</span>}
            <div className="bc-row row-corner">
                <span className="bc-lbl">
                    <HudIcon kind="flag" />
                    {t('match.corner')}
                </span>
            </div>
            <div className="bc-seg corner-seg" title={t('match.cornerHint')}>
                {CORNER_PLANS.map((pl) => (
                    <button
                        key={pl}
                        type="button"
                        className={corner === pl ? 'on' : undefined}
                        aria-pressed={corner === pl}
                        disabled={!canChange}
                        onClick={() => onCorner(pl)}
                    >
                        <HudIcon kind={CORNER_ICON[pl]} />
                        <span>{d.common.cornerPlan[pl]}</span>
                        <small>{d.match.coach.cornerSub[pl]}</small>
                    </button>
                ))}
            </div>
            <button
                type="button"
                className={`bc-subbtn${subOpen ? ' on' : ''}`}
                aria-expanded={subOpen}
                disabled={!canSub}
                onClick={onToggleSub}
            >
                <HudIcon kind="sub" />
                <b>{t('match.substitute')}</b>
                {tired && (
                    <span className="bc-warn">
                        {t('match.coach.tired', { name: tired.name, p: Math.round(tired.energy * 100) })}
                        <img className="pixel" src={tired.sprite} alt="" />
                    </span>
                )}
            </button>
        </div>
    );
}

/** Narração completa (aba Lances; no celular sem abas ela recolhe). */
export function MatchFeed({ lines, colors }: { lines: (CommentLine & { id: number })[]; colors: [number, number] }) {
    const { t } = useT();
    return (
        <div className="feed" aria-live="polite">
            {lines.length === 0 && <span className="muted">{t('match.feedEmpty')}</span>}
            {lines.map((l) => (
                <div
                    key={l.id}
                    className={`feed-line ${l.tone}`}
                    style={{ ['--team-color' as string]: l.team !== null ? hex(colors[l.team]) : undefined }}
                >
                    <span className="min">{Math.floor(l.minute)}'</span>
                    {l.text}
                </div>
            ))}
        </div>
    );
}
