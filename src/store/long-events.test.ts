import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { FUTSAL_5 } from '../engine/config';
import { nextNodes } from '../engine/cup-map';
import { createInstance, viewInstance } from '../engine/instance';
import { Rng } from '../engine/rng';
import { runMatch } from '../engine/runners/batch-runner';
import { playerTeam, type RunState, useGame } from './game-store';
import { outOf } from './long-cup';
import { EVENT_IDS, eventChoices, type LongEvent, resolveEvent, rollEvent, withKnownEvents } from './long-events';

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

    it('eventos de região só na região deles; o Juiz só com amarelo', () => {
        const run = longRun('ev-reg');
        const only = (id: string, at: string, extra: Partial<RunState> = {}) =>
            rollEvent({ ...run, ...extra, at, eventsSeen: EVENT_IDS.filter((x) => x !== id) }).id;
        const nodeAt = (row: number) => run.map!.nodes.find((n) => n.row === row)!.id;
        expect(only('fosseis', nodeAt(1))).toBe('entrevista');
        expect(only('fosseis', nodeAt(3))).toBe('fosseis');
        expect(only('lendario', nodeAt(3))).toBe('entrevista');
        expect(only('lendario', nodeAt(6))).toBe('lendario');
        expect(only('juiz', nodeAt(1), { cards: 0 })).toBe('entrevista');
        expect(only('juiz', nodeAt(1), { cards: 1 })).toBe('juiz');
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
        // a trombada é sempre entre dois titulares (com reserva, parar saía de graça)
        for (let k = 0; k < 20; k++)
            for (const u of rollEvent({ ...run, at: `r1c${k % 3}`, seed: `tromba-${k}` }, 'carrinho').uids!)
                expect(run.lineup).toContain(u);
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
        const sold = resolveEvent(run, ev, 'vender', sub, newCap)!;
        expect(sold.money).toBe(25);
        expect(sold.captainUid).toBe(newCap);
        expect(sold.picks.some((p) => p.uid === run.captainUid)).toBe(false);
        expect(sold.lineup).toContain(sub);
    });

    it('vender o capitão que está no banco não deixa ninguém fantasma no time (a próxima partida quebrava)', () => {
        const base = longRun('ev-cap');
        const k = base.lineup.indexOf(base.captainUid!);
        const run = {
            ...base,
            lineup: base.lineup.map((u, i) => (i === k ? base.bench[0] : u)),
            bench: [base.captainUid!, 'charm'],
        };
        const sold = resolveEvent(run, { id: 'capitao' }, 'vender', 'charm', run.lineup[0])!;
        const uids = new Set(sold.picks.map((p) => p.uid));
        expect([...sold.lineup, ...sold.bench].filter((u) => !uids.has(u))).toEqual([]);
        expect(sold.bench).toEqual(['charm']);
        expect(sold.lineup).toEqual(run.lineup);
    });

    it('entrevista muda o próximo rival', () => {
        const run = longRun('ev-5');
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
        const creche: RunState = { ...run, out: { charm: 2 }, outWhy: { charm: 'creche' } };
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

describe('eventos novos da revisão da Rota', () => {
    it('Fósseis: Omanyte ou Kabuto no lugar do reserva escolhido; a Pedra da Lua enche a barra de quem evolui com ela', () => {
        const base = longRun('ev-fossil');
        const ev = rollEvent(base, 'fosseis');
        expect(ev.cards!.map((c) => c.speciesId)).toEqual([138, 140]);
        const helix = resolveEvent(base, ev, 'helix', base.bench[0])!;
        expect(helix.picks.some((p) => p.speciesId === 138)).toBe(true);
        expect(helix.picks.some((p) => p.uid === base.bench[0])).toBe(false);
        // sem Clefairy/Jigglypuff/Nidorina/Nidorino a Pedra fica desligada
        expect(eventChoices(base, ev).find((c) => c.id === 'pedra')!.ok).toBe(false);
        const clef = { ...createInstance(35, new Rng('p', 'c')), uid: 'clef' };
        const run = {
            ...base,
            picks: [...base.picks.filter((p) => p.uid !== 'charm'), clef],
            bench: [base.bench[0], 'clef'],
        };
        const stone = resolveEvent(run, ev, 'pedra', 'clef')!;
        expect(stone.picks.find((p) => p.uid === 'clef')!.evo).toBe(14);
    });

    it('Pássaro lendário e Equipe Rocket: o desafio vale pra próxima partida do mapa, com o rival +2', () => {
        const run = longRun('ev-desafio');
        expect(resolveEvent(run, { id: 'lendario' }, 'desafiar')!.challenge).toBe('lendario');
        expect(resolveEvent(run, { id: 'lendario' }, 'deixar')!.challenge).toBeUndefined();
        const holder = run.lineup[1];
        const withItem = { ...run, picks: run.picks.map((p) => (p.uid === holder ? { ...p, item: 'leftovers' } : p)) };
        const lost = resolveEvent(withItem, { id: 'rocket' }, 'item', holder)!;
        expect(lost.picks.find((p) => p.uid === holder)!.item).toBeNull();
        const gone = resolveEvent(run, { id: 'rocket' }, 'reserva', run.bench[0])!;
        expect(gone.bench).toEqual(['charm']);
        expect(resolveEvent(run, { id: 'rocket' }, 'encarar')!.challenge).toBe('rocket');
        // o assalto não tem saída de graça
        expect(eventChoices(run, { id: 'rocket' }).every((c) => c.id !== 'seguir')).toBe(true);
    });

    it('Juiz: paga ₽10 ou o melhor reserva vai embora pra tirar o amarelo', () => {
        const run = { ...longRun('ev-juiz'), cards: 1, money: 12 };
        const ev = rollEvent(run, 'juiz');
        expect(resolveEvent(run, ev, 'pagar')).toMatchObject({ cards: 0, money: 2 });
        const best = resolveEvent(run, ev, 'reserva')!;
        expect(best.cards).toBe(0);
        expect(best.bench).toHaveLength(1);
        expect(best.bench).not.toContain(ev.uids![0]);
        expect(eventChoices({ ...run, money: 9 }, ev).find((c) => c.id === 'pagar')!.ok).toBe(false);
        // a nota do mapa guarda o nome de quem saiu ("{a} vai embora"): ele não está mais no time
        const name = viewInstance(run.picks.find((p) => p.uid === ev.uids![0])!).displayName;
        useGame.setState({ run: { ...run, status: 'event', event: ev } });
        useGame.getState().chooseEvent('reserva');
        expect(useGame.getState().run!.eventNote).toMatchObject({ id: 'juiz', choice: 'reserva', names: [name] });
    });

    it('Centro Pokémon: tira o amarelo ou traz de volta quem está fora', () => {
        const run = { ...longRun('ev-centro'), cards: 1, out: { charm: 2 }, outWhy: { charm: 'lesao' as const } };
        expect(resolveEvent(run, { id: 'centro' }, 'amarelo')!.cards).toBe(0);
        expect(resolveEvent(run, { id: 'centro' }, 'voltar')!.out).toBeUndefined();
        const fresh = { ...run, cards: 0, out: undefined };
        expect(
            eventChoices(fresh, { id: 'centro' })
                .filter((c) => c.ok)
                .map((c) => c.id),
        ).toEqual(['seguir']);
    });

    it('no store: Ovo choca no banco depois de 2 partidas; a aposta do Blue paga ou cobra na partida seguinte', () => {
        const run = longRun('ev-ovo');
        const egg = resolveEvent(run, { id: 'ovo', egg: 147 }, 'ficar', run.bench[0])!;
        expect(egg.bench).toEqual(['charm']);
        expect(egg.egg).toEqual({ left: 2, speciesId: 147 });
        const bet = resolveEvent({ ...egg, money: 10 }, { id: 'aposta' }, 'topar')!;
        expect(bet.bet).toBe(6);
        // duas partidas pelo mapa: a 1ª ganha por 1 (perde a aposta), a 2ª o Ovo choca
        const map = bet.map!;
        const jogo = map.nodes.find((n) => n.row === 0 && n.kind === 'jogo')!;
        useGame.setState({ run: { ...bet, status: 'map', at: null, path: [] } });
        useGame.getState().enterNode(jogo.id);
        const team = useGame.getState().run!;
        const play = () => {
            const r = useGame.getState().run!;
            const locked = playerTeam(r, 0xe8423f);
            useGame.setState({ run: { ...r, lockedTeam: locked } });
            const m = runMatch(FUTSAL_5, locked, r.opponents[r.stage], `${r.seed}-stage-${r.stage}`);
            useGame.getState().recordResult(m);
            return m.score;
        };
        expect(team.status).toBe('lineup');
        const [a, b] = play();
        const after1 = useGame.getState().run!;
        expect(after1.results.at(-1)!.bonus?.bet).toBe(a - b >= 2 ? 6 : -6);
        expect(after1.bet).toBeNull();
        expect(after1.egg).toEqual({ left: 1, speciesId: 147 });
        // volta pro mapa e joga a próxima partida
        useGame.setState({ run: { ...after1, status: 'map', rewards: [] } });
        const next = nextNodes(map, after1.at!).find((n) => n.kind !== 'jogo')!;
        useGame.getState().enterNode(next.id);
        let r = useGame.getState().run!;
        useGame.setState({ run: { ...r, status: 'map', shop: null, event: null, rewards: [] } });
        const m2 = nextNodes(map, next.id).find((n) => n.kind === 'jogo' || n.kind === 'ginasio')!;
        useGame.getState().enterNode(m2.id);
        play();
        r = useGame.getState().run!;
        expect(r.egg).toBeNull();
        expect(r.picks.some((p) => p.speciesId === 147)).toBe(true);
        expect(r.bench.some((u) => r.picks.find((p) => p.uid === u)?.speciesId === 147)).toBe(true);
        expect(r.eventNote).toMatchObject({ id: 'ovo', choice: 'nasceu' });
    });
});

describe('save de antes da revisão da Rota', () => {
    it('evento cortado aberto vira um sorteio novo; a nota dele some; o resto fica igual', async () => {
        const run = longRun('ev-velho');
        const old = {
            ...run,
            status: 'event' as const,
            event: { id: 'olheiro', cards: [] } as unknown as LongEvent,
            eventNote: { id: 'creche', choice: 'deixar', cost: 0 },
        };
        const fixed = withKnownEvents(old);
        expect(EVENT_IDS as readonly string[]).toContain(fixed.event!.id);
        expect(fixed.eventNote).toBeNull();
        expect(fixed.picks).toBe(old.picks);
        const ok = { ...run, status: 'event' as const, event: rollEvent(run, 'aposta') };
        expect(withKnownEvents(ok)).toBe(ok);
        // o save v6 de verdade passa pela mesma porta sem mudar
        const { readFileSync } = await import('node:fs');
        const backup = JSON.parse(readFileSync('scripts/fixtures/backup-v6-pt.json', 'utf8'));
        expect(withKnownEvents(backup.save.run)).toEqual(backup.save.run);
    });
});
