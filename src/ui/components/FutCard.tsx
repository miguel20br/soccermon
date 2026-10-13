import { useEffect, useRef, useState } from 'react';
import { type AttrKey, POSITION_LABEL, POSITIONS, type Position } from '../../engine/attributes';
import { MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { type CardAction, useCardModal } from '../card-modal';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { cardSprite, TIER_PT, TypeBadge } from './PokeCard';

/** As 6 estatísticas da carta (estilo Ultimate Team). */
const FIELD_STATS: [AttrKey, string][] = [
    ['pace', 'VEL'],
    ['shooting', 'CHU'],
    ['passing', 'PAS'],
    ['dribble', 'DRI'],
    ['tackling', 'DES'],
    ['strength', 'FOR'],
];
const GK_STATS: [AttrKey, string][] = [
    ['goalkeeping', 'GOL'],
    ['positioning', 'LEI'],
    ['strength', 'FOR'],
    ['pace', 'VEL'],
    ['passing', 'PAS'],
    ['stamina', 'FÔL'],
];
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

export const TIER_FRAME: Record<Tier, string> = {
    common: 'bronze',
    uncommon: 'silver',
    rare: 'gold',
    epic: 'epic',
    legendary: 'legend',
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
 * Carta estilo Ultimate Team: moldura pela raridade, OVR, posição e 6 estatísticas.
 * Passar o mouse (ou segurar o dedo) mostra a info rápida; clicar abre a carta completa.
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
    const sp = view.species;
    const pos = position ?? view.naturalPosition;
    const { rating, display, fit } = ratingAt(inst, pos);
    const stats = pos === 'GK' ? GK_STATS : FIELD_STATS;
    const item = inst.item ? ITEMS[inst.item] : null;

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
                className={`fut-card frame-${TIER_FRAME[sp.tier]}`}
                onClick={openFull}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerLeave}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`${view.displayName}, ${rating} de ${POSITION_LABEL[pos]}. Abrir carta completa`}
            >
                {ribbon && <span className="fut-ribbon">{ribbon}</span>}
                <span className="fut-top">
                    <span className="fut-ovr">{display}</span>
                    <span className={`fut-pos ${fit}`}>{POSITION_LABEL[pos]}</span>
                    <span className="fut-types">
                        {sp.types.map((t) => (
                            <i key={t} style={{ background: TYPE_COLOR[t] }} title={t} />
                        ))}
                    </span>
                    {captain && <span className="fut-captain">C</span>}
                    {inst.shiny && <span className="fut-shiny">★</span>}
                </span>
                <span className="fut-art">
                    <img className="pixel" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                </span>
                <span className="fut-name">{view.displayName}</span>
                <span className="fut-stats">
                    {stats.map(([k, label]) => (
                        <span key={k}>
                            <b>{Math.round(view.attributes[k])}</b> {label}
                        </span>
                    ))}
                </span>
                {item && <img className="pixel fut-item" src={itemSprite(item.id)} alt={item.name} />}

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
