import { describe, expect, it } from 'vitest';
import { fieldSheet } from './FieldSprite';

describe('fieldSheet', () => {
    it('shiny usa a folha shiny; espécie sem shiny no PMDCollab fica na normal', () => {
        expect(fieldSheet(4, true)).toBe('assets/field/shiny/4.png');
        expect(fieldSheet(4)).toBe('assets/field/4.png');
        expect(fieldSheet(16, true)).toBe('assets/field/16.png');
    });
});
