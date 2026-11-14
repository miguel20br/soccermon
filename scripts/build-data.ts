/**
 * Gera os dados estáticos de cada geração a partir do @pkmn/dex (MIT) + textos pt-BR do pokerogue-locales (AGPL).
 *
 * Decisões:
 * - Elenco e learnsets: os da geração (Gen 1 = Red/Blue/Yellow, Gen 2 = Gold/Silver/Crystal).
 * - Stats base, tipos, golpes e habilidades: dados modernos (Gen 1 não tinha SpA/SpD separados nem habilidades).
 * - A Gen 1 vai pra `src/data` (a que o jogo usa); as outras pra `src/data/gen<N>`, fora do jogo até serem ligadas.
 *
 * Uso: npm run data [-- --gen 1|2]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { cachedJson, dataDir, GENS, type Gen, gensFromArgs, pool } from './lib/download';

const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';

/** Altura (m) e formato do corpo, do PokeAPI — o @pkmn/dex não traz nenhum dos dois. */
async function fetchBodies(ids: number[]): Promise<Map<number, { heightm: number; shape: string }>> {
    const getJson = async <T>(path: string) => {
        const json = await cachedJson<T>(`${POKEAPI}/${path}/index.json`, `pokeapi/${path}.json`);
        if (!json) throw new Error(`Falha ao buscar ${path}`);
        return json;
    };
    const rows = await pool(ids, 8, async (id) => {
        const [mon, spec] = await Promise.all([
            getJson<{ height: number }>(`pokemon/${id}`),
            getJson<{ shape: { name: string } }>(`pokemon-species/${id}`),
        ]);
        return [id, { heightm: mon.height / 10, shape: spec.shape.name }] as const;
    });
    return new Map(rows);
}
const LOCALES = 'https://raw.githubusercontent.com/pagefaultgames/pokerogue-locales/main/pt-BR';
const LEGENDARY = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251]);
const PSEUDO = new Set([149, 248]);
/** Nome oficial com o símbolo (o Showdown escreve "Nidoran-F"). */
const NAME_FIX: Record<string, string> = { 'Nidoran-F': 'Nidoran♀', 'Nidoran-M': 'Nidoran♂' };

const toId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

async function fetchLocale(
    file: string,
): Promise<Record<string, { name: string; effect?: string; description?: string }>> {
    const res = await fetch(`${LOCALES}/${file}`);
    if (!res.ok) throw new Error(`Falha ao baixar ${file}: ${res.status}`);
    const raw = (await res.json()) as Record<string, { name: string; effect?: string; description?: string }>;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [toId(k), v]));
}

function tierOf(num: number, bst: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (LEGENDARY.has(num)) return 'legendary';
    if (num === 132) return 'epic'; // Ditto: vira o melhor da posição em campo
    if (PSEUDO.has(num) || bst >= 530) return 'epic';
    if (bst >= 450) return 'rare';
    if (bst >= 350) return 'uncommon';
    return 'common';
}

