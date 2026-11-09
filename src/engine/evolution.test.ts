import { describe, expect, it } from 'vitest';
import { type Attributes, computeAttributes } from './attributes';
import { FUTSAL_5 } from './config';
import { SPECIES, species } from './data';
import { monProblems, monRecipe } from './duel-validate';
import { EVO_THRESHOLD, evolvedRating, evolveInstance, evoNeeded, evoPreview, RIVAL_EVO_THRESHOLD } from './evolution';
import { createInstance, instanceBase, type PokemonInstance, slotRating, viewInstance } from './instance';
import { applyModifiers, attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';

describe('selo de evolução (selo B)', () => {
    it('fora da vaga mostra a nota da posição principal da forma nova; na vaga, a da vaga', () => {
        const magikarp = { ...createInstance(129, new Rng('selo-b')), uid: '129-selo' };
        const gyarados = viewInstance(evolveInstance(magikarp, 130));
        const fora = evoPreview(magikarp);
        // a carta evoluída mostra Gyarados Pivô; o selo não pode projetar na Ala do Magikarp ("vira 74")
        expect(fora).toEqual({ into: 130, rating: gyarados.overall, pos: gyarados.naturalPosition });
        expect(fora?.pos).not.toBe(viewInstance(magikarp).naturalPosition);
        expect(evoPreview(magikarp, 'ALA')).toEqual({
            into: 130,
            rating: slotRating(evolveInstance(magikarp, 130, 'ALA'), 'ALA'),
            pos: 'ALA',
        });
        expect(fora?.rating).toBeGreaterThan(evoPreview(magikarp, 'ALA')?.rating ?? 99);
    });
});

describe('evolução sem perda (regras B + C, Miguel 09/11/2026)', () => {
    const mon = (id: number, ability: string): PokemonInstance => ({
        ...createInstance(id, new Rng(`sem-perda-${id}`)),
        uid: `sem-perda-${id}`,
        ability,
        shiny: false,
        special: null,
    });
    const field = (p: PokemonInstance) => applyModifiers(instanceBase(p), attributeModifiers(p));
    const worse = (a: Attributes, b: Attributes) =>
        (Object.keys(a) as (keyof Attributes)[]).filter((k) => Math.round(b[k]) < Math.round(a[k]));
    // os 6 pares da auditoria (scripts/balance/evo-audit.ts) em que a carta ficava pior ao evoluir
    const AUDIT: [number, number][] = [
        [61, 62], // Poliwhirl → Poliwrath
        [13, 14], // Weedle → Kakuna
        [10, 11], // Caterpie → Metapod
        [129, 130], // Magikarp → Gyarados
        [60, 61], // Poliwag → Poliwhirl
        [11, 12], // Metapod → Butterfree
    ];

    it('os 6 pares da auditoria não ficam piores em nenhum atributo, na carta e em campo, com qualquer habilidade', () => {
        for (const [a, b] of AUDIT) {
            for (const ability of species(a).abilities) {
                const pre = mon(a, ability);
                const post = evolveInstance(pre, b);
                expect(worse(viewInstance(pre).attributes, viewInstance(post).attributes), `${a}→${b} carta`).toEqual(
                    [],
                );
                expect(worse(field(pre), field(post)), `${a}→${b} ${ability} campo`).toEqual([]);
            }
        }
    });

    it('nenhum par dos 151 fica pior na carta', () => {
        for (const sp of SPECIES)
            for (const e of sp.evolvesTo.filter((x) => x.id <= SPECIES.length)) {
                const pre = mon(sp.id, sp.abilities[0]);
                const post = evolveInstance(pre, e.id);
                expect(worse(viewInstance(pre).attributes, viewInstance(post).attributes), `${sp.id}→${e.id}`).toEqual(
                    [],
                );
            }
    });

    it('Magikarp que vira Gyarados mantém o Swift Swim e fica mais rápido; o Gyarados do pacote não muda', () => {
        const karp = mon(129, 'swiftswim');
        const gyara = evolveInstance(karp, 130);
        expect(gyara.ability).toBe('swiftswim');
        expect(gyara.evolvedFrom).toEqual([129]);
        expect(Math.round(field(gyara).pace)).toBeGreaterThan(Math.round(field(karp).pace));
        const pacote = mon(130, 'intimidate');
        expect(instanceBase(pacote)).toEqual(computeAttributes(species(130), pacote.level));
        // a forma de antes inteira conta: Charmander → Charmeleon → Charizard guarda as duas
        expect(evolveInstance(evolveInstance(mon(4, 'blaze'), 5), 6).evolvedFrom).toEqual([4, 5]);
    });

    it('habilidade que não mexe em atributo troca pela da forma nova (Eevee Adaptability → Vaporeon)', () => {
        expect(evolveInstance(mon(133, 'adaptability'), 134).ability).toBe('waterabsorb');
    });

    it('o Duelo aceita o Gyarados com Swift Swim só se ele evoluiu do Magikarp', () => {
        const gyara = monRecipe(evolveInstance(mon(129, 'swiftswim'), 130));
        expect(monProblems(gyara, 'x')).toEqual([]);
        expect(monProblems({ ...gyara, evolvedFrom: undefined }, 'x')).not.toEqual([]);
        expect(monProblems({ ...gyara, evolvedFrom: [1] }, 'x')).not.toEqual([]);
        expect(monProblems({ ...gyara, evolved: 0 }, 'x')).not.toEqual([]);
    });
});

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
