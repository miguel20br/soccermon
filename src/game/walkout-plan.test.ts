import { describe, expect, it } from 'vitest';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { ICONS } from '../engine/specials';
import {
    comemoracaoOf,
    dayCount,
    JOGADAS,
    jogadaOf,
    planBeats,
    SHATTER_MS,
    upgradeOf,
    walkoutPick,
    walkoutPlan,
    walkoutToday,
    walkTier,
} from './walkout-plan';

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

    it('dura ~5,5, ~10 e ~15,5 s; a revelação do especial tem ~5 s; Reduzir movimento ~1,2 s', () => {
        expect(walkoutPlan('raro').end).toBe(5500);
        expect(walkoutPlan('muitoraro').end).toBe(9800);
        const esp = walkoutPlan('especial');
        expect(esp.end).toBe(15600);
        expect(esp.end - esp.impact).toBeGreaterThanOrEqual(4500);
        expect(esp.end - esp.impact).toBeLessThanOrEqual(5500);
        // a nota bate antes da arte entrar
        expect(esp.card + 200 + esp.count).toBeLessThan(esp.art ?? 0);
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
        expect(walkoutPlan('muitoraro', { nth: 2 }).end).toBe(9800);
        expect(walkoutPlan('muitoraro', { nth: 3 })).toMatchObject({ kind: 'curto', end: 5000, tier: 'muitoraro' });
        expect(walkoutPlan('especial', { nth: 9 }).end).toBe(15600);
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
        // o dia vira à meia-noite de Brasília (03:00 UTC), não à do navegador
        expect(walkoutToday(new Date('2026-11-03T02:59:00Z'))).toBe(20261102);
        expect(walkoutToday(new Date('2026-11-03T03:01:00Z'))).toBe(20261103);
    });

    it('a carta do pacote: o nível mais alto, depois a nota; abaixo de 75 sem edição, nenhuma', () => {
        const mk = (id: number, lv: number) => createInstance(id, new Rng('pick', `${id}-${lv}`), lv);
        const weak = [mk(10, 5), mk(16, 5)];
        expect(walkoutPick(weak)).toBe(-1);
        const shiny = { ...mk(19, 5), shiny: true };
        expect(walkoutPick([weak[0], shiny, weak[1]])).toBe(1);
        const icon = { ...mk(150, 5), special: { kind: 'icone' as const, title: ICONS[150] } };
        expect(walkoutPick([shiny, weak[0], icon])).toBe(2);
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

    it('comemoração pela forma', () => {
        expect(comemoracaoOf(150)).toBe('pose'); // Mewtwo
        expect(comemoracaoOf(149)).toBe('giro'); // Dragonite
        expect(comemoracaoOf(6)).toBe('giro'); // Charizard
        expect(comemoracaoOf(59)).toBe('pulo'); // Arcanine
        expect(comemoracaoOf(132)).toBe('pulo'); // Ditto
    });
});
