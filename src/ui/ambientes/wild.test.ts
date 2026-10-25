import { describe, expect, it } from 'vitest';
import { TABS } from './nav';
import { type Actor, type Area, dirOf, MAX_WILD, POOLS, poke, rollAll, rollWild, spawn, step, wildQuota } from './wild';

/** Sorteio repetível pros testes (a tela usa Math.random). */
function seeded(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const none = () => false;

describe('Pokémon ambiente: sorteio', () => {
    it('cada lugar sorteia de 1 a 4, sem repetir espécie, das zonas do pool', () => {
        const rand = seeded(1);
        for (let k = 0; k < 300; k++) {
            for (const tab of TABS) {
                const w = rollWild(tab, none, rand);
                const min = POOLS[tab].filter((s) => (s.chance ?? 1) >= 1).length;
                expect(w.length).toBeGreaterThanOrEqual(Math.max(1, min));
                expect(w.length).toBeLessThanOrEqual(4);
                expect(new Set(w.map((x) => x.id)).size).toBe(w.length);
                for (const x of w) {
                    const slot = POOLS[tab][Number(x.key.split('-')[1])];
                    expect(slot.zone).toBe(x.zone);
                    expect(slot.ids).toContain(x.id);
                    expect(x.id).toBeGreaterThanOrEqual(1);
                    expect(x.id).toBeLessThanOrEqual(151);
                }
            }
        }
    });

    it('a Rota tem mato e água sempre; o Estádio tem alguém dormindo na arquibancada', () => {
        const rand = seeded(2);
        for (let k = 0; k < 100; k++) {
            const all = rollAll(none, rand);
            expect(all.rota.filter((w) => w.zone === 'grass')).toHaveLength(2);
            expect(all.rota.some((w) => w.zone === 'water')).toBe(true);
            expect(all.estadio.find((w) => w.zone === 'stand')?.mood).toBe('sleepy');
        }
    });

    it('prefere quem você já viu na Pokédex', () => {
        const seen = new Set([16, 19]);
        const rand = seeded(3);
        let hit = 0;
        const n = 2000;
        for (let k = 0; k < n; k++) if (seen.has(rollWild('rota', (id) => seen.has(id), rand)[0].id)) hit++;
        // 2 de 20 no mato: sem preferência ~10%; com peso 4, ~31%
        expect(hit / n).toBeGreaterThan(0.24);
        expect(hit / n).toBeLessThan(0.4);
    });

    it('sorteio diferente a cada abertura', () => {
        const rand = seeded(4);
        const keys = new Set(
            Array.from({ length: 20 }, () =>
                rollWild('estadio', none, rand)
                    .map((w) => w.id)
                    .join(),
            ),
        );
        expect(keys.size).toBeGreaterThan(10);
    });
});

describe('Pokémon ambiente: limite de sprites', () => {
    it('a aba da tela monta todos; vizinhas completam até o teto; as longe não montam nada', () => {
        expect(wildQuota(2, [2, 4, 4, 2, 2])).toEqual([0, 4, 4, 0, 0]);
        expect(wildQuota(2, [2, 3, 3, 1, 2])).toEqual([0, 3, 3, 1, 0]);
        expect(wildQuota(0, [2, 4, 4, 2, 2])).toEqual([2, 4, 0, 0, 0]);
        expect(wildQuota(4, [2, 4, 4, 2, 2])).toEqual([0, 0, 0, 2, 2]);
        const rand = seeded(5);
        for (let k = 0; k < 200; k++) {
            const counts = TABS.map((t) => rollWild(t, none, rand).length);
            for (let tab = 0; tab < TABS.length; tab++) {
                const q = wildQuota(tab, counts);
                expect(q.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(MAX_WILD);
                expect(q[tab]).toBe(counts[tab]);
            }
        }
    });
});

describe('Pokémon ambiente: ações', () => {
    // um "mapa" com mar na metade direita: quem é do mato nunca pode entrar na água
    const grass: Area = { aspect: 1.5, ok: (x) => x < 0.5, speed: 0.2 };
    const run = (actors: Actor[], areas: Record<string, Area>, ms: number, rand: () => number, threats = {}) => {
        let t = 0;
        let changes = 0;
        for (; t < ms; t += 50) if (step(actors, areas, 50, t, threats, rand)) changes++;
        return changes;
    };

    it('direção PMD do passo', () => {
        expect(dirOf(1, 0)).toBe(2);
        expect(dirOf(-1, 0)).toBe(6);
        expect(dirOf(0, 1)).toBe(0);
        expect(dirOf(0, -1)).toBe(4);
        expect(dirOf(1, 1)).toBe(1);
    });

    it('anda, para e muda de ação sem nunca sair de onde pode pisar', () => {
        const rand = seeded(6);
        const a = spawn({ key: 'a', id: 19, zone: 'grass', mood: 'busy' }, grass, rand);
        const b = spawn({ key: 'b', id: 16, zone: 'grass', mood: 'calm' }, grass, rand);
        const acts = new Set<string>();
        for (let t = 0; t < 120_000; t += 50) {
            step([a, b], { grass }, 50, t, {}, rand);
            acts.add(a.act).add(b.act);
            for (const p of [a, b]) {
                expect(grass.ok(p.x, p.y)).toBe(true);
                expect(p.y).toBeGreaterThan(0);
                expect(p.y).toBeLessThan(1);
            }
        }
        for (const act of ['walk', 'idle', 'look', 'hop', 'emote', 'chase', 'flee']) expect(acts).toContain(act);
    });

    it('tocado, pula com coração ou nota no lugar; quem dormia acorda assustado e depois segue a vida', () => {
        const stand: Area = { aspect: 4, ok: () => true, speed: 0.1, still: true };
        const rand = seeded(9);
        const a = spawn({ key: 's', id: 143, zone: 'stand', mood: 'sleepy' }, stand, rand);
        expect(a.act).toBe('sleep');
        expect(poke(a, 1000, rand)).toBe(true);
        expect([a.act, a.emote, a.t0]).toEqual(['hop', 'surprise', 1000]);
        const at = [a.x, a.y];
        step([a], { stand }, 950, 1950, {}, rand);
        expect(a.act).not.toBe('hop');
        expect([a.x, a.y]).toEqual(at);
        const b = spawn({ key: 'b', id: 25, zone: 'grass', mood: 'busy' }, grass, rand);
        expect(poke(b, 0, rand)).toBe(false);
        expect(['heart', 'note']).toContain(b.emote);
    });

    it('o dorminhoco passa a maior parte do tempo dormindo e não sai do lugar na arquibancada', () => {
        const stand: Area = { aspect: 4, ok: () => true, speed: 0.1, still: true };
        const rand = seeded(7);
        const a = spawn({ key: 's', id: 143, zone: 'stand', mood: 'sleepy' }, stand, rand);
        const at = [a.x, a.y];
        let asleep = 0;
        let n = 0;
        for (let t = 0; t < 60_000; t += 50, n++) {
            step([a], { stand }, 50, t, {}, rand);
            if (a.act === 'sleep') asleep++;
        }
        expect(asleep / n).toBeGreaterThan(0.6);
        expect([a.x, a.y]).toEqual(at);
    });

    it('foge quando o time passa perto', () => {
        const field: Area = { aspect: 1, ok: () => true, speed: 0.2 };
        const rand = seeded(8);
        const a = spawn({ key: 'r', id: 19, zone: 'grass', mood: 'calm' }, field, rand);
        a.x = 0.5;
        a.y = 0.5;
        a.act = 'idle';
        a.left = 5000;
        const team = { x: 0.45, y: 0.5 };
        step([a], { grass: field }, 50, 0, { grass: [team] }, rand);
        expect(a.act).toBe('flee');
        expect(a.emote).toBe('surprise');
        run([a], { grass: field }, 800, rand);
        expect(Math.hypot(a.x - team.x, a.y - team.y)).toBeGreaterThan(0.2);
    });

    it('quem voa atravessa o céu sem parar', () => {
        const sky: Area = { aspect: 1.5, ok: () => true, speed: 0.4, fly: true };
        const rand = seeded(9);
        const a = spawn({ key: 'p', id: 21, zone: 'sky', mood: 'calm' }, sky, rand);
        let moving = 0;
        for (let t = 0; t < 20_000; t += 50) {
            const [x, y] = [a.x, a.y];
            step([a], { sky }, 50, t, {}, rand);
            expect(a.act).toBe('walk');
            if (a.x !== x || a.y !== y) moving++;
        }
        expect(moving / 400).toBeGreaterThan(0.9);
    });
});
