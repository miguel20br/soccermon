import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { ENGINE_VERSION, FUTSAL_5 } from '../engine/config';
import { bestFit, DRAFT_PICKS } from '../engine/draft';
import { evolutionTarget, evolveInstance } from '../engine/evolution';
import { formationOf } from '../engine/formations';
import { createInstance, type PokemonInstance, slotRating } from '../engine/instance';
import { playerLines } from '../engine/match-stats';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { SIGNATURE } from '../engine/signature-moves';
import { specialBonus } from '../engine/specials';
import { teachMove } from '../engine/tm';
import { profile as enProfile } from '../i18n/en/profile';
import { profile as ptProfile } from '../i18n/pt/profile';
import { type DuelRecord, mergeDuels } from './duels';
import {
    DEFAULT_SETTINGS,
    dexLines,
    liveOf,
    markEvolvedPlayed,
    migrateSave,
    playerTeam,
    type RunState,
    SAVE_VERSION,
    type SlotRef,
    slotRole,
    useGame,
} from './game-store';
import { groupTable } from './long-cup';
import { BANNER_COUNT, bannerOf, EDITION_BIT, EMPTY_ENTRY, recordMatchInDex } from './profile';

describe('save', () => {
    it('v4 → v5: perfil com o nome do time, Pokédex com a copa em andamento e sem boas-vindas', () => {
        useGame.getState().newRun('Cerulean United', 'teste-v5');
        const s = useGame.getState();
        s.chooseFormation(s.run!.formation);
        const cap = useGame.getState().run!.options[0];
        useGame.getState().pick(cap.uid, { zone: 'lineup', index: 0 });
        const run = useGame.getState().run as RunState;
        const out = migrateSave({ run, records: { cups: 0, titles: 0, perfect: 0 } }, 4);
        expect(out.profile.clubName).toBe('Cerulean United');
        expect(out.profile.clubTag).toBe('CER');
        expect(out.dex[cap.speciesId]).toBeDefined();
        expect(out.dex[cap.speciesId].bestOvr).toBeGreaterThan(0);
        expect(out.onboarded).toBe(true);
        expect(out.settings.namesOnField).toBe('all');
    });

    it('save novo começa sem boas-vindas vistas', () => {
        const out = migrateSave({}, SAVE_VERSION);
        expect(out.onboarded).toBe(false);
        expect(out.profile.clubName).toBe('Pallet FC');
    });

    it('draft marca as opções como vistas e a nova copa usa o nome do clube', () => {
        useGame.setState({ dex: {}, profile: { ...useGame.getState().profile, clubName: 'Lavender FC' } });
        useGame.getState().newRun(undefined, 'teste-dex');
        expect(useGame.getState().run!.teamName).toBe('Lavender FC');
        useGame.getState().chooseFormation(useGame.getState().run!.formation);
        for (const o of useGame.getState().run!.options) expect(useGame.getState().dex[o.speciesId]).toBeDefined();
    });

    it('save antigo (instância sem `taught`) continua válido: dá para ensinar MT e evoluir', () => {
        useGame.getState().newRun('Pallet FC', 'teste-mt-save');
        const rng = new Rng('teste-mt-save', 'team');
        const picks = [5, 7, 25, 74, 95].map((id) => createInstance(id, rng));
        const run = { ...(useGame.getState().run as RunState), picks };
        const json = JSON.parse(JSON.stringify({ run, records: { cups: 1, titles: 0, perfect: 0 } }));
        const out = migrateSave(json, SAVE_VERSION);
        expect(out.run?.picks).toEqual(picks);
        const charmeleon = out.run!.picks[0];
        expect(charmeleon.taught).toBeUndefined();
        const taught = teachMove(charmeleon, 'bide', 3)!;
        expect(evolveInstance(taught, 6).moves).toContain('bide');
    });

    it('posição herdada na evolução sobrevive a salvar e carregar', () => {
        useGame.getState().newRun('Pallet FC', 'teste-heranca-save');
        const rng = new Rng('teste-heranca-save', 'team');
        const nidoqueen = evolveInstance(createInstance(30, rng), 31, 'ALA');
        const run = { ...(useGame.getState().run as RunState), picks: [nidoqueen] };
        const json = JSON.parse(JSON.stringify({ run, records: { cups: 1, titles: 0, perfect: 0 } }));
        expect(migrateSave(json, SAVE_VERSION).run?.picks[0].inherited).toEqual(['ALA']);
    });

    it('pegar a MT na recompensa ensina o golpe; a assinatura não sai', () => {
        useGame.getState().newRun('Pallet FC', 'teste-mt-claim');
        const rng = new Rng('teste-mt-claim', 'team');
        const lineup = [95, 7, 5, 25, 74].map((id) => createInstance(id, rng));
        const base = useGame.getState().run as RunState;
        const charmeleon = lineup[2];
        const reward = { kind: 'tm' as const, move: 'bide', leader: 'Brock' };
        const ready: RunState = {
            ...base,
            picks: lineup,
            lineup: lineup.map((p) => p.uid),
            bench: [],
            captainUid: lineup[0].uid,
            status: 'reward',
            rewards: [reward],
        };
        useGame.setState({ run: ready });
        // assinatura: nada acontece
        useGame.getState().claimReward(0, charmeleon.uid, 0);
        expect(useGame.getState().run!.status).toBe('reward');
        expect(useGame.getState().run!.picks[2].moves[0]).toBe(SIGNATURE[5]);
        // golpe da vaga 1 sai, Bide entra e a copa segue
        useGame.getState().claimReward(0, charmeleon.uid, 1);
        const after = useGame.getState().run!;
        expect(after.status).toBe('lineup');
        expect(after.stage).toBe(base.stage + 1);
        const p = after.picks.find((x) => x.uid === charmeleon.uid)!;
        expect(p.moves[1]).toBe('bide');
        expect(p.taught).toEqual(['bide']);
    });
});