async function buildGen(gen: Gen, ptMoves: Locale, ptAbilities: Locale) {
    const gens = new Generations(Dex);
    const g = gens.get(gen);
    const [lo, hi] = GENS[gen];
    const roster = [...g.species].filter((s) => s.num >= lo && s.num <= hi).sort((a, b) => a.num - b.num);

    const pokemon = [];
    const moveIds = new Set<string>();
    const abilityIds = new Set<string>();

    const bodies = await fetchBodies(roster.map((s) => s.num));
    for (const s1 of roster) {
        const s = Dex.species.get(s1.id);
        const learnable = await g.learnsets.learnable(s1.id);
        const learnset = Object.keys(learnable ?? {}).sort();
        for (const m of learnset) moveIds.add(m);

        const abilities = Object.values(s.abilities).map(toId);
        for (const a of abilities) abilityIds.add(a);

        const bst = Object.values(s.baseStats).reduce((a, b) => a + b, 0);
        const evolvesTo = s.evos
            .map((name) => Dex.species.get(name))
            .filter((e) => e.num <= hi && !e.forme)
            .map((e) => ({
                id: e.num,
                level: e.evoLevel ?? null,
                method: e.evoType ?? 'level',
                item: e.evoItem ?? null,
            }));

        pokemon.push({
            id: s.num,
            slug: s.id,
            name: NAME_FIX[s.name] ?? s.name,
            types: s.types,
            baseStats: s.baseStats,
            bst,
            tier: tierOf(s.num, bst),
            abilities,
            learnset,
            evolvesTo,
            prevo: s.prevo && Dex.species.get(s.prevo).num <= hi ? Dex.species.get(s.prevo).num : null,
            heightm: bodies.get(s.num)?.heightm ?? 1,
            shape: bodies.get(s.num)?.shape ?? 'upright',
            weightkg: s.weightkg,
        });
    }

    const moves: Record<string, unknown> = {};
    for (const id of [...moveIds].sort()) {
        const m = Dex.moves.get(id);
        moves[id] = {
            id,
            name: m.name,
            type: m.type,
            category: m.category,
            power: m.basePower,
            accuracy: m.accuracy === true ? 100 : m.accuracy,
            priority: m.priority,
            pp: m.pp,
            selfBoosts: (m.target === 'self' ? m.boosts : m.self?.boosts) ?? null,
            targetBoosts: m.target !== 'self' && m.boosts ? m.boosts : null,
            target: m.target,
            status: m.status ?? m.secondary?.status ?? null,
            heal: m.heal ? true : id === 'rest' || id === 'recover' || id === 'softboiled',
            multihit: m.multihit ?? null,
            secondary: m.secondary
                ? {
                      chance: m.secondary.chance ?? 100,
                      status: m.secondary.status ?? null,
                      volatile: m.secondary.volatileStatus ?? null,
                      boosts: m.secondary.boosts ?? null,
                  }
                : null,
            shortDesc: m.shortDesc,
            descPt: ptMoves[id]?.effect ?? null,
        };
    }

    const abilities: Record<string, unknown> = {};
    for (const id of [...abilityIds].sort()) {
        const a = Dex.abilities.get(id);
        abilities[id] = { id, name: a.name, shortDesc: a.shortDesc, descPt: ptAbilities[id]?.description ?? null };
    }

    const out = dataDir(gen);
    await mkdir(out, { recursive: true });
    await writeFile(`${out}/pokemon.json`, `${JSON.stringify(pokemon, null, 1)}\n`);
    await writeFile(`${out}/moves.json`, `${JSON.stringify(moves, null, 1)}\n`);
    await writeFile(`${out}/abilities.json`, `${JSON.stringify(abilities, null, 1)}\n`);

    const missingPt = Object.values(moves).filter((m) => !(m as { descPt: string | null }).descPt).length;
    console.log(
        `gen ${gen} → ${out}: pokemon ${pokemon.length} · moves ${moveIds.size} (sem pt-BR: ${missingPt}) · abilities ${abilityIds.size}`,
    );
}

/** Tabela de tipos (moderna, a mesma pra todas as gerações). */
async function buildTypechart() {
    const gens = new Generations(Dex);
    const typeNames = [...gens.get(9).types]
        .map((t) => t.name)
        .filter((t) => t !== 'Stellar' && t !== '???')
        .sort();
    const g9 = gens.get(9);
    const typechart: Record<string, Record<string, number>> = {};
    for (const atk of typeNames) {
        typechart[atk] = {};
        for (const def of typeNames) typechart[atk][def] = g9.types.totalEffectiveness(atk as never, [def as never]);
    }

    await writeFile('src/data/typechart.json', `${JSON.stringify({ types: typeNames, chart: typechart }, null, 1)}\n`);
    console.log(`types: ${typeNames.length}`);
}

type Locale = Awaited<ReturnType<typeof fetchLocale>>;

async function main() {
    const [ptMoves, ptAbilities] = await Promise.all([fetchLocale('move.json'), fetchLocale('ability.json')]);
    for (const gen of gensFromArgs()) await buildGen(gen, ptMoves, ptAbilities);
    await buildTypechart();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
