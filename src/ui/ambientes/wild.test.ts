import { describe, expect, it } from 'vitest';
import { type Dex, EDITION_BIT, EMPTY_ENTRY } from '../../store/profile';
import { TABS } from './nav';
import {
    type Actor,
    type Area,
    type Box,
    CLUB_MAX,
    CROWD,
    clubWild,
    dirOf,
    fits,
    HIDE_MS,
    MAX_WILD,
    POOLS,
    poke,
    rollAll,
    rollWild,
    spawn,
    step,
    wildQuota,
} from './wild';

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

    // a tela medida (o que a WildZone faz): o chão de uma sala com um botão no meio de baixo, uma estante cuja base
    // invade o chão à esquerda e a borda direita cortada (só 85% da caixa aparece)
    const BODY: Box = [-0.04, -0.2, 0.04, 0.01];
    const button: Box = [0.3, 0.55, 0.7, 1];
    const shelf: Box = [0, 0, 0.25, 0.3];
    const room = (): Area => ({
        aspect: 1.6,
        ok: (_x, y) => y > 0.12 && y < 0.95,
        speed: 0.25,
        bounds: [0, -0.5, 0.85, 1],
        blocks: [button],
        props: [shelf],
    });
    const hit = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
    const bodyOf = (a: Actor): Box => [a.x + BODY[0], a.y + BODY[1], a.x + BODY[2], a.y + BODY[3]];
    const overlap = (a: Actor, b: Actor) => {
        const [p, q] = [bodyOf(a), bodyOf(b)];
        const w = Math.min(p[2], q[2]) - Math.max(p[0], q[0]);
        const h = Math.min(p[3], q[3]) - Math.max(p[1], q[1]);
        return w > 0 && h > 0 ? (w * h) / ((BODY[2] - BODY[0]) * (BODY[3] - BODY[1])) : 0;
    };

    it('com a tela medida, o corpo nunca entra no botão, na base do móvel nem sai do que aparece', () => {
        const rand = seeded(10);
        const area = room();
        const all = ['a', 'b', 'c'].map((key, i) => {
            const a = spawn({ key, id: 19 + i, zone: 'floor', mood: 'busy' }, area, rand);
            a.body = BODY;
            return a;
        });
        let seen = 0;
        for (let t = 0; t < 120_000; t += 50) {
            step(all, { floor: area }, 50, t, {}, rand);
            for (const a of all) {
                if (!a.shown) continue;
                seen++;
                const b = bodyOf(a);
                expect(hit(b, button)).toBe(false);
                expect(hit(b, shelf)).toBe(false);
                expect(b[2]).toBeLessThanOrEqual(0.85);
                expect(fits(area, a.x, a.y, a.body)).toBe(true);
            }
        }
        expect(seen).toBeGreaterThan(all.length * 2000);
    });

    it('nada teleporta: quem deixa de caber (um botão apareceu em cima) some no lugar e só depois reaparece em outro', () => {
        const rand = seeded(4);
        const area = room();
        const a = spawn({ key: 'a', id: 25, zone: 'floor', mood: 'calm' }, area, rand);
        a.body = BODY;
        step([a], { floor: area }, 50, 0, {}, rand);
        expect(a.shown).toBe(true);
        // um botão novo bem em cima dele
        area.blocks = [...(area.blocks ?? []), [a.x - 0.1, a.y - 0.3, a.x + 0.1, a.y + 0.1]];
        let t = 50;
        let last: [number, number] = [a.x, a.y];
        let hiddenFor = 0;
        for (; t < 2000; t += 50) {
            const wasShown = a.shown;
            step([a], { floor: area }, 50, t, {}, rand);
            // à vista nos dois quadros: a posição só pode andar um passo, nunca saltar
            if (wasShown && a.shown) expect(Math.hypot(a.x - last[0], a.y - last[1])).toBeLessThan(0.05);
            if (!a.shown) hiddenFor += 50;
            last = [a.x, a.y];
        }
        expect(hiddenFor).toBeGreaterThanOrEqual(HIDE_MS - 50);
        expect(a.shown).toBe(true);
        expect(fits(area, a.x, a.y, a.body)).toBe(true);
    });

    it('ninguém atravessa ninguém: perseguir termina encostado, não um dentro do outro', () => {
        const rand = seeded(11);
        const area = room();
        const all = ['a', 'b', 'c', 'd'].map((key, i) => {
            const a = spawn({ key, id: 4 + i, zone: 'floor', mood: 'busy' }, area, rand);
            a.body = BODY;
            return a;
        });
        let chases = 0;
        let worst = 0;
        for (let t = 0; t < 120_000; t += 50) {
            step(all, { floor: area }, 50, t, {}, rand);
            if (all.some((a) => a.act === 'chase')) chases++;
            for (let i = 0; i < all.length; i++)
                for (let j = i + 1; j < all.length; j++) worst = Math.max(worst, overlap(all[i], all[j]));
        }
        expect(chases).toBeGreaterThan(100);
        expect(worst).toBeLessThanOrEqual(CROWD + 0.05);
    });

    it('o mato e a água do mesmo mapa (mesmo chão na tela) também não se atravessam', () => {
        const rand = seeded(12);
        const land: Area = { aspect: 1, ok: (x) => x < 0.5, speed: 0.3, bounds: [0, -1, 1, 1], ground: 'mapa' };
        const sea: Area = { aspect: 1, ok: (x) => x >= 0.5, speed: 0.3, bounds: [0, -1, 1, 1], ground: 'mapa' };
        const g = spawn({ key: 'g', id: 19, zone: 'grass', mood: 'busy' }, land, rand);
        const w = spawn({ key: 'w', id: 129, zone: 'water', mood: 'busy' }, sea, rand);
        for (const a of [g, w]) a.body = [-0.08, -0.2, 0.08, 0.01];
        // os dois andando um pro outro, na beira (já colados: chegar mais perto não pode, afastar pode)
        [g.x, w.x, g.tx, w.tx] = [0.44, 0.56, 0.49, 0.51];
        g.y = w.y = g.ty = w.ty = 0.5;
        g.act = w.act = 'walk';
        g.left = w.left = 5000;
        g.shown = w.shown = true;
        let near = 1;
        for (let t = 0; t < 2000; t += 50) {
            step([g, w], { grass: land, water: sea }, 50, t, {}, rand);
            near = Math.min(near, Math.abs(g.x - w.x));
        }
        expect(near).toBeGreaterThan(0.11);
    });

    it('sem lugar livre na tela (botão cobrindo a zona toda), some em vez de ficar atrás do botão; volta quando abre', () => {
        const rand = seeded(13);
        const area = room();
        area.blocks = [[0, -1, 1, 2]];
        const a = spawn({ key: 'a', id: 25, zone: 'floor', mood: 'calm' }, area, rand);
        a.body = BODY;
        step([a], { floor: area }, 50, 0, {}, rand);
        expect(a.shown).toBe(false);
        const at = [a.x, a.y];
        for (let t = 50; t < 3000; t += 50) step([a], { floor: area }, 50, t, {}, rand);
        expect([a.x, a.y]).toEqual(at);
        area.blocks = [button];
        step([a], { floor: area }, 50, 3000, {}, rand);
        expect(a.shown).toBe(true);
        expect(fits(area, a.x, a.y, a.body)).toBe(true);
    });

    it('sprite ainda sem tamanho medido não aparece num lugar que pode estar errado', () => {
        const rand = seeded(14);
        const area = room();
        const a = spawn({ key: 'a', id: 25, zone: 'floor', mood: 'calm' }, area, rand);
        expect(a.shown).toBe(false);
        step([a], { floor: area }, 50, 0, {}, rand);
        expect(a.shown).toBe(false);
        a.body = BODY;
        step([a], { floor: area }, 50, 50, {}, rand);
        expect(a.shown).toBe(true);
    });
});