describe('duelos (save v8)', () => {
    const rec = (id: string, date: number): DuelRecord => ({
        id,
        date,
        mode: 'ready',
        rival: 'Bia',
        rivalClub: 'Cerulean',
        score: [3, 2],
        shootout: null,
        result: 'win',
    });

    it('v7 sem histórico vira v8 com lista vazia; lista estragada também', () => {
        expect(migrateSave({}, 7).duels).toEqual([]);
        expect(migrateSave({ duels: 'x' } as never, 7).duels).toEqual([]);
        expect(migrateSave({ duels: [rec('A-1', 1), null] } as never, 8).duels).toHaveLength(1);
    });

    it('mesma partida não entra duas vezes e a nuvem junta com o aparelho', () => {
        useGame.setState({ duels: [] });
        useGame.getState().recordDuel(rec('A-1', 1));
        useGame.getState().recordDuel(rec('A-1', 1));
        useGame.getState().recordDuel(rec('A-2', 2));
        expect(useGame.getState().duels.map((d) => d.id)).toEqual(['A-2', 'A-1']);
        expect(mergeDuels([rec('A-1', 1)], [rec('B-1', 5), rec('A-1', 1)]).map((d) => d.id)).toEqual(['B-1', 'A-1']);
    });
});

describe('partida no meio', () => {
    it('só retoma se for do mesmo motor (save de antes da 0.8.4 recomeça do 0 a 0)', () => {
        const live = { stage: 1, orders: [], tick: 900 };
        expect(liveOf({ stage: 1, live })).toBeNull();
        expect(liveOf({ stage: 1, live: { ...live, engine: ENGINE_VERSION } })?.tick).toBe(900);
        expect(liveOf({ stage: 2, live: { ...live, engine: ENGINE_VERSION } })).toBeNull();
    });
});

