import { describe, expect, it } from 'vitest';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import {
    dayCount,
    entryOf,
    habitatOf,
    nextBeat,
    placeName,
    planBeats,
    upgradeOf,
    walkoutPlan,
    walkoutTier,
} from './walkout-plan';

const mk = (id: number, level?: number) => createInstance(id, new Rng('wk', String(id)), level);

describe('walkout em 3 níveis', () => {
    it('escolhe o nível pela edição e pela nota', () => {
        expect(walkoutTier({ ...mk(150), special: { kind: 'icone' } })).toBe('especial');
        expect(walkoutTier({ ...mk(25), special: { kind: 'destaque', level: 1 } })).toBe('especial');
        expect(walkoutTier({ ...mk(25), special: { kind: 'evento', type: 'Electric' } })).toBe('muitoRaro');
        expect(walkoutTier({ ...mk(25), shiny: true })).toBe('muitoRaro');
        // shiny junto de Ícone vale o maior
        expect(walkoutTier({ ...mk(25), shiny: true, special: { kind: 'icone' } })).toBe('especial');
        expect(walkoutTier(mk(150))).toBe('muitoRaro'); // Mewtwo 93
        expect(walkoutTier(mk(6))).toBe('raro'); // Charizard 84
        expect(walkoutTier(mk(129))).toBeNull(); // Magikarp
    });

    it('dura ~4, ~7 e ~11 s, com Pular depois de 1 s e Reduzir movimento em ~1,2 s', () => {
        expect(walkoutPlan('raro').end).toBe(4000);
        expect(walkoutPlan('muitoRaro').end).toBe(7000);
        expect(walkoutPlan('especial').end).toBe(10500);
        for (const tier of ['raro', 'muitoRaro', 'especial'] as const) {
            expect(walkoutPlan(tier, { reduce: true })).toMatchObject({ kind: 'calmo', end: 1200, spots: 0 });
        }
    });

    it('encolhe do 2º raro e do 3º muito raro do dia; especial nunca', () => {
        expect(walkoutPlan('raro', { nth: 2 }).end).toBe(1500);
        expect(walkoutPlan('muitoRaro', { nth: 2 }).end).toBe(7000);
        expect(walkoutPlan('muitoRaro', { nth: 3 })).toMatchObject({ end: 4000, tier: 'muitoRaro' });
        expect(walkoutPlan('especial', { nth: 9 }).end).toBe(10500);
    });

    it('upgrade só no especial: sem selo no começo, racha na silhueta', () => {
        const up = walkoutPlan('especial', { upgrade: true });
        expect(up.upgrade).toBe(true);
        expect(up.seal).toBeUndefined();
        expect(up.crack).toBeGreaterThan(up.gate ?? 0);
        expect(up.crack).toBeLessThan(up.flash);
        expect(walkoutPlan('muitoRaro', { upgrade: true }).upgrade).toBe(false);
        // metade dos especiais, mais ou menos
        const n = Array.from({ length: 400 }, (_, i) => createInstance(150, new Rng('up', String(i)))).filter(
            upgradeOf,
        ).length;
        expect(n).toBeGreaterThan(150);
        expect(n).toBeLessThan(250);
    });

    it('o toque adianta pra próxima batida, em ordem', () => {
        const p = walkoutPlan('especial');
        const beats = planBeats(p);
        expect(beats).toEqual([...beats].sort((a, b) => a - b));
        expect(nextBeat(p, 0)).toBe(600);
        expect(nextBeat(p, 600)).toBe(1500);
        expect(nextBeat(p, p.end)).toBe(p.end);
    });

    it('conta por dia e zera no dia seguinte', () => {
        const a = dayCount(null, 20261102);
        expect(a.nth).toBe(1);
        const b = dayCount(a.store, 20261102);
        expect(b.nth).toBe(2);
        expect(dayCount(b.store, 20261103).nth).toBe(1);
    });

    it('entra do jeito da forma', () => {
        expect(entryOf(6)).toBe('voa'); // Charizard
        expect(entryOf(149)).toBe('voa'); // Dragonite
        expect(entryOf(94)).toBe('aparece'); // Gengar
        expect(entryOf(100)).toBe('quica'); // Voltorb
        expect(entryOf(135)).toBe('corre'); // Jolteon
        expect(entryOf(150)).toBe('anda'); // Mewtwo
    });

    it('placa de rota: o lugar, ou o da pré-evolução', () => {
        expect(habitatOf(150)).toEqual({ area: 'Cerulean Cave (B1F)' });
        expect(placeName('Cerulean Cave (B1F)', 'pt')).toBe('Caverna Cerulean');
        expect(placeName('Road 7', 'pt')).toBe('Rota 7');
        expect(placeName('Road 7', 'en')).toBe('Route 7');
        expect(habitatOf(6)).toEqual({ kind: 'presente' }); // Charmander do Prof. Carvalho
        expect('area' in habitatOf(59)).toBe(true); // Growlithe
    });
});
