import { describe, expect, it } from 'vitest';
import { rowScale } from './sprite-scale';

describe('rowScale (fim de copa: uma escala pra fileira toda)', () => {
    it('a maior escala em que todos cabem, igual pra todos', () => {
        // Kakuna deitado (20 px) cabe em 2x; Gyarados deitado (50 px) só em 1x: a fileira fica 1x
        expect(rowScale([20, 50], 72, 2)).toBe(1);
        expect(rowScale([20, 30], 72, 2)).toBe(2);
    });
    it('nunca abaixo de 1x nem acima do teto; espécie sem animação não conta', () => {
        expect(rowScale([120], 72, 2)).toBe(1);
        expect(rowScale([10, null], 72, 3)).toBe(3);
        expect(rowScale([], 72, 2)).toBe(2);
    });
});