describe('backup antigo (scripts/fixtures)', () => {
    it('save v6 de verdade vira o save atual sem perder Hall da Fama', async () => {
        const { readFileSync } = await import('node:fs');
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(save.hall.length).toBe(backup.save.hall.length);
            // v8: histórico de duelos nasce vazio
            expect(save.duels).toEqual([]);
            expect(Array.isArray(save.profile.missionsDone)).toBe(true);
            expect(save.profile.trainer).toBeTruthy();
            // v9: quem jogou já entra no álbum com a figurinha Normal; visto não ganha nada
            const played = Object.values(save.dex).filter((e) => e.matches > 0);
            expect(played.length).toBeGreaterThan(0);
            for (const e of played) expect((e.editions ?? 0) & EDITION_BIT.normal).toBeTruthy();
            for (const e of Object.values(save.dex).filter((x) => x.matches === 0)) expect(e.editions).toBeUndefined();
            expect(save.settings.goalCry).toBe(true);
            // faixa da torcida (0.8.7): campo opcional, save antigo fica com a 1ª frase
            expect(save.profile.banner).toBeUndefined();
            expect(bannerOf(save.profile.banner)).toBe(0);
        }
    });

    it('edições em camadas (0.8.8): save antigo segue valendo e combo novo (shiny + Evento MVP) sobrevive', async () => {
        const { readFileSync } = await import('node:fs');
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            const cards = save.run?.picks ?? [];
            for (const c of cards) expect(specialBonus(c)).toBeGreaterThanOrEqual(0);
            for (const c of cards) expect(specialBonus(c)).toBeLessThanOrEqual(6);
        }
        useGame.getState().newRun('Pallet FC', 'teste-combo-save');
        const run = useGame.getState().run;
        if (!run) throw new Error('sem run');
        const card = {
            ...createInstance(4, new Rng('combo')),
            shiny: true,
            special: { kind: 'evento' as const, type: 'Fire', level: 2 },
        };
        const saved = migrateSave(JSON.parse(JSON.stringify({ run: { ...run, picks: [card] } })), SAVE_VERSION);
        expect(saved.run?.picks[0].shiny).toBe(true);
        expect(saved.run?.picks[0].special).toEqual({ kind: 'evento', type: 'Fire', level: 2 });
        expect(specialBonus(saved.run?.picks[0] as PokemonInstance)).toBe(5);
    });

    it('faixa da torcida: a escolhida sobrevive a salvar e carregar; número estragado vira a 1ª', () => {
        const keep = migrateSave(JSON.parse(JSON.stringify({ profile: { banner: 4 } })), SAVE_VERSION);
        expect(bannerOf(keep.profile.banner)).toBe(4);
        expect(keep.profile.clubName).toBe('Pallet FC');
        for (const bad of [99, -1, 2.5, '3', null]) expect(bannerOf(bad)).toBe(0);
        // a lista fechada tem as mesmas 12 frases nos dois idiomas, e a 1ª leva o nome do clube
        expect(ptProfile.club.banners).toHaveLength(BANNER_COUNT);
        expect(enProfile.club.banners).toHaveLength(BANNER_COUNT);
        expect(ptProfile.club.banners[0]).toContain('{club}');
        expect(enProfile.club.banners[0]).toContain('{club}');
    });

    it('v8 → v9: álbum retroativo pelo Hall (shiny) e pelas copas guardadas (Destaque só depois de virar)', () => {
        useGame.getState().newRun('Pallet FC', 'album');
        const rng = new Rng('album', 'team');
        const star = { ...createInstance(25, rng), special: { kind: 'destaque' as const } };
        const ev = { ...createInstance(4, rng), special: { kind: 'evento' as const, type: 'Fire' } };
        const line = (uid: string, speciesId: number) => ({ uid, speciesId, minutes: 20 });
        const result = (stage: number, players: ReturnType<typeof line>[], destaqueUid: string | null = null) =>
            ({
                stage,
                opponent: 'X',
                score: [1, 0],
                shootout: null,
                won: true,
                destaqueUid,
                stats: { players },
            }) as never;
        const run = {
            ...(useGame.getState().run as RunState),
            seed: 'album',
            picks: [star, ev],
            // Pikachu virou Destaque na fase 0 e jogou a 1 já como Destaque; o Charmander Evento só jogou a 0
            results: [result(0, [line(star.uid, 25), line(ev.uid, 4)], star.uid), result(1, [line(star.uid, 25)])],
        };
        const entry = { matches: 2, minutes: 40, goals: 0, assists: 0, wins: 2, titles: 0, bestRating: 7, bestOvr: 70 };
        const mate = (speciesId: number, shiny: boolean) => ({
            speciesId,
            shiny,
            name: '',
            ovr: 70,
            goals: 0,
            captain: false,
        });
        const hall = [{ id: 'h', date: 1, perfect: false, scores: [[1, 0]], squad: [mate(7, true), mate(1, false)] }];
        const old = { run, dex: { 25: entry, 4: entry, 7: entry, 1: entry, 150: { ...entry, matches: 0 } }, hall };
        const dex = migrateSave(JSON.parse(JSON.stringify(old)), 8).dex;
        expect(dex[25].editions).toBe(EDITION_BIT.normal | EDITION_BIT.destaque);
        expect(dex[4].editions).toBe(EDITION_BIT.normal | EDITION_BIT.evento);
        expect(dex[7].editions).toBe(EDITION_BIT.normal | EDITION_BIT.shiny);
        expect(dex[1].editions).toBe(EDITION_BIT.normal);
        expect(dex[150].editions).toBeUndefined();
        // save já na v9 não refaz o retroativo
        expect(migrateSave(JSON.parse(JSON.stringify(old)), 9).dex[25].editions).toBeUndefined();
    });

    it('item novo pra quem já segura um: o antigo vai pra quem o jogador escolher', () => {
        useGame.getState().newRun('Pallet FC', 'teste-item-passa');
        const rng = new Rng('teste-item-passa', 'team');
        const lineup = [95, 7, 5, 25, 74].map((id) => createInstance(id, rng));
        lineup[1].item = 'leftovers';
        lineup[3].item = 'choiceband';
        const base = useGame.getState().run as RunState;
        const ready: RunState = {
            ...base,
            picks: lineup,
            lineup: lineup.map((p) => p.uid),
            bench: [],
            captainUid: lineup[0].uid,
            status: 'reward',
            rewards: [{ kind: 'item', item: 'scopelens' }],
        };
        useGame.setState({ run: ready });
        useGame.getState().claimReward(0, lineup[1].uid, undefined, lineup[2].uid);
        const after = useGame.getState().run!;
        const itemOf = (i: number) => after.picks.find((p) => p.uid === lineup[i].uid)?.item;
        expect(itemOf(1)).toBe('scopelens');
        expect(itemOf(2)).toBe('leftovers');
        expect(itemOf(3)).toBe('choiceband');
    });
});

