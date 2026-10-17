import { describe, expect, it } from 'vitest';
import { evolvedRating, evolveInstance } from './evolution';
import { createInstance, slotRating, viewInstance } from './instance';
import { attributeModifiers } from './modifiers';
import { Rng } from './rng';

describe('evolução herda a vaga', () => {
    it('Nidorina que evolui jogando de Ala: a Nidoqueen fica com Ala nas posições (carta e campo)', () => {
        const nidorina = createInstance(30, new Rng('heranca'));
        const sem = evolveInstance(nidorina, 31);
        const com = evolveInstance(nidorina, 31, 'ALA');
        expect(viewInstance(sem).positions).not.toContain('ALA');
        expect(com.inherited).toEqual(['ALA']);
        expect(viewInstance(com).positions).toContain('ALA');
        expect(viewInstance(com).naturalPosition).toBe(viewInstance(sem).naturalPosition);
        // fora de posição seria Goleiro na linha (0,75); herdada vale como secundária (até 0,98)
        expect(slotRating(com, 'ALA')).toBeGreaterThan(slotRating(sem, 'ALA') + 10);
        const fator = (i: typeof com) =>
            attributeModifiers(i, { role: 'ALA' }).find((m) => m.source === 'posicao')?.factor ?? 1;
        expect(fator(sem)).toBe(0.75);
        expect(fator(com)).toBeGreaterThan(0.95);
        // o selo de evolução da carta já mostra a nota herdando a vaga
        expect(evolvedRating(nidorina, 'ALA')?.rating).toBe(slotRating(com, 'ALA'));
        // vaga que a forma nova já tem não duplica
        expect(evolveInstance(nidorina, 31, 'FIXO').inherited).toEqual(['FIXO']);
        expect(viewInstance(evolveInstance(nidorina, 31, 'FIXO')).positions.filter((p) => p === 'FIXO')).toHaveLength(
            1,
        );
    });
});
