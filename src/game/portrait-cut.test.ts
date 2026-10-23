import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { cutPortraitBg } from './portrait-cut';

async function cut(file: string) {
    const { data, info } = await sharp(`public/assets/portraits/${file}`)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const px = new Uint8ClampedArray(data);
    cutPortraitBg(px, info.width, info.height);
    const alpha = (x: number, y: number) => px[(y * info.width + x) * 4 + 3];
    return { alpha };
}

describe('retrato PMD sem o fundo rosa (faixa do N3)', () => {
    it('Dragonite: o rosa do canto some, o rosto fica', async () => {
        const { alpha } = await cut('149-determined.png');
        expect(alpha(0, 0)).toBe(0);
        expect(alpha(30, 5)).toBe(0); // a listra mais escura do fundo também
        expect(alpha(20, 20)).toBe(255);
    });

    it('Pokémon rosa encostado na borda (Chansey, Slowpoke) não vira fundo', async () => {
        for (const f of ['113-determined.png', '79-determined.png']) {
            const { alpha } = await cut(f);
            expect(alpha(20, 22), f).toBe(255);
            expect(alpha(20, 30), f).toBe(255);
        }
    });
});