describe('Monta pra mim (draft automático, escolha do jogador)', () => {
    const g = () => useGame.getState();
    const squad = () => {
        const run = g().run!;
        return [...run.lineup, ...run.bench].map((u) => run.picks.find((p) => p.uid === u)?.speciesId);
    };
    /** O mesmo draft feito na mão, sempre com a carta de maior nota na vaga (vagas na ordem da formação). */
    const manualBest = (seed: string) => {
        g().newRun('Pallet FC', seed);
        g().chooseFormation(g().run!.formation);
        const cap = g().run!.options;
        const fit = bestFit(cap, formationOf(g().run!.formation).slots);
        g().pick(cap[fit.option].uid, { zone: 'lineup', index: fit.role });
        while (g().run!.status === 'drafting') {
            const run = g().run!;
            const i = run.lineup.indexOf('');
            const slot: SlotRef =
                i >= 0 ? { zone: 'lineup', index: i } : { zone: 'bench', index: run.bench.indexOf('') };
            const role = slotRole(run, slot);
            g().chooseSlot(slot);
            const best = g().run!.options.reduce((b, o) => (slotRating(o, role) > slotRating(b, role) ? o : b));
            g().pick(best.uid);
        }
        return squad();
    };

    it('da formação ao fim: time completo, na escalação, igual ao draft na mão pela melhor carta', () => {
        const hand = manualBest('teste-monta');
        expect(g().run!.autoFrom).toBeUndefined();
        g().newRun('Pallet FC', 'teste-monta');
        const rerolls = g().run!.rerolls;
        g().autoDraft();
        const run = g().run!;
        expect(run.status).toBe('lineup');
        expect(g().screen).toBe('lineup');
        expect(run.picks).toHaveLength(DRAFT_PICKS);
        expect([...run.lineup, ...run.bench].every(Boolean)).toBe(true);
        expect(run.captainUid).toBeTruthy();
        expect(run.autoFrom).toBe(0);
        expect(run.rerolls).toBe(rerolls);
        expect(squad()).toEqual(hand);
        // mesma seed, mesmo time
        g().newRun('Pallet FC', 'teste-monta');
        g().autoDraft();
        expect(squad()).toEqual(hand);
    });

    it('no meio do draft: guarda o que já foi escolhido e respeita o capitão marcado', () => {
        g().newRun('Pallet FC', 'teste-monta-meio');
        g().chooseFormation('2-2');
        const cap = g().run!.options[2];
        g().autoDraft(cap.uid);
        expect(g().run!.captainUid).toBe(cap.uid);
        expect(g().run!.formation).toBe('2-2');

        g().newRun('Pallet FC', 'teste-monta-meio');
        g().chooseFormation('2-2');
        g().pick(g().run!.options[0].uid, { zone: 'lineup', index: 4 });
        g().chooseSlot({ zone: 'bench', index: 0 });
        const benchPick = g().run!.options[1];
        g().pick(benchPick.uid);
        g().autoDraft();
        const run = g().run!;
        expect(run.status).toBe('lineup');
        expect(run.autoFrom).toBe(2);
        expect(run.bench[0]).toBe(benchPick.uid);
        expect(new Set(run.picks.map((p) => p.speciesId)).size).toBe(DRAFT_PICKS);
    });
});

describe('evolução em quadra na Pokédex', () => {
    it('a forma evoluída de copas antigas conta como "jogou"', () => {
        const meowth = createInstance(52, new Rng('evo', 'dex'));
        const persian = { ...meowth, speciesId: 53, evolved: 1 };
        const dex = markEvolvedPlayed({ 52: { ...EMPTY_ENTRY, matches: 2 } }, [
            { picks: [persian] } as unknown as RunState,
        ]);
        expect(dex[53].matches).toBe(1);
        expect(markEvolvedPlayed(dex, [{ picks: [persian] } as unknown as RunState])).toBe(dex);
    });

    it('copas guardadas dão o "jogou" da forma de antes pelas evoluções do resumo de cada partida', () => {
        const run = {
            picks: [],
            results: [{ stats: { players: [], digest: { evolutions: [{ uid: 'x', from: 4, into: 5 }] } } }],
        } as unknown as RunState;
        const dex = markEvolvedPlayed({ 5: { ...EMPTY_ENTRY, matches: 1 } }, [run]);
        expect(dex[4].matches).toBe(1);
        expect(markEvolvedPlayed(dex, [run])).toBe(dex);
    });

    it('a forma de antes ganha a figurinha da carta (shiny), sem inventar Destaque', () => {
        const card = { ...createInstance(5, new Rng('evo', 'sticker')), uid: 'x', shiny: true, special: null };
        const run = {
            picks: [{ ...card, evolved: 1, special: { kind: 'destaque' } }],
            results: [{ stats: { players: [], digest: { evolutions: [{ uid: 'x', from: 4, into: 5 }] } } }],
        } as unknown as RunState;
        const dex = markEvolvedPlayed({}, [run]);
        expect(dex[4].editions).toBe(EDITION_BIT.shiny);
        expect(dex[5].editions).toBe(EDITION_BIT.shiny);
    });
});

describe('gol da copa: replay guardado no save', () => {
    it('a partida com gol seu guarda time e ordens; rodar de novo dá o mesmo placar e passa pelo save', () => {
        const g = () => useGame.getState();
        let found = false;
        for (let k = 0; k < 12 && !found; k++) {
            const seed = `teste-replay${k}`;
            g().newRun('Pallet FC', seed);
            const rng = new Rng(seed, 'demo');
            const lineup = [143, 68, 151, 142, 150].map((id) => createInstance(id, rng));
            const bench = [149, 25].map((id) => createInstance(id, rng));
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
                },
            });
            const team = playerTeam(g().run!);
            g().lockMatch(team);
            const run = g().run!;
            const m = runMatch(FUTSAL_5, team, run.opponents[0], `${seed}-stage-0`);
            g().recordResult(m);
            const res = g().run!.results[0];
            if (m.score[0] === 0) {
                expect(res.replay).toBeUndefined();
                continue;
            }
            found = true;
            expect(res.replay?.engine).toBe(ENGINE_VERSION);
            const again = runMatch(FUTSAL_5, res.replay!.team, run.opponents[0], `${seed}-stage-0`, {
                orders: res.replay!.orders,
                snapshots: false,
            });
            expect(again.score).toEqual(res.score);
            const saved = migrateSave(JSON.parse(JSON.stringify({ run: g().run })), SAVE_VERSION);
            expect(saved.run?.results[0].replay?.team.lineup).toHaveLength(5);
        }
        expect(found).toBe(true);
    });
});

