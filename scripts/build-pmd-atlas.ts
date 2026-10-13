/**
 * Sprites do campo: PMDCollab/SpriteCollab (CC BY-NC 4.0) → um atlas Phaser (JSON Hash) por Pokémon.
 *
 * Cada spritesheet PMD tem 1 coluna por frame e 1 linha por direção, na ordem:
 *   0 baixo, 1 baixo-direita, 2 direita, 3 cima-direita, 4 cima, 5 cima-esquerda, 6 esquerda, 7 baixo-esquerda
 * (conferido visualmente no Walk-Anim do Pikachu).
 *
 * Saídas:
 *   public/assets/field/{id}.png + {id}.json   atlas com frames "Anim/dir/i"
 *   src/data/pmd-anims.json                    durações (em ticks de 1/60 s), tamanho do frame, sombra
 *   CREDITS-PMD.md                             autores por Pokémon (crédito obrigatório da licença)
 *
 * Uso: npm run assets:field
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { fetchBuffer, ids151 } from './lib/download';

const REPO = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite';
const CACHE = '.cache/pmd';
const OUT = 'public/assets/field';

/** Animações usadas em campo. As opcionais caem em fallback no runtime (game/animation-manager.ts). */
const WANTED = ['Idle', 'Walk', 'Attack', 'Shoot', 'Hop', 'Hurt', 'Charge', 'Swing', 'Pose', 'Trip'] as const;
const REQUIRED = new Set(['Idle', 'Walk', 'Attack', 'Hurt', 'Hop']);
const MAX_TEXTURE = 4096;

interface RawAnim {
    Name: string;
    CopyOf?: string;
    FrameWidth?: number;
    FrameHeight?: number;
    HitFrame?: number;
    Durations?: { Duration: number | number[] };
}

export interface PmdAnimInfo {
    frameWidth: number;
    frameHeight: number;
    frames: number;
    rows: number;
    durations: number[];
    hitFrame: number | null;
}

async function cached(id: number, file: string): Promise<Buffer | null> {
    const path = `${CACHE}/${id}/${file}`;
    if (existsSync(path)) return readFile(path);
    const buf = await fetchBuffer(`${REPO}/${String(id).padStart(4, '0')}/${file}`);
    if (buf) {
        await mkdir(`${CACHE}/${id}`, { recursive: true });
        await writeFile(path, buf);
    }
    return buf;
}

