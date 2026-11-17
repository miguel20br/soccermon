import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tsx = readFileSync('src/ui/ambientes/Estadio.tsx', 'utf8');
const css = readFileSync('src/ui/ambientes/neon.css', 'utf8');

// Bug 0.9.52.3: na 1ª visita o telão do logo ganha a frase, cresce e cobria a placa que ficava na arquibancada
// (posição fixa atrás da UI). A placa do Estádio tem que vir no fluxo da UI, logo depois do telão.
describe('placa da Semana Fora da Lei no Estádio', () => {
    it('vem no fluxo, depois do telão (es-top) e fora da arquibancada', () => {
        const top = tsx.indexOf('<div className="es-top">');
        const flow = tsx.indexOf('<NeonSign flow />');
        const actions = tsx.indexOf('<div className="es-actions">');
        expect(top).toBeGreaterThan(-1);
        expect(flow).toBeGreaterThan(top);
        expect(flow).toBeLessThan(actions);
        expect(tsx.slice(tsx.indexOf('<Stands'), tsx.indexOf('</Stands>'))).not.toContain('flow');
    });
    it('a placa de trás some no Estádio e a do fluxo some junto em tela baixa', () => {
        expect(css).toMatch(/\.es-scene \.nn-sign\s*\{\s*display:\s*none/);
        expect(css).toMatch(/\.nn-sign\.nn-flow\s*\{[^}]*position:\s*relative/);
        expect(css).toMatch(
            /max-height:\s*700px\)\s*\{\s*\.es-scene \.nn-sign,\s*\.nn-sign\.nn-flow\s*\{\s*display:\s*none/,
        );
    });
});
