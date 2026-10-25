import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));

import { match } from '../../i18n/pt/match';
import { htTip } from './HalftimePanel';

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
