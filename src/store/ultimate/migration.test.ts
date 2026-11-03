import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../../cloud/reconcile-plan';
import { FUTSAL_5 } from '../../engine/config';
import { runMatch } from '../../engine/runners/batch-runner';
import { migrateSave, type PersistedSave, SAVE_VERSION, savePart, useGame } from '../game-store';
import { FICHAS, FIRST_STEPS, PACK_MAX, PACK_SIZE } from './rules';
import { homeTeam, outcomeOf, ultimateRival } from './ultimate';

const T0 = 1_800_000_000_000;
const withoutUltimate = ({ ultimate: _, ...rest }: PersistedSave) => rest;

describe('save do Time Ultimate (v10)', () => {
    it('save v6 de verdade abre igual e ganha a fatia vazia com os pacotes de boas-vindas', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(save.ultimate).toMatchObject({ cards: [], fichas: 0, packs: PACK_MAX, live: null, last: null });
            // o save de hoje (v9, sem a fatia) passa pela migração nova sem mudar nada do resto
            const v9 = JSON.parse(JSON.stringify(withoutUltimate(save)));
            const now = migrateSave(v9, 9);
            expect(withoutUltimate(now)).toEqual(withoutUltimate(save));
            expect(now.ultimate.cards).toEqual([]);
        }
    });

    it('a coleção, as Fichas e o time sobrevivem ao save, à migração e à nuvem', () => {
        const g = useGame.getState;
        g().ultimateOpenPack(T0);
        g().ultimateOpenPack(T0);
        expect(g().ultimateOpenPack(T0)).toBeNull();
        const u = g().ultimate;
        expect(u.cards).toHaveLength(2 * PACK_SIZE);
        const home = homeTeam(u, 'Eu', 0);
        const rival = ultimateRival(u.salt, 0, 'dificil', 60);
        g().ultimateStart({ n: 0, level: 'dificil', home, rival });
        const m = runMatch(FUTSAL_5, home, rival, 'ut-0');
        g().ultimateFinish(m);
        // os objetivos fechados esperam o Resgatar nos Pendentes (não pagam no apito); a vitória fecha o "vença 1", então
        // sem isso o teste só falhava quando o time sorteado (sal aleatório) ganhava
        const done = g().ultimate.last?.objectives ?? [];
        const prizes = g().ultimate.pending.filter((p) => p.kind === 'prize' && p.from === 'objective');
        expect(prizes.map((p) => (p.kind === 'prize' ? p.ref : '')).sort()).toEqual([...done].sort());
        // + os Primeiros passos: o 1º pacote, a 1ª partida (e a 1ª vitória)
        const first = g().ultimate.firsts.reduce((s, id) => s + FIRST_STEPS.find((f) => f.id === id)!.fichas, 0);
        expect(g().ultimate.fichas).toBe(FICHAS.dificil[outcomeOf(m.score)] + first);
        expect(g().ultimate.live).toBeNull();
        // a Pokédex marca quem jogou, como no Duelo
        expect(g().dex[home.lineup[0].speciesId]?.matches ?? 0).toBeGreaterThan(0);
        const saved = migrateSave(JSON.parse(JSON.stringify(savePart(g()))), SAVE_VERSION);
        expect(saved.ultimate).toEqual(g().ultimate);
        // aparelho sem o Time Ultimate x conta com ele: o que andou fica
        const empty = migrateSave({}, SAVE_VERSION);
        expect(mergeSaves(empty, saved, 'device').ultimate.fichas).toBe(saved.ultimate.fichas);
        expect(mergeSaves(saved, empty, 'cloud').ultimate.cards).toHaveLength(2 * PACK_SIZE);
    });
});
