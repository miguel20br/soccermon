/**
 * Onde cada Pokémon de Kanto aparece em Red/Blue/Yellow (lugar, jeito, chance e níveis) + habitat de FireRed/LeafGreen,
 * cor e forma, da PokeAPI (api-data estático, com cópia em .cache/). Ainda sem tela: é a base do "Draft do lugar" do
 * Modo história e do evento "Mato alto" da Rota (docs/planos/pesquisas/apis-e-assets.md, ideias 4, 5 e 11).
 *
 * Saída: src/data/kanto-encounters.json
 *   areas:   { [lugar]: { name, mons: [[id, jeito, chance %, nível mín, nível máx, versões]] } }
 *            versões = letras de r(ed) b(lue) y(ellow); chance = soma das faixas daquele jeito (no máximo 100: os
 *            parados, como os Voltorb da Usina, são vários de 100%)
 *   species: { [id]: { habitat, color, shape } }
 *   notWild: { [id]: motivo }  quem não se acha na natureza em nenhum dos três jogos: presente (inicial, Eevee,
 *            Lapras...), cassino (prêmio do Game Corner), troca, fóssil, evolução ou evento (Mew). Presentes e trocas
 *            continuam em `areas`, com o jeito `gift`/`npc-trade`.
 *
 * Uso: npx tsx scripts/fetch-encounters.ts
 */
import { writeFile } from 'node:fs/promises';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { cachedJson, idsOf, pool } from './lib/download';

const API = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';
const VERSIONS = { red: 'r', blue: 'b', yellow: 'y' } as const;
type Version = keyof typeof VERSIONS;

/** Jeitos de achar na natureza (o resto é presente ou troca). */
const WILD = new Set(['walk', 'surf', 'old-rod', 'good-rod', 'super-rod', 'static', 'pokeflute']);
/** Quem não tem encontro nenhum na PokeAPI e por quê (o resto sai dos dados). */
const NOT_WILD: Record<number, string> = { 151: 'evento' };

