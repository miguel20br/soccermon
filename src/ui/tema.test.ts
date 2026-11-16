import { describe, expect, it } from 'vitest';
import { NEON_DIR, NEON_FROM, NEON_TO, temaOf } from './tema';

const at = (iso: string) => Date.parse(iso);
const on = `neon-${NEON_DIR}`;

describe('Noite Neon', () => {
    it('liga na quinta 19/11 00:00 de Brasília e não antes', () => {
        expect(NEON_FROM).toBe(Date.UTC(2026, 10, 19, 3));
        expect(temaOf('', at('2026-11-18T23:59:59-03:00'))).toBe(null);
        expect(temaOf('', at('2026-11-19T00:00:00-03:00'))).toBe(on);
    });
    it('vale até domingo 22/11 23:59 de Brasília e some na segunda', () => {
        expect(NEON_TO).toBe(Date.UTC(2026, 10, 23, 3));
        expect(temaOf('', at('2026-11-22T23:59:59-03:00'))).toBe(on);
        expect(temaOf('', at('2026-11-23T00:00:00-03:00'))).toBe(null);
        // 23:30 de domingo em Brasília já é segunda em UTC: ainda vale
        expect(temaOf('', at('2026-11-23T02:30:00Z'))).toBe(on);
    });
    it('o atalho liga, escolhe a direção ou desliga', () => {
        const fora = at('2026-11-16T12:00:00-03:00');
        expect(temaOf('?tema=neon', fora)).toBe(on);
        expect(temaOf('?tema=neon-a', fora)).toBe('neon-a');
        expect(temaOf('?tema=neon-b', fora)).toBe('neon-b');
        expect(temaOf('?tema=off', at('2026-11-20T12:00:00-03:00'))).toBe(null);
        expect(temaOf('?tema=xyz', fora)).toBe(null);
    });
});
