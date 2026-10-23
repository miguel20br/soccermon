/**
 * Tira o fundo rosa pintado dos retratos PMD (SpriteCollab não tem versão transparente). Inunda a partir da borda de
 * cima e do alto dos lados, só por pixels rosados e claros, parando no contorno escuro do Pokémon. A semente é a cor
 * mais comum da linha de cima: Pokémon rosa (Chansey, Slowpoke) encostado na borda não vira fundo. O resto do degradê
 * (verde, amarelo) que não for rosa fica.
 */
export function cutPortraitBg(px: Uint8ClampedArray, w: number, h: number): number {
    const n = w * h;
    const bg = new Uint8Array(n);
    const luma = (i: number) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    const dist = (i: number, r: number, g: number, b: number) =>
        Math.abs(px[i * 4] - r) + Math.abs(px[i * 4 + 1] - g) + Math.abs(px[i * 4 + 2] - b);
    const pink = (i: number) => {
        const r = px[i * 4] / 255;
        const g = px[i * 4 + 1] / 255;
        const b = px[i * 4 + 2] / 255;
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx === mn) return false;
        const l = (mx + mn) / 2;
        const d = mx - mn;
        const s = d / (1 - Math.abs(2 * l - 1));
        let hue = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        hue *= 60;
        return (hue >= 285 || hue <= 20) && ((s > 0.2 && l > 0.55) || (s > 0.05 && l > 0.8));
    };
    const ok = (i: number) => px[i * 4 + 3] > 0 && luma(i) > 110 && pink(i);
    const top: number[] = [];
    for (let x = 0; x < w; x++) top.push(x);
    const seeds = [...top];
    for (let y = 0; y < Math.round(h * 0.6); y++) seeds.push(y * w, y * w + w - 1);
    const count = new Map<number, number>();
    for (const i of top) {
        const k = (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2];
        count.set(k, (count.get(k) ?? 0) + 1);
    }
    let mode = 0;
    let best = 0;
    for (const [k, c] of count) if (c > best) [mode, best] = [k, c];
    const [mr, mg, mb] = [mode >> 16, (mode >> 8) & 255, mode & 255];
    const stack: number[] = [];
    for (const i of seeds)
        if (!bg[i] && ok(i) && dist(i, mr, mg, mb) <= 24) {
            bg[i] = 1;
            stack.push(i);
        }
    let cut = 0;
    while (stack.length) {
        const i = stack.pop() as number;
        cut++;
        const x = i % w;
        const y = (i - x) / w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
            if (j < 0 || bg[j] || !ok(j) || dist(j, px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) > 90) continue;
            bg[j] = 1;
            stack.push(j);
        }
    }
    for (let i = 0; i < n; i++) if (bg[i]) px[i * 4 + 3] = 0;
    return cut;
}
