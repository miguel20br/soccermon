import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { ENGINE_VERSION } from '../engine/config';
import { evolveInstance } from '../engine/evolution';
import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { SIGNATURE } from '../engine/signature-moves';
import { teachMove } from '../engine/tm';
import { liveOf, migrateSave, type RunState, SAVE_VERSION, useGame } from './game-store';

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

describe('partida no meio', () => {
    it('só retoma se for do mesmo motor (save de antes da 0.8.4 recomeça do 0 a 0)', () => {
        const live = { stage: 1, orders: [], tick: 900 };
        expect(liveOf({ stage: 1, live })).toBeNull();
        expect(liveOf({ stage: 1, live: { ...live, engine: ENGINE_VERSION } })?.tick).toBe(900);
        expect(liveOf({ stage: 2, live: { ...live, engine: ENGINE_VERSION } })).toBeNull();
    });
});
