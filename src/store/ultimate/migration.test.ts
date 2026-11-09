import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../../cloud/reconcile-plan';
import { FUTSAL_5 } from '../../engine/config';
import { runMatch } from '../../engine/runners/batch-runner';
import { migrateSave, type PersistedSave, SAVE_VERSION, savePart, useGame } from '../game-store';
import { FICHAS, FIRST_STEPS, OPEN_FICHAS, PACK_SIZE, PACK_START, POINTS_TO_FICHAS } from './rules';
import { homeTeam, newUltimate, outcomeOf, rollPack, ultimateOf, ultimateRival } from './ultimate';

const T0 = 1_800_000_000_000;
const withoutUltimate = ({ ultimate: _, ...rest }: PersistedSave) => rest;

describe('save do Time Ultimate (v10)', () => {
    it('save v6 de verdade abre igual e ganha a fatia vazia com os pacotes de boas-vindas', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(save.ultimate).toMatchObject({ cards: [], fichas: 0, packs: PACK_START, live: null, last: null });
            expect(save.ultimate).not.toHaveProperty('packPoints');
            // o save de hoje (v9, sem a fatia) passa pela migração nova sem mudar nada do resto
            const v9 = JSON.parse(JSON.stringify(withoutUltimate(save)));
            const now = migrateSave(v9, 9);
            expect(withoutUltimate(now)).toEqual(withoutUltimate(save));
            expect(now.ultimate.cards).toEqual([]);
        }
    });

    it('a coleção, as Fichas e o time sobrevivem ao save, à migração e à nuvem', () => {
        const g = useGame.getState;
        // o relógio guarda até PACK_MAX: o save nasce em T0 pra só ter os de boas-vindas
        useGame.setState({ ultimate: newUltimate('mig', T0) });
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
        // + os 2 pacotes abertos (moeda única: o que eram pontos de pacote)
        expect(g().ultimate.fichas).toBe(FICHAS.dificil[outcomeOf(m.score)] + first + 2 * OPEN_FICHAS);
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

    it('moeda única (09/11): os pontos de pacote de um save de prévia viram Fichas, uma vez só', () => {
        const card = rollPack(newUltimate('pts', T0))[0];
        const old = {
            ...newUltimate('pts', T0),
            fichas: 100,
            packPoints: 37,
            sold: [{ card, points: 3 }],
        };
        const u = ultimateOf(JSON.parse(JSON.stringify(old)));
        expect(u.fichas).toBe(100 + 37 * POINTS_TO_FICHAS);
        expect(u).not.toHaveProperty('packPoints');
        // o Desfazer da venda velha cobra em Fichas o que ela pagou em pontos
        expect(u.sold).toEqual([{ card, fichas: 3 * POINTS_TO_FICHAS }]);
        // pelo save inteiro e de volta: não converte de novo
        const save = migrateSave({ ultimate: old } as unknown as Partial<PersistedSave>, SAVE_VERSION);
        expect(save.ultimate.fichas).toBe(100 + 37 * POINTS_TO_FICHAS);
        const again = migrateSave(JSON.parse(JSON.stringify(save)), SAVE_VERSION);
        expect(again.ultimate).toEqual(save.ultimate);
        // fatia vazia (a produção hoje) e save sem os pontos: nada muda
        expect(ultimateOf(undefined).fichas).toBe(0);
        expect(ultimateOf({ ...newUltimate('x', T0), fichas: 40 }).fichas).toBe(40);
    });
});
