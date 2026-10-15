import { type CSSProperties, useEffect, useState } from 'react';
import { MOVES } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { moveProfile } from '../../engine/moves';
import { canLearn, isProtectedMove, rareMovePool, tmLabel } from '../../engine/tm';
import { playSfx } from '../../game/audio';
import { GdxIcon } from '../golpedex/GdxIcon';
import { TYPE_COLOR } from '../type-colors';
import { cardSprite } from './PokeCard';
import { TypeIcon } from './TypeIcon';
import './tm.css';

/** "MT do ginásio" na recompensa: a carta do disco e o passo a passo de ensinar (quem aprende, o que esquece). */

const KIND_SHORT: Record<string, string> = {
    strike: 'Físico',
    blast: 'Especial',
    burst: 'Arrancada',
    buff: 'Reforço',
    debuff: 'Enfraquece',
    status: 'Status',
    heal: 'Cura',
    flavor: 'Narração',
    special: 'Efeito especial',
};

const moveName = (m: string) => MOVES[m]?.name ?? m;

/** Disco de MT desenhado em SVG, na cor do tipo do golpe. */
export function TmDisc({ type, size = 72, className = '' }: { type: string; size?: number; className?: string }) {
    const c = TYPE_COLOR[type] ?? '#a6aed6';
    return (
        <svg className={`tm-disc ${className}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden>
            <circle cx="32" cy="32" r="29" fill={c} stroke="#0d1126" strokeWidth="3" />
            <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
            <circle cx="32" cy="32" r="14" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
            <path d="M14 22 A20 20 0 0 1 30 12" stroke="rgba(255,255,255,0.75)" strokeWidth="3" fill="none" />
            <circle cx="32" cy="32" r="8" fill="#e9ecf7" stroke="#0d1126" strokeWidth="2.5" />
            <circle cx="32" cy="32" r="3" fill="#0d1126" />
        </svg>
    );
}

/** Rótulo do disco: "MT34" / "MO02", ou "Golpe raro" quando o golpe não tinha disco na Gen 1. */
export const tmTag = (move: string) => tmLabel(move) ?? 'Golpe raro';

/** Selo "MT" ao lado do nome do golpe nas listas de golpes (carta, painel). */
export function TaughtMark({ inst, move }: { inst: PokemonInstance; move: string }) {
    if (!inst.taught?.includes(move)) return null;
    return (
        <span className="tm-mark" title="Ensinado por MT">
            MT
        </span>
    );
}

export function TmCard({
    move,
    leader,
    team,
    selected,
    onClick,
}: {
    move: string;
    leader: string | null;
    team: readonly PokemonInstance[];
    selected: boolean;
    onClick: () => void;
}) {
    const data = MOVES[move];
    const learners = team.filter((p) => canLearn(p, move)).length;
    const rare = rareMovePool().includes(move);
    return (
        <button
            type="button"
            className={`card item-card tm-card${selected ? ' selected' : ''}`}
            style={{ '--tc': TYPE_COLOR[data.type] } as CSSProperties}
            onClick={onClick}
        >
            <span className="tier-label">
                {tmTag(move)} · {leader ? `Do ${leader}` : 'Baú raro'}
            </span>
            <TmDisc type={data.type} className="item-art" />
            <b className="card-name">{data.name}</b>
            <span className="tm-meta">
                <TypeIcon type={data.type} label size={16} />
                <span className="pos-chip">{KIND_SHORT[moveProfile(move).kind] ?? ''}</span>
            </span>
            {data.descPt && <span className="tactic-desc">{data.descPt}</span>}
            <span className="tm-learners">
                {learners === 1 ? '1 do seu time aprende' : `${learners} do seu time aprendem`}
                {rare && ' · quase ninguém usa'}
            </span>
        </button>
    );
}

/**
 * Ensinar a MT: escolhe quem aprende (só quem tem o golpe no learnset e ainda não sabe), depois o golpe que
 * vai esquecer (a assinatura é protegida). "1, 2 e… Pronto!" e só então a recompensa é pega.
 */
export function TmTeachPanel({
    move,
    team,
    onTeach,
}: {
    move: string;
    team: readonly PokemonInstance[];
    onTeach: (uid: string, slot: number) => void;
}) {
    const [uid, setUid] = useState<string | null>(null);
    const [slot, setSlot] = useState<number | null>(null);
    const [taught, setTaught] = useState(false);
    const [ready, setReady] = useState(false);
    const target = team.find((p) => p.uid === uid) ?? null;
    const newName = moveName(move);

    // troca de MT (reroll): volta para o começo
    // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o golpe muda
    useEffect(() => {
        setUid(null);
        setSlot(null);
        setTaught(false);
    }, [move]);

    useEffect(() => {
        if (!taught) return;
        setReady(false);
        const t = window.setTimeout(() => {
            setReady(true);
            playSfx('select');
        }, 900);
        return () => clearTimeout(t);
    }, [taught]);

    if (!target) {
        return (
            <div className="panel reward-pick tm-panel">
                <h2>Quem aprende {newName}?</h2>
                <div className="squad-strip">
                    {team.map((p) => {
                        const ok = canLearn(p, move);
                        const why = p.moves.includes(move) ? 'já sabe' : 'não aprende';
                        return (
                            <button
                                key={p.uid}
                                type="button"
                                className="mini target-btn"
                                disabled={!ok}
                                onClick={() => {
                                    playSfx('select');
                                    setUid(p.uid);
                                    setSlot(null);
                                }}
                            >
                                <img className="pixel" src={cardSprite(p)} alt="" />
                                <span>
                                    <b>{viewInstance(p).displayName}</b>
                                    {!ok && <span className="muted"> ({why})</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    const name = viewInstance(target).displayName;
    const free = target.moves.length < 4;
    const forgotten = slot !== null && slot < target.moves.length ? moveName(target.moves[slot]) : null;

    return (
        <div className="panel reward-pick tm-panel">
            <div className="tm-head">
                <img className="pixel" src={cardSprite(target)} alt="" />
                <h2>{free ? `${name} tem uma vaga livre` : `Qual golpe ${name} esquece?`}</h2>
            </div>
            <p className="muted tm-new">
                Novo: <b style={{ color: TYPE_COLOR[MOVES[move].type] }}>{newName}</b>. A assinatura nunca é esquecida.
            </p>
            <div className="tm-moves">
                {target.moves.map((m, i) => {
                    const locked = isProtectedMove(target, i);
                    const data = MOVES[m];
                    return (
                        <button
                            key={m}
                            type="button"
                            className={`tm-move${slot === i ? ' selected' : ''}`}
                            style={{ '--tc': TYPE_COLOR[data.type] } as CSSProperties}
                            disabled={locked}
                            onClick={() => {
                                playSfx('select');
                                setSlot(i);
                            }}
                        >
                            <TypeIcon type={data.type} size={18} />
                            <span className="tm-move-name">
                                <b>{data.name}</b>
                                <small>
                                    {locked ? (
                                        <>
                                            <GdxIcon kind="lock" size={11} /> Assinatura
                                        </>
                                    ) : (
                                        (KIND_SHORT[moveProfile(m).kind] ?? '')
                                    )}
                                    {target.taught?.includes(m) && ' · MT'}
                                </small>
                            </span>
                        </button>
                    );
                })}
                {free && (
                    <button
                        type="button"
                        className={`tm-move free${slot === target.moves.length ? ' selected' : ''}`}
                        onClick={() => {
                            playSfx('select');
                            setSlot(target.moves.length);
                        }}
                    >
                        <span className="tm-move-name">
                            <b>Vaga livre</b>
                            <small>aprende sem esquecer</small>
                        </span>
                    </button>
                )}
            </div>
            <div className="tm-confirm">
                <span>
                    {slot === null
                        ? 'Escolha o golpe que sai.'
                        : forgotten
                          ? `${name} vai esquecer ${forgotten} e aprender ${newName}.`
                          : `${name} vai aprender ${newName}.`}
                </span>
                <div className="row">
                    <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => {
                            setUid(null);
                            setSlot(null);
                        }}
                    >
                        Voltar
                    </button>
                    <button
                        type="button"
                        className="btn small primary"
                        disabled={slot === null}
                        onClick={() => {
                            playSfx('select');
                            setTaught(true);
                        }}
                    >
                        Ensinar
                    </button>
                </div>
            </div>

            {taught && slot !== null && (
                <div className="modal-backdrop tm-done" role="dialog" aria-modal="true" aria-label="Golpe ensinado">
                    <div className="panel tm-done-box">
                        <TmDisc type={MOVES[move].type} size={64} />
                        <p className="tm-count">{ready ? 'Pronto!' : '1, 2 e…'}</p>
                        <p className={`tm-done-text${ready ? ' show' : ''}`}>
                            {forgotten ? (
                                <>
                                    {name} esqueceu <b>{forgotten}</b> e aprendeu <b>{newName}</b>!
                                </>
                            ) : (
                                <>
                                    {name} aprendeu <b>{newName}</b>!
                                </>
                            )}
                        </p>
                        <button
                            type="button"
                            className="btn primary"
                            disabled={!ready}
                            onClick={() => onTeach(target.uid, slot)}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