async function buildOne(id: number) {
    const xml = await cached(id, 'AnimData.xml');
    if (!xml) throw new Error(`#${id}: sem AnimData.xml`);
    const parsed = new XMLParser().parse(xml.toString('utf8'));
    const rawAnims: RawAnim[] = [parsed.AnimData.Anims.Anim].flat();
    const byName = new Map(rawAnims.map((a) => [a.Name, a]));

    const anims: Record<string, PmdAnimInfo> = {};
    const sheets: { name: string; img: Buffer; width: number; height: number }[] = [];

    for (const name of WANTED) {
        let raw = byName.get(name);
        if (!raw) {
            if (REQUIRED.has(name)) throw new Error(`#${id}: falta animação obrigatória ${name}`);
            continue;
        }
        // CopyOf aponta para outra animação (mesmo arquivo e metadados)
        const source = raw.CopyOf ? byName.get(raw.CopyOf) : raw;
        if (!source) continue;
        raw = source;

        const img = await cached(id, `${source.Name}-Anim.png`);
        if (!img) {
            if (REQUIRED.has(name)) throw new Error(`#${id}: sem ${source.Name}-Anim.png`);
            continue;
        }
        const { width = 0, height = 0 } = await sharp(img).metadata();
        const fw = Number(raw.FrameWidth);
        const fh = Number(raw.FrameHeight);
        const durations = [raw.Durations?.Duration ?? 1].flat().map(Number);
        anims[name] = {
            frameWidth: fw,
            frameHeight: fh,
            frames: Math.round(width / fw),
            rows: Math.round(height / fh),
            durations,
            hitFrame: raw.HitFrame != null ? Number(raw.HitFrame) : null,
        };
        sheets.push({ name, img, width, height });
    }

    // Empilha as sheets em colunas de no máximo MAX_TEXTURE px de altura (limite seguro de GPU mobile)
    const frames: Record<string, unknown> = {};
    const composites: sharp.OverlayOptions[] = [];
    let colX = 0;
    let colW = 0;
    let y = 0;
    let atlasW = 0;
    let atlasH = 0;
    for (const s of sheets) {
        if (y + s.height > MAX_TEXTURE && y > 0) {
            colX += colW;
            colW = 0;
            y = 0;
        }
        const x0 = colX;
        colW = Math.max(colW, s.width);
        atlasW = Math.max(atlasW, colX + colW);
        atlasH = Math.max(atlasH, y + s.height);
        const a = anims[s.name];
        composites.push({ input: s.img, left: x0, top: y });
        for (let row = 0; row < a.rows; row++) {
            for (let f = 0; f < a.frames; f++) {
                const w = a.frameWidth;
                const h = a.frameHeight;
                frames[`${s.name}/${row}/${f}`] = {
                    frame: { x: x0 + f * w, y: y + row * h, w, h },
                    rotated: false,
                    trimmed: false,
                    spriteSourceSize: { x: 0, y: 0, w, h },
                    sourceSize: { w, h },
                };
            }
        }
        y += s.height;
    }

    await sharp({ create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(composites)
        .png({ compressionLevel: 9, palette: true })
        .toFile(`${OUT}/${id}.png`);
    await writeFile(
        `${OUT}/${id}.json`,
        JSON.stringify({ frames, meta: { image: `${id}.png`, size: { w: atlasW, h: atlasH }, scale: 1 } }),
    );

    const credits = (await cached(id, 'credits.txt'))?.toString('utf8') ?? '';
    const authors = [
        ...new Set(
            credits
                .split('\n')
                .map((l) => l.split('\t')[1]?.trim())
                .filter(Boolean),
        ),
    ];

    return { shadowSize: Number(parsed.AnimData.ShadowSize ?? 1), anims, authors };
}

await mkdir(OUT, { recursive: true });
const meta: Record<number, { shadowSize: number; anims: Record<string, PmdAnimInfo> }> = {};
const creditLines: string[] = [];
const errors: string[] = [];
const queue = [...ids151];

await Promise.all(
    Array.from({ length: 6 }, async () => {
        while (queue.length) {
            const id = queue.shift() as number;
            try {
                const r = await buildOne(id);
                meta[id] = { shadowSize: r.shadowSize, anims: r.anims };
                const name = pokemon.find((p) => p.id === id)?.name ?? `#${id}`;
                creditLines[id] = `| ${id} | ${name} | ${r.authors.join(', ') || '—'} |`;
            } catch (e) {
                errors.push(String((e as Error).message));
            }
        }
    }),
);

await writeFile('src/data/pmd-anims.json', `${JSON.stringify(meta)}\n`);
await writeFile(
    'CREDITS-PMD.md',
    [
        '# Créditos dos sprites de campo (PMD Sprite Repository)',
        '',
        'Sprites de [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licença',
        '[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Alteração: as sheets de cada Pokémon foram',
        'empilhadas num único atlas PNG. Sprites originais de Pokémon Mystery Dungeon © Nintendo / Spike Chunsoft.',
        '',
        '| # | Pokémon | Autores |',
        '|---|---|---|',
        ...creditLines.filter(Boolean),
        '',
    ].join('\n'),
);

console.log(`atlas: ${Object.keys(meta).length}/151`);
const missingOptional = WANTED.filter((n) => !REQUIRED.has(n)).map(
    (n) => `${n}: ${ids151.filter((id) => meta[id] && !meta[id].anims[n]).length} sem`,
);
console.log(`opcionais ausentes → ${missingOptional.join(' · ')}`);
if (errors.length) {
    console.error(errors);
    process.exit(1);
}
