import type { AttrKey, Position } from '../engine/attributes';
import { COUNTER_FACTOR, FORMATION_STYLES, FORMATIONS, type FormationId, hasEdge } from '../engine/formations';
import { dict, formationText, pct } from '../i18n';
import type { Lang } from '../i18n/lang';
import type { HudIconKind } from './components/MatchHud';

/** Ícone desenhado de cada formação (seletor, Escalação). */
export const FORMATION_ICON: Record<FormationId, HudIconKind> = {
    '1-2-1': 'fDiamond',
    '2-2': 'fSquare',
    '3-1': 'fPivot',
    '4-0': 'fRotation',
    '1-1-2': 'fTwin',
    ferrolho: 'lock',
};

/**
 * Ponto forte e fraco da formação, tirados da mesma tabela do motor (FORMATION_STYLES, carta = campo).
 * Com `role`, só o que vale pra essa posição (painel do Pokémon); sem, tudo, mais o jeito de jogar (seletor).
 */
export function formationLines(id: FormationId, lang: Lang, role?: Position): { up: string[]; down: string[] } {
    const d = dict(lang);
    const st = FORMATION_STYLES[id];
    const up: string[] = [];
    const down: string[] = [];
    for (const [k, f] of Object.entries(st.attrs ?? {}) as [AttrKey, number][]) {
        if (role && role !== 'GK' && k === 'goalkeeping') continue;
        (f > 1 ? up : down).push(`${d.common.attr[k]} ${pct(f)}`);
    }
    for (const [r, attrs] of Object.entries(st.role ?? {}) as [Position, Partial<Record<AttrKey, number>>][]) {
        if (role && role !== r) continue;
        const list = (Object.entries(attrs) as [AttrKey, number][]).map(([k, f]) => `${d.common.attr[k]} ${pct(f)}`);
        up.push(role ? list.join(', ') : `${d.common.pos[r]}: ${list.join(', ')}`);
    }
    const trait = formationText(id, lang).trait;
    if (!role && trait) up.push(trait);
    return { up, down };
}

/** A formação que leva vantagem tática contra `theirs` (o Losango não tem). */
export const edgeAgainst = (theirs: FormationId): FormationId | null =>
    (Object.keys(FORMATIONS) as FormationId[]).find((f) => hasEdge(f, theirs)) ?? null;

/** "1,5%" / "1.5%" */
export const edgePct = (lang: Lang) =>
    `${((COUNTER_FACTOR - 1) * 100).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { maximumFractionDigits: 1 })}%`;
