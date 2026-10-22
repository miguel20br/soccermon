import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { readFileSync } from 'node:fs';
import { mergeSaves } from '../cloud/reconcile-plan';
import { FUTSAL_5 } from '../engine/config';
import { CUP_STAGES } from '../engine/cup';
import { SPECIES } from '../engine/data';
import { monProblems, monRecipe } from '../engine/duel-validate';
import { evolveInstance } from '../engine/evolution';
import { createInstance, type PokemonInstance, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import {
    type BinderCard,
    type BinderVersion,
    bestOfSpecies,
    binderAdd,
    binderBackfill,
    binderInst,
    binderOf,
    CARD_SLOTS,
    cardSlots,
    cleanBinder,
    giftInst,
    mergeBinder,
    parseCardShowcase,
    replaceShowcase,
    resolveCardShowcase,
    returnCard,
    swapShowcase,
    versionId,
    versionsOf,
} from './binder';
import { backfillEditions, migrateSave, playerTeam, type RunState, SAVE_VERSION, useGame } from './game-store';
import { MEDALS, type MedalView } from './medals';
import { PLATINUM, platinumItems } from './missions';
import { ALBUM_EDITIONS, albumCount, type Dex, EDITION_BIT } from './profile';
import { CODE_CARDS } from './title-codes';

const rng = new Rng('binder-test');
const mon = (id: number, uid: string, extra: Partial<PokemonInstance> = {}): PokemonInstance => ({
    ...createInstance(id, rng),
    uid,
    shiny: false,
    ...extra,
});
const icon = (uid: string, level?: number) =>
    mon(6, uid, { special: { kind: 'icone', title: 'Charizard Rebelde', ...(level && { level }) } });
/** O espaço da versão na vitrine ("6:icone#s.icone..2" → "6:icone"). */
const slotOf = (id: string) => id.split('#')[0];
const add = (list: BinderCard[], p: PokemonInstance, at = 1, champ = false) =>
    binderAdd(list, [p], { from: 'draft', at, cup: 'c', champ });

describe('álbum de cartas: uma figurinha por espécie × edição', () => {
    it('carta comum não entra', () => {
        expect(add([], mon(10, 'a'))).toEqual([]);
    });

    it('5 Charizard Ícone = 1 figurinha ×5, com a melhor (maior MVP)', () => {
        let b: BinderCard[] = [];
        b = add(b, icon('a'), 1);
        b = add(b, icon('b', 2), 2);
        b = add(b, icon('c'), 3);
        b = add(b, icon('d', 1), 4);
        b = add(b, icon('e'), 5);
        expect(b).toHaveLength(1);
        expect(b[0]).toMatchObject({ id: '6:icone', uid: 'b', n: 5, at: 2, card: { special: { level: 2 } } });
    });

    it('campeã ganha da não campeã de mesmo nível', () => {
        let b = add([], icon('a'), 1);
        b = add(b, icon('b'), 2, true);
        expect(b[0]).toMatchObject({ uid: 'b', champ: true, n: 2 });
    });

    it('a mesma carta de novo (ganhou MVP, foi campeã) atualiza sem contar 2 vezes', () => {
        let b = add([], icon('a'), 10);
        b = binderAdd(b, [icon('a', 1)], { from: 'evolucao', at: 20 });
        b = binderAdd(b, [icon('a', 1)], { from: 'draft', at: 30, champ: true });
        expect(b).toHaveLength(1);
        expect(b[0]).toMatchObject({ n: 1, at: 10, from: 'draft', champ: true, card: { special: { level: 1 } } });
    });

    it('Shiny Ícone ocupa os dois espaços; a melhor da espécie é o combo', () => {
        let b = add([], icon('a', 3));
        b = add(b, mon(6, 'sh', { shiny: true }));
        b = add(b, { ...icon('combo', 1), shiny: true });
        expect(b.map((c) => c.id).sort()).toEqual(['6:icone', '6:shiny']);
        expect(b.find((c) => c.id === '6:shiny')).toMatchObject({ uid: 'combo', n: 2 });
        // Ícone MVP 3 sozinho perde pro Shiny Ícone MVP (mais edições juntas)
        expect(b.find((c) => c.id === '6:icone')).toMatchObject({ uid: 'combo', n: 2 });
        expect(bestOfSpecies(b, 6)?.uid).toBe('combo');
        // sem combo: o Ícone ganha do Destaque III (edição mais rara antes do nível)
        const star = add(add([], icon('ic')), mon(6, 'd3', { special: { kind: 'destaque', level: 3 } }));
        expect(bestOfSpecies(star, 6)?.uid).toBe('ic');
        // só entre as figurinhas coladas
        expect(bestOfSpecies(b, 6, (c) => c.id === '6:nada')).toBeNull();
    });

    it('a evolução vai pro espaço da forma nova', () => {
        const p = mon(4, 'charm', { shiny: true });
        const evo = evolveInstance(p, 5);
        const b = binderAdd(add([], p), [evo], { from: 'evolucao', at: 2 });
        expect(b.map((c) => c.id).sort()).toEqual(['4:shiny', '5:shiny']);
        const c5 = b.find((c) => c.id === '5:shiny')!;
        expect(c5.uid).toBe('charm>5');
        expect(binderInst(c5)).toMatchObject({ uid: 'charm', speciesId: 5, shiny: true });
    });
});

describe('álbum: migração do fichário, retroativo e nuvem', () => {
    /** Fichário da 0.8.8: uma entrada por carta, comuns inclusive. */
    const legacy = (p: PokemonInstance, at: number, champ = false) => ({
        id: p.uid,
        card: monRecipe(p),
        at,
        from: 'draft',
        cup: 'x',
        ...(champ && { champ }),
    });

    it('fichário antigo vira álbum: comuns saem, cada especial conta no espaço dela', () => {
        const old = [
            legacy(mon(10, 'comum'), 1),
            legacy(icon('i1'), 2),
            legacy(icon('i2', 1), 3, true),
            legacy(icon('i3'), 4),
            legacy(mon(25, 'pk', { shiny: true }), 5),
        ];
        const b = binderOf({ binder: old });
        expect(b.map((c) => c.id).sort()).toEqual(['25:shiny', '6:icone']);
        expect(b.find((c) => c.id === '6:icone')).toMatchObject({ uid: 'i2', n: 3, champ: true, at: 3 });
        // a vitrine antiga (guardava a carta) acha o espaço dela
        expect(resolveCardShowcase(['i3', 'pk', 'comum'], b).map((c) => slotOf(c.id))).toEqual(['6:icone', '25:shiny']);
        // e o save novo lê de volta igual
        expect(cleanBinder(JSON.parse(JSON.stringify(b)))).toEqual(b);
    });

    it('carta comprada no Mercado sobrevive a salvar e carregar (antes sumia do álbum)', () => {
        const b = binderAdd([], [icon('m1')], { from: 'mercado', at: 1, cup: 'c' });
        expect(cleanBinder(JSON.parse(JSON.stringify(b)))).toEqual(b);
    });

    const run = (seed: string, status: RunState['status']): RunState => {
        const picks = [
            mon(10, `${seed}-0`),
            mon(25, `${seed}-1`, { shiny: true }),
            mon(6, `${seed}-2`, { special: { kind: 'evento', type: 'Fire' } }),
            mon(13, `${seed}-3`),
            mon(16, `${seed}-4`),
            mon(19, `${seed}-5`),
            mon(94, `${seed}-6-c1`, { special: { kind: 'destaque' } }),
        ];
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
            { speciesId: 26, shiny: false, name: 'Raichu', ovr: 70, goals: 3, captain: false },
            { speciesId: 999, shiny: true, name: '?', ovr: 0, goals: 0, captain: false },
        ],
    });

    it('copas guardadas e Hall entram; copa que já está nas guardadas não repete pelo Hall', () => {
        const b = binderBackfill([run('a', 'champion'), run('b', 'drafting')], [hallOf('a'), hallOf('h')]);
        expect(b.map((c) => c.id).sort()).toEqual(['25:shiny', '6:evento', '94:destaque']);
        // Pikachu Shiny: copa a (campeã), copa b e o Hall h = 3 cartas; a do Hall a não repete
        expect(b.find((c) => c.id === '25:shiny')).toMatchObject({ n: 3, champ: true });
        expect(b.find((c) => c.id === '94:destaque')).toMatchObject({ from: 'recompensa', n: 2 });
    });

    it('save sem álbum nasce dele; com álbum, não refaz', () => {
        const save = { run: run('a', 'champion'), parkedRuns: [], hall: [] };
        expect(binderOf(save)).toHaveLength(3);
        expect(binderOf({ ...save, binder: [] })).toEqual([]);
    });

    it('backup v6 de verdade: migra e lê de volta igual', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(save.binder.every((c) => c.n >= 1 && c.id.includes(':'))).toBe(true);
            const again = migrateSave(JSON.parse(JSON.stringify(save)), SAVE_VERSION);
            expect(again.binder).toEqual(save.binder);
        }
    });

    it('lixo no álbum (backup editado) sai, o resto fica', () => {
        const good = add([], icon('a'));
        const out = cleanBinder([
            ...good,
            null,
            { ...good[0] },
            { ...good[0], id: '7:icone' },
            { ...good[0], id: '6:shiny' },
            { ...good[0], n: 0 },
            { ...good[0], card: { ...good[0].card, special: { kind: 'icone', level: 9 } } },
            { ...good[0], from: 'loja' },
        ]);
        expect(out).toEqual(good);
        expect(cleanBinder('lixo')).toEqual([]);
    });

    it('nuvem: o mesmo save dos dois lados não duplica; aparelhos diferentes somam', () => {
        let a = add([], icon('a'));
        a = add(a, icon('b', 2));
        expect(mergeBinder(a, a)[0]).toMatchObject({ n: 2, uid: 'b' });
        const other = add([], icon('z', 3));
        expect(mergeBinder(a, other)[0]).toMatchObject({ n: 3, uid: 'z' });
        // o fichário antigo de um lado também entra
        const old = [legacy(icon('q'), 9)];
        expect(mergeBinder(old, a)[0]).toMatchObject({ n: 3, uid: 'b' });
        const local = migrateSave({ binder: a }, SAVE_VERSION);
        expect(mergeSaves(local, { binder: other }, 'device').binder[0].n).toBe(3);
    });
});

