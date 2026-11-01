import { describe, expect, it } from 'vitest';
import { ultimateOn, utClockOf } from './flag';

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

describe('relógio da prévia ?utnow=', () => {
    it('só no dev e nas prévias; dia vira meio-dia de Brasília; lixo não muda nada', () => {
        expect(utClockOf(false, '?utnow=2026-12-20')).toBeNull();
        expect(utClockOf(true, '?utnow=2026-12-20')).toBe(Date.UTC(2026, 11, 20, 15));
        expect(utClockOf(true, '?utnow=2027-06-01T03:00:00Z')).toBe(Date.UTC(2027, 5, 1, 3));
        expect(utClockOf(true, '?utnow=amanha')).toBeNull();
        expect(utClockOf(true, '')).toBeNull();
    });
});
