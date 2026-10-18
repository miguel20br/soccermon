import { describe, expect, it } from 'vitest';
import { qrMatrix } from './qr';

/** FNV-1a da matriz (0/1 linha a linha). */
const hash = (m: boolean[][]) => {
    let h = 0x811c9dc5;
    for (const ch of m.map((r) => r.map((on) => (on ? '1' : '0')).join('')).join('|'))
        h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
    return h.toString(16);
};

describe('QR do link da sala', () => {
    it('gera o mesmo QR que o zbarimg leu (https://soccermon.com/?duelo=K7M2QX, versão 3)', () => {
        const m = qrMatrix('https://soccermon.com/?duelo=K7M2QX');
        expect(m).toHaveLength(29);
        // conferido com `zbarimg` em 17/10/2026: muda o código do QR, confere de novo e atualiza
        expect(hash(m!)).toBe('62c607b7');
    });
    it('link grande demais (mais de 106 bytes) não vira QR', () => {
        expect(qrMatrix('x'.repeat(106))).toHaveLength(41);
        expect(qrMatrix('x'.repeat(107))).toBeNull();
    });
});
