/**
 * Ícones de menu (o "bonequinho de caixa") numa folha só por fonte, pra listas, mapa da Rota e chave da copa:
 * - pokesprite (msikma/pokesprite, código MIT; imagens © Nintendo/Creatures/GAME FREAK): ícones de caixa, com shiny
 *   (feitos pela comunidade). Duas pastas: `pokemon-gen8` (Sword/Shield: quem ganhou ícone novo no Galar fica bem
 *   maior que quem ficou com o antigo) e `pokemon-gen7x` (Sun/Moon: todos no mesmo tamanho).
 * - Pokémon Showdown (`pokemonicons-sheet.png`, uso sem fins lucrativos com crédito): o traço da Gen 8 em 40×30, sem
 *   shiny. Fica pra comparação (`?lab=icones`).
 * Cada fonte vira uma folha nossa (16 por linha, na ordem da Pokédex, quadro igual pra todos, aparado na sobra de
 * transparência que todos têm), servida do nosso domínio; o original fica em .cache/.
 *
 * Saídas: public/assets/icons/{pokesprite,pokesprite7,showdown}.png (+ `-shiny` nas do pokesprite) e
 * src/data/icon-sheets.json (tamanho do quadro de cada folha).
 * Uso: npx tsx scripts/fetch-icons.ts [--gen 1|2]
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { cachedJson, fetchBuffer, idsFromArgs, pool } from './lib/download';

const PS = 'https://raw.githubusercontent.com/msikma/pokesprite/master';
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png';
const OUT = 'public/assets/icons';
const COLS = 16;
const ids = idsFromArgs();

async function cached(url: string, file: string): Promise<Buffer> {
    const path = `.cache/icons/${file}`;
    if (existsSync(path)) return readFile(path);
    const buf = await fetchBuffer(url);
    if (!buf) throw new Error(`não baixou ${url}`);
    await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    await writeFile(path, buf);
    return buf;
}

/** RGBA cru de uma imagem. */
async function raw(img: Buffer | sharp.Sharp) {
    const s = Buffer.isBuffer(img) ? sharp(img) : img;
    const { data, info } = await s.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, w: info.width, h: info.height };
}

/** Caixa que cobre os pixels visíveis de todos os quadros (o mesmo corte pra todos: ninguém pula de lugar). */
function unionBox(cells: { data: Buffer; w: number; h: number }[]) {
    let x0 = Number.POSITIVE_INFINITY;
    let y0 = Number.POSITIVE_INFINITY;
    let x1 = -1;
    let y1 = -1;
    for (const c of cells)
        for (let y = 0; y < c.h; y++)
            for (let x = 0; x < c.w; x++)
                if (c.data[(y * c.w + x) * 4 + 3] > 0) {
                    x0 = Math.min(x0, x);
                    y0 = Math.min(y0, y);
                    x1 = Math.max(x1, x);
                    y1 = Math.max(y1, y);
                }
    return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Monta a folha: um quadro por número, na ordem, 16 por linha. */
async function sheet(cells: Buffer[], box: sharp.Region, file: string) {
    const rows = Math.ceil(cells.length / COLS);
    const composites = await Promise.all(
        cells.map(async (c, i) => ({
            input: await sharp(c).extract(box).png().toBuffer(),
            left: (i % COLS) * box.width,
            top: Math.floor(i / COLS) * box.height,
        })),
    );
    await sharp({
        create: {
            width: COLS * box.width,
            height: rows * box.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(composites)
        .png({ compressionLevel: 9, palette: true })
        .toFile(`${OUT}/${file}.png`);
}

await mkdir(OUT, { recursive: true });

// pokesprite: um PNG de 68×56 por Pokémon (regular e shiny), pelo slug em inglês
const dex = await cachedJson<Record<string, { slug: { eng: string } }>>(
    `${PS}/data/pokemon.json`,
    'icons/pokesprite-pokemon.json',
);
if (!dex) throw new Error('sem data/pokemon.json do pokesprite');
const slug = (id: number) => dex[String(id).padStart(3, '0')].slug.eng;
const boxes: Record<string, sharp.Region> = {};
for (const [name, folder] of [
    ['pokesprite', 'pokemon-gen8'],
    ['pokesprite7', 'pokemon-gen7x'],
] as const) {
    const get = (kind: string) =>
        pool(ids, 8, (id) => cached(`${PS}/${folder}/${kind}/${slug(id)}.png`, `${folder}/${kind}/${id}.png`));
    const [regular, shiny] = [await get('regular'), await get('shiny')];
    const box = unionBox(await Promise.all([...regular, ...shiny].map((b) => raw(b))));
    await sheet(regular, box, name);
    await sheet(shiny, box, `${name}-shiny`);
    boxes[name] = box;
}

// Showdown: uma folha de 12 por linha, 40×30, na posição = número da Pokédex
const sd = await cached(SHOWDOWN, 'showdown-sheet.png');
const sdCells = await Promise.all(
    ids.map((id) =>
        sharp(sd)
            .ensureAlpha()
            .extract({ left: (id % 12) * 40, top: Math.floor(id / 12) * 30, width: 40, height: 30 })
            .png()
            .toBuffer(),
    ),
);
const sdBox = unionBox(await Promise.all(sdCells.map((b) => raw(b))));
await sheet(sdCells, sdBox, 'showdown');

const meta = {
    cols: COLS,
    count: ids.length,
    pokesprite: { w: boxes.pokesprite.width, h: boxes.pokesprite.height, shiny: true },
    pokesprite7: { w: boxes.pokesprite7.width, h: boxes.pokesprite7.height, shiny: true },
    showdown: { w: sdBox.width, h: sdBox.height, shiny: false },
};
await writeFile('src/data/icon-sheets.json', `${JSON.stringify(meta)}\n`);
console.log(
    `ícones: ${ids.length} · ${Object.entries(meta)
        .flatMap(([k, v]) => (typeof v === 'object' ? [`${k} ${v.w}×${v.h}`] : []))
        .join(' · ')}`,
);
