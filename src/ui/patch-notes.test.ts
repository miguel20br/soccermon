import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { PATCH_NOTES, PATCH_NOTES_EN } from './patch-notes';

describe('datas das Novidades', () => {
    for (const [nome, lista] of [
        ['pt', PATCH_NOTES],
        ['en', PATCH_NOTES_EN],
    ] as const) {
        it(`${nome}: toda versão tem data válida e nunca sobe descendo a lista`, () => {
            for (const n of lista) expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            for (const n of lista) expect(Number.isNaN(Date.parse(n.date))).toBe(false);
            for (let i = 1; i < lista.length; i++) expect(lista[i].date <= lista[i - 1].date).toBe(true);
        });
    }
});

describe('versão das Novidades', () => {
    it('a mais nova é a versão do jogo (o botão e o pontinho usam __APP_VERSION__ sem baixar as notas)', () => {
        const v = (pkg as { displayVersion?: string }).displayVersion ?? pkg.version;
        expect(PATCH_NOTES[0].version).toBe(v);
        expect(PATCH_NOTES_EN[0].version).toBe(v);
    });
});
