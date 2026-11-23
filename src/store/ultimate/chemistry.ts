import type { Position } from '../../engine/attributes';
import { species } from '../../engine/data';
import type { PokemonInstance } from '../../engine/instance';
import { type ActiveLink, computeLinks, LINKS, type LinkDef } from '../../engine/links';
import { attributeModifiers } from '../../engine/modifiers';
import { computeSynergies, MONO_BONUS, type Synergy, TYPE_BONUS } from '../../engine/synergy';

/**
 * Química do Time Ultimate: as sinergias de tipo e de história que já existem, lidas pela regra única de bônus
 * (`attributeModifiers`, a mesma da carta e do motor). Nada de fórmula nova: aqui só se junta o que está ativo e o
 * que falta pra ativar.
 */
export interface Chemistry {
    /** Por titular: o bônus de química (tipo × história, com o teto) e o fator de posição na vaga (1 = na posição). */
    players: { uid: string; chem: number; pos: number; type: number; link: number }[];
    /** Média do bônus de química dos titulares (1.05 = +5%). */
    avg: number;
    types: Synergy[];
    links: ActiveLink[];
    /** Tipos de um titular só: mais um do tipo liga a sinergia. */
    nearTypes: string[];
    /** Sinergias de história que faltam pouco: a 1ª forma de cada família que falta, e as da sua coleção que servem. */
    nearLinks: { def: LinkDef; missing: number[]; owned: PokemonInstance[] }[];
}

const factor = (
    inst: PokemonInstance,
    lineup: PokemonInstance[],
    rest: readonly PokemonInstance[],
    role: Position,
    sources: string[],
) =>
    attributeModifiers(inst, { lineup, rest, role })
        .filter((m) => sources.includes(m.source))
        .reduce((f, m) => f * (m.factor ?? 1), 1);

/** `lineup` na ordem das vagas (`roles`); `reserves` = as cartas da coleção fora dos titulares; `bench` = o banco (conta pro monotipo, como na partida). */
export function chemistry(
    lineup: PokemonInstance[],
    roles: readonly Position[],
    reserves: readonly PokemonInstance[] = [],
    bench: readonly PokemonInstance[] = [],
): Chemistry {
    const players = lineup.map((p, i) => ({
        uid: p.uid,
        chem: factor(p, lineup, bench, roles[i], ['sinergia', 'historia']),
        pos: factor(p, lineup, bench, roles[i], ['posicao']),
        // as duas partes da química, separadas só pra explicar ("por que"); `chem` é o produto das duas
        type: factor(p, lineup, bench, roles[i], ['sinergia']),
        link: factor(p, lineup, bench, roles[i], ['historia']),
    }));
    const avg = players.length ? players.reduce((s, p) => s + p.chem, 0) / players.length : 1;
    const types = computeSynergies(lineup, bench);
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

const pct = (f: number) => Math.round((f - 1) * 100);

/**
 * Losangos de química 0–3 por titular (como os do FC), convertidos do bônus que já existe. Degraus aprovados pelo
 * Miguel (09/11): 0% = 0, até +3% = 1, até +6% = 2, acima = 3.
 */
export const diamondsOf = (chem: number) => {
    const p = pct(chem);
    return p <= 0 ? 0 : p <= 3 ? 1 : p <= 6 ? 2 : 3;
};
/** O "X/15" do time: a soma dos losangos dos titulares. */
export const chemTotal = (ch: Chemistry) => ch.players.reduce((s, p) => s + diamondsOf(p.chem), 0);

type NearLink = Chemistry['nearLinks'][number];
/** O "por que" da química de um titular: só lê o que `chemistry` já calculou (nada de número novo). */
export interface ChemWhy {
    diamonds: number;
    /** Tipo: a sinergia que vale pra ele (ou nenhuma), o fator e o próximo degrau dela (mais um do tipo). */
    type: { syn: Synergy | null; factor: number; types: string[]; next: { count: number; bonus: number } | null };
    /** História: as sinergias de que ele faz parte (a de maior bônus vale), o fator e as que falta pouco com a família dele. */
    link: { active: ActiveLink[]; factor: number; near: NearLink[] };
    /** Fator de posição na vaga (1 = na posição). */
    pos: number;
    /** Os outros titulares que ligam com ele (mesmo tipo ligado ou mesma sinergia de história). */
    partners: string[];
}

/** O degrau seguinte da sinergia de tipo com `count` titulares do tipo (4 → 5 é o monotipo). */
export const nextType = (count: number) => {
    const n = count + 1;
    const bonus = TYPE_BONUS[n] ?? (n === 5 ? MONO_BONUS[5] : undefined);
    return bonus ? { count: n, bonus } : null;
};

export function chemWhy(ch: Chemistry, lineup: readonly PokemonInstance[], i: number): ChemWhy {
    const me = lineup[i];
    const row = ch.players[i];
    const types = species(me.speciesId).types;
    const mine = ch.types.filter((s) => types.includes(s.type));
    // a que vale é a de maior bônus (synergyFactor); sem nenhuma, o próximo degrau é ligar o 1º tipo dele
    const syn = mine.find((s) => s.bonus === row.type) ?? null;
    const active = ch.links.filter((l) => l.members.includes(me.uid));
    const partners = new Set<string>();
    for (const s of mine) for (const p of lineup) if (species(p.speciesId).types.includes(s.type)) partners.add(p.uid);
    for (const l of active) for (const uid of l.members) partners.add(uid);
    partners.delete(me.uid);
    return {
        diamonds: diamondsOf(row.chem),
        type: { syn, factor: row.type, types, next: syn?.mono ? null : nextType(syn?.count ?? 1) },
        link: {
            active: [...active].sort((a, b) => b.bonus - a.bonus),
            factor: row.link,
            near: ch.nearLinks.filter((n) => n.def.groups.some((g) => g.includes(me.speciesId))),
        },
        pos: row.pos,
        partners: lineup.filter((p) => partners.has(p.uid)).map((p) => p.uid),
    };
}
