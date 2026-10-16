import type { CSSProperties, ReactNode } from 'react';
import { species } from '../../engine/data';
import { EVO_THRESHOLD } from '../../engine/evolution';
import { type FormationId, formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { editionOf } from '../../engine/specials';
import { useT } from '../../i18n/react';
import type { SlotRef } from '../../store/game-store';
import { editionLabel, finishOf, METAL, metalOf } from '../rarity';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
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
    /**
     * Pokémon selecionado: cada vaga da quadra fica verde (joga bem ali) ou vermelha (fora de posição),
     * com a nota que ele teria naquela vaga.
     */
    projection?: PokemonInstance | null;
    stateOf?: (slot: SlotRef, uid: string) => SlotState;
    onSlot?: (slot: SlotRef, uid: string) => void;
    emptyLabel?: string;
    footer?: ReactNode;
    /** Selo extra no canto da vaga (ex.: quantos golpes o item da recompensa aproveita). */
    badgeOf?: (inst: PokemonInstance) => ReactNode;
    /** Vaga apagada (ex.: o item da recompensa não serve pra ele). */
    dimOf?: (inst: PokemonInstance) => boolean;
    /** Sufixo do aria-label de cada vaga ocupada (ex.: "abrir carta completa"). */
    slotAria?: (inst: PokemonInstance) => string;
}

/** Mini-quadra vertical com as vagas da formação + banco. Usada no draft, na escalação e nas recompensas. */
export function FormationBoard({
    formation,
    lineup,
    bench,
    byUid,
    captainUid,
    preview,
    projection,
    stateOf,
    onSlot,
    emptyLabel: emptyProp,
    footer,
    badgeOf,
    dimOf,
    slotAria,
}: Props) {
    const f = formationOf(formation);
    const { t, d } = useT();
    const emptyLabel = emptyProp ?? t('team.board.empty');

    const slot = (ref: SlotRef, uid: string, style?: CSSProperties) => {
        const role = ref.zone === 'bench' ? 'ANY' : f.slots[ref.index];
        const label = ref.zone === 'bench' ? t('common.ui.bench') : d.team.board.slot[f.slots[ref.index]];
        const fullLabel = ref.zone === 'bench' ? label : d.common.pos[f.slots[ref.index]];
        const state = stateOf?.(ref, uid) ?? 'idle';
        const inst = uid ? byUid.get(uid) : undefined;
        const ghost = !inst && state === 'target' ? preview : null;
        const shown = inst ?? ghost;
        const r = shown ? ratingAt(shown, role) : null;
        const clickable = !!onSlot && state !== 'locked';
        // projeção do selecionado (não no banco nem na própria vaga dele)
        const proj = projection && ref.zone === 'lineup' && uid !== projection.uid ? ratingAt(projection, role) : null;
        const projClass = proj ? (proj.fit === 'off' ? ' proj-bad' : ' proj-good') : '';
        // cor da raridade (anel) e marca da edição especial
        const tier = inst ? species(inst.speciesId).tier : null;
        const edition = inst ? editionOf(inst) : null;
        // anel na cor do metal da carta (lendário: creme e dourado)
        const ring = inst
            ? tier === 'legendary'
                ? '#f2d878'
                : METAL[metalOf(viewInstance(inst).overall)].color
            : null;
        // visual da carta (metal pela nota, lendário, edições especiais), sem os atributos
        const look = inst
            ? edition
                ? `sc sc-${edition}`
                : tier === 'legendary'
                  ? 'sc sc-lendario'
                  : `sc sc-${metalOf(viewInstance(inst).overall)}${tier && finishOf(tier) === 'brilhante' ? ' sc-brilhante' : ''}`
            : '';
        const t1 = inst ? TYPE_COLOR[species(inst.speciesId).types[0]] : undefined;
        const rarStyle = ring ? ({ ...style, '--rar': ring, '--t1': t1 } as CSSProperties) : style;
        const dim = inst && dimOf?.(inst) ? ' dim' : '';
        return (
            <button
                type="button"
                key={`${ref.zone}-${ref.index}`}
                className={`slot ${inst ? 'filled' : 'empty'} ${state}${projClass}${tier ? ` rar-${tier}` : ''}${dim} ${look}`}
                style={rarStyle}
                disabled={!clickable}
                onClick={() => onSlot?.(ref, uid)}
                aria-label={`${fullLabel}${inst ? `: ${viewInstance(inst).displayName}${slotAria ? slotAria(inst) : ''}` : ` (${emptyLabel})`}`}
            >
                <span className="pos-badge">{label}</span>
                {inst?.uid === captainUid && inst && <span className="captain-badge">C</span>}
                {inst && badgeOf?.(inst)}
                {proj && (inst || !ghost) && (
                    <span className={`proj-badge ${proj.fit === 'off' ? 'bad' : 'good'}`}>{proj.display}</span>
                )}
                {shown ? (
                    <>
                        <img className={`pixel${ghost ? ' ghost' : ''}`} src={cardSprite(shown)} alt="" />
                        {inst && <span className="slot-name">{viewInstance(inst).displayName}</span>}
                        {r && (
                            <span className={`slot-rating ${r.fit}`}>
                                {r.display}
                                {r.fit === 'off' && t('team.board.off')}
                            </span>
                        )}
                        {inst?.item && <img className="pixel slot-item" src={itemSprite(inst.item)} alt="" />}
                        {inst?.evo ? (
                            <i
                                className="slot-evo"
                                title={t('team.board.evo', {
                                    n: Math.min(100, Math.round((inst.evo / EVO_THRESHOLD) * 100)),
                                })}
                                style={{ '--evo': Math.min(1, inst.evo / EVO_THRESHOLD) } as CSSProperties}
                            />
                        ) : null}
                        {edition && (
                            <span className={`slot-edition ed-${edition}`} title={editionLabel(edition)}>
                                ★
                            </span>
                        )}
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
