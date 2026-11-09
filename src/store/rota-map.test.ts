import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { buildCupMap, isMatchKind, LONG_ROWS, mapPaths, nextNodes } from '../engine/cup-map';
import { viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { migrateSave, type RunState, useGame } from './game-store';
import { nodeOpponent } from './long-cup';
import { eventChoices, gambleNote, gambleWon, resolveEvent, rollEvent } from './long-events';
import { buildRotaMap, casaOf, houseOf, MAP_V, roleMatchesLayout } from './rota-map';

const SEEDS = Array.from({ length: 300 }, (_, i) => `largo-${i}`);

describe('mapa largo (opção B da Rota Índigo)', () => {
    it('as linhas de partida são as mesmas do mapa de sempre', () => {
        expect(roleMatchesLayout()).toBe(true);
    });

    it('4 casas por linha, a última parada é Treino, Mercado do Planalto ou Centro', () => {
        for (const seed of SEEDS) {
            const map = buildRotaMap(seed);
            expect(map.rows).toBe(LONG_ROWS);
            for (let row = 0; row < LONG_ROWS - 1; row++)
                expect(map.nodes.filter((n) => n.row === row)).toHaveLength(4);
            const last = map.nodes.filter((n) => n.row === LONG_ROWS - 1).map(houseOf);
            expect([...last].sort()).toEqual(['centro', 'planalto', 'treino']);
        }
    });

    it('todo passo é escolha entre tipos diferentes (a 1ª linha também) e toda casa é alcançável', () => {
        for (const seed of SEEDS) {
            const map = buildRotaMap(seed);
            expect(new Set(nextNodes(map, null).map(houseOf)).size).toBeGreaterThan(1);
            for (const n of map.nodes) {
                if (n.row === LONG_ROWS - 1) {
                    expect(n.next).toEqual([]);
                    continue;
                }
                expect(n.next.length).toBeGreaterThanOrEqual(2);
                expect(n.next.length).toBeLessThanOrEqual(3);
                expect(new Set(nextNodes(map, n.id).map(houseOf)).size).toBeGreaterThan(1);
                if (n.row > 0) expect(map.nodes.some((m) => m.next.includes(n.id))).toBe(true);
            }
        }
    });

    it('todo caminho: 4 partidas, no máximo 2 Mercados antes do Planalto e a pedra de cada região', () => {
        for (const seed of SEEDS.slice(0, 60)) {
            const map = buildRotaMap(seed);
            for (const p of mapPaths(map.nodes)) {
                expect(p).toHaveLength(LONG_ROWS);
                expect(p.filter((n) => isMatchKind(n.kind))).toHaveLength(4);
                expect(p.filter((n) => houseOf(n) === 'mercado').length).toBeLessThanOrEqual(2);
            }
            // a pedra só em Jogo (o Ás tem o prêmio dele) e uma por pedra da região
            expect(map.nodes.filter((n) => n.stone).every((n) => houseOf(n) === 'jogo')).toBe(true);
            expect(map.nodes.filter((n) => n.stone)).toHaveLength(5);
            // o Ás promete a carta rara; o Jogo, MT, item ou ₽
            for (const n of map.nodes.filter((x) => houseOf(x) === 'as')) expect(n.prize).toBe('pokemon');
            for (const n of map.nodes.filter((x) => houseOf(x) === 'jogo')) expect(n.prize).not.toBe('pokemon');
        }
    });

    it('mais escolha que o mapa estreito: passos com escolha e sequências de casas diferentes', () => {
        const measure = (build: (s: string) => ReturnType<typeof buildRotaMap>) => {
            let steps = 0;
            let walks = 0;
            let seqs = 0;
            for (const seed of SEEDS.slice(0, 150)) {
                const map = build(seed);
                seqs += new Set(mapPaths(map.nodes).map((p) => p.map(houseOf).join(','))).size;
                const rng = new Rng(seed, 'walk');
                for (let w = 0; w < 4; w++, walks++) {
                    let at: string | null = null;
                    for (let open = nextNodes(map, at); open.length; open = nextNodes(map, at)) {
                        if (new Set(open.map(houseOf)).size > 1) steps++;
                        at = rng.pick(open).id;
                    }
                }
            }
            return { steps: steps / walks, seqs: seqs / 150 };
        };
        const old = measure(buildCupMap);
        const wide = measure(buildRotaMap);
        expect(wide.steps).toBe(9);
        expect(old.steps).toBeLessThan(5);
        expect(wide.seqs).toBeGreaterThan(60);
    });

    it('mesma seed, mesmo mapa', () => {
        expect(buildRotaMap('igual')).toEqual(buildRotaMap('igual'));
    });
});

describe('casas novas na Rota', () => {
    const start = (seed: string) => {
        useGame.getState().newRun('Pallet FC', seed, undefined, 'longa');
        useGame.getState().autoDraft();
        return useGame.getState().run!;
    };
    /** O time numa casa de onde dá pra entrar em `house` (sem jogar: só pra testar a casa). */
    const enterFrom = (seed: string, house: string, row?: number) => {
        const run = start(seed);
        const target = run.map!.nodes.find(
            (n) => houseOf(n) === house && n.row > 0 && (row === undefined || n.row === row),
        )!;
        const prev = run.map!.nodes.find((n) => n.next.includes(target.id))!;
        useGame.setState({ run: { ...run, at: prev.id, path: [prev.id], money: 30 } });
        return target;
    };

    it('Rota nova nasce com o mapa largo (mapV 2)', () => {
        const run = start('largo-novo');
        expect(run.mapV).toBe(MAP_V);
        expect(run.map!.nodes.filter((n) => n.row === 0)).toHaveLength(4);
    });

    it('Treinador Ás: rival +1 do Jogo da mesma linha; vencendo, 1 de 3 cartas raras depois do rival', () => {
        const target = enterFrom('largo-as', 'as');
        const run = useGame.getState().run!;
        const plain = { ...target, casa: undefined };
        const opp = nodeOpponent(run, target);
        // o mesmo time com +1 (o sorteio do rival é o do Jogo da linha)
        expect(opp.name).toBe(nodeOpponent(run, plain).name);
        useGame.getState().enterNode(target.id);
        const now = useGame.getState().run!;
        useGame.setState({
            run: {
                ...now,
                status: 'reward',
                rivalPick: true,
                rewards: [],
                results: [
                    ...now.results,
                    { stage: now.stage, opponent: opp.name, score: [2, 1], shootout: null, won: true, final: false },
                ],
            },
        });
        useGame.getState().skipReward();
        const prize = useGame.getState().run!;
        expect(prize.status).toBe('reward');
        expect(prize.rivalPick).toBe(false);
        expect(prize.rewards).toHaveLength(3);
        expect(prize.rewards.every((r) => r.kind === 'pokemon' && !r.from)).toBe(true);
    });

    it('Zona Safari: 3 selvagens com a chance à vista; pegou entra no lugar do reserva, fugiu ninguém sai', () => {
        let seen = { won: 0, lost: 0 };
        for (let s = 0; s < 40 && (!seen.won || !seen.lost); s++) {
            const target = enterFrom(`largo-safari-${s}`, 'safari');
            useGame.getState().enterNode(target.id);
            const run = useGame.getState().run!;
            expect(run.status).toBe('event');
            const ev = run.event!;
            expect(ev.id).toBe('safari');
            expect(ev.cards).toHaveLength(3);
            const choices = eventChoices(run, ev);
            for (const c of choices.filter((x) => x.id.startsWith('bola'))) {
                expect(c.chance).toBeGreaterThan(0.4);
                expect(c.chance).toBeLessThan(0.9);
            }
            const reserve = run.bench.find((u) => u && u !== run.captainUid)!;
            const won = gambleWon(run, ev, 'bola0')!;
            const note = gambleNote(run, ev, 'bola0', reserve)!;
            expect(note.choice).toBe(won ? 'pegou' : 'fugiu');
            expect(note.names).toEqual([viewInstance(ev.cards![0]).displayName]);
            useGame.getState().chooseEvent('bola0', reserve);
            const after = useGame.getState().run!;
            expect(after.status).toBe('map');
            expect(after.eventNote?.choice).toBe(note.choice);
            expect(after.picks.some((p) => p.uid === ev.cards![0].uid)).toBe(won);
            expect(after.picks.some((p) => p.uid === reserve)).toBe(!won);
            seen = { won: seen.won + +won, lost: seen.lost + +!won };
        }
        expect(seen.won).toBeGreaterThan(0);
        expect(seen.lost).toBeGreaterThan(0);
    });

    it('Cassino: o caça-níquel dá item a quem está sem, o balcão dá a carta; perdendo, só o ₽ vai', () => {
        const target = enterFrom('largo-cassino', 'cassino');
        useGame.getState().enterNode(target.id);
        const run = useGame.getState().run!;
        const ev = run.event!;
        expect(ev.id).toBe('cassino');
        const reserve = run.bench.find((u) => u && u !== run.captainUid)!;
        const premio = resolveEvent(run, ev, 'premio', reserve)!;
        expect(premio.money).toBe((run.money ?? 0) - 8);
        expect(premio.picks.some((p) => p.uid === ev.cards![0].uid)).toBe(gambleWon(run, ev, 'premio'));
        const bare = { ...run, picks: run.picks.map((p) => ({ ...p, item: null })) };
        const spin = resolveEvent(bare, ev, 'girar', bare.lineup[0])!;
        expect(!!spin.picks.find((p) => p.uid === bare.lineup[0])!.item).toBe(gambleWon(bare, ev, 'girar'));
        // sem ₽ não dá pra apostar
        expect(
            eventChoices({ ...run, money: 2 }, ev)
                .filter((c) => c.ok)
                .map((c) => c.id),
        ).toEqual(['sair']);
    });

    it('última parada: depois do Mercado do Planalto e do Centro vem o grupo', () => {
        const planalto = enterFrom('largo-fim', 'planalto');
        useGame.getState().enterNode(planalto.id);
        expect(useGame.getState().run!.status).toBe('shop');
        useGame.getState().leaveShop();
        expect(useGame.getState().run!.status).toBe('group');
        const centro = enterFrom('largo-fim', 'centro', LONG_ROWS - 1);
        useGame.getState().enterNode(centro.id);
        expect(useGame.getState().run!.status).toBe('event');
        useGame.getState().chooseEvent('seguir');
        expect(useGame.getState().run!.status).toBe('group');
    });

    it('evento que não existe numa versão antiga cai no sorteio de sempre (casa nova = tipo de base)', () => {
        const map = buildRotaMap('base');
        for (const n of map.nodes) {
            if (casaOf(n) === 'safari' || casaOf(n) === 'cassino') expect(n.kind).toBe('evento');
            if (casaOf(n) === 'as') expect(n.kind).toBe('jogo');
            if (casaOf(n) === 'planalto') expect(n.kind).toBe('mercado');
        }
        // e o sorteio comum nunca tira Safari nem Cassino (só a casa deles)
        const run = start('largo-sorteio');
        for (let i = 0; i < 30; i++)
            expect(['safari', 'cassino']).not.toContain(rollEvent({ ...run, at: `r1c${i}` }).id);
    });
});

describe('Rota guardada antes do mapa largo', () => {
    it('backup v6 + Rota da 0.9.43/rota-a (mapa estreito, sem mapV) carrega e segue no mapa velho', async () => {
        const { readFileSync } = await import('node:fs');
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            useGame.getState().newRun('Pallet FC', `velha-${lang}`, undefined, 'longa');
            useGame.getState().autoDraft();
            const fresh = useGame.getState().run!;
            // como a 0.9.43 e a rota-a salvavam: o mapa de buildCupMap, sem mapV, bag nem shopFree
            const { mapV: _v, bag: _b, shopFree: _s, ...rest } = fresh;
            const oldRun = { ...rest, map: buildCupMap(fresh.seed) } as RunState;
            const save = migrateSave(JSON.parse(JSON.stringify({ ...backup.save, run: oldRun })), backup.version);
            const run = save.run!;
            expect(run.mapV).toBeUndefined();
            expect(run.map).toEqual(buildCupMap(fresh.seed));
            useGame.setState({ run, screen: 'map' });
            // anda até o Treino de sempre e vai pro grupo
            const first = nextNodes(run.map!, null)[0];
            useGame.getState().enterNode(first.id);
            expect(useGame.getState().run!.status).toBe('lineup');
            const treino = run.map!.nodes.find((n) => n.row === LONG_ROWS - 1)!;
            expect(treino.kind).toBe('treino');
            useGame.setState({ run: { ...useGame.getState().run!, at: treino.id, status: 'treino' } });
            useGame.getState().train('rest');
            expect(useGame.getState().run!.status).toBe('group');
            expect(useGame.getState().run!.map).toEqual(buildCupMap(fresh.seed));
        }
    });
});
