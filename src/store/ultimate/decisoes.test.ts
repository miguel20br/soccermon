import { describe, expect, it } from 'vitest';
import { MATCH_FICHAS_DAY_MAX } from './rules';
import { cappedFichas } from './ultimate';

// decisões do Miguel depois da auditoria do Time Ultimate (27/11/2026)

describe('Fichas acima do teto do dia', () => {
    it('acima do teto a partida não paga Fichas (era 10)', () => {
        expect(cappedFichas(MATCH_FICHAS_DAY_MAX - 30, 80)).toBe(30);
        expect(cappedFichas(MATCH_FICHAS_DAY_MAX, 80)).toBe(0);
    });
});
