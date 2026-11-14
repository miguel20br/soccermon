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

import { gradeDelta, holdRing, MAX_BEAT } from './max-beat';

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

describe('a música não fica no fundo depois do anel', () => {
    it('sem toque, volta quando o anel fecha e passa a janela do bom (não espera a hora certa acabar)', () => {
        vi.useFakeTimers();
        music.unduck.mockClear();
        const r = holdRing(true);
        vi.advanceTimersByTime(r.at - r.start + MAX_BEAT.goodMs);
        expect(music.unduck).not.toHaveBeenCalled();
        vi.advanceTimersByTime(150);
        expect(music.unduck).toHaveBeenCalledWith(false);
        // o botão some depois: não solta de novo
        r.release();
        expect(music.unduck).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});
