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
    it('só os pixels do olho mudam, cada um com a cor da pele vizinha, e o ponto preto fica no meio do olho', () => {
        // 20x20 de pele (200,100,50) com sombra (180,90,45) na coluna 12 e um olho preto de 3x3 em (8..10, 5..7)
        const w = 20;
        const rgba = new Uint8ClampedArray(w * w * 4);
        for (let i = 0; i < w * w; i++) rgba.set([200, 100, 50, 255], i * 4);
        for (let y = 0; y < w; y++) rgba.set([180, 90, 45, 255], (y * w + 12) * 4);
        for (let y = 5; y <= 7; y++) for (let x = 8; x <= 10; x++) rgba.set([0, 0, 0, 255], (y * w + x) * 4);
        const [e] = dittoEyes(rgba, w, w, [[6, 3, 12, 9]]);
        // nenhum retângulo: só os 9 pixels do olho (a pele e a sombra da caixa ficam como estão)
        expect(e.pixels).toHaveLength(9);
        expect(e.pixels.every((p) => p.x >= 8 && p.x <= 10 && p.y >= 5 && p.y <= 7)).toBe(true);
        expect(new Set(e.pixels.map((p) => p.fill))).toEqual(new Set(['rgb(200,100,50)']));
        expect(e.dot).toMatchObject({ s: 2 });
        expect(e.dot.x).toBeGreaterThanOrEqual(8);
        expect(e.dot.x + e.dot.s - 1).toBeLessThanOrEqual(10);
        expect(e.dot.y).toBeGreaterThanOrEqual(5);
        expect(e.dot.y + e.dot.s - 1).toBeLessThanOrEqual(7);
    });

    it('o disfarce sai só dos Pokémon com os olhos medidos', () => {
        for (let k = 0; k < 40; k++) {
            const ditto = { ...createInstance(DITTO, new Rng('galeria-132')), uid: `d-${k}` };
            expect(DITTO_FACES[dittoDisguise(ditto).speciesId]).toBeDefined();
        }
    });
});