describe('Pokédex com evolução no meio da partida', () => {
    it('a forma de antes também jogou (a linha da partida já vem com a forma nova)', () => {
        const g = () => useGame.getState();
        useGame.setState({ dex: {} });
        g().newRun('Pallet FC', 'dex-evo');
        const base = g().run!;
        // time de quem evolui, com a barra quase cheia: evolui na primeira bola parada depois de fazer algo
        const rng = new Rng('dex-evo', 'team');
        const picks = [1, 4, 7, 60, 66, 92, 147].map((id) => ({ ...createInstance(id, rng), evo: 13.5 }));
        const run: RunState = {
            ...base,
            status: 'lineup',
            picks,
            lineup: picks.slice(0, 5).map((p) => p.uid),
            bench: picks.slice(5).map((p) => p.uid),
            captainUid: picks[0].uid,
        };
        useGame.setState({ run });
        const team = playerTeam(g().run!, 0xe8423f);
        g().lockMatch(team);
        const m = runMatch(FUTSAL_5, team, run.opponents[0], 'dex-evo-0');
        const ev = m.events.find((e) => e.type === 'evolve' && e.team === 0 && e.minute >= 2);
        expect(ev?.type).toBe('evolve');
        if (ev?.type !== 'evolve') return;
        g().recordResult(m);
        expect(g().dex[ev.into].matches).toBe(1);
        expect(g().dex[ev.from].matches).toBe(1);
        expect(g().dex[ev.from].minutes).toBeGreaterThan(0);
        // a passagem em quadra se divide entre as duas formas (sem dobrar)
        const line = playerLines(m).find((l) => l.team === 0 && l.uid === ev.uid)!;
        expect(g().dex[ev.from].minutes + g().dex[ev.into].minutes).toBe(line.minutes);
    });

    it('evoluiu no apito inicial ou no último minuto: as duas formas jogaram (a de segundos também)', () => {
        const rng = new Rng('dex-evo-borda', 'team');
        const picks = [16, 4, 7, 60, 66].map((id) => ({ ...createInstance(id, rng), evo: 13.5 }));
        const team = {
            name: 'Pallet FC',
            lineup: picks,
            bench: [],
            tactic: 'balanced' as const,
            color: 0xe8423f,
            formation: '1-2-1' as const,
            captainUid: picks[0].uid,
            manualSubs: true,
        };
        const m = runMatch(FUTSAL_5, team, useGame.getState().run!.opponents[0], 'dex-evo-borda');
        const ev = m.events.find((e) => e.type === 'evolve' && e.team === 0);
        expect(ev?.type).toBe('evolve');
        if (ev?.type !== 'evolve') return;
        // a mesma partida com a evolução no minuto 0,2 (barra cheia de antes) e no 39,8 (antes do apito final)
        for (const minute of [0.2, 39.8]) {
            const moved = { ...m, events: m.events.map((e) => (e === ev ? { ...e, minute } : e)) };
            const dex = recordMatchInDex({}, dexLines(moved), true);
            expect(dex[ev.from].matches, `minuto ${minute}`).toBe(1);
            expect(dex[ev.into].matches, `minuto ${minute}`).toBe(1);
            const line = playerLines(m).find((l) => l.team === 0 && l.uid === ev.uid)!;
            expect(dex[ev.from].minutes + dex[ev.into].minutes).toBe(line.minutes);
        }
    });
});

describe('Duelo na Pokédex', () => {
    it('quem jogou pelo seu lado vira "jogou" (as duas formas de quem evoluiu), o rival fica "visto"', () => {
        const rng = new Rng('duelo-dex', 'team');
        const mk = (ids: number[], name: string, evo?: number) => {
            const ps = ids.map((id) => ({ ...createInstance(id, rng), ...(evo ? { evo } : {}) }));
            return {
                name,
                lineup: ps.slice(0, 5),
                bench: ps.slice(5),
                tactic: 'balanced' as const,
                color: 0x3a7bd5,
                formation: '1-2-1' as const,
                captainUid: ps[0].uid,
                manualSubs: true,
            };
        };
        const host = mk([95, 111, 74, 27, 50], 'Anfitrião');
        const guest = mk([1, 4, 7, 60, 66, 92, 147], 'Convidado', 13.5);
        const m = runMatch(FUTSAL_5, host, guest, 'duelo-dex-0');
        const ev = m.events.find((e) => e.type === 'evolve' && e.team === 1 && e.minute >= 2);
        expect(ev?.type).toBe('evolve');
        if (ev?.type !== 'evolve') return;
        useGame.setState({ dex: {} });
        useGame.getState().recordDuelDex(m, 1);
        const dex = useGame.getState().dex;
        expect(dex[ev.from].matches).toBe(1);
        expect(dex[ev.into].matches).toBe(1);
        // o anfitrião é o rival de quem gravou: visto, não jogou
        expect(dex[95]).toBeDefined();
        expect(dex[95].matches).toBe(0);
    });
});