const ref = (url: string) => url.replace(/^.*\/api\/v2\//, '').replace(/\/$/, '');

interface EncounterVersion {
    version: { name: string };
    encounter_details: { chance: number; min_level: number; max_level: number; method: { name: string } }[];
}
interface Encounter {
    location_area: { name: string; url: string };
    version_details: EncounterVersion[];
}

const ids = idsOf(1);
const areaName = new Map<string, string>();
/** lugar → id → jeito → versão → [chance, mín, máx] */
const found = new Map<string, Map<number, Map<string, Map<Version, [number, number, number]>>>>();

await pool(ids, 6, async (id) => {
    const list = await cachedJson<Encounter[]>(
        `${API}/pokemon/${id}/encounters/index.json`,
        `pokeapi/pokemon/${id}/encounters.json`,
    );
    for (const e of list ?? []) {
        for (const v of e.version_details) {
            const version = v.version.name as Version;
            if (!(version in VERSIONS)) continue;
            const area = e.location_area.name;
            areaName.set(area, ref(e.location_area.url));
            const byMon = found.get(area) ?? new Map();
            found.set(area, byMon);
            const byMethod = byMon.get(id) ?? new Map();
            byMon.set(id, byMethod);
            for (const d of v.encounter_details) {
                const byVersion = byMethod.get(d.method.name) ?? new Map();
                byMethod.set(d.method.name, byVersion);
                const [c, lo, hi] = byVersion.get(version) ?? [0, 99, 0];
                byVersion.set(version, [
                    Math.min(100, c + d.chance),
                    Math.min(lo, d.min_level),
                    Math.max(hi, d.max_level),
                ]);
            }
        }
    }
});

// nome em inglês de cada lugar ("Viridian Forest", "Route 1"); o PokeAPI deixa vazio em alguns: fica o slug
const names = new Map<string, string>();
await pool([...areaName], 6, async ([slug, path]) => {
    const a = await cachedJson<{ names: { name: string; language: { name: string } }[]; location: { url: string } }>(
        `${API}/${path}/index.json`,
        `pokeapi/${path}.json`,
    );
    let name = a?.names.find((n) => n.language.name === 'en')?.name;
    if (!name && a) {
        const loc = await cachedJson<{ names: { name: string; language: { name: string } }[] }>(
            `${API}/${ref(a.location.url)}/index.json`,
            `pokeapi/${ref(a.location.url)}.json`,
        );
        name = loc?.names.find((n) => n.language.name === 'en')?.name;
    }
    names.set(slug, name ?? slug);
});

type Row = [number, string, number, number, number, string];
const areas: Record<string, { name: string; mons: Row[] }> = {};
for (const area of [...found.keys()].sort()) {
    const mons: Row[] = [];
    for (const [id, byMethod] of [...found.get(area)!].sort(([a], [b]) => a - b)) {
        for (const [method, byVersion] of byMethod) {
            // versões com a mesma chance e os mesmos níveis viram uma linha só ("rb", "rby")
            const groups = new Map<string, Version[]>();
            for (const [v, nums] of byVersion) {
                const k = nums.join();
                groups.set(k, [...(groups.get(k) ?? []), v]);
            }
            for (const [k, vs] of groups) {
                const [chance, lo, hi] = k.split(',').map(Number);
                const versions = (['red', 'blue', 'yellow'] as const).filter((v) => vs.includes(v));
                mons.push([id, method, chance, lo, hi, versions.map((v) => VERSIONS[v]).join('')]);
            }
        }
    }
    areas[area] = { name: names.get(area) ?? area, mons };
}

const species: Record<number, { habitat: string | null; color: string; shape: string }> = {};
await pool(ids, 6, async (id) => {
    const s = await cachedJson<{ habitat: { name: string } | null; color: { name: string }; shape: { name: string } }>(
        `${API}/pokemon-species/${id}/index.json`,
        `pokeapi/pokemon-species/${id}.json`,
    );
    if (!s) throw new Error(`#${id}: sem pokemon-species`);
    species[id] = { habitat: s.habitat?.name ?? null, color: s.color.name, shape: s.shape.name };
});

// quem não se acha na natureza: presente, prêmio do cassino, troca, evolução ou um dos motivos da lista
const rows = Object.entries(areas).flatMap(([area, a]) => a.mons.map((m) => ({ area, id: m[0], method: m[1] })));
const wild = new Set(rows.filter((r) => WILD.has(r.method)).map((r) => r.id));
const byId = new Map(pokemon.map((p) => [p.id, p]));
const notWild: Record<number, string> = {};
const unexplained: number[] = [];
for (const id of ids) {
    if (wild.has(id)) continue;
    const mine = rows.filter((r) => r.id === id);
    const fossil = mine.some((r) => r.area.includes('lab')) && byId.get(id)?.types.includes('Rock');
    notWild[id] =
        NOT_WILD[id] ??
        (fossil
            ? 'fossil'
            : mine.some((r) => r.area.includes('prize-corner'))
              ? 'cassino'
              : mine.some((r) => r.method === 'gift')
                ? 'presente'
                : mine.some((r) => r.method === 'npc-trade')
                  ? 'troca'
                  : byId.get(id)?.prevo
                    ? 'evolucao'
                    : '');
    if (!notWild[id]) unexplained.push(id);
}

const sorted = <T>(o: Record<number, T>) =>
    Object.fromEntries(Object.entries(o).sort(([a], [b]) => Number(a) - Number(b)));
await writeFile(
    'src/data/kanto-encounters.json',
    `${JSON.stringify({ areas, species: sorted(species), notWild: sorted(notWild) })}\n`,
);
console.log(
    `lugares: ${Object.keys(areas).length} · na natureza: ${wild.size}/151 · fora: ${Object.keys(notWild).length}` +
        (unexplained.length ? ` · SEM MOTIVO: ${unexplained.join(', ')}` : ''),
);
if (unexplained.length) process.exit(1);
