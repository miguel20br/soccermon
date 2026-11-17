import { describe, expect, it } from 'vitest';
import { NEON_FROM, NEON_TO, temaOf, timeLeft } from './tema';

const at = (iso: string) => Date.parse(iso);

describe('Noite Neon', () => {
    it('liga na segunda 16/11 00:00 de Brasília e não antes', () => {
        expect(NEON_FROM).toBe(Date.UTC(2026, 10, 16, 3));
        expect(temaOf('', at('2026-11-15T23:59:59-03:00'))).toBe(null);
        expect(temaOf('', at('2026-11-16T00:00:00-03:00'))).toBe('neon');
    });
    it('vale até domingo 22/11 23:59 de Brasília e some na segunda', () => {
        expect(NEON_TO).toBe(Date.UTC(2026, 10, 23, 3));
        expect(temaOf('', at('2026-11-22T23:59:59-03:00'))).toBe('neon');
        expect(temaOf('', at('2026-11-23T00:00:00-03:00'))).toBe(null);
        // 23:30 de domingo em Brasília já é segunda em UTC: ainda vale
        expect(temaOf('', at('2026-11-23T02:30:00Z'))).toBe('neon');
    });
    it('o atalho liga ou desliga', () => {
        expect(temaOf('?tema=neon', at('2026-11-10T12:00:00-03:00'))).toBe('neon');
        expect(temaOf('?tema=off', at('2026-11-20T12:00:00-03:00'))).toBe(null);
        expect(temaOf('?tema=xyz', at('2026-11-10T12:00:00-03:00'))).toBe(null);
    });
});

describe('cronômetro da Noite Neon', () => {
    const end = NEON_TO;
    const until = (ms: number) => timeLeft(end - ms);
    it('dias e horas, depois horas e minutos, depois só minutos', () => {
        expect(timeLeft(NEON_FROM)).toBe('7d 0h');
        expect(until((2 * 24 + 14) * 3_600_000)).toBe('2d 14h');
        expect(until((5 * 60 + 32) * 60_000)).toBe('5h 32min');
        expect(until(24 * 3_600_000 - 60_000)).toBe('23h 59min');
        expect(until(32 * 60_000)).toBe('32min');
    });
    it('o último minuto ainda conta e no fim some', () => {
        expect(until(30_000)).toBe('1min');
        expect(until(1)).toBe('1min');
        expect(timeLeft(end)).toBe(null);
        expect(timeLeft(end + 60_000)).toBe(null);
    });
});
