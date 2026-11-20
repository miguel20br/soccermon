import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Bug de 18/11: "MÉDIA" saía "MEDIA". A Galmuri11 desenha numa grade de 12px (em de 1200 unidades) e o acento das
// maiúsculas (É, Ô) sobe até 1400, acima do ascent. No VS, a 9px, o acento virava meio pixel cinza; no cartaz do rival
// na escalação, o overflow do ellipsis com linha de 1.15 cortava o acento fora.
const regra = (file: string, selector: string) => {
    const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const corpo = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2];
    expect(corpo, `${selector} em ${file}`).toBeDefined();
    return corpo!;
};

describe('acento do "MÉDIA" na Galmuri11', () => {
    it('VS: o rótulo da média fica no tamanho da grade (12px), não encolhido', () => {
        const r = regra('src/ui/components/versus.css', '.vsp-avg small');
        expect(r).toMatch(/font-size:\s*12px;/);
        // o acento passa 2px da linha: sem margem ele encosta no pé do número
        expect(r).toMatch(/margin-top:\s*2px;/);
    });
    it('cartaz do rival: o recorte do ellipsis tem folga em cima pro acento (2/12 de em)', () => {
        const r = regra('src/ui/vestiario.css', '.vt-obj small');
        const pad = r.match(/padding-top:\s*([\d.]+)em/);
        expect(pad, 'padding-top em em').not.toBeNull();
        expect(Number(pad![1])).toBeGreaterThanOrEqual(2 / 12);
        // a folga não mexe no layout
        expect(r).toMatch(new RegExp(`margin-top:\\s*-${pad![1]}em`));
    });
});
