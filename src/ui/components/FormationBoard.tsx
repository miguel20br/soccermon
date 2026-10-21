import { type CSSProperties, type ReactNode, useLayoutEffect, useRef } from 'react';
import { species } from '../../engine/data';
import { EVO_THRESHOLD } from '../../engine/evolution';
import { type FormationId, formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { computeLinks } from '../../engine/links';
import { cardTypeOf, editionOf } from '../../engine/specials';
import { useT } from '../../i18n/react';
import type { SlotRef } from '../../store/game-store';
import { editionLabel, finishOf, METAL, metalOf } from '../rarity';
import { ratingAt } from '../rating';
import { reduceMotionOn } from '../reduce-motion';
import { TYPE_COLOR } from '../type-colors';
import { HudIcon } from './MatchHud';
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
    /** Quadra deitada (prancheta embaixo da partida no celular): o gol do time à esquerda, o ataque pra direita. */
    horizontal?: boolean;
    /** Quadra deitada espelhada: o gol do time à direita (o time 1 na quadra da partida). */
    mirror?: boolean;
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
    horizontal,
    mirror,
}: Props) {
    const f = formationOf(formation);
    const { t, d } = useT();
    // nada teleporta: quem muda de vaga (troca, substituição) desliza do lugar antigo pro novo
    const boardRef = useRef<HTMLDivElement>(null);
    const lastRects = useRef(new Map<string, { left: number; top: number }>());
    const seat = `${formation}|${lineup.join()}|${bench.join()}|${horizontal}`;
    // biome-ignore lint/correctness/useExhaustiveDependencies: mede de novo só quando alguém muda de vaga
    useLayoutEffect(() => {
        const measure = (animate: boolean) => {
            const rects = new Map<string, { left: number; top: number }>();
            const box = boardRef.current?.getBoundingClientRect();
            for (const el of boardRef.current?.querySelectorAll<HTMLElement>('[data-uid]') ?? []) {
                // relativo à prancheta: rolar a página não conta como mudar de vaga
                const b = el.getBoundingClientRect();
                const r = { left: b.left - (box?.left ?? 0), top: b.top - (box?.top ?? 0) };
                const was = lastRects.current.get(el.dataset.uid ?? '');
                rects.set(el.dataset.uid ?? '', r);
                if (!animate || !was || !el.animate || reduceMotionOn() || (was.left === r.left && was.top === r.top))
                    continue;
                el.animate(
                    [
                        // `translate` (não `transform`): a vaga já usa o transform pra se centralizar
                        { translate: `${was.left - r.left}px ${was.top - r.top}px`, zIndex: 3 },
                        { translate: '0 0', zIndex: 3 },
                    ],
                    { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
                );
            }
            lastRects.current = rects;
        };
        measure(true);
        // a troca de formação anda pelo CSS (left/top): mede de novo quando ela termina
        const id = window.setTimeout(() => measure(false), 320);
        return () => clearTimeout(id);
    }, [seat]);
    const emptyLabel = emptyProp ?? t('team.board.empty');
    // sinergia especial completa (os 3 pássaros, os 3 iniciais, Mew + Mewtwo): as cartas brilham juntas
    const aura = new Map<string, string>();
    for (const l of computeLinks(lineup.flatMap((u) => byUid.get(u) ?? []))) {
        if (l.full && l.def.special) for (const uid of l.members) aura.set(uid, l.def.id);
    }

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
        // Evento: a cor (e o fundo da vaga) é a do tipo do evento, não a do 1º tipo do Pokémon (Kabutops de Água, não de Pedra)
        const t1 = inst ? TYPE_COLOR[cardTypeOf(inst)] : undefined;
        const rarStyle = ring ? ({ ...style, '--rar': ring, '--t1': t1 } as CSSProperties) : style;
        const dim = inst && dimOf?.(inst) ? ' dim' : '';
        const glow = inst && ref.zone === 'lineup' && aura.has(inst.uid) ? ` aura aura-${aura.get(inst.uid)}` : '';
        return (
            <button
                type="button"
                key={`${ref.zone}-${ref.index}`}
                className={`slot ${inst ? 'filled' : 'empty'} ${state}${projClass}${tier ? ` rar-${tier}` : ''}${dim}${glow} ${look}`}
                style={rarStyle}
                data-uid={inst?.uid}
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
                        {/* chave pelo uid: carta nova na vaga (contratou, ganhou, trocou de lugar) cai com um pulinho */}
                        <img
                            key={inst?.uid ?? 'ghost'}
                            className={`pixel${ghost ? ' ghost' : ' slot-pop'}`}
                            src={cardSprite(shown)}
                            alt=""
                        />
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
                                <HudIcon kind="max" />
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
        <div className={`formation-board${horizontal ? ' horizontal' : ''}`} ref={boardRef}>
            <div className="court">
                {lineup.map((uid, i) =>
                    slot(
                        { zone: 'lineup', index: i },
                        uid,
                        horizontal
                            ? { left: `${mirror ? f.ui[i][1] : 100 - f.ui[i][1]}%`, top: `${f.ui[i][0]}%` }
                            : { left: `${f.ui[i][0]}%`, top: `${f.ui[i][1]}%` },
                    ),
                )}
            </div>
            <div className="bench">{bench.map((uid, i) => slot({ zone: 'bench', index: i }, uid))}</div>
            {footer}
        </div>
    );
}
