import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '../../engine/config';
import { evoPaths } from './evolutions';
import { FICHAS, FICHAS_PACK_PRICE, FIRST_STEPS } from './rules';
import {
    finishMatch,
    firstStep,
    homeTeam,
    lastPacks,
    momentGoal,
    newUltimate,
    openPack,
    redeem,
    startEvo,
    type UltimateSave,
    ultimateOf,
    ultimateRival,
} from './ultimate';

// segunda, 02/11/2026, meio-dia em Brasília
const MON = Date.UTC(2026, 10, 2, 15);
const pay = (id: string) => FIRST_STEPS.find((f) => f.id === id)!.fichas;
const live = (u: UltimateSave): UltimateSave => ({
    ...u,
    live: {
        n: 0,
        level: 'normal',
        home: homeTeam(u, 'Eu', 0),
        rival: ultimateRival(u.salt, 0, 'normal', 60),
        orders: [],
        tick: 0,
        engine: ENGINE_VERSION,
    },
});

describe('Primeiros passos', () => {
    it('somam o preço de 1 Pacote Mini na loja', () => {
        expect(FIRST_STEPS.reduce((s, f) => s + f.fichas, 0)).toBe(FICHAS_PACK_PRICE);
    });

    it('cada passo paga uma vez só, na hora em que você faz', () => {
        let u = newUltimate('fs', MON);
        u = openPack(u, MON)!.u;
        expect(u.firsts).toEqual(['pack']);
        expect(u.fichas).toBe(pay('pack'));
        u = openPack(u, MON)!.u;
        expect(u.fichas).toBe(pay('pack'));
        const again = firstStep(firstStep(u, 'lineup'), 'lineup');
        expect(again.fichas).toBe(pay('pack') + pay('lineup'));
        u = startEvo(again, again.cards[0].uid, evoPaths(again.cards[0])[0])!;
        expect(u.firsts).toContain('evo');
        expect(u.fichas).toBe(pay('pack') + pay('lineup') + pay('evo'));
    });

    it('a 1ª partida e a 1ª vitória pagam no apito e aparecem no prêmio', () => {
        let u = openPack(openPack(newUltimate('fs2', MON), MON)!.u, MON)!.u;
        const f0 = u.fichas;
        u = finishMatch(live(u), { score: [0, 1], shootout: null }, MON);
        expect(u.last?.firsts).toEqual(['play']);
        expect(u.fichas).toBe(f0 + FICHAS.normal.loss + pay('play'));
        const f1 = u.fichas;
        u = finishMatch(live(u), { score: [2, 0], shootout: null }, MON);
        expect(u.last?.firsts).toEqual(['win']);
        // a vitória ainda fecha o objetivo do dia "vença 1" (+40) e "jogue 2" (+30), que esperam o Resgatar
        expect(u.fichas).toBe(f1 + FICHAS.normal.win + pay('win'));
        expect(redeem(u).fichas).toBe(f1 + FICHAS.normal.win + pay('win') + 40 + 30);
        u = finishMatch(live(u), { score: [2, 0], shootout: null }, MON);
        expect(u.last?.firsts).toBeUndefined();
    });

    it('o save guarda só os passos que existem', () => {
        expect(ultimateOf({ firsts: ['pack', 'xyz', 'pack', 3] }).firsts).toEqual(['pack']);
        expect(ultimateOf({}).firsts).toEqual([]);
    });
});

describe('objetivo do JOGAR', () => {
    it('mostra os Primeiros passos até acabarem; depois, o objetivo mais perto de fechar', () => {
        const u = newUltimate('mg', MON);
        expect(momentGoal({ ...u, firsts: ['pack', 'lineup'] }, MON)).toEqual({ kind: 'first', n: 2, of: 5 });
        const all = { ...u, firsts: FIRST_STEPS.map((f) => f.id) };
        // nada andou: o primeiro da lista
        expect(momentGoal(all, MON)).toMatchObject({ kind: 'objective', o: { id: 'd-play' }, n: 0 });
        // 3 de 4 gols (75%) passa de 1 de 2 partidas (50%)
        const prog = { ...all, objectives: { ...all.objectives, prog: { 'd-play': 1, 'd-goals': 3 } } };
        expect(momentGoal(prog, MON)).toMatchObject({ o: { id: 'd-goals' }, n: 3 });
        // o que já pagou sai da conta
        const done = { ...prog, objectives: { ...prog.objectives, done: ['d-goals'] } };
        expect(momentGoal(done, MON)).toMatchObject({ o: { id: 'd-play' }, n: 1 });
    });
});

describe('Abrir agora no pós-jogo', () => {
    it('conta os pacotes que a partida deu: objetivos, insígnia e marcos do passe', () => {
        const last = {
            score: [3, 0],
            shootout: null,
            outcome: 'win',
            level: 'dificil',
            fichas: 0,
            rival: '',
            seen: false,
        } as const;
        expect(lastPacks({ ...last, score: [3, 0] })).toEqual({ mini: 0, big: 0 });
        // d-goals = 1 Mini; w-win = 2 Grandes; insígnia = 1 Grande; marco 2 = 1 Mini, marco 10 = 1 Grande
        expect(
            lastPacks({ ...last, score: [3, 0], objectives: ['d-goals', 'w-win'], badge: true, marks: [2, 3, 10] }),
        ).toEqual({ mini: 2, big: 4 });
    });
});
