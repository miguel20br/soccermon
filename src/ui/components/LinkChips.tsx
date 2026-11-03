import { species } from '../../engine/data';
import type { PokemonInstance } from '../../engine/instance';
import { type ActiveLink, computeLinks, type LinkDef } from '../../engine/links';
import { computeSynergies, type Synergy } from '../../engine/synergy';
import { linkText, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { TYPE_COLOR } from '../type-colors';
import { HudIcon } from './MatchHud';

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
            <HudIcon kind="max" /> {txt.name} <b>+{Math.round((bonus - 1) * 100)}%</b>
        </span>
    );
}

/** Selo de uma sinergia de tipo ("Fogo ×3 +6%"; `plus`: "+Fogo 3", a que a carta da escolha ativa ou sobe). */
export function SynergyChip({ s, plus, fresh }: { s: Synergy; plus?: boolean; fresh?: boolean }) {
    const { t, lang } = useT();
    const pct = Math.round((s.bonus - 1) * 100);
    return (
        <span
            className={`link-chip syn-chip${fresh ? ' fresh' : ''}`}
            style={{ borderColor: TYPE_COLOR[s.type] }}
            title={t('team.synTitle', { type: typeName(s.type, lang), n: s.count, pct })}
        >
            {plus ? (
                <>
                    +{typeName(s.type, lang)} <b>{s.count}</b>
                </>
            ) : (
                <>
                    {typeName(s.type, lang)} ×{s.count} <b>+{pct}%</b>
                </>
            )}
        </span>
    );
}

/** As sinergias de tipo e de história de um time, numa linha só (some se não há nenhuma). */
export function TeamSynergies({ lineup }: { lineup: readonly PokemonInstance[] }) {
    const syn = computeSynergies(lineup);
    const links = computeLinks(lineup);
    if (!syn.length && !links.length) return null;
    return (
        <div className="syn-row">
            {syn.map((s) => (
                <SynergyChip key={s.type} s={s} />
            ))}
            <LinkChips links={links} />
        </div>
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

/** Sinergias de tipo que `candidate` ativaria ou subiria de degrau entre os titulares `lineup`. */
export function newSynergies(lineup: readonly PokemonInstance[], candidate: PokemonInstance): Synergy[] {
    const before = new Map(computeSynergies(lineup).map((s) => [s.type, s.count]));
    return computeSynergies([...lineup, candidate]).filter(
        (s) => (before.get(s.type) ?? 0) < s.count && species(candidate.speciesId).types.includes(s.type),
    );
}
