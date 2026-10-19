import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from './config';
import { EVO_THRESHOLD, evolvedRating, evolveInstance, evoNeeded, RIVAL_EVO_THRESHOLD } from './evolution';
import { createInstance, slotRating, viewInstance } from './instance';
import { attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';

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

describe('carta que evolui vale mais que a pronta', () => {
    it('Charmander que vira Charizard tem +2 por evolução em todos os atributos (carta e campo)', () => {
        const rng = new Rng('evo-bonus');
        const ready = viewInstance(createInstance(6, rng));
        const grown = evolveInstance(evolveInstance(createInstance(4, rng), 5), 6);
        expect(grown.evolved).toBe(2);
        const view = viewInstance(grown);
        for (const k of Object.keys(ready.attributes) as (keyof typeof ready.attributes)[])
            expect(view.attributes[k]).toBe(Math.min(99, ready.attributes[k] + 4));
        expect(view.overall).toBeGreaterThan(ready.overall);
        expect(attributeModifiers(grown).some((m) => m.source === 'evolucao' && m.add === 4)).toBe(true);
    });
});

describe('limiar de evolução', () => {
    it('no Duelo os dois lados (técnico humano) precisam do mesmo; o rival da IA continua com o dele', () => {
        expect(evoNeeded(0)).toBe(EVO_THRESHOLD);
        expect(evoNeeded(1, true)).toBe(EVO_THRESHOLD);
        expect(evoNeeded(1)).toBe(RIVAL_EVO_THRESHOLD);
    });
});

describe('barra cheia de partidas anteriores', () => {
    it('não evolui no apito inicial: a forma de antes aparece e evolui depois de fazer algo', () => {
        const rng = new Rng('barra-cheia');
        const mk = (ids: number[], evo: number) => {
            const ps = ids.map((id) => ({ ...createInstance(id, rng), evo }));
            return {
                name: 'Time',
                lineup: ps,
                bench: [],
                tactic: 'balanced' as const,
                color: 0x3a7bd5,
                formation: '1-2-1' as const,
                captainUid: ps[0].uid,
                manualSubs: true,
            };
        };
        const m = runMatch(FUTSAL_5, mk([74, 16, 4, 7, 1], EVO_THRESHOLD), mk([95, 111, 27, 50, 66], 0), 'barra-cheia');
        const evos = m.events.filter((e) => e.type === 'evolve' && e.team === 0);
        expect(evos.length).toBeGreaterThan(0);
        expect(evos.every((e) => e.tick > 0)).toBe(true);
    });
});
