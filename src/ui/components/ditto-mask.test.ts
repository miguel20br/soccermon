import { describe, expect, it } from 'vitest';
import { createInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { metalOf } from '../rarity';
import { DITTO, DITTO_FACES, dittoDisguise, dittoEyes } from './DittoMask';

describe('Ditto disfarçado no pacote', () => {
    it('vira outra espécie do mesmo metal, com a mesma edição, e a mesma carta dá sempre o mesmo disfarce', () => {
        for (let k = 0; k < 20; k++) {
            const ditto = {
                ...createInstance(DITTO, new Rng(`d${k}`)),
                special: k % 4 ? null : { kind: 'destaque' as const },
            };
            const mask = dittoDisguise(ditto);
            expect(mask.speciesId).not.toBe(DITTO);
            expect(mask.ability).not.toBe('imposter');
            expect(mask.special).toEqual(ditto.special);
            expect(metalOf(viewInstance(mask).overall)).toBe(metalOf(viewInstance(ditto).overall));
            expect(dittoDisguise(ditto).speciesId).toBe(mask.speciesId);
        }
    });
});

describe('olhinhos do Ditto no disfarce', () => {
    it('o olho do Pokémon vira um remendo da cor da pele com um ponto no meio', () => {
        // 20x20 de pele (200,100,50) com um olho preto de 3x3 em (8..10, 5..7)
        const w = 20;
        const rgba = new Uint8ClampedArray(w * w * 4);
        for (let i = 0; i < w * w; i++) rgba.set([200, 100, 50, 255], i * 4);
        for (let y = 5; y <= 7; y++) for (let x = 8; x <= 10; x++) rgba.set([0, 0, 0, 255], (y * w + x) * 4);
        const [e] = dittoEyes(rgba, w, w, [[8, 5, 10, 7]]);
        expect(e.patch).toEqual({ x: 8, y: 5, w: 3, h: 3, fill: 'rgb(200,100,50)' });
        expect(e.dot.x).toBeGreaterThanOrEqual(8);
        expect(e.dot.x + e.dot.s - 1).toBeLessThanOrEqual(10);
        expect(e.dot.y).toBeGreaterThanOrEqual(5);
        expect(e.dot.y + e.dot.s - 1).toBeLessThanOrEqual(7);
    });

    it('o disfarce sai dos Pokémon com os olhos medidos e a galeria mostra disfarces diferentes', () => {
        const ditto = createInstance(DITTO, new Rng('galeria-132'));
        const ids = [0, 1, 2, 3, 4, 5].map((k) => dittoDisguise({ ...ditto, uid: `galeria-ditto-${k}` }).speciesId);
        for (const id of ids) expect(DITTO_FACES[id]).toBeDefined();
        expect(new Set(ids).size).toBeGreaterThanOrEqual(4);
    });
});
