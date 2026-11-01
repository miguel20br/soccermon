import type { Position } from '../../engine/attributes';
import { species } from '../../engine/data';
import type { PokemonInstance } from '../../engine/instance';
import { type ActiveLink, computeLinks, LINKS, type LinkDef } from '../../engine/links';
import { attributeModifiers } from '../../engine/modifiers';
import { computeSynergies, type Synergy } from '../../engine/synergy';

/**
 * Química do Time Ultimate: as sinergias de tipo e de história que já existem, lidas pela regra única de bônus
 * (`attributeModifiers`, a mesma da carta e do motor). Nada de fórmula nova: aqui só se junta o que está ativo e o
 * que falta pra ativar.
 */
export interface Chemistry {
    /** Por titular: o bônus de química (tipo × história, com o teto) e o fator de posição na vaga (1 = na posição). */
    players: { uid: string; chem: number; pos: number }[];
    /** Média do bônus de química dos titulares (1.05 = +5%). */
    avg: number;
    types: Synergy[];
    links: ActiveLink[];
    /** Tipos de um titular só: mais um do tipo liga a sinergia. */
    nearTypes: string[];
    /** Sinergias de história que faltam pouco: a 1ª forma de cada família que falta, e as da sua coleção que servem. */
    nearLinks: { def: LinkDef; missing: number[]; owned: PokemonInstance[] }[];
}

const factor = (inst: PokemonInstance, lineup: PokemonInstance[], role: Position, sources: string[]) =>
    attributeModifiers(inst, { lineup, role })
        .filter((m) => sources.includes(m.source))
        .reduce((f, m) => f * (m.factor ?? 1), 1);

/** `lineup` na ordem das vagas (`roles`); `reserves` = as cartas da coleção fora dos titulares. */
export function chemistry(
    lineup: PokemonInstance[],
    roles: readonly Position[],
    reserves: readonly PokemonInstance[] = [],
): Chemistry {
    const players = lineup.map((p, i) => ({
        uid: p.uid,
        chem: factor(p, lineup, roles[i], ['sinergia', 'historia']),
        pos: factor(p, lineup, roles[i], ['posicao']),
    }));
    const avg = players.length ? players.reduce((s, p) => s + p.chem, 0) / players.length : 1;
    const types = computeSynergies(lineup);
    const links = computeLinks(lineup);
    const counts = new Map<string, number>();
    for (const p of lineup) for (const t of species(p.speciesId).types) counts.set(t, (counts.get(t) ?? 0) + 1);
    const nearTypes = [...counts].filter(([, c]) => c === 1).map(([t]) => t);
    const nearLinks = LINKS.flatMap((def) => {
        const active = links.find((l) => l.def.id === def.id);
        if (active && (active.full || !def.full)) return [];
        const has = (g: number[]) => lineup.some((p) => g.includes(p.speciesId));
        if (!def.groups.some(has)) return [];
        const gaps = def.groups.filter((g) => !has(g));
        return [
            {
                def,
                missing: gaps.map((g) => g[0]),
                owned: reserves.filter((r) => gaps.some((g) => g.includes(r.speciesId))),
            },
        ];
    });
    return { players, avg, types, links, nearTypes, nearLinks };
}
