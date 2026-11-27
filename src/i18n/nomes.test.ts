import { describe, expect, it } from 'vitest';
import { en } from './en';
import { pt } from './pt';

/** Nomes sem colisão (revisão dos menus, U1, 26/11): cada palavra com um sentido só entre o modo normal e o UT. */
describe('nomes dos menus sem colisão', () => {
    it('o Time Ultimate não fala mais em "Metas" (são os Objetivos, como no FC)', () => {
        expect(JSON.stringify(pt.ultimate)).not.toMatch(/\bMetas?\b/);
        expect(JSON.stringify(en.ultimate)).not.toMatch(/in Goals\b|Goals tab|weekly goals/);
        expect(pt.ultimate.tabs.goals).toBe('Objetivos');
        expect(en.ultimate.tabs.goals).toBe('Objectives');
    });

    it('"Clube" é do UT; o escudo e as cores da Sede são o Uniforme', () => {
        expect(pt.ultimate.tabs.club).toBe('Clube');
        expect(pt.profile.tabs.clube).toBe('Uniforme');
        expect(en.profile.tabs.clube).not.toBe(en.ultimate.tabs.club);
        // a aba da Sede embaixo também: em inglês ela era "Club", o mesmo nome da aba do UT
        expect(en.home.amb.tabs.sede).not.toBe(en.ultimate.tabs.club);
        expect(pt.home.amb.tabs.sede).not.toBe(pt.ultimate.tabs.club);
    });

    it('a figurinha é o Personagem, não "Seu treinador"', () => {
        expect(pt.profile.picker.trainer).toBe('Personagem');
        expect(JSON.stringify(pt)).not.toContain('Seu treinador');
        expect(en.profile.picker.trainer).toBe('Character');
    });
});
