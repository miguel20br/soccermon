/**
 * Avatares centrados: refaz `public/assets/avatars/{id}.gif` (e `shiny/`) a partir dos sprites das cartas
 * (`public/assets/cards/`). O sprite da carta é recortado pela caixa de todos os quadros, então o "peso" do Pokémon
 * (cauda, asa, um quadro que pula) puxa pra um lado e as pontas saem do círculo do avatar. Aqui cada um ganha uma tela
 * quadrada com o centro entre o centro de massa e o da caixa, larga o bastante pra todo pixel caber no círculo
 * (com folga). Normal e shiny usam a mesma tela (a forma é a mesma, só a cor muda).
 *
 * Precisa do ImageMagick (`magick`). Uso: `npx tsx scripts/build-avatars.ts` (refaz tudo e confere) ou
 * `npx tsx scripts/build-avatars.ts --check` (só confere os que já existem; sai com erro se algum escapar).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CARDS = 'public/assets/cards';
const OUT = 'public/assets/avatars';
/** Todo pixel dentro deste raio (fração do lado): o círculo do avatar é 0,5, com a borda por cima. */
const RADIUS = 0.47;
const check = process.argv.includes('--check');

const magick = (args: string[]) => execFileSync('magick', args, { maxBuffer: 64 << 20 });

/** União dos quadros: largura, altura e o alfa (1 byte por pixel). */
function union(file: string) {
    const merged = ['-coalesce', '-background', 'none', '-layers', 'merge'];
    const [w, h] = magick([file, ...merged, '-format', '%w %h', 'info:'])
        .toString()
        .split(' ')
        .map(Number);
    const alpha = magick([file, ...merged, '-alpha', 'extract', '-depth', '8', 'gray:-']);
    return { w, h, alpha };
}

/** Centro de massa, centro da caixa visível e o raio que cobre tudo a partir de um centro. */
function shape({ w, h, alpha }: ReturnType<typeof union>) {
    let n = 0;
    let sx = 0;
    let sy = 0;
    let x0 = w;
    let x1 = 0;
    let y0 = h;
    let y1 = 0;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            if (alpha[y * w + x] <= 127) continue;
            n++;
            sx += x + 0.5;
            sy += y + 0.5;
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x + 1);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y + 1);
        }
    const mass = [sx / n, sy / n];
    const box = [(x0 + x1) / 2, (y0 + y1) / 2];
    const reach = (cx: number, cy: number) => {
        let r = 0;
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++)
                if (alpha[y * w + x] > 127) r = Math.max(r, Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + 0.5);
        return r;
    };
    return { mass, box, reach };
}

/** Confere um avatar pronto: quadrado, tudo dentro do círculo e o peso perto do centro. */
function verify(file: string) {
    const u = union(file);
    const s = shape(u);
    const side = u.w;
    return {
        square: u.w === u.h,
        reach: s.reach(side / 2, side / 2) / side,
        off: Math.hypot(s.mass[0] - side / 2, s.mass[1] - side / 2) / side,
    };
}

const bad: string[] = [];
let worstOff = 0;
let worstReach = 0;
if (!check) mkdirSync(`${OUT}/shiny`, { recursive: true });
for (let id = 1; id <= 151; id++) {
    if (!check) {
        const u = union(`${CARDS}/${id}.gif`);
        const s = shape(u);
        const cx = (s.mass[0] + s.box[0]) / 2;
        const cy = (s.mass[1] + s.box[1]) / 2;
        const side = Math.ceil(Math.max(u.w, u.h, (2 * s.reach(cx, cy)) / (2 * RADIUS)));
        const left = Math.round(side / 2 - cx);
        const top = Math.round(side / 2 - cy);
        for (const dir of ['', 'shiny/'])
            magick([
                `${CARDS}/${dir}${id}.gif`,
                '-coalesce',
                '-background',
                'none',
                '-gravity',
                'NorthWest',
                '-extent',
                `${side}x${side}-${left}-${top}`,
                '+repage',
                '-layers',
                'OptimizeTransparency',
                `${OUT}/${dir}${id}.gif`,
            ]);
    }
    for (const dir of ['', 'shiny/']) {
        const v = verify(`${OUT}/${dir}${id}.gif`);
        worstOff = Math.max(worstOff, v.off);
        worstReach = Math.max(worstReach, v.reach);
        if (!v.square || v.reach > 0.5 || v.off > 0.06)
            bad.push(
                `${dir}${id}: quadrado=${v.square} alcance=${v.reach.toFixed(3)} fora do centro=${v.off.toFixed(3)}`,
            );
    }
}
console.log(
    `151 avatares (normal e shiny): maior alcance ${worstReach.toFixed(3)} do lado (círculo = 0,5), peso a no máximo ${(worstOff * 100).toFixed(1)}% do centro`,
);
if (bad.length) {
    console.error(`fora do círculo ou do centro:\n${bad.join('\n')}`);
    process.exit(1);
}
