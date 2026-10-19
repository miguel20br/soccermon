import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { readFileSync } from 'node:fs';
import { mergeSaves } from '../cloud/reconcile-plan';
import { FUTSAL_5 } from '../engine/config';
import { CUP_STAGES } from '../engine/cup';
import { monRecipe } from '../engine/duel-validate';
import { evolveInstance } from '../engine/evolution';
import { createInstance, type PokemonInstance, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import {
    BINDER_MAX,
    BINDER_RECENT,
    type BinderCard,
    binderAdd,
    binderBackfill,
    binderInst,
    binderKey,
    binderOf,
    cleanBinder,
    isNotable,
    mergeBinder,
    parseCardShowcase,
    resolveCardShowcase,
} from './binder';
import { migrateSave, playerTeam, type RunState, SAVE_VERSION, useGame } from './game-store';

const rng = new Rng('binder-test');
/** Carta comum (sem edição, nota baixa): Caterpie, Weedle, Pidgey, Rattata… */
const COMMON = [10, 13, 16, 19, 21, 129];
const plain = (i: number): PokemonInstance => ({
    ...createInstance(COMMON[i % COMMON.length], rng),
    uid: `p${i}`,
    shiny: false,
});
const add = (list: BinderCard[], p: PokemonInstance, at: number, champ = false) =>
    binderAdd(list, [p], { from: 'draft', at, cup: 'c', champ });

describe('fichário: guardar e limitar', () => {
    it('cartas comuns: só as últimas 50 ficam', () => {
        let b: BinderCard[] = [];
        for (let i = 0; i < 80; i++) b = add(b, plain(i), i);
        expect(b).toHaveLength(BINDER_RECENT);
        expect(b.every((c) => !isNotable(c))).toBe(true);
        // as mais novas primeiro, as 30 mais antigas saíram
        expect(b[0].id).toBe('p79');
        expect(b.some((c) => c.id === 'p29')).toBe(false);
    });

    it('notáveis (edição, Shiny, campeã) ficam mesmo fora das últimas 50', () => {
        let b: BinderCard[] = [];
        b = add(b, { ...plain(0), uid: 'shiny', shiny: true }, 0);
        b = add(b, { ...plain(1), uid: 'evento', special: { kind: 'evento', type: 'Bug' } }, 1);
        b = add(b, { ...plain(2), uid: 'campea' }, 2, true);
        b = add(b, { ...createInstance(150, rng), uid: 'nota' }, 3);
        for (let i = 0; i < 60; i++) b = add(b, plain(i), 100 + i);
        expect(b.map((c) => c.id)).toEqual(expect.arrayContaining(['shiny', 'evento', 'campea', 'nota']));
        expect(b).toHaveLength(BINDER_RECENT + 4);
    });

    it('acima de 300: saem primeiro as não notáveis, depois a notável mais antiga', () => {
        let b: BinderCard[] = [];
        for (let i = 0; i < BINDER_MAX; i++) b = add(b, { ...plain(i), uid: `s${i}`, shiny: true }, 1000 + i);
        for (let i = 0; i < 10; i++) b = add(b, plain(i), 5000 + i);
        // cheio de notáveis: as comuns (mesmo as mais novas) saem primeiro
        expect(b).toHaveLength(BINDER_MAX);
        expect(b.every((c) => isNotable(c))).toBe(true);
        // notável nova: sai a notável mais antiga
        b = add(b, { ...plain(0), uid: 'nova', shiny: true }, 9000);
        expect(b).toHaveLength(BINDER_MAX);
        expect(b[0].id).toBe('nova');
        expect(b.some((c) => c.id === 's0')).toBe(false);
        expect(b.some((c) => c.id === 's1')).toBe(true);
    });

    it('a mesma carta atualiza (Destaque), a evolução vira outra entrada', () => {
        const p = { ...createInstance(4, rng), uid: 'charm' };
        let b = add([], p, 10);
        b = binderAdd(b, [{ ...p, special: { kind: 'destaque' } }], { from: 'evolucao', at: 20 });
        expect(b).toHaveLength(1);
        expect(b[0]).toMatchObject({ at: 10, from: 'draft', card: { special: { kind: 'destaque' } } });
        const evo = evolveInstance(p, 5);
        b = binderAdd(b, [evo], { from: 'evolucao', at: 30 });
        expect(b.map((c) => c.id).sort()).toEqual(['charm', 'charm>5']);
        expect(binderKey(evo)).toBe('charm>5');
        // a carta desenhada é a mesma (nota, edição, evoluções)
        const back = binderInst(b.find((c) => c.id === 'charm>5')!);
        expect(viewInstance(back).overall).toBe(viewInstance(evo).overall);
        expect(back.uid).toBe('charm');
    });
});

describe('fichário: retroativo, migração e nuvem', () => {
    const run = (seed: string, status: RunState['status']): RunState => {
        const picks = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ ...plain(i), uid: `${seed}-${i}` }));
        picks[6] = { ...picks[6], uid: `${seed}-6-c1` };
        return {
            seed,
            status,
            picks,
            lineup: picks.slice(0, 5).map((p) => p.uid),
            bench: [picks[6].uid],
            opponents: [],
            results: [],
            startedAt: 1000,
        } as unknown as RunState;
    };
    const hallOf = (id: string) => ({
        id,
        date: 500,
        club: 'X',
        clubColor: 'vermelho' as const,
        formation: '1-2-1',
        titleNo: 1,
        perfect: false,
        scores: [],
        squad: [
            { speciesId: 25, shiny: true, name: 'Pikachu', ovr: 70, goals: 3, captain: true },
            { speciesId: 999, shiny: false, name: '?', ovr: 0, goals: 0, captain: false },
        ],
    });

    it('copas guardadas e Hall entram; copa que já está nas guardadas não repete pelo Hall', () => {
        const b = binderBackfill([run('a', 'champion'), run('b', 'drafting')], [hallOf('a'), hallOf('h')]);
        const a = b.filter((c) => c.cup === 'a');
        expect(a).toHaveLength(7);
        expect(a.filter((c) => c.champ)).toHaveLength(6);
        expect(a.find((c) => c.id === 'a-6-c1')?.from).toBe('recompensa');
        expect(b.filter((c) => c.cup === 'b' && c.champ)).toHaveLength(0);
        // Hall: espécie que não existe fica de fora, o Pikachu Shiny entra campeão
        const h = b.filter((c) => c.cup === 'h');
        expect(h).toHaveLength(1);
        expect(h[0]).toMatchObject({ from: 'hall', champ: true, card: { speciesId: 25, shiny: true } });
    });

    it('save sem fichário nasce dele; com fichário, não refaz', () => {
        const save = { run: run('a', 'champion'), parkedRuns: [], hall: [] };
        expect(binderOf(save)).toHaveLength(7);
        expect(binderOf({ ...save, binder: [] })).toEqual([]);
    });

    it('backup v6 de verdade: o Hall vira fichário de campeãs; o save atual guarda e lê de volta', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(save.binder.length).toBeGreaterThan(0);
            expect(save.binder.filter((c) => c.from === 'hall').every((c) => c.champ)).toBe(true);
            const again = migrateSave(JSON.parse(JSON.stringify(save)), SAVE_VERSION);
            expect(again.binder).toEqual(save.binder);
        }
    });

    it('lixo no fichário (backup editado) sai, o resto fica', () => {
        const good = add([], plain(1), 5);
        const out = cleanBinder([
            ...good,
            null,
            {
                id: 'x',
                at: 1,
                from: 'draft',
                card: { speciesId: 25, moves: ['hyperbeam'], ability: 'x', shiny: false },
            },
            { ...good[0] },
            { ...good[0], id: 'y', from: 'loja' },
        ]);
        expect(out).toEqual(good);
        expect(cleanBinder('lixo')).toEqual([]);
    });

    it('nuvem: união pela carta, sem duplicar; o elenco refeito do Hall sai se o outro lado tem o de verdade', () => {
        const a = add(add([], plain(1), 1), plain(2), 2);
        const b = binderAdd(add([], plain(2), 9, true), [{ ...plain(3), uid: 'hall-a-0' }], {
            from: 'hall',
            at: 0,
            cup: 'c',
            champ: true,
        });
        const m = mergeBinder(a, b);
        expect(m.map((c) => c.id).sort()).toEqual(['p1', 'p2']);
        expect(m.find((c) => c.id === 'p2')).toMatchObject({ at: 2, champ: true });
        const local = migrateSave({ binder: a }, SAVE_VERSION);
        expect(mergeSaves(local, { binder: b }, 'device').binder).toHaveLength(2);
    });
});

