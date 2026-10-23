import { describe, expect, it } from 'vitest';
import { needsScroll, tappableUnder } from './place';

/** Nó falso: `closest` acha ele mesmo ou um ancestral pelo "seletor" (aqui, o nome). */
interface N {
    name: string;
    parent?: N;
    closest(sel: string): N | null;
}
const node = (name: string, parent?: N): N => ({
    name,
    closest(sel: string) {
        const hit = sel.split(',').map((x) => x.trim());
        let n: N | undefined = this;
        while (n) {
            if (hit.includes(n.name) || hit.includes(`.${n.name}`)) return n;
            n = n.parent;
        }
        return null;
    },
    parent,
});

describe('tocar fora do balão do tutorial', () => {
    it('segue pro botão que está debaixo do pedaço transparente', () => {
        const botao = node('button');
        const icone = node('span', botao);
        const bloco = node('coach');
        expect(tappableUnder([bloco, icone, node('body')])).toBe(botao);
    });
    it('fundo sem botão só fecha o balão', () => {
        expect(tappableUnder([node('coach'), node('div')])).toBeNull();
    });
});

describe('needsScroll', () => {
    it('alvo que cabe na tela não rola (nem perto da borda)', () => {
        expect(needsScroll({ top: 20, bottom: 70 }, 720)).toBe(false);
        expect(needsScroll({ top: 640, bottom: 700 }, 720)).toBe(false);
    });
    it('alvo cortado rola', () => {
        expect(needsScroll({ top: -5, bottom: 40 }, 720)).toBe(true);
        expect(needsScroll({ top: 680, bottom: 760 }, 720)).toBe(true);
    });
});
