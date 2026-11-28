import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FICHAS, FICHAS_OVER_CAP, GYM_FICHAS_MULT, MATCH_FICHAS_DAY_MAX } from '../../store/ultimate/rules';
import { cappedFichas } from '../../store/ultimate/ultimate';

// QA da 0.10.0: depois do teto do dia o prêmio dizia só "+0 Fichas" (parecia bug). O painel mostra o aviso do teto quando
// a partida pagou 0, e isso só vale se toda partida abaixo do teto pagar alguma coisa.
describe('aviso do teto de Fichas no prêmio do Time Ultimate', () => {
    it('abaixo do teto toda partida paga; no teto paga 0', () => {
        for (const lv of Object.values(FICHAS))
            for (const f of Object.values(lv)) {
                expect(cappedFichas(0, f)).toBeGreaterThan(0);
                expect(cappedFichas(0, f * GYM_FICHAS_MULT)).toBeGreaterThan(0);
            }
        expect(FICHAS_OVER_CAP).toBe(0);
        expect(cappedFichas(MATCH_FICHAS_DAY_MAX, 50)).toBe(0);
    });
    it('o painel mostra o aviso quando a partida pagou 0', () => {
        const home = readFileSync('src/ui/ultimate/Home.tsx', 'utf8');
        expect(home).toContain('last.fichas === 0 && (');
        expect(home).toContain("t('ultimate.result.fichasCap')");
    });
});