describe('vitrine de cartas', () => {
    it('só cartas do fichário, no máximo 3', () => {
        let b: BinderCard[] = [];
        for (let i = 0; i < 5; i++) b = add(b, plain(i), i);
        expect(resolveCardShowcase(['p4', 'nao-existe', 'p1', 'p2', 'p3'], b).map((c) => c.id)).toEqual([
            'p4',
            'p1',
            'p2',
        ]);
        expect(resolveCardShowcase('lixo', b)).toEqual([]);
    });

    it('a do rival no Duelo: carta inventada e lixo são ignorados, no máximo 3', () => {
        const real = monRecipe({ ...createInstance(6, rng), special: { kind: 'icone', title: 'Charizard Rebelde' } });
        const forged = { ...real, special: { kind: 'icone', level: 9 } };
        const cards = parseCardShowcase([42, 'x', forged, { ...real, speciesId: 200 }, real, real, real, real]);
        expect(cards).toHaveLength(3);
        expect(cards[0]).toMatchObject({ speciesId: 6, special: { kind: 'icone' } });
        expect(parseCardShowcase(null)).toEqual([]);
        expect(parseCardShowcase([{ ...real, moves: ['hyperbeam', 'hyperbeam'] }])).toEqual([]);
    });
});

describe('fichário no jogo', () => {
    const g = () => useGame.getState();

    it('o draft guarda a carta escolhida', () => {
        useGame.setState({ binder: [] });
        g().newRun('Pallet FC', 'fichario-draft');
        g().autoDraft();
        const run = g().run!;
        expect(
            g()
                .binder.map((c) => c.id)
                .sort(),
        ).toEqual(run.picks.map((p) => p.uid).sort());
        expect(g().binder.every((c) => c.from === 'draft' && c.cup === 'fichario-draft')).toBe(true);
    });

    it('o título marca o elenco campeão', () => {
        let won = false;
        for (let k = 0; k < 8 && !won; k++) {
            const seed = `fichario-final${k}`;
            useGame.setState({ binder: [] });
            g().newRun('Pallet FC', seed);
            const r = new Rng(seed, 'demo');
            const lineup = [143, 68, 151, 142, 150].map((id) => createInstance(id, r));
            const bench = [149, 25].map((id) => createInstance(id, r));
            const last = CUP_STAGES.length - 1;
            useGame.setState({
                run: {
                    ...g().run!,
                    formation: '1-2-1',
                    picks: [...lineup, ...bench],
                    lineup: lineup.map((p) => p.uid),
                    bench: bench.map((p) => p.uid),
                    captainUid: lineup[4].uid,
                    draftRound: 7,
                    status: 'lineup',
                    stage: last,
                },
            });
            const team = playerTeam(g().run!);
            g().lockMatch(team);
            const m = runMatch(FUTSAL_5, team, g().run!.opponents[last], `${seed}-stage-${last}`);
            g().recordResult(m);
            if (g().run!.status !== 'champion') continue;
            won = true;
            const squad = [...g().run!.lineup, ...g().run!.bench];
            const champs = g().binder.filter((c) => c.champ);
            expect(champs.map((c) => c.id.split('>')[0]).sort()).toEqual(squad.sort());
        }
        expect(won).toBe(true);
    });
});
