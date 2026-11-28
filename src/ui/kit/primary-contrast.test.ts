import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/kit/kit.css', 'utf8');

// QA da 0.10.0: "Pronto pro jogo" e "Começar o 2º tempo" do Duelo (.btn.primary sem .big) eram branco chapado no
// amarelo, 1,6:1. O dourado sem .big ganha o contorno fino, e antes da regra do .big (que leva o de 2 px por cima).
describe('botão dourado sem .big', () => {
    it('tem contorno no texto', () => {
        expect(css).toMatch(/\.btn\.primary:not\(\.big\) \{\s*text-shadow: var\(--k-out-1\);/);
    });
    it('vem antes do contorno grosso do .big e da barra do polegar', () => {
        expect(css.indexOf('.btn.primary:not(.big) {')).toBeLessThan(css.indexOf('.btn.big,\n.cb,'));
    });
});
