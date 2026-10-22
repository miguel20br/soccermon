import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { createInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { type RunState, useGame } from './game-store';
import { outOf } from './long-cup';
import { EVENT_IDS, eventChoices, type LongEvent, resolveEvent, rollEvent } from './long-events';

/** Copa longa pronta, com um Charmander (evolui) no banco. */
function longRun(seed: string): RunState {
    useGame.getState().newRun('Pallet FC', seed, undefined, 'longa');
    useGame.getState().autoDraft();
    const run = useGame.getState().run!;
    const charm = { ...createInstance(4, new Rng(seed, 'x')), uid: 'charm' };
    const leaving = run.bench[1];
    return {
        ...run,
        picks: [...run.picks.filter((p) => p.uid !== leaving), charm],
        bench: [run.bench[0], 'charm'],
        money: 10,
        at: 'r1c0',
    };
}

describe('eventos da Copa longa', () => {
    it('mesmo lugar, mesmo evento; não repete o já visto', () => {
        const run = longRun('ev-1');
        expect(rollEvent(run)).toEqual(rollEvent(run));
        for (const id of EVENT_IDS) {
            const seen = EVENT_IDS.filter((x) => x !== id);
            expect(['entrevista', id]).toContain(rollEvent({ ...run, eventsSeen: [...seen] }).id);
        }
    });

    it('todo evento tem uma escolha possível mesmo sem ₽, e nenhuma deixa o ₽ negativo', () => {
        const run = longRun('ev-2');
        for (const id of EVENT_IDS) {
            const ev: LongEvent = { ...rollEvent({ ...run, eventsSeen: EVENT_IDS.filter((x) => x !== id) }), id };
            const choices = eventChoices({ ...run, money: 0 }, ev);
            expect(choices.some((c) => c.ok)).toBe(true);
            for (const c of choices.filter((x) => x.cost > 0)) expect(c.ok).toBe(false);
        }
    });

    it('carrinho: você escolhe quem para (2 partidas) ou paga o fisioterapeuta', () => {
        const run = longRun('ev-3');
        const ev: LongEvent = { id: 'carrinho', uids: [run.lineup[1], run.lineup[2]] };
        expect(resolveEvent(run, ev, 'parar')).toBeNull();
        expect(resolveEvent(run, ev, 'parar', run.lineup[3])).toBeNull();
        expect(resolveEvent(run, ev, 'parar', run.lineup[2])!.out).toEqual({ [run.lineup[2]]: 2 });
        const fisio = resolveEvent(run, ev, 'fisio')!;
        expect(fisio.money).toBe(6);
        expect(fisio.out).toBeUndefined();
    });

    it('patrocinador: dois reservas por uma carta; capitão: vende, o reserva entra e você escolhe o novo', () => {
        const run = longRun('ev-4');
        const card = { ...createInstance(149, new Rng('ev', 'c')), uid: 'dragonite' };
        const two = resolveEvent(run, { id: 'patrocinador', cards: [card] }, 'aceitar')!;
        expect(two.bench).toEqual(['dragonite']);
        expect(two.picks).toHaveLength(run.picks.length - 1);
        const ev: LongEvent = { id: 'capitao' };
        const sub = run.bench[0];
        const newCap = run.lineup.find((u) => u !== run.captainUid)!;
        expect(resolveEvent(run, ev, 'vender', sub)).toBeNull();
        const sold = resolveEvent(run, ev, 'vender', sub, 0, newCap)!;
        expect(sold.money).toBe(25);
        expect(sold.captainUid).toBe(newCap);
        expect(sold.picks.some((p) => p.uid === run.captainUid)).toBe(false);
        expect(sold.lineup).toContain(sub);
    });

    it('creche e treino puxado: barra de evolução e fica fora; entrevista muda o próximo rival', () => {
        const run = longRun('ev-5');
        const creche = resolveEvent(run, { id: 'creche' }, 'deixar', 'charm')!;
        expect(creche.picks.find((p) => p.uid === 'charm')!.evo).toBe(14);
        expect(creche.out).toEqual({ charm: 2 });
        expect(resolveEvent(run, { id: 'entrevista' }, 'provocar')!).toMatchObject({ rivalShift: 1, money: 14 });
        expect(resolveEvent(run, { id: 'entrevista' }, 'respeito')!.rivalShift).toBe(-1);
    });

    it('no store: o evento abre na casa "?" e a escolha volta pro mapa; quem está fora não entra na partida', () => {
        const run = longRun('ev-6');
        const map = run.map!;
        const evNode = map.nodes.find((n) => n.row === 1 && n.kind === 'evento')!;
        const from = map.nodes.find((n) => n.row === 0 && n.next.includes(evNode.id))!;
        useGame.setState({ run: { ...run, status: 'map', at: from.id } });
        useGame.getState().enterNode(evNode.id);
        const open = useGame.getState().run!;
        expect(open.status).toBe('event');
        const none = eventChoices(open, open.event!).find((c) => c.need === 'none' && c.ok)!;
        useGame.getState().chooseEvent(none.id);
        const back = useGame.getState().run!;
        expect(back.status).toBe('map');
        expect(back.eventsSeen).toEqual([open.event!.id]);
        expect(back.eventNote).toEqual({ id: open.event!.id, choice: none.id, cost: none.cost });
    });

    it('quem está fora tem selo com o motivo e as partidas, e não entra em quadra pela escalação', () => {
        const run = longRun('ev-out');
        const creche = resolveEvent(run, { id: 'creche' }, 'deixar', 'charm')!;
        expect(outOf(creche, 'charm')).toEqual({ why: 'creche', n: 2 });
        const ev: LongEvent = { id: 'carrinho', uids: [run.lineup[1], run.lineup[2]] };
        const hurt = resolveEvent(creche, ev, 'parar', run.lineup[2])!;
        expect(outOf(hurt, run.lineup[2])).toEqual({ why: 'lesao', n: 2 });
        expect(outOf(hurt, 'charm')).toEqual({ why: 'creche', n: 2 });
        expect(outOf(hurt, run.lineup[0])).toBeNull();
        // save de antes do motivo: só "Fora"
        expect(outOf({ out: { x: 1 } }, 'x')).toEqual({ why: 'fora', n: 1 });

        useGame.setState({ run: { ...hurt, status: 'lineup' } });
        const charmAt = { zone: 'bench' as const, index: hurt.bench.indexOf('charm') };
        // o da Creche não entra no lugar de um titular (nem tocando primeiro no titular)
        useGame.getState().swapSlots(charmAt, { zone: 'lineup', index: 0 });
        useGame.getState().swapSlots({ zone: 'lineup', index: 0 }, charmAt);
        expect(useGame.getState().run!.bench).toEqual(hurt.bench);
        // o titular machucado sai pro banco no lugar de um reserva disponível
        const free = { zone: 'bench' as const, index: hurt.bench.findIndex((u) => u !== 'charm') };
        useGame.getState().swapSlots({ zone: 'lineup', index: 2 }, free);
        expect(useGame.getState().run!.bench).toContain(run.lineup[2]);
        expect(useGame.getState().run!.lineup).not.toContain(run.lineup[2]);
    });
});
