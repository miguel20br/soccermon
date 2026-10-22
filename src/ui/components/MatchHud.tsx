import { type CSSProperties, type ReactNode, type Ref, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { CORNER_PLANS } from '../../engine/runners/live-runner';
import { type CornerPlan, type Phase, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { dict, t } from '../../i18n';
import { useT } from '../../i18n/react';
import type { ClubLook } from '../../store/club-kit';
import type { CommentLine } from '../commentary';
import { PRESSURE_BINS, pressureUntil } from '../match-view';
import { Crest, kitBackground } from '../profile/Crest';
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
    /** Acréscimos anunciados do tempo atual (minutos; o relógio para no 20'/40' e o placar mostra "+N'"). */
    added?: number;
}

const MATCH_MIN = 40;

/** Relógio do placar em duas linhas: o minuto (ou Intervalo/Fim/Pênaltis) e o tempo; `text` = não é minuto. */
export interface ClockParts {
    main: string;
    sub: string;
    text: boolean;
    /** Quanto da partida já passou (0..1), pra barrinha embaixo do relógio. */
    progress: number;
    /** Acréscimos ("+2'"), ou ''/sem. */
    added?: string;
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
        added: clock.added ? t('match.added', { min: clock.added }) : '',
    };
}

/** Texto do relógio numa linha: intervalo, fim/pênaltis, "19' · 1º tempo" ou, nos acréscimos, "20' +2' · 1º tempo". */
export function clockLabel(clock: Clock, over: boolean, shootout: [number, number] | null, halftime = false): string {
    const p = clockParts(clock, over, shootout, halftime);
    if (p.text) return p.main;
    const label = t('match.clock', { min: Math.min(MATCH_MIN, Math.floor(clock.minute)), half: p.sub });
    return p.added ? label.replace(p.main, `${p.main} ${p.added}`) : label;
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
    looks,
    pressure,
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
    /** Escudo e uniforme de cada time (a faixa do lado ganha o padrão; o escudo vai antes da sigla). */
    looks?: [ClubLook, ClubLook];
    /** Time na Pressão final agora (selo em cima do lado dele); undefined = a tela não mostra. */
    pressure?: 0 | 1 | null;
    children?: ReactNode;
}) {
    const { t } = useT();
    const team = (i: 0 | 1) => (
        <div
            className={`bc-tm${i ? ' away' : ''}${looks ? ' has-kit' : ''}`}
            style={
                {
                    '--tc': hex(colors[i]),
                    ...(looks && {
                        '--kit': kitBackground(looks[i].color, looks[i].color2, looks[i].pattern, '5px', '180deg'),
                    }),
                } as CSSProperties
            }
        >
            {looks && <Crest look={looks[i]} className="crest bc-crest" />}
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
            {pressure !== undefined &&
                ([0, 1] as const).map((i) => (
                    // os dois selos ficam montados: o do lado que perde aparece (e some) no fade, nada pula
                    <span
                        key={i}
                        className={`bc-fp${i ? ' away' : ''}${pressure === i ? ' on' : ''}`}
                        style={{ '--tc': hex(colors[i]) } as CSSProperties}
                        title={t('match.finalPressureHint')}
                        aria-hidden={pressure !== i}
                    >
                        <HudIcon kind="offensive" />
                        {t('match.finalPressure')}
                    </span>
                ))}
            {team(0)}
            <div className="bc-mid">
                <span className={`bc-clock${clock.text ? ' txt' : ''}`}>
                    {clock.main}
                    {clock.added && <span className="bc-add">{clock.added}</span>}
                </span>
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

/** Ícones desenhados do painel da partida e do resto do site (nada de emoji). A Golpedex reusa (GdxIcon). */
export const ICONS = {
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
    // duas cartas, uma atrás da outra (aba Fichário do Perfil)
    cards: 'M9 7h10v14H9zM5 17V3h10',
    // medalha com fita (aba Medalhas do Perfil)
    medal: 'M8 2l3 7M16 2l-3 7M12 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM12 12.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    // instrução de escanteio: bola alta, curta, varia
    cornerArea: 'M4 18c2-9 14-9 16 0M18 15l2 3 2-3',
    cornerShort: 'M3 14h11M10 10l4 4-4 4M19 7a2 2 0 1 1 0 .1',
    cornerMixed: 'M3 7h4l10 10h4M3 17h4l10-10h4M18 4l3 3-3 3M18 14l3 3-3 3',
    // pronto do duelo
    check: 'M5 12.5l4.5 4.5L19 7.5',
    lock: 'M8 11V8a4 4 0 0 1 8 0v3M5 11h14v10H5z',
    // o resto do site (docs/marca/brand-guide.md: todo ícone de interface sai daqui, 24 / traço 2.4 / ponta redonda)
    close: 'M6 6l12 12M18 6L6 18',
    play: 'M8 5l11 7-11 7z',
    search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5L20 20',
    expand: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
    reroll: 'M19.5 13A7.5 7.5 0 1 1 17 6.4M18.5 3v4h-4',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    upload: 'M12 15V4M7 9l5-5 5 5M5 20h14',
    next: 'M9 6l6 6-6 6',
    prev: 'M15 6l-6 6 6 6',
    stop: 'M6.5 6.5h11v11h-11z',
    mute: 'M3 10v4h4l7 5V5L7 10zM17 9.5l5 5M22 9.5l-5 5',
    bulb: 'M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z',
    person: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8',
    addFriend: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-7 7-7s7 3 7 7M19 8v6M16 11h6',
    friends: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-7 7-7s7 3 7 7M16 3.5a4 4 0 0 1 0 7.5M18 14c2.4.8 4 3.4 4 7',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    // Mercado e Patrocínios (src/ui/components/SponsorCard.tsx)
    heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    dice: 'M5 5h14v14H5zM9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01',
    ship: 'M3 14h18l-2.5 6h-13zM6 14V9h12v5M10 9V5h4v4',
    bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
    flask: 'M9 3h6M10 3v6l-5 11h14l-5-11V3M7 15h10',
    egg: 'M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11zM8 14l2 1.5 2-1.5 2 1.5 2-1.5',
    leaf: 'M5 19C5 10 11 4 20 4c0 9-6 15-15 15zM5 19l8-8',
    building: 'M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3',
    bike: 'M3.5 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0M14.5 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0M6.5 17L10 9h5l2.5 8M10 9l3 8M13 6h3',
    book: 'M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3zM21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z',
    crown: 'M4 19h16M5 16L3 7l5 4 4-6 4 6 5-4-2 9z',
    // Copa longa (src/ui/screens/CupMap.tsx)
    chest: 'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9H4zM4 12h16M12 10v5',
    question: 'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01',
    // eventos da Rota Índigo
    medkit: 'M4 8h16v12H4zM9 8V5h6v3M12 11v6M9 14h6',
    briefcase: 'M3 9h18v11H3zM8 9V6h8v3M3 14h18',
    armband: 'M5 6h14l-1.5 14h-11zM10 10.5a2.5 2.5 0 1 0 0 5h1.5M14 10v6',
    binoculars:
        'M3.5 16a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0M13.5 16a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0M5 13l2-7h3l1 7M19 13l-2-7h-3l-1 7M10.5 12h3',
    mic: 'M9 4a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10a7 7 0 0 0 14 0M12 17v4M8 21h8',
    paw: 'M7 11a2 2 0 1 0 0-.01M17 11a2 2 0 1 0 0-.01M10 7a2 2 0 1 0 0-.01M14 7a2 2 0 1 0 0-.01M8 18c0-3 2-5 4-5s4 2 4 5c0 1.5-1.5 2-4 2s-4-.5-4-2z',
    dumbbell: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
    yellow: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    // formações (src/ui/formation-info.ts; o Ferrolho usa o cadeado)
    fDiamond: 'M12 3l8 9-8 9-8-9z',
    fSquare: 'M4 4h16v16H4zM12 16V8M8.5 11.5L12 8l3.5 3.5',
    fPivot: 'M4 20h4M10 20h4M16 20h4M12 16V5M8 9l4-4 4 4',
    fRotation: 'M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v3.7h-3.7M6 21v-3.7h3.7',
    fTwin: 'M7 20V6M3 10l4-4 4 4M17 20V6M13 10l4-4 4 4',
    // vantagem tática (a formação que encaixa contra a do rival)
    edge: 'M3 17l6-6 4 4 8-8M15 7h6v6',
} as const;
export type HudIconKind = keyof typeof ICONS;

/** `className` soma ao "hud-icon" (18 px): use pra mudar o tamanho num lugar só, nunca o traço. */
export function HudIcon({ kind, className }: { kind: HudIconKind; className?: string }) {
    return (
        <svg
            className={className ? `hud-icon ${className}` : 'hud-icon'}
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
    canSub,
    onSub,
    tired,
}: {
    tactic: Tactic;
    corner: CornerPlan;
    canChange: boolean;
    pending: boolean;
    error?: string | null;
    onTactic: (t: Tactic) => void;
    onCorner: (c: CornerPlan) => void;
    canSub: boolean;
    /** Leva pra prancheta (a troca é tocando em quem sai e em quem entra). Sem = sem botão (no intervalo o painel já tem). */
    onSub?: () => void;
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
            {onSub && (
                <button type="button" className="bc-subbtn" disabled={!canSub} onClick={onSub}>
                    <HudIcon kind="sub" />
                    <b>{t('match.substitute')}</b>
                    {tired && (
                        <span className="bc-warn">
                            {t('match.coach.tired', { name: tired.name, p: Math.round(tired.energy * 100) })}
                            <img className="pixel" src={tired.sprite} alt="" />
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

/** Fim de jogo: quanto tempo a quadra espera antes de ir sozinha pro resultado. */
export const AUTO_RESULT_MS = 3000;

/** Passo da ida automática pro resultado: esperando, já pode ir, ou o técnico segurou (fica na quadra). */
export function autoResultStep(elapsedMs: number, held: boolean): 'wait' | 'go' | 'held' {
    if (held) return 'held';
    return elapsedMs >= AUTO_RESULT_MS ? 'go' : 'wait';
}

/**
 * Depois do apito final vai sozinho pro resultado em AUTO_RESULT_MS; `hold()` (um toque na quadra ou no painel)
 * segura e a tela fica esperando o "Ver resultado". `left` = fração do tempo que falta (1 → 0), pro botão encher.
 */
export function useAutoResult(ended: boolean, onGo: () => void): { held: boolean; hold: () => void; left: number } {
    const [held, setHeld] = useState(false);
    const [left, setLeft] = useState(1);
    const go = useRef(onGo);
    go.current = onGo;
    useEffect(() => {
        if (!ended || held) return;
        const start = performance.now();
        let gone = false;
        const id = window.setInterval(() => {
            const elapsed = performance.now() - start;
            setLeft(Math.max(0, 1 - elapsed / AUTO_RESULT_MS));
            if (!gone && autoResultStep(elapsed, false) === 'go') {
                gone = true;
                go.current();
            }
        }, 100);
        return () => clearInterval(id);
    }, [ended, held]);
    return { held, hold: () => ended && setHeld(true), left };
}

/** Resultado da partida do ponto de vista de `side` (pênaltis desempatam). */
export function finalOutcome(score: [number, number], shootout: [number, number] | null, side: 0 | 1) {
    const [a, b] = shootout && score[0] === score[1] ? shootout : score;
    const diff = side === 0 ? a - b : b - a;
    return diff > 0 ? 'win' : diff < 0 ? 'loss' : 'draw';
}

/** Faixa grande do fim de jogo por cima da quadra: VITÓRIA!/DERROTA/EMPATE e o placar. */
export function FinalBanner({
    score,
    shootout,
    side,
    names,
}: {
    score: [number, number];
    shootout: [number, number] | null;
    side: 0 | 1;
    names: [string, string];
}) {
    const { t } = useT();
    const outcome = finalOutcome(score, shootout, side);
    return (
        <div className={`final-banner ${outcome}`} role="status">
            <b>{t(`match.final.${outcome}`)}</b>
            <span>
                {names[side]} {score[side]} x {score[side === 0 ? 1 : 0]}
                {shootout && ` (${t('match.penalties', { a: shootout[side], b: shootout[side === 0 ? 1 : 0] })})`}
            </span>
        </div>
    );
}

/** Botão do fim de jogo: enche enquanto conta os segundos pra ir sozinho; segurado, vira o botão de sempre. */
export function ResultButton({
    label,
    onGo,
    auto,
}: {
    label: string;
    onGo: () => void;
    auto: { held: boolean; hold: () => void; left: number };
}) {
    const { t } = useT();
    const counting = !auto.held;
    return (
        <>
            <button
                type="button"
                className={`btn primary bc-result${counting ? ' counting' : ''}`}
                style={{ '--fill': 1 - auto.left } as CSSProperties}
                onClick={onGo}
            >
                {counting
                    ? t('match.goingResult', { s: Math.max(1, Math.ceil((auto.left * AUTO_RESULT_MS) / 1000)) })
                    : label}
            </button>
            {counting && (
                <button type="button" className="btn ghost bc-stay" onClick={auto.hold}>
                    {t('match.stay')}
                </button>
            )}
        </>
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
