/**
 * Gorro de Natal (src/ui/ambientes/Gorro.tsx): a cabeça sobe e desce até 5 px nos quadros do Idle (e muda de lugar na
 * Pose), e o gorro parado no quadro 0 afundava nos olhos ou flutuava. Este script segue a cabeça quadro a quadro: pega
 * o pedaço do quadro Idle 0 logo embaixo da aba (a âncora revisada em src/data/gorro-ancoras.json) e procura o
 * deslocamento (dx, dy) em que ele casa melhor em cada quadro do Idle e da Pose, nas 8 direções.
 * Saída: src/data/gorro-quadros.json, { id: { Idle: [dir][dx0, dy0, dx1, dy1, ...], Pose: ... } }.
 *
 * Uso: npx tsx scripts/build-gorro-quadros.ts   (rode de novo ao mexer numa âncora; o teste do Gorro cobra)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import ANCORAS from '../src/data/gorro-ancoras.json' with { type: 'json' };
import FEET from '../src/data/sprite-feet.json' with { type: 'json' };
import { type Ancora, gorroPos } from '../src/ui/ambientes/gorro-pixel';

const ANIMS = ['Idle', 'Pose'] as const;
type MenuAnim = { w: number; h: number; y: number; n: number };

const out: Record<string, Partial<Record<(typeof ANIMS)[number], number[][]>>> = {};
for (const [id, an] of Object.entries(ANCORAS as Record<string, Ancora>)) {
    const sheet = JSON.parse(readFileSync(`public/assets/field/menu/${id}.json`, 'utf8')) as {
        anims: Record<string, MenuAnim>;
    };
    const { data, info } = await sharp(`public/assets/field/menu/${id}.png`)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
    const feet = (FEET as Record<string, Partial<Record<string, number>>>)[id] ?? {};
    const idle = sheet.anims.Idle;
    /** RGBA do pixel (x, y) do quadro f da direção d da animação a; fora do quadro, transparente. */
    const px = (a: MenuAnim, d: number, f: number, x: number, y: number) => {
        if (x < 0 || y < 0 || x >= a.w || y >= a.h) return 0;
        const i = ((a.y + d * a.h + y) * info.width + f * a.w + x) * 4;
        return data[i + 3] ? (data[i] << 16) | (data[i + 1] << 8) | data[i + 2] : 0;
    };
    const mirrored = (a: MenuAnim, r: number, l: number) => {
        for (let f = 0; f < a.n; f++)
            for (let y = 0; y < a.h; y++)
                for (let x = 0; x < a.w; x++) if (px(a, r, f, x, y) !== px(a, l, f, a.w - 1 - x, y)) return false;
        return true;
    };
    out[id] = {};
    for (const name of ANIMS) {
        const a = sheet.anims[name];
        if (!a) continue;
        // o mesmo ponto do corpo no quadro da animação: meio do quadro e linha do pé (as duas folhas se alinham assim)
        const bx = Math.round((a.w - idle.w) / 2);
        const by = Math.round((feet[name] ?? 0.7) * a.h - (feet.Idle ?? 0.7) * idle.h);
        const R = name === 'Idle' ? 9 : 12;
        const errs: number[] = [];
        const rows = Array.from({ length: 8 }, (_, d) => {
            const g = gorroPos(an, d);
            const [, hy] = an.p[d];
            const row: number[] = [];
            errs[d] = 0;
            for (let f = 0; f < a.n; f++) {
                let best = [0, 0];
                let bestErr = Number.POSITIVE_INFINITY;
                for (let dy = -R; dy <= R; dy++)
                    for (let dx = -R; dx <= R; dx++) {
                        let err = 0;
                        for (let y = hy - 4; y <= hy + 8; y++)
                            for (let x = g.x - 2; x < g.x + g.w + 2; x++) {
                                const u = px(idle, d, 0, x, y);
                                const v = px(a, d, f, x + bx + dx, y + by + dy);
                                // forma pesa mais que cor (o sombreado muda entre quadros)
                                if (!u !== !v) err += 2;
                                else if (u !== v) err += 1;
                            }
                        // empate: o menor deslocamento
                        const e = err + (Math.abs(dx) + Math.abs(dy)) * 0.01;
                        if (e < bestErr) {
                            bestErr = e;
                            best = [dx, dy];
                        }
                    }
                errs[d] += bestErr;
                // sem flutuar: a aba tem que encostar no sprite (algum pixel até 2 linhas acima ou 1 abaixo da base);
                // se o casamento errou pra cima (pose de costas muito diferente), desce até encostar
                const touches = (dy: number) => {
                    const yb = hy + by + dy;
                    for (let y = yb - 2; y <= yb + 1; y++)
                        for (let x = g.x + bx + best[0] + 2; x < g.x + bx + best[0] + g.w - 2; x++)
                            if (px(a, d, f, x, y)) return true;
                    return false;
                };
                while (!touches(best[1]) && best[1] < R + 12) best[1]++;
                if (process.env.DEBUG) console.log(id, name, d, f, Math.round(bestErr));
                row.push(best[0] + bx, best[1] + by);
            }
            return row;
        });
        // folha espelhada (a direita é a esquerda virada, quadro a quadro): vale o lado que casou melhor, espelhado no
        // outro. Uma pose muito diferente do quadro 0 (o Pikachu de lado) às vezes engana um lado só.
        for (const [r, l] of [
            [1, 7],
            [2, 6],
            [3, 5],
        ]) {
            if (!mirrored(a, r, l)) continue;
            const [good, bad] = errs[r] <= errs[l] ? [r, l] : [l, r];
            rows[bad] = rows[good].map((v, i) => (i % 2 ? v : -v));
        }
        out[id][name] = rows;
    }
}
const lines = Object.entries(out).map(([id, v]) => `    "${id}": ${JSON.stringify(v)}`);
writeFileSync('src/data/gorro-quadros.json', `{\n${lines.join(',\n')}\n}\n`);
console.log('src/data/gorro-quadros.json', lines.length);
