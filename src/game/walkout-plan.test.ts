import { describe, expect, it } from 'vitest';
import { species } from '../engine/data';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { ICONS, themeTypeOf } from '../engine/specials';
import {
    comemoracaoOf,
    dayCount,
    FX_TYPES,
    GOAL_CELEB_MS,
    goalCelebPose,
    JOGADAS,
    jogadaOf,
    planBeats,
    revealOf,
    SHATTER_MS,
    upgradeOf,
    walkoutLast,
    walkoutPick,
    walkoutPlan,
    walkoutToday,
    walkTier,
} from './walkout-plan';

describe('plano do walkout', () => {
    it('vidro só nas edições; no ouro, o efeito do tipo (Normal com 2º tipo usa o 2º)', () => {
        for (const ed of ['icone', 'destaque', 'shiny', 'evento']) expect(revealOf(ed, ['Fire'])).toBe('vidro');
        const of = (id: number) => revealOf(null, species(id).types);
        expect(of(25)).toBe('Electric');
        expect(of(76)).toBe('Rock');
        expect(of(18)).toBe('Flying');
        expect(of(59)).toBe('Fire');
        expect(of(143)).toBe('Normal');
        expect(revealOf(null, ['Steel'])).toBe('Normal');
        // o telão (themeTypeOf), o símbolo da carta e o efeito nunca divergem
        for (let id = 1; id <= 151; id++) expect(of(id)).toBe(themeTypeOf({ speciesId: id }));
        expect(themeTypeOf({ speciesId: 18 })).toBe('Flying');
        // todo tipo da Gen 1 + Fada tem efeito, e todo efeito tem um Pokémon de Kanto que o mostra
        const seen = new Set(Array.from({ length: 151 }, (_, i) => of(i + 1)));
        expect([...seen].sort()).toEqual([...FX_TYPES].sort());
    });

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
        expect(walkoutPlan('raro').end).toBe(6000);
        expect(walkoutPlan('muitoraro').end).toBe(10650);
        const esp = walkoutPlan('especial');
        expect(esp.end).toBe(16550);
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
        expect(walkoutPlan('raro', { nth: 2 })).toMatchObject({ kind: 'curto', end: 3000 });
        expect(walkoutPlan('muitoraro', { nth: 2 }).end).toBe(10650);
        expect(walkoutPlan('muitoraro', { nth: 3 })).toMatchObject({ kind: 'curto', end: 6000, tier: 'muitoraro' });
        expect(walkoutPlan('especial', { nth: 9 }).end).toBe(16550);
        // o curto também mostra o tipo e a posição nos telões, antes do chute
        const c = walkoutPlan('raro', { nth: 2 });
        expect(c.type).toBeLessThan(c.pos ?? 0);
        expect(c.pos).toBeLessThan(c.enter);
        // o curto respira: a nota bate e ainda dá pra ler nota e nome antes do Continuar
        for (const p of [walkoutPlan('raro', { nth: 2 }), walkoutPlan('muitoraro', { nth: 3 })]) {
            expect(p.impact + SHATTER_MS).toBeLessThanOrEqual(p.card);
            expect(p.end - (p.card + 200 + p.count)).toBeGreaterThanOrEqual(600);
        }
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

    it('Abrir todos: o pacote com a carta do walkout vai por último, os outros na ordem', () => {
        const mk = (id: number, lv: number) => createInstance(id, new Rng('pick', `${id}-${lv}`), lv);
        const a = { cards: [mk(10, 5)] };
        const shiny = { ...mk(19, 5), shiny: true };
        const b = { cards: [mk(16, 5), shiny] };
        const c = { cards: [mk(13, 5)] };
        expect(walkoutLast([a, b, c])).toEqual({ packs: [a, c, b], best: shiny });
        expect(walkoutLast([a, c])).toEqual({ packs: [a, c], best: null });
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

    it('comemoração do gol: o jeito sai só da espécie e cabe nos 2,5 s', () => {
        // a mesma espécie comemora sempre igual (sem sorteio: o replay e o Duelo mostram o mesmo)
        for (let id = 1; id <= 151; id++) expect(comemoracaoOf(id)).toBe(comemoracaoOf(id));
        const kinds = new Set(Array.from({ length: 151 }, (_, i) => comemoracaoOf(i + 1)));
        expect([...kinds].sort()).toEqual(['giro', 'pose', 'pulo']);
        // pulo: Hop pra onde estava virado
        expect(goalCelebPose('pulo', 1500, 3)).toEqual({ anim: 'Hop', facing: 3, sx: 1, sy: 1, lift: 0 });
        // agacha antes de pular (squash), e o corpo volta ao normal
        expect(goalCelebPose('pulo', 80, 3).sy).toBeLessThan(1);
        // giro: passa pelas 8 direções e termina pulando de frente antes do fim
        const dirs = new Set(Array.from({ length: 30 }, (_, i) => goalCelebPose('giro', i * 50, 2).facing));
        expect(dirs.size).toBe(8);
        expect(goalCelebPose('giro', GOAL_CELEB_MS - 1, 2)).toMatchObject({ anim: 'Hop', facing: 0 });
        // o giro acelera e freia: no meio troca de direção mais rápido que no começo
        const stepsIn = (a: number, b: number) =>
            new Set(Array.from({ length: 20 }, (_, i) => goalCelebPose('giro', a + ((b - a) * i) / 20, 0).facing)).size;
        expect(stepsIn(600, 760)).toBeGreaterThan(stepsIn(0, 160));
        // pose: junta força e solta, de frente
        expect(goalCelebPose('pose', 100, 5)).toMatchObject({ anim: 'Charge', facing: 0 });
        expect(goalCelebPose('pose', 400, 5).sy).toBeLessThan(1);
        expect(goalCelebPose('pose', 560, 5).sy).toBeGreaterThan(1);
        expect(goalCelebPose('pose', 1200, 5)).toEqual({ anim: 'Pose', facing: 0, sx: 1, sy: 1, lift: 0 });
    });

    it('comemoração: todo jeito pula e amassa ao aterrissar (o pulo de verdade, com a sombra no chão)', () => {
        for (const kind of ['pulo', 'giro', 'pose'] as const) {
            let high = 0;
            let landed = false;
            let flat = 1;
            for (let ms = 0; ms < GOAL_CELEB_MS; ms += 10) {
                const p = goalCelebPose(kind, ms, 0);
                high = Math.max(high, p.lift);
                if (high > 0 && p.lift === 0) landed = true;
                if (landed) flat = Math.min(flat, p.sy);
                if (p.lift > 0) expect(p.sy, `${kind} ${ms}`).toBeGreaterThanOrEqual(1);
            }
            expect(high, kind).toBeGreaterThan(12);
            // amassa na aterrissagem (~35%, o reforço)
            expect(flat, kind).toBeLessThan(0.7);
        }
    });
});
