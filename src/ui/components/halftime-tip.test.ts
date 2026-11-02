import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));

import { match } from '../../i18n/pt/match';
import { htTip, share } from './HalftimePanel';

/**
 * Revisão de textos, bloco 3 (25/10): o cansado já aparece no quadro e no "trocar?", a dica não repete. E o "Ainda tem
 * o 2º tempo inteiro" vale pra quem não está na frente, perdendo inclusive.
 */
describe('dica do intervalo', () => {
    it('chute do rival pesa primeiro, depois posse sem chute, depois o placar', () => {
        expect(htTip(1, 4, 50, false)).toBe('tipShots');
        expect(htTip(2, 3, 65, true)).toBe('tipPossession');
        expect(htTip(3, 2, 50, true)).toBe('tipAhead');
        expect(htTip(3, 2, 50, false)).toBe('tipEven');
    });

    it('a dica do cansado saiu do dicionário', () => {
        expect('tipTired' in match.ht).toBe(false);
    });
});

/** Placar de TV do intervalo: a barra de dois lados é a parte do seu time (0 x 0 fica no meio, sem dividir por zero). */
describe('barra do intervalo', () => {
    it('divide pelo total e para no meio sem chute nenhum', () => {
        expect(share(10, 4)).toBeCloseTo(10 / 14);
        expect(share(0, 3)).toBe(0);
        expect(share(0, 0)).toBe(0.5);
    });
});
