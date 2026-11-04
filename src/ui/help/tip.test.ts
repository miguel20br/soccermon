import { describe, expect, it } from 'vitest';
import { claimTipSeq, tipSeq } from './Tip';

describe('uma dica por sequência de telas', () => {
    it('a primeira dica fica com a sequência e cala as outras; outra partida é outra sequência', () => {
        const a = tipSeq({ seed: 's', results: [1] });
        expect(claimTipSeq(a, 'reward-pick')).toBe(true);
        expect(claimTipSeq(a, 'reward-pick')).toBe(true); // a mesma dica pode voltar (prêmio da casa na Rota)
        expect(claimTipSeq(a, 'result-dex')).toBe(false);
        expect(claimTipSeq(tipSeq({ seed: 's', results: [1, 2] }), 'result-dex')).toBe(true);
    });
});
