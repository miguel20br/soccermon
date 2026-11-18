import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/components/broadcast.css', 'utf8');
const panel = readFileSync('src/ui/components/HalftimePanel.tsx', 'utf8');

/** O bloco do celular deitado (quadra à esquerda, abas à direita). */
const landscape = (() => {
    const at = css.indexOf('@media (orientation: landscape) and (max-height: 520px) {');
    return css.slice(at, css.indexOf('\n}\n', at));
})();

/** Seletores com `order: 2` no deitado (as listas que vão pra baixo dos botões). */
const afterButtons = [...landscape.matchAll(/([^{}]+)\{[^{}]*order:\s*2;[^{}]*\}/g)].map((m) => m[1]);

describe('intervalo no celular deitado', () => {
    // a 667x375 a lista "O rival trocou" ficava em cima dos botões (ela vem dentro do wrapper da cascata, que a
    // regra não pegava) e o Começar o 2º tempo saía da tela, embaixo do painel
    it('as duas listas de trocas descem pra baixo do Começar o 2º tempo', () => {
        expect(panel).toMatch(/className="ht-subs-beat"/);
        expect(afterButtons.some((sel) => sel.includes('.ht-subs-beat'))).toBe(true);
        expect(afterButtons.some((sel) => /\.ht-subs\b(?!-)/.test(sel))).toBe(true);
    });
});
