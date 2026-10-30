import { describe, expect, it, vi } from 'vitest';

const music = vi.hoisted(() => ({ duck: vi.fn(), unduck: vi.fn() }));
vi.mock('../game/music', () => ({
    beatNow: () => null,
    nextBarIn: () => null,
    heardAt: () => 0,
    duckMusic: music.duck,
    unduckMusic: music.unduck,
}));

vi.mock('../game/audio', () => ({ loadMaxSfx: vi.fn(), playMax: vi.fn() }));
// o ZzFX cria um AudioContext ao carregar (o Node não tem)
vi.mock('zzfx', () => ({ ZZFX: {}, zzfx: () => {} }));

import { gradeDelta, holdRing } from './max-beat';

describe('nota do toque no anel do golpe máximo (QTE de um tiro)', () => {
    it('perfeito de 70 ms antes até 30 ms depois de encostar, bom até 150 ms, senão fora', () => {
        expect([gradeDelta(0), gradeDelta(-70), gradeDelta(-40), gradeDelta(30)]).toEqual([2, 2, 2, 2]);
        // depois de encostar o perfeito acaba cedo: o anel já fechou
        expect([gradeDelta(31), gradeDelta(-71), gradeDelta(150), gradeDelta(-150)]).toEqual([1, 1, 1, 1]);
        expect([gradeDelta(151), gradeDelta(-200), gradeDelta(600)]).toEqual([0, 0, 0]);
    });
});

describe('música no anel do golpe máximo', () => {
    it('só abaixa na hora certa: o anel do "chamar o capitão" (todo ataque) deixa a música', () => {
        const call = holdRing(false);
        call.release();
        expect(music.duck).not.toHaveBeenCalled();
        expect(music.unduck).not.toHaveBeenCalled();
        const hora = holdRing(true);
        expect(music.duck).toHaveBeenCalledTimes(1);
        hora.release();
        expect(music.unduck).toHaveBeenCalledWith(false);
    });
});
