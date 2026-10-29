import { describe, expect, it } from 'vitest';
import { gradeDelta } from './max-beat';

describe('nota do toque no anel do golpe máximo (QTE de um tiro)', () => {
    it('perfeito de 70 ms antes até 30 ms depois de encostar, bom até 150 ms, senão fora', () => {
        expect([gradeDelta(0), gradeDelta(-70), gradeDelta(-40), gradeDelta(30)]).toEqual([2, 2, 2, 2]);
        // depois de encostar o perfeito acaba cedo: o anel já fechou
        expect([gradeDelta(31), gradeDelta(-71), gradeDelta(150), gradeDelta(-150)]).toEqual([1, 1, 1, 1]);
        expect([gradeDelta(151), gradeDelta(-200), gradeDelta(600)]).toEqual([0, 0, 0]);
    });
});
