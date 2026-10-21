import { describe, expect, it } from 'vitest';
import { nameKey } from './names';

describe('nomes únicos', () => {
    it('ignora maiúsculas, acentos e espaços a mais', () => {
        expect(nameKey('Tesão FC')).toBe(nameKey('tesao fc'));
        expect(nameKey('  TESÃO   FC ')).toBe('tesao fc');
        expect(nameKey('Ash')).not.toBe(nameKey('Ashe'));
    });
});
