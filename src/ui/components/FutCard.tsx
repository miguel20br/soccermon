import { useEffect, useRef, useState } from 'react';
import { type AttrKey, POSITION_LABEL, POSITIONS, type Position } from '../../engine/attributes';
import { MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';
import { type CardAction, useCardModal } from '../card-modal';
import { EDITION } from '../rarity';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { TIER_PT, TypeBadge } from './PokeCard';
import { PokeCard2 } from './PokeCard2';

export const ATTR_SHORT: Record<AttrKey, string> = {
    pace: 'Velocidade',
    dribble: 'Drible',
    shooting: 'Chute',
    passing: 'Passe',
    tackling: 'Desarme',
    strength: 'Força',
    positioning: 'Leitura',
    stamina: 'Fôlego',
    goalkeeping: 'Goleiro',
};

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
}: FutCardProps) {
    const open = useCardModal((s) => s.open);
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
                className="fut-card2"
                onClick={openFull}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerLeave}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`${view.displayName}, ${display} de ${POSITION_LABEL[pos]}${edition ? `, edição ${EDITION[edition].label}` : ''}. Abrir carta completa`}
            >
                <PokeCard2 inst={inst} variant="figurinha" position={pos} captain={captain} />
                {ribbon && <span className="fut-ribbon">{ribbon}</span>}

                {peek && (
                    <span className="fut-peek" aria-hidden>
                        <span className="peek-title">Posições</span>
                        {positions.map((x) => (
                            <span key={x.p} className={`peek-row ${x.fit}`}>
                                {POSITION_LABEL[x.p]} <b>{x.display}</b>
                            </span>
                        ))}
                        <span className="peek-title">Destaques</span>
                        {best.map((b) => (
                            <span key={b.k} className="peek-row">
                                {ATTR_SHORT[b.k]} <b>{b.v}</b>
                            </span>
                        ))}
                        <span className="peek-title">Golpes</span>
                        <span className="peek-moves">
                            {inst.moves.map((m) => (
                                <i key={m} style={{ borderColor: TYPE_COLOR[MOVES[m].type] }}>
                                    {MOVES[m].name}
                                </i>
                            ))}
                        </span>
                        <span className="peek-hint">toque para ver a carta completa</span>
                    </span>
                )}
            </button>
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
export const tierLabel = (tier: Tier) => TIER_PT[tier];
export { TypeBadge };
