import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSeen, versionNum } from './AboutFooter';

describe('pontinho das Novidades', () => {
    afterEach(() => vi.unstubAllGlobals());
    const store = (get: () => string | null) => vi.stubGlobal('localStorage', { getItem: get });

    // revisão da 0.9.28: a chave é nova, então quem já jogava (sem ela) nunca via o pontinho
    it('quem nunca abriu vale 0 (o pontinho acende); a versão guardada vale ela', () => {
        store(() => null);
        expect(readSeen()).toBe(0);
        store(() => '9027');
        expect(readSeen()).toBe(9027);
    });

    it('sem onde guardar (aba anônima): null, sem pontinho que nunca apaga', () => {
        store(() => {
            throw new Error('bloqueado');
        });
        expect(readSeen()).toBeNull();
    });

    it('versão nova passa de qualquer versão de 4 partes vista antes (0.9.53.1 < 0.9.54 < 0.10.0)', () => {
        expect(versionNum('0.9.53.1')).toBeLessThan(versionNum('0.9.54'));
        expect(versionNum('0.9.54')).toBeLessThan(versionNum('0.10.0'));
        // o que ficou guardado no jeito antigo (0.9.53.1 = 9053001) também fica pra trás
        expect(9053001).toBeLessThan(versionNum('0.10.0'));
    });
});
