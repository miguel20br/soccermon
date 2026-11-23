import { describe, expect, it } from 'vitest';
import { bonemerang, COINS, coinAt, SCRIBBLE, scribbleDone } from './celeb-fx';
import { BONE, PAYDAY } from './walkout-plan';

describe('enfeites das comemorações da 0.9.54', () => {
    it('as moedas do Pay Day sobem em leque, caem no chão delas e param (as 8 até o fim da comemoração)', () => {
        const floor = 30;
        for (let n = 0; n < COINS; n++) {
            expect(coinAt(n, PAYDAY.toss - 1, 1, floor)).toBeNull();
            const ys = Array.from({ length: 30 }, (_, i) => coinAt(n, PAYDAY.toss + n * 45 + i * 20, 1, floor)?.y ?? 0);
            expect(Math.min(...ys), `${n}`).toBeLessThan(-10);
            const end = coinAt(n, 2400, 1, floor);
            expect(end?.rest, `${n}`).toBe(true);
            expect(end?.y).toBeCloseTo(floor);
        }
        // metade pra cada lado
        expect(new Set(Array.from({ length: COINS }, (_, n) => Math.sign(coinAt(n, 2400, 1, floor)?.x ?? 0)))).toEqual(
            new Set([-1, 1]),
        );
    });

    it('o Bonemerang sai pra direita, passa por trás e volta pra mão', () => {
        const at = (u: number) => bonemerang(BONE.toss + u * (BONE.back - BONE.toss), 1);
        expect(at(0)).toMatchObject({ x: expect.closeTo(0, 3), y: expect.closeTo(0, 3) });
        expect(at(0.25)?.x).toBeGreaterThan(40);
        expect(at(0.5)?.front).toBe(false);
        expect(bonemerang(BONE.back, 1)).toBeNull();
    });

    it('o rabisco é desenhado aos poucos, um rival depois do outro', () => {
        expect(SCRIBBLE.length).toBeGreaterThan(30);
        expect(scribbleDone(0, 0)).toBe(0);
        expect(scribbleDone(2400, 0)).toBe(1);
        expect(scribbleDone(2400, 1)).toBe(1);
    });
});
