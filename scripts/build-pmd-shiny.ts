/**
 * Folhas shiny dos sprites de campo (PMDCollab SpriteCollab, pasta {id}/0000/0001). Mesma disposição da folha
 * normal: cada animação shiny é colada no mesmo lugar da normal, então o atlas reusa o JSON normal
 * (public/assets/field/{id}.json) e só a imagem muda (public/assets/field/shiny/{id}.png).
 * Espécie sem shiny completo fica de fora (o jogo cai no sprite normal com tinta).
 *
 * Uso: npx tsx scripts/build-pmd-shiny.ts   (depois de scripts/build-pmd-atlas.ts)
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';
import { fetchBuffer, ids151 } from './lib/download';

const REPO = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite';
const CACHE = '.cache/pmd-shiny';
const FIELD = 'public/assets/field';
const OUT = `${FIELD}/shiny`;

async function cached(id: number, file: string): Promise<Buffer | null> {
    const path = `${CACHE}/${id}/${file}`;
    if (existsSync(path)) return readFile(path);
    const buf = await fetchBuffer(`${REPO}/${String(id).padStart(4, '0')}/0000/0001/${file}`);
    if (buf) {
        await mkdir(`${CACHE}/${id}`, { recursive: true });
        await writeFile(path, buf);
    }
    return buf;
}

async function buildOne(id: number): Promise<boolean> {
    const atlas = JSON.parse(await readFile(`${FIELD}/${id}.json`, 'utf8')) as {
        frames: Record<string, { frame: { x: number; y: number } }>;
        meta: { size: { w: number; h: number } };
    };
    const xml = await cached(id, 'AnimData.xml');
    if (!xml) return false;
    const raw = [new XMLParser().parse(xml.toString('utf8')).AnimData.Anims.Anim].flat() as {
        Name: string;
        CopyOf?: string;
    }[];
    const byName = new Map(raw.map((a) => [a.Name, a]));
    const names = [...new Set(Object.keys(atlas.frames).map((k) => k.split('/')[0]))];
    const composites: sharp.OverlayOptions[] = [];
    for (const name of names) {
        const a = byName.get(name);
        const source = a?.CopyOf ? byName.get(a.CopyOf) : a;
        const img = source && (await cached(id, `${source.Name}-Anim.png`));
        if (!img) return false;
        const { x, y } = atlas.frames[`${name}/0/0`].frame;
        composites.push({ input: img, left: x, top: y });
    }
    const { w, h } = atlas.meta.size;
    await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(composites)
        .png({ compressionLevel: 9, palette: true })
        .toFile(`${OUT}/${id}.png`);
    return true;
}

await mkdir(OUT, { recursive: true });
const missing: number[] = [];
const queue = [...ids151];
await Promise.all(
    Array.from({ length: 8 }, async () => {
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
            if (!(await buildOne(id).catch(() => false))) missing.push(id);
        }
    }),
);
missing.sort((a, b) => a - b);
await writeFile('src/data/pmd-shiny-missing.json', `${JSON.stringify(missing)}\n`);
console.log(`shiny: ${151 - missing.length}/151 (sem shiny: ${missing.join(', ') || 'nenhum'})`);