describe('Ícones escalados', () => {
    it('Ícone que chega como reforço na recompensa também conta (antes só o do draft)', () => {
        useGame.getState().newRun('Pallet FC', 'icone-reforco');
        const rng = new Rng('icone-reforco', 'team');
        const team = [95, 7, 5, 25, 74, 1, 4].map((id) => createInstance(id, rng));
        const mew = { ...createInstance(151, rng), special: { kind: 'icone' as const, title: 'Mew Ancestral' } };
        const ready: RunState = {
            ...(useGame.getState().run as RunState),
            picks: team,
            lineup: team.slice(0, 5).map((p) => p.uid),
            bench: team.slice(5).map((p) => p.uid),
            captainUid: team[0].uid,
            status: 'reward',
            rewards: [{ kind: 'pokemon', inst: mew, from: null }],
        };
        useGame.setState({ run: ready, records: { cups: 0, titles: 0, perfect: 0, icones: 2 } });
        useGame.getState().claimReward(0, team[6].uid);
        expect(useGame.getState().run!.bench).toContain(mew.uid);
        expect(useGame.getState().records.icones).toBe(3);
    });
});

describe('sequência de títulos', () => {
    it('nova copa por cima de uma em andamento zera a sequência (como abandonar); depois do fim, não', () => {
        const records = { cups: 3, titles: 3, perfect: 0, streak: 3, bestStreak: 3 };
        useGame.setState({ records });
        useGame.getState().newRun('Pallet FC', 'seq-a');
        useGame.getState().newRun('Pallet FC', 'seq-b');
        expect(useGame.getState().records.streak).toBe(0);
        expect(useGame.getState().records.bestStreak).toBe(3);
        useGame.setState({ records, run: { ...useGame.getState().run!, status: 'champion' } });
        useGame.getState().newRun('Pallet FC', 'seq-c');
        expect(useGame.getState().records.streak).toBe(3);
    });
});

describe('estilo dos gritos: o padrão virou o Novo (0.8.9)', () => {
    it('save antigo no Gen 1 sem ter escolhido conta como padrão e vai pro Novo', () => {
        const old = { ...DEFAULT_SETTINGS, cries: 'legacy' as const, criesChosen: undefined };
        expect(migrateSave({ settings: old }, SAVE_VERSION).settings.cries).toBe('latest');
    });
    it('quem escolheu em Configurações fica com o que escolheu', () => {
        const chosen = { ...DEFAULT_SETTINGS, cries: 'legacy' as const, criesChosen: true };
        expect(migrateSave({ settings: chosen }, SAVE_VERSION).settings.cries).toBe('legacy');
    });
    it('jogador novo começa no Novo', () => {
        expect(DEFAULT_SETTINGS.cries).toBe('latest');
    });
});

