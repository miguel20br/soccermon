import type { CSSProperties, ReactNode } from 'react';
import { POSITION_LABEL } from '../../engine/attributes';
import { type FormationId, formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import type { SlotRef } from '../../store/game-store';
import { ratingAt } from '../rating';
import { cardSprite } from './PokeCard';

export type SlotState = 'idle' | 'selected' | 'target' | 'locked';

interface Props {
    formation: FormationId;
    lineup: string[];
    bench: string[];
    byUid: Map<string, PokemonInstance>;
    captainUid?: string | null;
    /** Pokémon "fantasma" mostrado nas vagas-alvo com a nota que teria ali. */
    preview?: PokemonInstance | null;
    stateOf?: (slot: SlotRef, uid: string) => SlotState;
    onSlot?: (slot: SlotRef, uid: string) => void;
    emptyLabel?: string;
    footer?: ReactNode;
}

/** Mini-quadra vertical com as vagas da formação + banco. Usada no draft, na escalação e nas recompensas. */
export function FormationBoard({
    formation,
    lineup,
    bench,
    byUid,
    captainUid,
    preview,
    stateOf,
    onSlot,
    emptyLabel = 'vaga',
    footer,
}: Props) {
    const f = formationOf(formation);

    const slot = (ref: SlotRef, uid: string, style?: CSSProperties) => {
        const role = ref.zone === 'bench' ? 'ANY' : f.slots[ref.index];
        const label = ref.zone === 'bench' ? 'Banco' : POSITION_LABEL[f.slots[ref.index]];
        const state = stateOf?.(ref, uid) ?? 'idle';
        const inst = uid ? byUid.get(uid) : undefined;
        const ghost = !inst && state === 'target' ? preview : null;
        const shown = inst ?? ghost;
        const r = shown ? ratingAt(shown, role) : null;
        const clickable = !!onSlot && state !== 'locked';
        return (
            <button
                type="button"
                key={`${ref.zone}-${ref.index}`}
                className={`slot ${inst ? 'filled' : 'empty'} ${state}`}
                style={style}
                disabled={!clickable}
                onClick={() => onSlot?.(ref, uid)}
                aria-label={`${label}${inst ? `: ${viewInstance(inst).displayName}` : ` (${emptyLabel})`}`}
            >
                <span className="pos-badge">{label}</span>
                {inst?.uid === captainUid && inst && <span className="captain-badge">C</span>}
                {shown ? (
                    <>
                        <img className={`pixel${ghost ? ' ghost' : ''}`} src={cardSprite(shown)} alt="" />
                        {inst && <span className="slot-name">{viewInstance(inst).displayName}</span>}
                        {r && (
                            <span className={`slot-rating ${r.fit}`}>
                                {r.rating}
                                {r.fit === 'off' && ' · fora'}
                            </span>
                        )}
                        {inst?.item && <img className="pixel slot-item" src={itemSprite(inst.item)} alt="" />}
                    </>
                ) : (
                    <span className="slot-empty">{emptyLabel}</span>
                )}
            </button>
        );
    };

    return (
        <div className="formation-board">
            <div className="court">
                {lineup.map((uid, i) =>
                    slot({ zone: 'lineup', index: i }, uid, { left: `${f.ui[i][0]}%`, top: `${f.ui[i][1]}%` }),
                )}
            </div>
            <div className="bench">{bench.map((uid, i) => slot({ zone: 'bench', index: i }, uid))}</div>
            {footer}
        </div>
    );
}
