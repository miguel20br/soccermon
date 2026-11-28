import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/components/broadcast.css', 'utf8');
const rule = css.slice(
    css.indexOf('.bt-line.goal .bt-min {'),
    css.indexOf('}', css.indexOf('.bt-line.goal .bt-min {')),
);

// QA da 0.10.0: o minuto do gol na caixa de narração é branco na cor do time que marcou; com time de cor clara (Pewter,
// gol contra a favor dele) o "40'" sumia. Contorno escuro no texto e borda na plaquinha valem pra qualquer cor.
describe('minuto do gol na narração', () => {
    it('tem contorno escuro no texto e na plaquinha', () => {
        expect(rule).toContain('text-shadow: var(--k-out-1)');
        expect(rule).toContain('--ol: #283044');
        expect(rule).toContain('box-shadow: inset 0 0 0 1px #283044');
    });
});
