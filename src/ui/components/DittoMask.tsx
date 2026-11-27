import { type ReactNode, useMemo } from 'react';
import { SPECIES } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../rarity';

export const DITTO = 132;
/** Do `--rd` da carta (a hora em que ela sai do pacote) até o Ditto derreter, e quanto o derretimento dura (ms). */
export const DITTO_MELT_AT = 950;
export const DITTO_MELT_MS = 500;

/**
 * A carta que o Ditto finge ser no pacote: outra espécie do mesmo metal (sem lendário), com a mesma edição e nível. A
 * mesma carta do Ditto sempre vira o mesmo disfarce (a semente é o uid).
 */
export function dittoDisguise(inst: PokemonInstance): PokemonInstance {
    const metal = metalOf(viewInstance(inst).overall);
    const as = (id: number): PokemonInstance => ({ ...inst, speciesId: id, evolvedFrom: undefined });
    const others = SPECIES.filter((sp) => sp.id !== DITTO && sp.tier !== 'legendary');
    const same = others.filter((sp) => metalOf(viewInstance(as(sp.id)).overall) === metal);
    const rng = new Rng(inst.uid, 'ditto');
    const id = rng.pick(same.length ? same : others).id;
    return {
        ...createInstance(id, rng, inst.level),
        uid: `${inst.uid}~ditto`,
        shiny: inst.shiny,
        special: inst.special ?? null,
        evolved: inst.evolved,
        trained: inst.trained,
    };
}

/**
 * Ditto no pacote (ideia de playtester, 07/12/2026): sai disfarçado de outro Pokémon do mesmo metal e, logo depois de
 * pousar, derrete em roxo e vira o Ditto. Só CSS, no tempo da carta (`--rd` do CardPack): pulou a abertura ou
 * "reduzir movimento" = já é o Ditto. `render` desenha a carta (a mesma pra de verdade e pro disfarce).
 */
export function DittoMask({ inst, render }: { inst: PokemonInstance; render: (inst: PokemonInstance) => ReactNode }) {
    const mask = useMemo(() => (inst.speciesId === DITTO ? dittoDisguise(inst) : null), [inst]);
    if (!mask) return render(inst);
    return (
        <div className="ditto-swap">
            <div className="ditto-real">{render(inst)}</div>
            <div className="ditto-mask" aria-hidden inert>
                {render(mask)}
            </div>
        </div>
    );
}
