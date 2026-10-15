import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { migrateSave, type RunState, SAVE_VERSION, useGame } from './game-store';

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
});