describe('fonte única: a conta do Álbum é a da medalha e da platina', () => {
    const dex: Dex = {};
    SPECIES.forEach((sp, i) => {
        dex[sp.id] = {
            matches: 1,
            minutes: 1,
            goals: 0,
            assists: 0,
            wins: 0,
            titles: 0,
            bestRating: 0,
            bestOvr: 0,
            editions: Object.values(EDITION_BIT)
                .filter((_, k) => (i + k) % 3 === 0)
                .reduce((x, y) => x | y, 0),
        };
    });

    it('seções (Ícones, Shiny, Evento, Destaque) + Comuns = o total; Kanto tem 622', () => {
        expect(albumCount({}).total).toBe(622);
        const parts = ALBUM_EDITIONS.map((ed) => albumCount(dex, SPECIES, [ed]));
        expect(parts.reduce((n, p) => n + p.total, 0)).toBe(622);
        expect(parts.reduce((n, p) => n + p.got, 0)).toBe(albumCount(dex).got);
        expect(CARD_SLOTS.map((ed) => albumCount({}, SPECIES, [ed]).total)).toEqual([20, 151, 149, 151]);
    });

    it('medalha Figurinhas e item Álbum da platina usam a mesma conta', () => {
        const got = albumCount(dex).got;
        const medal = MEDALS.find((m) => m.id === 'figurinhas')!;
        expect(medal.value({ dex } as unknown as MedalView)).toBe(got);
        const view = {
            dex,
            moves: {},
            done: new Set<string>(),
            records: {},
            career: {},
            hall: [],
            runs: [],
        } as unknown as Parameters<typeof platinumItems>[1];
        expect(platinumItems(PLATINUM[0], view).find((i) => i.id === 'album')).toMatchObject({ n: got, goal: 622 });
    });
});

