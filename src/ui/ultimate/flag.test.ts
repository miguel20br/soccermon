import { describe, expect, it } from 'vitest';
import { ULTIMATE_OPENS_AT, ultimateOn, utClockOf } from './flag';

const BEFORE = Date.UTC(2026, 10, 27, 2, 59); // 26/11 23:59 de Brasília
const AFTER = Date.UTC(2026, 10, 27, 3); // 27/11 00:00 de Brasília

describe('bandeira ?lab=ultimate', () => {
    it('a estreia é 27/11/2026 00:00 de Brasília', () => {
        expect(ULTIMATE_OPENS_AT).toBe(new Date('2026-11-27T00:00:00-03:00').getTime());
    });
    it('em produção (sem __SMOKE__), antes de 27/11, nunca liga, nem com a bandeira', () => {
        expect(ultimateOn(false, '?lab=ultimate', '1', BEFORE)).toBe(false);
        expect(ultimateOn(false, '', null, BEFORE)).toBe(false);
    });
    it('em produção, a partir de 27/11, liga pra todo mundo (a bandeira de desligar não vale lá)', () => {
        expect(ultimateOn(false, '', null, AFTER)).toBe(true);
        expect(ultimateOn(false, '?lab=ultimate-off', '0', AFTER)).toBe(true);
    });
    it('no dev e nas prévias, antes da data: a URL liga e desliga; sem ela vale o que ficou na aba', () => {
        expect(ultimateOn(true, '', null, BEFORE)).toBe(false);
        expect(ultimateOn(true, '?lab=ultimate', null, BEFORE)).toBe(true);
        expect(ultimateOn(true, '', '1', BEFORE)).toBe(true);
        expect(ultimateOn(true, '?lab=ultimate-off', '1', BEFORE)).toBe(false);
    });
    it('no dev e nas prévias, depois da data: liga sozinho; ?lab=ultimate-off ainda mostra o menu antigo', () => {
        expect(ultimateOn(true, '', '0', AFTER)).toBe(true);
        expect(ultimateOn(true, '?lab=ultimate-off', null, AFTER)).toBe(false);
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
