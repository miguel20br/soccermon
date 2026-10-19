import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompareRows } from './StatsCharts';

describe('barra de comparação (Times, no fim da partida)', () => {
    it('"Escanteios 0 x 0" fica só na trilha neutra: nenhuma barra de 2 px (o risco vermelho da 0.8.5)', () => {
        const html = renderToStaticMarkup(
            createElement(CompareRows, {
                rows: [
                    { label: 'Escanteios', home: 0, away: 0 },
                    { label: 'Chutes', home: 3, away: 0 },
                ],
            }),
        );
        const bars = [...html.matchAll(/<div class="st-split"[^>]*>(.*?)<\/div>/g)].map((m) => m[1]);
        // vazia: o CSS (.st-split:empty) desenha a trilha neutra
        expect(bars[0]).toBe('');
        // 3 x 0: só a barra de quem tem (o lado com 0 não desenha o risco mínimo)
        expect(bars[1].match(/<i /g)).toHaveLength(1);
    });
});