describe('clubWild (Sede: os mais usados do clube)', () => {
    const e = (matches: number, goals = 0, editions = EDITION_BIT.normal) => ({
        ...EMPTY_ENTRY,
        matches,
        minutes: matches * 10,
        goals,
        editions,
    });

    it('jogador novo (sem partida): lista vazia, a Sede sorteia como antes', () => {
        expect(clubWild({})).toEqual([]);
        expect(clubWild({ 25: { ...EMPTY_ENTRY } })).toEqual([]);
    });

    it('os mais usados por partidas, com o artilheiro na frente mesmo fora do top', () => {
        const dex: Dex = { 1: e(30), 4: e(25, 2), 7: e(20), 25: e(3, 40), 6: e(18), 94: e(17), 143: e(16), 130: e(2) };
        const list = clubWild(dex);
        expect(list).toHaveLength(CLUB_MAX);
        expect(list.map((w) => w.id)).toEqual([25, 1, 4, 7, 6, 94]);
        expect(list[0].goals).toBe(40);
        expect(list.filter((w) => w.goals !== undefined)).toHaveLength(1);
        expect(new Set(list.map((w) => w.key)).size).toBe(list.length);
        // o celular mostra os 3 primeiros: o artilheiro está entre eles
        expect(clubWild(dex, 3).map((w) => w.id)).toEqual([25, 1, 4]);
    });

    it('shiny só se ele já jogou shiny por você', () => {
        const list = clubWild({ 6: e(10, 0, EDITION_BIT.normal | EDITION_BIT.shiny), 9: e(5) });
        expect(list.find((w) => w.id === 6)?.shiny).toBe(true);
        expect(list.find((w) => w.id === 9)?.shiny).toBeUndefined();
    });

    it('o toque no artilheiro mostra o balão dos gols', () => {
        const [w] = clubWild({ 25: e(10, 12) });
        const area: Area = { aspect: 1.6, ok: () => true, speed: 0.2 };
        const a = spawn(w, area, () => 0.5);
        poke(a, 0);
        expect(a.emote).toBe('goal');
    });
});
