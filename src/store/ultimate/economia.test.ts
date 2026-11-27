import { describe, expect, it } from 'vitest';
import { FICHAS_OVER_CAP, MATCH_FICHAS_DAY_MAX, PICK_PRICE, RESET_PACKS, UT_EPOCH, UT_NO_SPECIES } from './rules';
import { cappedFichas, cardPrice, mergeUltimate, metalPools, newUltimate, pickable, ultimateOf } from './ultimate';

// economia do 1º dia (27/11/2026): Fichas sem teto com o Pular e o Mewtwo por 1.600 em 20 minutos
describe('economia do Time Ultimate (27/11/2026)', () => {
    it('sem lendários em pacote, Pick, prêmio ou compra; Ditto fora da compra', () => {
        const all = Object.values(metalPools()).flat();
        for (const id of UT_NO_SPECIES) expect(all).not.toContain(id);
        expect(all).toContain(132);
        expect(pickable(newUltimate('s'), 'bronze').concat(pickable(newUltimate('s'), 'prata'))).not.toContain(132);
    });

    it('a carta ouro custa mais quanto maior a nota; bronze e prata pelo metal', () => {
        const gold = metalPools().ouro.map((id) => cardPrice(id));
        expect(Math.min(...gold)).toBe(PICK_PRICE.ouro);
        expect(Math.max(...gold)).toBeGreaterThan(PICK_PRICE.ouro);
        expect(new Set(metalPools().bronze.map(cardPrice))).toEqual(new Set([PICK_PRICE.bronze]));
        expect(new Set(metalPools().prata.map(cardPrice))).toEqual(new Set([PICK_PRICE.prata]));
    });

    it('Fichas de partida param no teto do dia; depois, FICHAS_OVER_CAP por partida', () => {
        let paid = 0;
        for (let i = 0; i < 30; i++) paid += cappedFichas(paid, 80);
        // 30 vitórias no Difícil pagavam 2.400
        expect(paid).toBe(MATCH_FICHAS_DAY_MAX + (30 - MATCH_FICHAS_DAY_MAX / 80) * FICHAS_OVER_CAP);
        expect(cappedFichas(380, 80)).toBe(20);
        expect(cappedFichas(0, 10)).toBe(10);
    });

    it('quem jogou antes do recomeço volta pro começo uma vez, com os pacotes e o aviso', () => {
        const old = { ...newUltimate('s'), epoch: undefined, played: 149, fichas: 9000, extraPacks: 0 };
        const r = ultimateOf(old);
        expect(r).toMatchObject({ played: 0, fichas: 0, cards: [], extraPacks: RESET_PACKS, resetNotice: true });
        expect(r.epoch).toBe(UT_EPOCH);
        // carregar de novo (ou juntar com a nuvem já recomeçada) não recomeça outra vez
        const again = ultimateOf({ ...r, played: 3, resetNotice: false });
        expect(again).toMatchObject({ played: 3, resetNotice: false });
        expect(mergeUltimate(again, old).played).toBe(3);
        // quem nunca jogou não recomeça nem vê aviso
        expect(ultimateOf({ ...newUltimate('s'), epoch: undefined }).resetNotice).toBe(false);
    });
});
