import { describe, expect, it } from 'vitest';
import { firstFit, labelText, type Rect } from './label-fit';

const r = (x0: number, x1: number): Rect => ({ x0, x1, y0: 0, y1: 10 });

describe('nomes na quadra em pé', () => {
    it('nome curto tem no máximo 5 letras e o capitão mantém o C·', () => {
        expect(labelText('Charizard', false, true)).toBe('Chari');
        expect(labelText('Charizard', true, true)).toBe('C·Chari');
        expect(labelText('Mew', false, true)).toBe('Mew');
        expect(labelText('Charizard', false, false)).toBe('Charizard');
    });

    it('tenta o inteiro, depois o curto, e só some se ainda se cruzar', () => {
        const placed = [r(50, 60)];
        expect(firstFit(placed, [r(0, 20), r(5, 15)])).toBe(0);
        expect(firstFit(placed, [r(30, 55), r(30, 45)])).toBe(1);
        expect(firstFit(placed, [r(30, 55), r(52, 58)])).toBe(-1);
    });
});
