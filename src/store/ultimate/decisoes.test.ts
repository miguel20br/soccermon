import { describe, expect, it } from 'vitest';
import { species } from '../../engine/data';
import { monFromRecipe, monProblems, monRecipe } from '../../engine/duel-validate';
import { createInstance, evolutionBonus, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { evoPaths, evoPreview, newEvo } from './evolutions';
import { MATCH_FICHAS_DAY_MAX, PAID_EVO_MAX, TRAIN_STEPS } from './rules';
import { buyCard, buyPick, cappedFichas, newUltimate, pickable, pickOptions, startEvo, type UtPick } from './ultimate';

// decisões do Miguel depois da auditoria do Time Ultimate (27/11/2026)
const T = Date.UTC(2026, 11, 1, 15);
const mon = (id: number, uid: string): PokemonInstance => ({ ...createInstance(id, new Rng('dec', uid)), uid });
const ovr = (c: PokemonInstance) => viewInstance(c).overall;
const finals = (c: PokemonInstance, club: PokemonInstance[] = []) =>
    evoPaths(c, club).map((p) => ovr(evoPreview(c, newEvo(c, p))));

describe('Fichas acima do teto do dia', () => {
    it('acima do teto a partida não paga Fichas (era 10)', () => {
        expect(cappedFichas(MATCH_FICHAS_DAY_MAX - 30, 80)).toBe(30);
        expect(cappedFichas(MATCH_FICHAS_DAY_MAX, 80)).toBe(0);
    });
});

describe('Evolução da carta comprada, uma de cada no Clube e Treino', () => {
    it(`Bronze/Prata comprada com Fichas evolui só até ${PAID_EVO_MAX}; a de pacote evolui livre`, () => {
        const u = { ...newUltimate('dec', T), fichas: 1e6 };
        // Machop de 240 Fichas: virava Machamp 95; agora a cadeia para antes de passar de 74 (ou nem começa)
        const bought = buyCard(u, 66)!.card;
        expect(bought.paid).toBe(true);
        for (const f of finals(bought)) expect(f).toBeLessThanOrEqual(PAID_EVO_MAX);
        expect(Math.max(...finals(mon(66, 'pack')))).toBeGreaterThan(90);
        // Pick pago (Comprar) também sai marcado; o Pick de prêmio não
        const shop = buyPick(u, 'bronze')!;
        expect(pickOptions(shop, shop.picks.at(-1)!).every((c) => c.paid)).toBe(true);
        expect(pickOptions(u, u.picks[0]).some((c) => c.paid)).toBe(false);
        // toda Bronze/Prata da loja fica em 74 ou menos, com Evolução ou Treino
        for (const id of [...pickable(u, 'bronze'), ...pickable(u, 'prata')]) {
            const c = buyCard(u, id)!.card;
            for (const f of finals(c)) expect(f, species(id).name).toBeLessThanOrEqual(PAID_EVO_MAX);
        }
        // carta antiga (sem a marca) segue livre
        expect(finals({ ...bought, paid: undefined })).toEqual(finals({ ...bought, paid: undefined, uid: 'x' }));
        expect(Math.max(...finals({ ...bought, paid: undefined }))).toBeGreaterThan(90);
    });

    it('uma de cada no Clube: a loja não oferece linha que você já tem e a Evolução não vira espécie do Clube', () => {
        const u = { ...newUltimate('dec', T), fichas: 1e6, cards: [mon(68, 'machamp'), mon(6, 'charizard')] };
        const shop = [...pickable(u, 'bronze'), ...pickable(u, 'prata'), ...pickable(u, 'ouro')];
        for (const id of [4, 5, 6, 66, 67, 68]) expect(shop).not.toContain(id);
        expect(buyCard(u, 66)).toBeNull();
        // Charmander de pacote com o Charizard no Clube: não evolui (viraria um segundo Charizard)
        const char = mon(4, 'char');
        expect(evoPaths(char, [...u.cards, char])).toEqual([]);
        expect(startEvo({ ...u, cards: [...u.cards, char] }, 'char', [5, 6])).toBeNull();
        // o Pick também pula as linhas do Clube quando tem outra opção
        const p: UtPick = { n: 3, min: 'bronze', exact: true, uid: 'gift-x', from: 'event', ref: '' };
        for (const c of pickOptions(u, p)) expect([4, 5, 6, 66, 67, 68]).not.toContain(c.speciesId);
    });

    it('Treino: +1 em tudo por passo (era +2)', () => {
        const tauros = mon(128, 'tauros');
        const done = evoPreview(tauros, newEvo(tauros, []));
        expect(done.trained).toBe(TRAIN_STEPS);
        expect(done.evolved).toBeUndefined();
        expect(evolutionBonus(done)).toBe(TRAIN_STEPS);
        // o Duelo do UT leva o Treino junto (sem isso a carta jogava com 3 a menos); fora do UT, não vale
        expect(monFromRecipe(monRecipe(done), 'x').trained).toBe(TRAIN_STEPS);
        expect(monProblems(monRecipe(done), '', TRAIN_STEPS)).toEqual([]);
        expect(monProblems(monRecipe(done), '')).toEqual([': treino']);
    });
});
