import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACTIVE_GENS, ALL_GENS, dataDir, GENS, idsOf } from './lib/download';

// Cobertura de cada geração gerada pelos scripts (npm run data, assets:*): todo número tem dados, sprite da carta,
// sprite de campo, retrato e grito. A Gen 2 fica pronta fora do jogo (só os dados no git); ligar = pôr o 2 em
// ACTIVE_GENS e gerar os assets dela com --gen 2.
const json = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;

describe.each(ALL_GENS)('Gen %i', (gen) => {
    const dir = dataDir(gen);
    const ids = idsOf(gen);
    const lacking = (has: (id: number) => boolean) => ids.filter((id) => !has(id));

    it('tem a faixa certa de números', () => {
        expect(ids[0]).toBe(GENS[gen][0]);
        expect(ids.at(-1)).toBe(GENS[gen][1]);
    });

    it('dados: espécie, golpes de cada learnset e golpes por nível', () => {
        const pokemon = json<{ id: number; learnset: string[]; types: string[] }[]>(`${dir}/pokemon.json`);
        const moves = json<Record<string, unknown>>(`${dir}/moves.json`);
        const level = json<Record<string, Record<string, number>>>(`${dir}/level-moves.json`);
        expect(pokemon.map((p) => p.id)).toEqual(ids);
        for (const p of pokemon) {
            expect(p.types.length, `#${p.id}`).toBeGreaterThan(0);
            expect(
                p.learnset.filter((m) => !moves[m]),
                `#${p.id}`,
            ).toEqual([]);
        }
        expect(lacking((id) => !!level[id])).toEqual([]);
    });

    it('dados de campo, retrato e grito de todos', () => {
        const anims = json<Record<string, unknown>>(`${dir}/pmd-anims.json`);
        const feet = json<Record<string, unknown>>(`${dir}/sprite-feet.json`);
        const portraits = json<Record<string, string[]>>(`${dir}/portraits.json`);
        const cries = json<Record<string, unknown[]>>(`${dir}/cry-levels.json`);
        expect(lacking((id) => !!anims[id] && !!feet[id] && !!portraits[id])).toEqual([]);
        expect(cries.legacy).toHaveLength(ids.length);
    });

    // Geração desligada: os arquivos pesados ficam fora do git (.gitignore) e só existem depois dos scripts com
    // --gen. Sem eles, a conferência dos arquivos pula com aviso; geração ligada sempre exige.
    const files = ACTIVE_GENS.includes(gen) || existsSync(`public/assets/cards/${ids[0]}.gif`);
    if (!files) console.warn(`Gen ${gen}: sem os assets em public/ (fora do git); rode os scripts com --gen ${gen}`);
    it.skipIf(!files)('arquivos: carta (normal e shiny), campo, retrato e grito', () => {
        expect(lacking((id) => existsSync(`public/assets/cards/${id}.gif`))).toEqual([]);
        expect(lacking((id) => existsSync(`public/assets/cards/shiny/${id}.gif`))).toEqual([]);
        expect(lacking((id) => existsSync(`public/assets/field/${id}.png`))).toEqual([]);
        expect(lacking((id) => existsSync(`public/assets/portraits/${id}.png`))).toEqual([]);
        expect(
            lacking(
                (id) =>
                    existsSync(`public/assets/cries/legacy/${id}.ogg`) &&
                    existsSync(`public/assets/cries/latest/${id}.ogg`),
            ),
        ).toEqual([]);
    });
});

it('o jogo usa só a Gen 1 (a Gen 2 não entra sem decisão)', () => {
    expect(ACTIVE_GENS).toEqual([1]);
    expect(json<unknown[]>('src/data/pokemon.json')).toHaveLength(151);
});

// Ficha da espécie e Álbum (scripts/fetch-dex-text.ts): PT-BR do TCG Pocket e EN do Red/Blue pra todo Pokémon do jogo.
describe.each(ACTIVE_GENS)('texto da Pokédex da Gen %i', (gen) => {
    const texts = json<Record<'pt' | 'en', Record<string, string>>>(`${dataDir(gen)}/dex-text.json`);
    it.each(['pt', 'en'] as const)('%s: todos, numa linha e sem a caixa alta do cartucho', (lang) => {
        const bad = idsOf(gen).filter((id) => {
            const s = texts[lang][id];
            return !s || s.length < 20 || /[\n\f]|POKéMON/.test(s);
        });
        expect(bad).toEqual([]);
    });
});
