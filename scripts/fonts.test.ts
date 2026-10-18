import { describe, expect, it } from 'vitest';
import coverage from './fonts-coverage.json';
import { usedChars } from './lib/font-chars';

// As Galmuri de public/fonts são um subset (scripts/build-fonts.ts). Texto novo com símbolo que não estava no subset
// apareceria na fonte do sistema: este teste pega antes. Conserto: npm run fonts (e commitar as fontes e o JSON).
describe('subset das fontes Galmuri', () => {
    const chars = usedChars();
    for (const [font, { covered, missing }] of Object.entries(coverage)) {
        it(`${font} tem todo caractere usado nos textos`, () => {
            const sem = chars.filter((c) => !covered.includes(c) && !missing.includes(c));
            expect(sem, `rode npm run fonts (faltam: ${sem.join(' ')})`).toEqual([]);
        });
        it(`${font} tem os acentos do PT e a pontuação dos textos`, () => {
            // nome digitado pelo jogador cai nos blocos latinos inteiros (FONT_RANGES), que entram sempre
            const sem = [...'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÇñ×°ºª·…–—“”‘’'].filter((c) => !covered.includes(c));
            expect(sem).toEqual([]);
        });
    }
});
