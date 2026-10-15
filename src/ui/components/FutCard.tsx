import { useEffect, useRef, useState } from 'react';
import { type AttrKey, POSITIONS, type Position } from '../../engine/attributes';
import { MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';
import { dict, moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { type CardAction, useCardModal } from '../card-modal';
import { editionLabel } from '../rarity';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { TypeBadge } from './PokeCard';
import { PokeCard2 } from './PokeCard2';

/** Nomes dos atributos em português (no idioma do jogo: `dict().common.attr`). */
export const ATTR_SHORT: Record<AttrKey, string> = dict('pt').common.attr;

const LONG_PRESS_MS = 420;

interface FutCardProps {
    inst: PokemonInstance;
    /** Posição para a nota (padrão: a principal). */
    position?: Position;
    captain?: boolean;
    selected?: boolean;
    size?: 'md' | 'sm';
    /** Faixa no topo (ex.: "Do adversário"). */
    ribbon?: string;
    /** Botão de ação rápida embaixo da carta (ex.: "Escolher"). */
    action?: CardAction;
    /** Ações extras mostradas na carta completa. */
    modalActions?: CardAction[];
    modalNote?: string;
    /** Já está dentro da carta completa: tocar não reabre (senão perde as ações do modal). */
    inModal?: boolean;
    /** Botão "Ver carta completa" embaixo (painel da partida, escalação): deixa claro que tocar abre mais. */
    fullButton?: boolean;
}

/** Ícone de "abrir/expandir" (quatro cantos), desenhado em SVG. */
export function ExpandIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
    );
}

/**
 * A carta do jogo (Figurinha Holo, src/ui/components/PokeCard2.tsx) com as interações: passar o mouse
 * (ou segurar o dedo) mostra a info rápida; clicar abre a carta completa; ação rápida embaixo.
 */
export function FutCard({
    inst,
    position,
    captain,
    selected,
    size = 'md',
    ribbon,
    action,
    modalActions,
    modalNote,
    inModal = false,
    fullButton = false,
}: FutCardProps) {
    const open = useCardModal((s) => s.open);
    const { t, d } = useT();
    const [peek, setPeek] = useState(false);
    const hoverTimer = useRef<number | undefined>(undefined);
    const pressTimer = useRef<number | undefined>(undefined);
    const suppressClick = useRef(false);
    const view = viewInstance(inst);
    const pos = position ?? view.naturalPosition;
    const { display } = ratingAt(inst, pos);
    const edition = editionOf(inst);

    useEffect(
        () => () => {
            clearTimeout(hoverTimer.current);
            clearTimeout(pressTimer.current);
        },
        [],
    );

    const openFull = () => {
        if (inModal) return;
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        open(inst, { position: pos, captain, note: modalNote, actions: modalActions ?? (action ? [action] : []) });
    };

    // info rápida: hover com mouse, "segurar" no toque
    const onPointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        hoverTimer.current = window.setTimeout(() => setPeek(true), 220);
    };
    const onPointerLeave = () => {
        clearTimeout(hoverTimer.current);
        clearTimeout(pressTimer.current);
        setPeek(false);
    };
    const onPointerDown = (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse') return;
        pressTimer.current = window.setTimeout(() => {
            setPeek(true);
            suppressClick.current = true;
        }, LONG_PRESS_MS);
    };
    const onPointerUp = (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse') return;
        clearTimeout(pressTimer.current);
        setPeek(false);
    };

    const positions = POSITIONS.map((p) => ({ p, ...ratingAt(inst, p) }))
        .filter((x) => view.positions.includes(x.p))
        .sort((a, b) => b.rating - a.rating);
    const best = (Object.keys(ATTR_SHORT) as AttrKey[])
        .filter((k) => k !== 'goalkeeping' || pos === 'GK')
        .map((k) => ({ k, v: Math.round(view.attributes[k]) }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 3);

    return (
        <div className={`fut-wrap ${size}${selected ? ' selected' : ''}`}>
            <button
                type="button"
                className={`fut-card2${inModal ? ' static' : ''}`}
                onClick={openFull}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerLeave}
                onContextMenu={(e) => e.preventDefault()}
                tabIndex={inModal ? -1 : undefined}
                aria-label={t('team.card.aria', {
                    name: view.displayName,
                    rating: display,
                    pos: d.common.pos[pos],
                    edition: edition ? t('team.card.editionAria', { label: editionLabel(edition) }) : '',
                })}
            >
                <PokeCard2 inst={inst} variant="metal" position={pos} captain={captain} />
                {ribbon && <span className="fut-ribbon">{ribbon}</span>}

                {peek && (
                    <span className="fut-peek" aria-hidden>
                        <span className="peek-title">{t('team.card.positions')}</span>
                        {positions.map((x) => (
                            <span key={x.p} className={`peek-row ${x.fit}`}>
                                {d.common.pos[x.p]} <b>{x.display}</b>
                            </span>
                        ))}
                        <span className="peek-title">{t('team.card.highlights')}</span>
                        {best.map((b) => (
                            <span key={b.k} className="peek-row">
                                {d.common.attr[b.k]} <b>{b.v}</b>
                            </span>
                        ))}
                        <span className="peek-title">{t('team.card.moves')}</span>
                        <span className="peek-moves">
                            {inst.moves.map((m) => (
                                <i key={m} style={{ borderColor: TYPE_COLOR[MOVES[m].type] }}>
                                    {moveName(m)}
                                </i>
                            ))}
                        </span>
                        <span className="peek-hint">{t('team.card.peekHint')}</span>
                    </span>
                )}
            </button>
            {fullButton && !inModal && (
                <button
                    type="button"
                    className="fut-full"
                    onClick={openFull}
                    aria-label={t('team.card.fullAria', { name: view.displayName })}
                >
                    <ExpandIcon />
                    <span>
                        <b>{t('team.card.full')}</b>
                        <small>{t('team.card.fullSub')}</small>
                    </span>
                </button>
            )}
            {action && (
                <button
                    type="button"
                    className={`btn small${action.primary ? ' primary' : ''} fut-action`}
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

/** Rótulo curto da raridade (para a carta completa). */
export const tierLabel = (tier: Tier) => dict().common.tier[tier];
export { TypeBadge };
