import type { PokemonInstance } from '../../engine/instance';
import { type ActiveLink, computeLinks, type LinkDef } from '../../engine/links';
import { linkText } from '../../i18n';
import { useT } from '../../i18n/react';

/** Selo de uma sinergia de história ("★ Gênese +8%"), com a descrição no title. */
export function LinkChip({
    def,
    bonus = def.bonus,
    special,
    fresh,
}: {
    def: LinkDef;
    bonus?: number;
    /** Sinergia especial completa: selo com o brilho da aura. */
    special?: boolean;
    fresh?: boolean;
}) {
    const { t, lang } = useT();
    const txt = linkText(def.id, lang);
    return (
        <span
            className={`link-chip${fresh ? ' fresh' : ''}${special ? ` special aura-${def.id}` : ''}`}
            title={t('team.linkTitle', { desc: txt.desc, combo: txt.combo })}
        >
            ★ {txt.name} <b>+{Math.round((bonus - 1) * 100)}%</b>
        </span>
    );
}

export function LinkChips({ links }: { links: readonly ActiveLink[] }) {
    return (
        <>
            {links.map((l) => (
                <LinkChip key={l.def.id} def={l.def} bonus={l.bonus} special={l.full && l.def.special} />
            ))}
        </>
    );
}

/** Sinergias que `candidate` ativaria (ou subiria de degrau) se entrasse entre os titulares `lineup`. */
export function newLinks(lineup: readonly PokemonInstance[], candidate: PokemonInstance): ActiveLink[] {
    const before = new Map(computeLinks(lineup).map((l) => [l.def.id, l.bonus]));
    return computeLinks([...lineup, candidate]).filter(
        (l) => l.members.includes(candidate.uid) && (before.get(l.def.id) ?? 0) < l.bonus,
    );
}