describe('Mercado (Copa rápida)', () => {
    const ready = (seed: string, patch: Partial<RunState> = {}): RunState => {
        useGame.getState().newRun('Pallet FC', seed);
        const rng = new Rng(seed, 'team');
        const team = [95, 7, 5, 25, 74, 1, 4].map((id) => createInstance(id, rng));
        return {
            ...(useGame.getState().run as RunState),
            picks: team,
            lineup: team.slice(0, 5).map((p) => p.uid),
            bench: team.slice(5).map((p) => p.uid),
            captainUid: team[0].uid,
            status: 'reward',
            stage: 0,
            rewards: [{ kind: 'item', item: 'scopelens' }],
            results: [{ stage: 0, opponent: 'x', score: [3, 0], shootout: null, won: true }],
            ...patch,
        };
    };

    it('vitória → recompensa → Mercado com o ₽ da vitória → escalação da próxima fase', () => {
        useGame.setState({ run: ready('mercado-fluxo', { money: 4 }) });
        useGame.getState().skipReward();
        let run = useGame.getState().run!;
        expect(run.status).toBe('shop');
        expect(useGame.getState().screen).toBe('shop');
        // 5 da vitória + 3 gols + 2 sem sofrer + 0 de juros (4 guardados)
        expect(run.shop!.earned.total).toBe(10);
        expect(run.money).toBe(14);

        const i = run.shop!.offers.findIndex((o) => o.kind === 'pokemon');
        const offer = run.shop!.offers[i];
        useGame.getState().buyOffer(i, run.bench[0]);
        run = useGame.getState().run!;
        expect(run.money).toBe(14 - offer.price);
        expect(run.shop!.sold).toEqual([i]);
        expect(run.picks.some((p) => offer.kind === 'pokemon' && p.uid === offer.inst.uid)).toBe(true);
        // vendido não vende de novo
        useGame.getState().buyOffer(i, run.bench[1]);
        expect(useGame.getState().run!.money).toBe(run.money);

        useGame.getState().leaveShop();
        run = useGame.getState().run!;
        expect(run.status).toBe('lineup');
        expect(run.stage).toBe(1);
        expect(run.shop).toBeNull();
    });

    it('Patrocínio: até 3, o 4º troca por um que sai; sem ₽ não compra', () => {
        useGame.setState({ run: ready('mercado-patrocinio', { sponsors: ['loja', 'creche', 'cassino'], money: 30 }) });
        useGame.getState().skipReward();
        const run = useGame.getState().run!;
        const i = run.shop!.offers.findIndex((o) => o.kind === 'sponsor');
        useGame.getState().buyOffer(i);
        expect(useGame.getState().run!.sponsors).toHaveLength(3);
        useGame.getState().buyOffer(i, 'creche');
        const after = useGame.getState().run!;
        expect(after.sponsors).toHaveLength(3);
        expect(after.sponsors).not.toContain('creche');
        expect(after.money).toBe(run.money! - 10);

        useGame.setState({ run: { ...after, money: 1, shop: { ...after.shop!, sold: [] } } });
        useGame.getState().buyOffer(0, after.bench[0]);
        expect(useGame.getState().run!.shop!.sold).toEqual([]);
    });

    it('pacote de tipo: abre, você fica com 1 no lugar de um reserva', () => {
        useGame.setState({ run: ready('mercado-pacote', { money: 20 }) });
        useGame.getState().skipReward();
        const i = useGame.getState().run!.shop!.offers.findIndex((o) => o.kind === 'pack');
        useGame.getState().buyOffer(i);
        let run = useGame.getState().run!;
        expect(run.shop!.pack!.length).toBe(3);
        // com o pacote aberto não sai do Mercado
        useGame.getState().leaveShop();
        expect(useGame.getState().run!.status).toBe('shop');
        const card = run.shop!.pack![1];
        useGame.getState().claimPack(1, run.bench[1]);
        run = useGame.getState().run!;
        expect(run.bench[1]).toBe(card.uid);
        expect(run.shop!.pack).toBeUndefined();
    });

    it('não entra um segundo Pokémon da mesma espécie (pacote e vitrine podem trazer o mesmo)', () => {
        useGame.setState({ run: ready('mercado-repetido', { money: 20 }) });
        useGame.getState().skipReward();
        const run = useGame.getState().run!;
        const twin = { ...createInstance(run.picks[0].speciesId, new Rng('gemeo', 'x')), uid: 'gemeo' };
        useGame.setState({ run: { ...run, shop: { ...run.shop!, pack: [twin] } } });
        useGame.getState().claimPack(0, run.bench[0]);
        expect(useGame.getState().run!.picks.some((p) => p.uid === 'gemeo')).toBe(false);
    });

    it('Copa do Dia e copa sem resultado (save antigo) não têm Mercado', () => {
        useGame.setState({ run: ready('mercado-dia', { daily: '2026-10-20' }) });
        useGame.getState().skipReward();
        expect(useGame.getState().run!.status).toBe('lineup');
        useGame.setState({ run: ready('mercado-antigo', { results: [] }) });
        useGame.getState().skipReward();
        expect(useGame.getState().run!.status).toBe('lineup');
    });

    it('Patrocínio de campo vai pro time da partida (carta = campo)', () => {
        const run = ready('mercado-campo', { sponsors: ['academia'] });
        expect(playerTeam(run, 15221311).sponsors).toEqual(['academia']);
        expect(playerTeam({ ...run, sponsors: [] }, 15221311).sponsors).toBeUndefined();
    });
});

