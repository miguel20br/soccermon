import type { PokemonInstance } from '../../engine/instance';
import { type ActiveLink, computeLinks, type LinkDef } from '../../engine/links';

/** Selo de uma sinergia de história ("★ Gênese +8%"), com a descrição no title. */
export function LinkChip({ def, fresh }: { def: LinkDef; fresh?: boolean }) {
    return (
        <span className={`link-chip${fresh ? ' fresh' : ''}`} title={`${def.desc} Combo: ${def.combo}.`}>
            ★ {def.name} <b>+{Math.round((def.bonus - 1) * 100)}%</b>
        </span>
    );
}

export function LinkChips({ links }: { links: readonly ActiveLink[] }) {
    return (
        <>
            {links.map((l) => (
                <LinkChip key={l.def.id} def={l.def} />
            ))}
        </>
    );
}

/** Sinergias que `candidate` ativaria se entrasse entre os titulares `lineup`. */
export function newLinks(lineup: readonly PokemonInstance[], candidate: PokemonInstance): LinkDef[] {
    const before = new Set(computeLinks(lineup).map((l) => l.def.id));
    return computeLinks([...lineup, candidate])
        .filter((l) => !before.has(l.def.id) && l.members.includes(candidate.uid))
        .map((l) => l.def);
}
