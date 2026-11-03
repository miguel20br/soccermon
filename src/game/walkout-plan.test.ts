import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { dayCount, JOGADAS, jogadaOf, planBeats, SHATTER_MS, upgradeOf, walkoutPlan, walkTier } from './walkout-plan';

describe('plano do walkout', () => {
    it('nível pela edição e pela nota (ut-walkout.md, decidido em 02/11)', () => {
        expect(walkTier('icone', 60)).toBe('especial');
        expect(walkTier('destaque', 70)).toBe('especial');
        expect(walkTier('shiny', 60)).toBe('muitoraro');
        expect(walkTier('evento', 60)).toBe('muitoraro');
        expect(walkTier(null, 85)).toBe('muitoraro');
        expect(walkTier(null, 84)).toBe('raro');
        expect(walkTier(null, 75)).toBe('raro');
        expect(walkTier(null, 74)).toBeNull();
    });

    it('dura ~5, ~8,5 e ~14 s; a revelação do especial tem ~3,5–4 s; Reduzir movimento ~1,2 s', () => {
        expect(walkoutPlan('raro').end).toBe(5000);
        expect(walkoutPlan('muitoraro').end).toBe(8500);
        const esp = walkoutPlan('especial');
        expect(esp.end).toBe(14000);
        expect(esp.end - esp.impact).toBeGreaterThanOrEqual(3500);
        expect(esp.end - esp.impact).toBeLessThanOrEqual(4000);
        for (const tier of ['raro', 'muitoraro', 'especial'] as const)
            expect(walkoutPlan(tier, { reduce: true })).toMatchObject({ kind: 'calmo', end: 1200, spots: 0 });
    });

    it('a ordem das batidas faz sentido (telões, silhueta, jogada, vidro, carta)', () => {
        for (const tier of ['raro', 'muitoraro', 'especial'] as const)
            for (const upgrade of [false, true]) {
                const p = walkoutPlan(tier, { upgrade });
                expect(p.enter + p.body).toBeLessThan(p.impact);
                // a carta só aparece com o vidro já quebrado
                expect(p.impact + SHATTER_MS).toBeLessThanOrEqual(p.card);
                expect(p.card + p.count).toBeLessThanOrEqual(p.end);
                expect((p.type ?? 0) <= (p.pos ?? 0)).toBe(true);
                if (p.gate !== undefined) expect(p.gate).toBeLessThan(p.enter);
                const beats = planBeats(p);
                expect(beats).toEqual([...beats].sort((a, b) => a - b));
            }
    });

    it('encolhe do 2º raro e do 3º muito raro do dia; especial nunca', () => {
        expect(walkoutPlan('raro', { nth: 2 })).toMatchObject({ kind: 'curto', end: 1800 });
        expect(walkoutPlan('muitoraro', { nth: 2 }).end).toBe(8500);
        expect(walkoutPlan('muitoraro', { nth: 3 })).toMatchObject({ end: 5000, tier: 'muitoraro' });
        expect(walkoutPlan('especial', { nth: 9 }).end).toBe(14000);
    });

    it('upgrade só no especial: prévia prateada, a placa vem no flash; metade dos especiais', () => {
        const up = walkoutPlan('especial', { upgrade: true });
        expect(up.upgrade).toBe(true);
        expect(up.plate).toBe(up.enter);
        expect(walkoutPlan('muitoraro', { upgrade: true }).upgrade).toBe(false);
        const n = Array.from({ length: 400 }, (_, i) => createInstance(150, new Rng('up', String(i)))).filter(
            upgradeOf,
        ).length;
        expect(n).toBeGreaterThan(150);
        expect(n).toBeLessThan(250);
    });

    it('conta por dia e zera no dia seguinte', () => {
        const a = dayCount(null, 20261102);
        expect(a.nth).toBe(1);
        const b = dayCount(a.store, 20261102);
        expect(b.nth).toBe(2);
        expect(dayCount(b.store, 20261103).nth).toBe(1);
    });

    it('jogada com bola pela forma e pelo tipo, sempre a mesma por espécie, e todas aparecem', () => {
        expect(jogadaOf(150)).toBe('levita'); // Mewtwo
        expect(jogadaOf(94)).toBe('levita'); // Gengar
        expect(jogadaOf(149)).toBe('voo'); // Dragonite
        expect(jogadaOf(18)).toBe('voo'); // Pidgeot
        expect(jogadaOf(6)).toBe('chama'); // Charizard
        expect(jogadaOf(59)).toBe('drible'); // Arcanine
        expect(jogadaOf(25)).toBe('drible'); // Pikachu
        expect(jogadaOf(68)).toBe('bicicleta'); // Machamp
        expect(jogadaOf(76)).toBe('tremor'); // Golem
        expect(jogadaOf(132)).toBe('embaixadinha'); // Ditto
        expect(jogadaOf(143)).toBe('canhao'); // Snorlax
        const seen = new Set(Array.from({ length: 151 }, (_, i) => jogadaOf(i + 1)));
        expect([...seen].sort()).toEqual([...JOGADAS].sort());
    });
});
