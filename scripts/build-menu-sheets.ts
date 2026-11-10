/**
 * Folha do menu (revisão de arte, F7): só as animações que os menus usam (Walk, Idle, Hop, Pose, nas 8 direções),
 * recortadas da folha da quadra (public/assets/field) e gravadas em public/assets/field/menu/{id}.png (+ shiny/) com
 * um JSON curto (tamanho do quadro, fileira e durações do AnimData). Antes o navegador baixava a folha inteira (até
 * 3512x3392) e recortava num canvas: com a página ocupada, o menu de modos ficava segundos só com as sombras.
 *
 * Uso: npm run assets:menu (depois do assets:field). O teste scripts/menu-sheets.test.ts confere se está em dia.
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import pmdAnims from '../src/data/pmd-anims.json' with { type: 'json' };

/** As animações do menu, na ordem da folha (a mesma do FieldSprite). */
const MENU_ANIMS = ['Walk', 'Idle', 'Hop', 'Pose'] as const;
const FIELD = 'public/assets/field';
const OUT = `${FIELD}/menu`;

interface MenuAnim {
    /** Tamanho do quadro. */
    w: number;
    h: number;
    /** Linha de cima da 1ª fileira (direção 0); cada direção é uma fileira de `h`, quadros lado a lado. */
    y: number;
    n: number;
    rows: number;
    /** Do AnimData, em 1/60 s. */
    durations: number[];
}
interface MenuSheet {
    size: { w: number; h: number };
    anims: Record<string, MenuAnim>;
}

type Frame = { x: number; y: number; w: number; h: number };
const PMD = pmdAnims as unknown as Record<string, { anims: Record<string, { durations: number[] }> }>;

async function buildOne(id: number) {
    const atlas = JSON.parse(await readFile(`${FIELD}/${id}.json`, 'utf8')) as {
        frames: Record<string, { frame: Frame }>;
    };
    const strips: { anim: string; row: number; from: Frame; n: number }[] = [];
    const anims: Record<string, MenuAnim> = {};
    let y = 0;
    let w = 0;
    for (const anim of MENU_ANIMS) {
        const f0 = atlas.frames[`${anim}/0/0`]?.frame;
        if (!f0) continue;
        let rows = 0;
        while (atlas.frames[`${anim}/${rows}/0`]) rows++;
        let n = 0;
        while (atlas.frames[`${anim}/0/${n}`]) n++;
        for (let row = 0; row < rows; row++) {
            const first = atlas.frames[`${anim}/${row}/0`].frame;
            // os quadros de uma fileira ficam lado a lado na folha da quadra: dá pra copiar a fileira inteira de uma vez
            for (let i = 0; i < n; i++) {
                const f = atlas.frames[`${anim}/${row}/${i}`]?.frame;
                if (!f || f.x !== first.x + i * f0.w || f.y !== first.y || f.w !== f0.w || f.h !== f0.h)
                    throw new Error(`#${id} ${anim}/${row}/${i}: quadro fora da fileira`);
            }
            strips.push({ anim, row, from: first, n });
        }
        const durations = PMD[id]?.anims[anim]?.durations ?? [];
        if (durations.length !== n) throw new Error(`#${id} ${anim}: ${n} quadros e ${durations.length} durações`);
        anims[anim] = { w: f0.w, h: f0.h, y, n, rows, durations };
        y += rows * f0.h;
        w = Math.max(w, n * f0.w);
    }
    const sheet: MenuSheet = { size: { w, h: y }, anims };
    for (const dir of ['', 'shiny/']) {
        const src = `${FIELD}/${dir}${id}.png`;
        if (!existsSync(src)) continue;
        const composites = await Promise.all(
            strips.map(async (s) => ({
                input: await sharp(src)
                    .extract({ left: s.from.x, top: s.from.y, width: s.n * s.from.w, height: s.from.h })
                    .toBuffer(),
                left: 0,
                top: anims[s.anim].y + s.row * s.from.h,
            })),
        );
        await sharp({ create: { width: w, height: y, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite(composites)
            .png({ compressionLevel: 9, palette: true })
            .toFile(`${OUT}/${dir}${id}.png`);
    }
    await writeFile(`${OUT}/${id}.json`, JSON.stringify(sheet));
}

await mkdir(`${OUT}/shiny`, { recursive: true });
const ids = (await readdir(FIELD)).filter((f) => /^\d+\.json$/.test(f)).map((f) => Number.parseInt(f, 10));
for (const id of ids.sort((a, b) => a - b)) await buildOne(id);
console.log(`folhas do menu: ${ids.length}`);
