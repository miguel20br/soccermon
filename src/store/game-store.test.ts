import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { ENGINE_VERSION } from '../engine/config';
import { bestFit, DRAFT_PICKS } from '../engine/draft';
import { evolveInstance } from '../engine/evolution';
import { formationOf } from '../engine/formations';
import { createInstance, slotRating } from '../engine/instance';
import { Rng } from '../engine/rng';
import { SIGNATURE } from '../engine/signature-moves';
import { teachMove } from '../engine/tm';
import { type DuelRecord, mergeDuels } from './duels';
import { liveOf, migrateSave, type RunState, SAVE_VERSION, type SlotRef, slotRole, useGame } from './game-store';
import { EDITION_BIT } from './profile';

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
        }
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
