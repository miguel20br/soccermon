import { describe, expect, it } from 'vitest';
import {
    DRAFT_SIZE,
    draftChoices,
    draftClose,
    draftCost,
    draftEnter,
    draftMatch,
    draftOf,
    draftPick,
    draftScore,
    draftSlot,
} from './draft';
import { DRAFT_FICHAS, DRAFT_GAMES, DRAFT_PRIZES, LEVELS } from './rules';
import { finishMatch, newUltimate, teamStrength, type UltimateSave, ultimateOf } from './ultimate';

const T0 = Date.UTC(2026, 10, 25, 15); // quarta
const WEEK = 7 * 86400000;
const base = (fichas = 0): UltimateSave => ({ ...newUltimate('draft', T0), fichas });

/** Entra e monta o time escolhendo sempre a 1ª carta. */
const built = (u = base()) => fill(draftEnter(u, '1-2-1', T0)!);
function fill(x: UltimateSave): UltimateSave {
    while (draftSlot(x.draft.run!) < DRAFT_SIZE) x = draftPick(x, draftChoices(x)[0].uid);
    return x;
}
/** Começa a próxima partida e apita com o placar. */
function play(u: UltimateSave, score: [number, number], shootout: [number, number] | null = null) {
    const live = draftMatch(u, 'Pallet FC', 0xff0000)!;
    const started = { ...u, live: { ...live, orders: [], tick: 0, engine: 0 } };
    return finishMatch(started, { score, shootout }, T0);
}

describe('Draft do Time Ultimate', () => {
    it('a 1ª entrada da semana é grátis; a 2ª cobra; sem Fichas não entra; semana nova volta a ser grátis', () => {
        const u = base(DRAFT_FICHAS);
        expect(draftCost(u, T0)).toBe(0);
        const a = draftClose(play(built(u), [0, 1]));
        expect(a.fichas).toBe(DRAFT_FICHAS);
        expect(draftCost(a, T0)).toBe(DRAFT_FICHAS);
        const b = draftEnter(a, '2-2', T0)!;
        expect(b.fichas).toBe(0);
        expect(draftEnter(draftClose(play(fill(b), [0, 1])), '2-2', T0)).toBeNull();
        expect(draftCost(a, T0 + WEEK)).toBe(0);
    });

    it('não começa outra campanha com uma em andamento', () => {
        const u = draftEnter(base(1000), '1-2-1', T0)!;
        expect(draftEnter(u, '1-2-1', T0)).toBeNull();
    });

    it('capitão 1 de 5, depois 1 de 5 por vaga: sem espécie repetida, mesmas cartas pra mesma vaga', () => {
        const u = draftEnter(base(), '1-2-1', T0)!;
        const cap = draftChoices(u);
        expect(cap).toHaveLength(5);
        expect(draftChoices(u).map((c) => c.uid)).toEqual(cap.map((c) => c.uid));
        const x = built();
        const team = x.draft.run!.team;
        expect(team.every(Boolean)).toBe(true);
        expect(new Set(team.map((p) => p!.speciesId)).size).toBe(DRAFT_SIZE);
        expect(team.some((p) => p!.uid === x.draft.run!.captainUid)).toBe(true);
        // o time do Draft não entra no Clube
        expect(x.cards).toEqual([]);
    });

    it('a pontuação durante a montagem bate com a força da partida no fim', () => {
        const x = built();
        const live = draftMatch(x, 'Pallet FC', 0)!;
        expect(draftScore(x.draft.run!).power).toBeCloseTo(teamStrength(live.home));
    });

    it('4 partidas do Fácil ao Mestre; venceu todas, prêmio máximo em Meus pacotes', () => {
        let x = built();
        for (let k = 0; k < DRAFT_GAMES; k++) {
            expect(draftMatch(x, 'P', 0)!.level).toBe(LEVELS[k]);
            x = play(x, [3, 1]);
        }
        expect(x.draft.run!.prize).toEqual(DRAFT_PRIZES[DRAFT_GAMES]);
        expect(x.extraPacks).toBe(DRAFT_PRIZES[DRAFT_GAMES].packs);
        expect(x.bigPacks).toBe(DRAFT_PRIZES[DRAFT_GAMES].big);
        expect(x.draft.best).toBe(DRAFT_GAMES);
        expect(draftMatch(x, 'P', 0)).toBeNull();
    });

    it('perdeu, acabou: paga pelas vitórias; empate só passa vencendo nos pênaltis', () => {
        let x = play(built(), [2, 2], [4, 3]);
        expect(x.draft.run!.prize).toBeNull();
        x = play(x, [1, 1], null);
        expect(x.draft.run!.prize).toEqual(DRAFT_PRIZES[1]);
        expect(x.extraPacks).toBe(DRAFT_PRIZES[1].packs);
        expect(draftMatch(x, 'P', 0)).toBeNull();
        expect(draftClose(x).draft.run).toBeNull();
    });

    it('a partida do Draft não conta nas Batalhas (placar, Fichas, objetivos, passe)', () => {
        const x = built();
        const after = play(x, [5, 0]);
        expect(after.played).toBe(0);
        expect(after.wins).toBe(0);
        expect(after.fichas).toBe(x.fichas);
        expect(after.objectives).toEqual(x.objectives);
        expect(after.pass).toEqual(x.pass);
        expect(after.last).toBeNull();
        expect(after.live).toBeNull();
    });

    it('save: sem o campo nasce vazio; a campanha volta igual do JSON; partida aberta do Draft fica marcada', () => {
        const old = JSON.parse(JSON.stringify(base())) as Record<string, unknown>;
        delete old.draft;
        expect(ultimateOf(old).draft).toEqual({ runs: 0, free: '', best: 0, run: null });
        const x = play(built(), [2, 0]);
        const live = draftMatch(x, 'P', 0)!;
        const open = { ...x, live: { ...live, orders: [], tick: 0, engine: 0 } };
        const back = ultimateOf(JSON.parse(JSON.stringify(open)));
        expect(back.draft).toEqual(x.draft);
        expect(draftOf({ run: { formation: 'xx' } }).run).toBeNull();
    });
});