describe('Copa longa', () => {
    const start = (seed: string) => {
        useGame.getState().newRun('Pallet FC', seed, undefined, 'longa');
        useGame.getState().autoDraft();
        return useGame.getState().run!;
    };

    it('nasce com o mapa e sem rivais; o time pronto vai pro mapa', () => {
        const run = start('longa-mapa');
        expect(run.mode).toBe('longa');
        expect(run.map?.rows).toBe(9);
        expect(run.opponents).toEqual([]);
        expect(run.status).toBe('map');
        expect(useGame.getState().screen).toBe('map');
    });

    it('casa de partida: rival da prévia na escalação; casa fora do caminho não entra', () => {
        const run = start('longa-casa');
        const far = run.map!.nodes.find((n) => n.row === 4)!;
        useGame.getState().enterNode(far.id);
        expect(useGame.getState().run!.status).toBe('map');
        const first = run.map!.nodes.find((n) => n.row === 0)!;
        useGame.getState().enterNode(first.id);
        const now = useGame.getState().run!;
        expect(now.status).toBe('lineup');
        expect(now.at).toBe(first.id);
        expect(now.opponents[0]?.name).toBeTruthy();
    });

    it('vitória vai pra recompensa e depois pro mapa (sem Mercado); derrota fora da Final é cartão amarelo', () => {
        const run = start('longa-partida');
        useGame.getState().enterNode(run.map!.nodes.find((n) => n.row === 0)!.id);
        const cur = useGame.getState().run!;
        const team = playerTeam(cur, 15221311);
        useGame.getState().lockMatch(team);
        const m = runMatch(FUTSAL_5, team, cur.opponents[0], `${cur.seed}-stage-0`);
        useGame.getState().recordResult(m);
        const after = useGame.getState().run!;
        expect(after.results[0].final).toBe(false);
        if (m.winner === 0) {
            expect(after.status).toBe('reward');
            expect(after.money).toBeGreaterThanOrEqual(5);
            useGame.getState().skipReward();
            expect(useGame.getState().run!.status).toBe('map');
        } else {
            expect(after.status).toBe('map');
            expect(after.cards).toBe(1);
        }
    });

    it('Mercado é casa do mapa: juros ao entrar, sair volta pro mapa', () => {
        const run = start('longa-mercado');
        const first = run.map!.nodes.find((n) => n.row === 0)!;
        const shopNode = first.next
            .map((id) => run.map!.nodes.find((n) => n.id === id)!)
            .find((n) => n.kind === 'mercado');
        if (!shopNode) return;
        useGame.setState({ run: { ...run, at: first.id, money: 12 } });
        useGame.getState().enterNode(shopNode.id);
        const shop = useGame.getState().run!;
        expect(shop.status).toBe('shop');
        expect(shop.money).toBe(14);
        useGame.getState().leaveShop();
        expect(useGame.getState().run!.status).toBe('map');
    });

    it('Treino: barra de evolução enche metade, ou +1 troca', () => {
        const base = start('longa-treino');
        // Charmander no banco: alguém que evolui com certeza
        const evolver = { ...createInstance(4, new Rng('treino', 'x')), uid: 'charmander' };
        const run = { ...base, picks: [...base.picks.slice(0, -1), evolver], bench: [base.bench[0], 'charmander'] };
        expect(evolutionTarget(evolver.speciesId, evolver.uid)).not.toBeNull();
        useGame.setState({ run: { ...run, status: 'treino' } });
        useGame.getState().train('rest');
        expect(useGame.getState().run!.rerolls).toBe(run.rerolls + 1);
        useGame.setState({ run: { ...run, status: 'treino' } });
        useGame.getState().train('evo', evolver.uid);
        expect(useGame.getState().run!.status).toBe('map');
        expect(useGame.getState().run!.picks.find((p) => p.uid === evolver.uid)!.evo).toBe(7);
    });
});

describe('Rota Índigo: fase de grupos', () => {
    it('depois do Treino vem o grupo; 3 rodadas; quem fica entre os 2 primeiros joga a Final contra a Liga Índigo', () => {
        useGame.getState().newRun('Pallet FC', 'grupo-1', undefined, 'longa');
        useGame.getState().autoDraft();
        const run = useGame.getState().run!;
        const treino = run.map!.nodes.find((n) => n.row === run.map!.rows - 1)!;
        // 4 partidas das eliminatórias "jogadas" (só os resultados), parado no Treino
        const results = [0, 1, 2, 3].map((stage) => ({
            stage,
            opponent: 'x',
            score: [2, 1] as [number, number],
            shootout: null,
            won: true,
        }));
        useGame.setState({ run: { ...run, at: treino.id, status: 'treino', results, stage: 3 } });
        useGame.getState().train('rest');
        let now = useGame.getState().run!;
        expect(now.status).toBe('group');
        expect(now.group?.rivals).toHaveLength(3);
        for (let md = 0; md < 3; md++) {
            useGame.getState().playNext();
            now = useGame.getState().run!;
            expect(now.status).toBe('lineup');
            expect(now.stage).toBe(4 + md);
            expect(now.opponents[now.stage].name).toBe(now.group!.rivals[md].name);
            const team = playerTeam(now, 15221311);
            useGame.getState().lockMatch(team);
            useGame
                .getState()
                .recordResult(runMatch(FUTSAL_5, team, now.opponents[now.stage], `${now.seed}-stage-${now.stage}`));
            now = useGame.getState().run!;
            if (now.status === 'eliminated') {
                expect(md).toBe(2);
                return;
            }
            if (now.status === 'reward') useGame.getState().skipReward();
            expect(useGame.getState().run!.status).toBe('group');
        }
        useGame.getState().playNext();
        now = useGame.getState().run!;
        expect(now.stage).toBe(7);
        expect(now.opponents[7].name).toBe('Liga Índigo');
    });

    it('tabela: vitória 3, vitória nos pênaltis 2, derrota nos pênaltis 1', () => {
        const rivals = [0, 1, 2].map((i) => ({ name: `R${i}`, color: 0 }) as never);
        const results = [
            { stage: 4, score: [3, 1] as [number, number], won: true, shootout: null },
            { stage: 5, score: [2, 2] as [number, number], won: true, shootout: [4, 3] },
            { stage: 6, score: [1, 1] as [number, number], won: false, shootout: [2, 4] },
        ];
        const rows = groupTable({ seed: 'tab', teamName: 'Eu', group: { rivals }, results }, 0);
        expect(rows.find((r) => r.you)!.pts).toBe(6);
        expect(rows.reduce((n, r) => n + r.played, 0)).toBe(12);
    });
});
