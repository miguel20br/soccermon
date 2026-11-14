/**
 * Texto da Pokédex de cada espécie, pra ficha da espécie e o Álbum:
 * - pt: tradução oficial do TCG Pocket (campo `description` das cartas no TCGdex, banco MIT; texto © TPC). Usa a
 *   carta mais antiga da espécie que tem o texto (a coleção A1 primeiro).
 * - en: o texto do Red/Blue (Gen 1) ou do Gold (Gen 2) na PokeAPI (decisão do Miguel: combina com Kanto).
 * Tudo com cópia em .cache/ (nada é chamado com o jogo rodando).
 *
 * Saída: src/data/dex-text.json (Gen 1) e src/data/gen<N>/dex-text.json  { pt: { [id]: texto }, en: { [id]: texto } }
 * Uso: npx tsx scripts/fetch-dex-text.ts [--gen 1|2]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import gen2 from '../src/data/gen2/pokemon.json' with { type: 'json' };
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { cachedJson, dataDir, type Gen, gensFromArgs, idsOf, pool } from './lib/download';

const TCGDEX = 'https://api.tcgdex.net/v2/pt-br';
const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';
/** Versão do texto em inglês de cada geração. */
const EN_VERSION: Record<Gen, string> = { 1: 'red', 2: 'gold' };
const NAMES = [...pokemon, ...gen2].map((p) => p.name);

interface CardBrief {
    id: string;
    name: string;
}

/** Coleções do Pocket em ordem de lançamento (A1, A1a, A2…); promos (P-A) por último. */
const setRank = (id: string) => (id.startsWith('P-') ? `~${id}` : id);

async function ptText(id: number): Promise<string | null> {
    const list = await cachedJson<CardBrief[]>(`${TCGDEX}/cards?dexId=eq:${id}`, `tcgdex/list-${id}.json`);
    const cards = (list ?? [])
        .filter((c) => !/\bex$/i.test(c.name))
        .sort((a, b) => setRank(a.id).localeCompare(setRank(b.id), 'en', { numeric: true }));
    for (const c of cards) {
        const card = await cachedJson<{ description?: string }>(`${TCGDEX}/cards/${c.id}`, `tcgdex/${c.id}.json`);
        if (card?.description?.trim()) return tidy(card.description);
    }
    return null;
}

async function enText(id: number, gen: Gen): Promise<string | null> {
    const spec = await cachedJson<{
        flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
    }>(`${POKEAPI}/pokemon-species/${id}/index.json`, `pokeapi/pokemon-species/${id}.json`);
    const entry = spec?.flavor_text_entries.find((f) => f.language.name === 'en' && f.version.name === EN_VERSION[gen]);
    return entry ? caps(tidy(entry.flavor_text)) : null;
}

/** Quebras de linha do cartucho e da carta viram espaço. */
const tidy = (s: string) =>
    s
        .replace(/[\n\f\r­]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/** O cartucho escreve POKéMON e os nomes em caixa alta: aqui vira "Pokémon" e "Pikachu". */
function caps(s: string): string {
    let out = s.replace(/POKéMON/g, 'Pokémon');
    for (const name of NAMES) {
        const upper = name.toUpperCase();
        if (upper !== name) out = out.replaceAll(upper, name);
    }
    return out;
}

for (const gen of gensFromArgs()) {
    const ids = idsOf(gen);
    const rows = await pool(ids, 6, async (id) => [id, await ptText(id), await enText(id, gen)] as const);
    const pt: Record<number, string> = {};
    const en: Record<number, string> = {};
    for (const [id, p, e] of rows) {
        if (p) pt[id] = p;
        if (e) en[id] = e;
    }
    await mkdir(dataDir(gen), { recursive: true });
    await writeFile(`${dataDir(gen)}/dex-text.json`, `${JSON.stringify({ pt, en }, null, 1)}\n`);
    const miss = (o: Record<number, string>) => ids.filter((id) => !o[id]);
    console.log(
        `gen ${gen}: pt ${Object.keys(pt).length}/${ids.length} · en ${Object.keys(en).length}/${ids.length}` +
            (miss(pt).length ? ` (sem pt: ${miss(pt).join(', ')})` : ''),
    );
}
