import { describe, expect, it } from 'vitest';
import { ultimateOn } from './flag';

describe('bandeira ?lab=ultimate', () => {
    it('em produção (sem __SMOKE__) nunca liga, nem com a bandeira', () => {
        expect(ultimateOn(false, '?lab=ultimate', '1')).toBe(false);
    });
    it('no dev e nas prévias: a URL liga e desliga; sem ela vale o que ficou na aba', () => {
        expect(ultimateOn(true, '', null)).toBe(false);
        expect(ultimateOn(true, '?lab=ultimate', null)).toBe(true);
        expect(ultimateOn(true, '', '1')).toBe(true);
        expect(ultimateOn(true, '?lab=ultimate-off', '1')).toBe(false);
    });
});
