/**
 * Desenha o que o formacoes-comportamento.ts mediu: uma quadra por formação, lado a lado, com o mapa de calor do
 * time atacando (onde os 4 da linha ficam com a bola) e os passes certos (verde pra frente, cinza de lado, vermelho
 * pra trás). Ataque pra direita. Sai um SVG (vira PNG com `magick x.svg x.png`).
 *
 * Uso: npx tsx scripts/balance/formacoes-desenho.ts <medida.json> <saida.svg> [título]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [src, out, title = ''] = process.argv.slice(2);
const data = JSON.parse(readFileSync(src, 'utf8')) as Record<
    string,
    { heatAtk: number[]; heatDef: number[]; lines: [number, number, number, number][]; gx: number; gy: number }
>;
const NAMES: Record<string, string> = {
    '1-2-1': 'Losango (1-2-1)',
    '2-2': 'Quadrado (2-2)',
    '3-1': 'Linha de 3 (3-1)',
    '4-0': 'Rodízio (4-0)',
    '1-1-2': 'Dois pivôs (1-1-2)',
    ferrolho: 'Ferrolho (3 fixos)',
};
const S = 10; // px por metro
const W = 40 * S;
const H = 20 * S;
const PAD = 24;
const TOP = 34;
const cols = 3;
const ids = Object.keys(data);
const rows = Math.ceil(ids.length / cols);
const GAP = 22; // entre a quadra com a bola e a sem a bola
const total = { w: cols * (W + PAD) + PAD, h: rows * (2 * H + GAP + TOP + PAD) + PAD + 30 };

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total.w}" height="${total.h}" font-family="sans-serif">`;
svg += `<rect width="100%" height="100%" fill="#141a33"/>`;
svg += `<text x="${PAD}" y="30" fill="#ffcb05" font-size="20" font-weight="700">${title}</text>`;
ids.forEach((f, k) => {
    const d = data[f];
    const ox = PAD + (k % cols) * (W + PAD);
    const oy = 30 + PAD + Math.floor(k / cols) * (2 * H + GAP + TOP + PAD);
    svg += `<text x="${ox}" y="${oy + 20}" fill="#fff" font-size="17" font-weight="700">${NAMES[f] ?? f}</text>`;
    const py = oy + TOP;
    svg += `<rect x="${ox}" y="${py}" width="${W}" height="${H}" fill="#c98a4f" stroke="#fff" stroke-width="2"/>`;
    const max = Math.max(...d.heatAtk);
    const cw = W / d.gx;
    const ch = H / d.gy;
    d.heatAtk.forEach((v, i) => {
        const a = (v / max) * 0.85;
        svg += `<rect x="${ox + (i % d.gx) * cw}" y="${py + Math.floor(i / d.gx) * ch}" width="${cw}" height="${ch}" fill="#7a1fa2" fill-opacity="${a.toFixed(3)}"/>`;
    });
    svg += `<line x1="${ox + W / 2}" y1="${py}" x2="${ox + W / 2}" y2="${py + H}" stroke="#fff" stroke-width="1.5"/>`;
    svg += `<circle cx="${ox + W / 2}" cy="${py + H / 2}" r="${3 * S}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    for (const gxp of [0, W]) {
        svg += `<rect x="${ox + gxp - (gxp ? 6 * S : 0)}" y="${py + 4 * S}" width="${6 * S}" height="${12 * S}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    }
    for (const [ax, ay, bx, by] of d.lines.slice(0, 260)) {
        const dx = bx - ax;
        const c = dx > 2 ? '#3ce06a' : dx < -2 ? '#ff4d4d' : '#e8e8e8';
        svg += `<line x1="${(ox + ax * S).toFixed(1)}" y1="${(py + ay * S).toFixed(1)}" x2="${(ox + bx * S).toFixed(1)}" y2="${(py + by * S).toFixed(1)}" stroke="${c}" stroke-opacity="0.45" stroke-width="1.4"/>`;
        svg += `<circle cx="${(ox + bx * S).toFixed(1)}" cy="${(py + by * S).toFixed(1)}" r="1.8" fill="${c}" fill-opacity="0.7"/>`;
    }
    svg += `<text x="${ox + W - 4}" y="${py + H - 6}" text-anchor="end" fill="#fff" font-size="12">com a bola · ataque →</text>`;
    // embaixo: sem a bola (onde o time se defende)
    const qy = py + H + GAP;
    svg += `<rect x="${ox}" y="${qy}" width="${W}" height="${H}" fill="#c98a4f" stroke="#fff" stroke-width="2"/>`;
    const maxD = Math.max(...d.heatDef);
    d.heatDef.forEach((v, i) => {
        const a = (v / maxD) * 0.85;
        svg += `<rect x="${ox + (i % d.gx) * cw}" y="${qy + Math.floor(i / d.gx) * ch}" width="${cw}" height="${ch}" fill="#1f4fd1" fill-opacity="${a.toFixed(3)}"/>`;
    });
    svg += `<line x1="${ox + W / 2}" y1="${qy}" x2="${ox + W / 2}" y2="${qy + H}" stroke="#fff" stroke-width="1.5"/>`;
    svg += `<circle cx="${ox + W / 2}" cy="${qy + H / 2}" r="${3 * S}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    for (const gxp of [0, W]) {
        svg += `<rect x="${ox + gxp - (gxp ? 6 * S : 0)}" y="${qy + 4 * S}" width="${6 * S}" height="${12 * S}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
    }
    svg += `<text x="${ox + W - 4}" y="${qy + H - 6}" text-anchor="end" fill="#fff" font-size="12">sem a bola</text>`;
});
svg += `<text x="${PAD}" y="${total.h - 12}" fill="#cfd3e6" font-size="13">Roxo: onde os 4 da linha ficam com a bola; azul: sem a bola. Passes certos: verde pra frente, cinza de lado, vermelho pra trás.</text>`;
svg += '</svg>';
writeFileSync(out, svg);
