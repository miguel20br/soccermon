import type { CSSProperties, ReactNode, Ref } from 'react';
import type { Position } from '../../engine/attributes';
import { MAX_TACTIC_CHANGES } from '../../engine/config';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { CORNER_PLANS } from '../../engine/runners/live-runner';
import { type CornerPlan, type Phase, TACTIC_LABEL, type Tactic } from '../../engine/state';
import { useT } from '../../i18n/react';
import type { CommentLine } from '../commentary';
import { ratingAt } from '../rating';
import { cardSprite } from './PokeCard';

/**
 * Peças da tela de partida que a copa e o duelo dividem (placar, relógio, substituição, tática, escanteio e
 * narração): o mesmo DOM e o mesmo CSS nos dois modos. O que é só de um modo (velocidades, "pular pro fim",
 * emotes, pedido de velocidade) fica na tela dele.
 */

export const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export interface Clock {
    tick: number;
    minute: number;
    half: number;
    score: [number, number];
    phase: Phase;
}

/** Texto do relógio: intervalo, fim (ou a disputa de pênaltis) ou "12' · 1º tempo". */
export function useClockLabel(clock: Clock, over: boolean, shootout: [number, number] | null): string {
    const { t, d } = useT();
    return clock.phase === 'halftime'
        ? t('match.halftime')
        : clock.phase === 'fulltime' || over
          ? shootout
              ? t('match.penalties', { a: shootout[0], b: shootout[1] })
              : t('match.fulltime')
          : t('match.clock', {
                min: Math.min(40, Math.floor(clock.minute)),
                half: d.match.half[clock.half - 1] ?? '',
            });
}

/** Placar com o relógio. Nome comprido (mais de 10 letras) ganha a sigla no celular. */
export function Scoreboard({
    names,
    colors,
    score,
    clockLabel,
    stage,
    homeTag,
    boardRef,
    className = '',
    children,
}: {
    names: [string, string];
    colors: [number, number];
    score: [number, number];
    clockLabel: string;
    stage: string;
    homeTag: string;
    boardRef?: Ref<HTMLDivElement>;
    className?: string;
    children?: ReactNode;
}) {
    const long = names[0].length > 10;
    return (
        <div className={`scoreboard${className}`} ref={boardRef}>
            <div className="sb-team">
                <i style={{ background: hex(colors[0]) }} />
                <span className={`sb-name${long ? ' has-tag' : ''}`}>{names[0]}</span>
                {long && (
                    <span className="sb-tag" title={names[0]}>
                        {homeTag}
                    </span>
                )}
            </div>
            <div className="sb-score">
                {/* key muda no gol: o número remonta e dá o pulo com o brilho da cor do time (sb-pop) */}
                <b key={`h${score[0]}`} className="sb-n" style={{ '--tc': hex(colors[0]) } as CSSProperties}>
                    {score[0]}
                </b>{' '}
                x{' '}
                <b
                    key={`a${score[1]}`}
                    className="sb-n"
                    style={{ '--tc': hex(colors[1]), '--pop': 1.2 } as CSSProperties}
                >
                    {score[1]}
                </b>
                <span className="sb-clock">
                    <span className="sb-stage">{stage} · </span>
                    {clockLabel}
                </span>
            </div>
            <div className="sb-team away">
                <span>{names[1]}</span>
                <i style={{ background: hex(colors[1]) }} />
            </div>
            {children}
        </div>
    );
}

/** Painel da substituição: primeiro quem sai (posição e fôlego), depois quem entra (nota na vaga de quem sai). */
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
    return (
        <div className="panel sub-panel" ref={panelRef}>
            <div className="sub-head">
                <b>{subOut ? t('match.whoIn', { name: nameOf(subOut) }) : t('match.whoOut')}</b>
                <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => (subOut ? setSubOut(null) : onClose())}
                >
                    {subOut ? t('common.ui.back') : t('common.ui.close')}
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
                            onClick={() => (subOut ? onPick(subOut, uid) : setSubOut(uid))}
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
        </div>
    );
}

/** Tática (com o botão Substituir e as trocas que restam) e instrução de escanteio. */
export function TacticControls({
    tactic,
    tacticsUsed,
    corner,
    cornersUsed,
    canChange,
    pending,
    error,
    onTactic,
    onCorner,
    subOpen,
    canSub,
    onToggleSub,
}: {
    tactic: Tactic;
    tacticsUsed: number;
    corner: CornerPlan;
    cornersUsed: number;
    canChange: boolean;
    pending: boolean;
    error?: string | null;
    onTactic: (t: Tactic) => void;
    onCorner: (c: CornerPlan) => void;
    subOpen: boolean;
    canSub: boolean;
    onToggleSub: () => void;
}) {
    const { t, tn, d } = useT();
    return (
        <>
            <div className="control-group">
                {(Object.keys(TACTIC_LABEL) as Tactic[]).map((tc) => (
                    <button
                        key={tc}
                        type="button"
                        className={`btn small${tactic === tc ? ' active' : ''}`}
                        disabled={!canChange || (tacticsUsed >= MAX_TACTIC_CHANGES && tactic !== tc)}
                        onClick={() => onTactic(tc)}
                    >
                        {d.common.tactic[tc]}
                    </button>
                ))}
                <button
                    type="button"
                    className={`btn small yellow${subOpen ? ' active' : ''}`}
                    disabled={!canSub}
                    onClick={onToggleSub}
                >
                    {t('match.substitute')}
                </button>
                {error && <span className="error-text tactic-left">{error}</span>}
                <span className="muted tactic-left">
                    {pending ? t('match.changing') : tn('match.tacticChanges', MAX_TACTIC_CHANGES - tacticsUsed)}
                </span>
            </div>
            <div className="control-group corner-group" title={t('match.cornerHint')}>
                <span className="corner-label">{t('match.corner')}</span>
                {CORNER_PLANS.map((pl) => (
                    <button
                        key={pl}
                        type="button"
                        className={`btn small${corner === pl ? ' active' : ''}`}
                        disabled={!canChange || (cornersUsed >= MAX_TACTIC_CHANGES && corner !== pl)}
                        onClick={() => onCorner(pl)}
                    >
                        {d.common.cornerPlan[pl]}
                    </button>
                ))}
            </div>
        </>
    );
}

/** Narração da partida (recolhível no celular). */
export function MatchFeed({
    lines,
    colors,
    open,
    onToggle,
}: {
    lines: (CommentLine & { id: number })[];
    colors: [number, number];
    open: boolean;
    onToggle: () => void;
}) {
    const { t } = useT();
    return (
        <div className={`panel feed${open ? '' : ' collapsed'}`} aria-live="polite">
            <button type="button" className="feed-toggle" onClick={onToggle}>
                {t('match.feed')} {open ? '▲' : '▼'}
            </button>
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
