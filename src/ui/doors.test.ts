import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { metasLink } from './doors';

describe('Metas na Sede (menos-e-mais.md, B2)', () => {
    it('links antigos de missões e medalhas vão pras Metas; o resto continua na porta dele', () => {
        expect(metasLink('?aba=missoes')).toBe(true);
        expect(metasLink('?aba=medalhas')).toBe(true);
        expect(metasLink('?perfil=missoes')).toBe(true);
        expect(metasLink('?perfil=medalhas')).toBe(true);
        expect(metasLink('?aba=metas')).toBe(true);
        expect(metasLink('?aba=clube')).toBe(false);
        expect(metasLink('?aba=numeros')).toBe(false);
        expect(metasLink('')).toBe(false);
    });
});