describe('vitrine de cartas', () => {
    it('cheia: a nova entra no lugar da escolhida; trocar de lugar vale pro Perfil, amigo e Duelo (a ordem é a da lista)', () => {
        let b: BinderCard[] = [];
        for (const id of [6, 25, 150, 94]) b = add(b, mon(id, `s${id}`, { shiny: true }));
        const ids = ['6:shiny', '150:shiny', '25:shiny'];
        expect(replaceShowcase(ids, 1, '94:shiny')).toEqual(['6:shiny', '94:shiny', '25:shiny']);
        expect(replaceShowcase(ids, 5, '94:shiny')).toEqual(ids);
        const swapped = swapShowcase(ids, 0, 1);
        expect(swapped).toEqual(['150:shiny', '6:shiny', '25:shiny']);
        expect(swapShowcase(ids, 0, 7)).toEqual(ids);
        expect(resolveCardShowcase(swapped, b).map((c) => c.inst.speciesId)).toEqual([150, 6, 25]);
    });

    it('só figurinhas do álbum (coladas), no máximo 3, sem repetir', () => {
        let b: BinderCard[] = [];
        for (const id of [6, 25, 94, 143, 150]) b = add(b, mon(id, `s${id}`, { shiny: true }));
        const ids = ['150:shiny', 'nao-existe', '6:shiny', 's6', '25:shiny', '94:shiny'];
        expect(resolveCardShowcase(ids, b).map((c) => slotOf(c.id))).toEqual(['150:shiny', '6:shiny', '25:shiny']);
        expect(resolveCardShowcase(ids, b, (slot) => slot !== '6:shiny').map((c) => slotOf(c.id))).toEqual([
            '150:shiny',
            '25:shiny',
            '94:shiny',
        ]);
        expect(resolveCardShowcase('lixo', b)).toEqual([]);
        // o Shiny Ícone ocupa os dois espaços: na vitrine aparece uma vez
        const combo = add([], { ...icon('combo', 1), shiny: true });
        expect(resolveCardShowcase(['6:icone', '6:shiny'], combo)).toHaveLength(1);
    });

    it('qualquer versão que você tem vai pra vitrine, não só a melhor do espaço', () => {
        let b: BinderCard[] = [];
        b = add(b, icon('plain'), 1);
        b = add(b, icon('mvp2', 2), 2);
        b = add(b, { ...icon('combo'), shiny: true }, 3);
        const slot = b.find((c) => c.id === '6:icone');
        const vs = versionsOf(slot);
        // a melhor primeiro: Shiny Ícone, Ícone MVP 2, Ícone
        expect(vs.map((v) => v.uid)).toEqual(['combo', 'mvp2', 'plain']);
        const plain = vs.find((v) => v.uid === 'plain') as BinderVersion;
        const shown = resolveCardShowcase([versionId(6, plain)], b);
        expect(shown).toHaveLength(1);
        expect(shown[0].inst).toMatchObject({ shiny: false, special: { kind: 'icone' } });
        expect(shown[0].inst.special?.level).toBeUndefined();
        // o Shiny Ícone pelo espaço Shiny ou pelo Ícone é a mesma versão (aparece uma vez)
        const combo = vs[0];
        expect(resolveCardShowcase(['6:shiny', versionId(6, combo)], b)).toHaveLength(1);
        // versões sobrevivem ao backup e à nuvem
        expect(versionsOf(cleanBinder(JSON.parse(JSON.stringify(b))).find((c) => c.id === '6:icone'))).toHaveLength(3);
        const other = add([], icon('outro', 3), 9);
        expect(versionsOf(mergeBinder(b, other).find((c) => c.id === '6:icone')).map((v) => v.uid)).toEqual([
            'combo',
            'outro',
            'mvp2',
            'plain',
        ]);
    });

    it('figurinha de antes do álbum (sem carta guardada) vai pra vitrine como a carta padrão (bug do Mewtwo Ícone)', () => {
        // o caso do Triple M: Mewtwo Destaque I guardado e a figurinha Ícone que veio do álbum antigo, sem carta
        const b = add([], mon(150, 'mew-d', { special: { kind: 'destaque', level: 1 } }));
        const old = versionId(150, { ed: 'icone' });
        expect(old).toBe('150:icone#padrao');
        const shown = resolveCardShowcase([old], b, (slot) => slot === '150:icone' || slot === '150:destaque');
        expect(shown.map((c) => c.inst.special)).toEqual([{ kind: 'icone', title: 'Mewtwo Contra-Ataca' }]);
        expect(shown[0].v).toBeNull();
        // sem a figurinha colada, não entra
        expect(resolveCardShowcase([old], b, () => false)).toEqual([]);
        // e o rival no Duelo aceita a carta padrão
        expect(parseCardShowcase([monRecipe(shown[0].inst)])).toHaveLength(1);
    });

    it('carta de antes do álbum (Mewtwo Destaque III, Arcanine Shiny Ícone MVP 3): a vitrine mostrava a padrão; o código devolve a de verdade', () => {
        // save da 0.8.6 (backup v6): o Hall só guarda espécie, Shiny e nota; as figurinhas foram coladas na Pokédex
        const backup = JSON.parse(readFileSync('scripts/fixtures/backup-v6-pt.json', 'utf8'));
        const entry = { matches: 4, minutes: 40, goals: 3, assists: 1, wins: 4, titles: 1, bestRating: 9 };
        backup.save.hall[0].squad.push(
            { speciesId: 150, shiny: false, name: 'Mewtwo', ovr: 97, goals: 3, captain: false },
            { speciesId: 59, shiny: true, name: 'Arcanine', ovr: 93, goals: 0, captain: false },
        );
        backup.save.dex[150] = { ...entry, bestOvr: 97, editions: EDITION_BIT.normal | EDITION_BIT.destaque };
        backup.save.dex[59] = {
            ...entry,
            bestOvr: 93,
            editions: EDITION_BIT.normal | EDITION_BIT.icone | EDITION_BIT.shiny,
        };
        const save = migrateSave(backup.save, backup.version);
        const stuck = (slot: string) => {
            const [id, ed] = slot.split(':');
            return !!((save.dex[Number(id)]?.editions ?? 0) & EDITION_BIT[ed as keyof typeof EDITION_BIT]);
        };
        // o álbum (0.8.8.4) só tinha a carta padrão pra pôr na vitrine: Destaque I e Ícone sem MVP e sem Shiny
        const choice = ['150:destaque#padrao', '59:icone#padrao'];
        const before = resolveCardShowcase(choice, save.binder, stuck).map((c) => c.inst);
        expect(before.map((p) => [p.shiny, p.special?.level ?? 1])).toEqual([
            [false, 1],
            [false, 1],
        ]);
        let s = { binder: save.binder, dex: save.dex };
        for (const g of Object.values(CODE_CARDS)) s = returnCard(s, g, 9) ?? s;
        const after = resolveCardShowcase(choice, s.binder, stuck).map((c) => c.inst);
        expect(after.map((p) => [p.speciesId, p.shiny, p.special?.kind, p.special?.level])).toEqual([
            [150, false, 'destaque', 3],
            [59, true, 'icone', 3],
        ]);
        expect(after.map((p) => viewInstance(p).overall)).toEqual([97, 93]);
        // uma vez por save, sobrevive a salvar/carregar e à nuvem, e o rival do Duelo aceita a carta
        expect(returnCard(s, Object.values(CODE_CARDS)[0])).toBeNull();
        const back = cleanBinder(JSON.parse(JSON.stringify(s.binder)));
        expect(back.find((c) => c.id === '150:destaque')).toMatchObject({ from: 'resgate', n: 1 });
        expect(parseCardShowcase(after.map(monRecipe))).toHaveLength(2);
    });

    it('carta devolvida por código é uma carta que a copa poderia dar', () => {
        for (const g of Object.values(CODE_CARDS)) expect(monProblems(monRecipe(giftInst(g)), g.id)).toEqual([]);
    });

    it('álbum de antes das versões: a versão é a própria melhor carta', () => {
        const b = add([], icon('i', 2));
        const { versions: _, ...old } = b[0];
        const back = cleanBinder([old]);
        expect(versionsOf(back[0]).map((v) => v.uid)).toEqual(['i']);
        expect(resolveCardShowcase(['6:icone'], back)[0].id).toBe(versionId(6, versionsOf(back[0])[0]));
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

describe('álbum no jogo', () => {
    const g = () => useGame.getState();

    it('o draft guarda só as cartas especiais escolhidas', () => {
        useGame.setState({ binder: [] });
        g().newRun('Pallet FC', 'fichario-draft');
        g().autoDraft();
        const special = g().run!.picks.filter((p) => cardSlots(p).length);
        expect(g().binder.reduce((n, c) => n + c.n, 0)).toBe(special.reduce((n, p) => n + cardSlots(p).length, 0));
    });

    it('o título marca o elenco campeão', () => {
        let won = false;
        for (let k = 0; k < 8 && !won; k++) {
            const seed = `fichario-final${k}`;
            useGame.setState({ binder: [] });
            g().newRun('Pallet FC', seed);
            const r = new Rng(seed, 'demo');
            const lineup = [143, 68, 151, 142, 150].map((id) => ({ ...createInstance(id, r), shiny: true }));
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
            const shiny = g().binder.filter((c) => c.id.endsWith(':shiny'));
            expect(shiny.map((c) => c.card.speciesId).sort()).toEqual(expect.arrayContaining([68, 142, 143, 150, 151]));
            expect(shiny.filter((c) => [143, 68, 151, 142, 150].includes(c.card.speciesId)).every((c) => c.champ)).toBe(
                true,
            );
        }
        expect(won).toBe(true);
    });

    it('partida da copa cola as figurinhas de edição de quem jogou (Shiny, Ícone, Evento) na Pokédex', () => {
        const seed = 'album-e2e';
        useGame.setState({ binder: [], dex: {} });
        g().newRun('Pallet FC', seed);
        const r = new Rng(seed, 'demo');
        const lineup = [
            { ...createInstance(143, r), shiny: true },
            { ...createInstance(150, r), special: { kind: 'icone' as const, title: 'Mewtwo Contra-Ataca' } },
            { ...createInstance(131, r), special: { kind: 'evento' as const, type: 'Ice' } },
            createInstance(68, r),
            createInstance(142, r),
        ];
        useGame.setState({
            run: {
                ...g().run!,
                formation: '1-2-1',
                picks: lineup,
                lineup: lineup.map((p) => p.uid),
                bench: [],
                captainUid: lineup[0].uid,
                draftRound: 7,
                status: 'lineup',
                stage: 0,
            },
        });
        const team = playerTeam(g().run!);
        g().lockMatch(team);
        g().recordResult(runMatch(FUTSAL_5, team, g().run!.opponents[0], `${seed}-stage-0`));
        const dex = g().dex;
        expect(dex[143].editions).toBe(EDITION_BIT.shiny);
        expect(dex[150].editions).toBe(EDITION_BIT.icone);
        expect(dex[131].editions).toBe(EDITION_BIT.evento);
        expect(dex[68].editions).toBe(EDITION_BIT.normal);
    });

    it('ao abrir o jogo: as copas guardadas colam as edições de quem jogou, sem dar a Normal', () => {
        const ev = { ...createInstance(131, rng), uid: 'ev', special: { kind: 'evento' as const, type: 'Ice' } };
        const bench = { ...createInstance(25, rng), uid: 'banco', shiny: true };
        const run = {
            picks: [ev, bench],
            results: [{ stage: 0, stats: { players: [{ uid: 'ev', speciesId: 131, minutes: 12 }] } }],
        } as unknown as RunState;
        const entry = { matches: 1, minutes: 12, goals: 0, assists: 0, wins: 1, titles: 0, bestRating: 7, bestOvr: 70 };
        const dex = backfillEditions({ 131: entry, 25: entry }, [], [run], false);
        expect(dex[131].editions).toBe(EDITION_BIT.evento);
        // ficou no banco: não colou
        expect(dex[25].editions).toBeUndefined();
    });
});
