import { describe, expect, it } from 'vitest';
import { buildCupOpponents, CROWD, CROWD_ROUTE_START } from './cup';
import { longOpponent } from './cup-map';
import { species } from './data';
import { teamFromRecipe, teamRecipe } from './duel-validate';
import { EVO_THRESHOLD, evoNeeded } from './evolution';
import { attributeModifiers } from './modifiers';

// Times dos líderes (Miguel, 04/11/2026): temáticos, capitão do tipo, sem contra-tipo nem lendário solto
describe('times dos líderes de ginásio', () => {
    const teams = Array.from({ length: 60 }, (_, i) => buildCupOpponents(`lider-${i}`)).flat();
    const byName = (name: string) => teams.filter((t) => t.name === name);
    const typesOf = (id: number) => species(id).types;

    it('a Misty não leva Fogo e ninguém leva lendário fora do tipo', () => {
        for (const t of byName('Cerulean Cascata'))
            for (const p of [...t.lineup, ...t.bench]) expect(typesOf(p.speciesId)).not.toContain('Fire');
        for (const t of byName('Celadon Arco-Íris'))
            for (const p of [...t.lineup, ...t.bench]) expect(typesOf(p.speciesId)).not.toContain('Fire');
        for (const t of byName('Cerulean Cascata'))
            for (const p of [...t.lineup, ...t.bench])
                if (species(p.speciesId).tier === 'legendary') expect(typesOf(p.speciesId)).toContain('Water');
    });

    it('o capitão é do tipo do líder e a Misty tem 4+ titulares Água', () => {
        for (const t of byName('Cerulean Cascata')) {
            const cap = t.lineup.find((p) => p.uid === t.captainUid)!;
            expect(typesOf(cap.speciesId)).toContain('Water');
            expect(t.lineup.filter((p) => typesOf(p.speciesId).includes('Water')).length).toBeGreaterThanOrEqual(4);
        }
    });
});

// Torcida a favor (Miguel, 05/11/2026): menos zebra contra o jogador, só no PVE
describe('torcida a favor', () => {
    it('Copa -4%, Rota -7% nas 3 primeiras e -4% depois; a Final da Rota sem torcida (era a partida mais fácil)', () => {
        for (const o of buildCupOpponents('torcida')) expect(o.crowd).toBe(CROWD);
        expect(longOpponent('torcida', 0, 'jogo', []).crowd).toBe(CROWD_ROUTE_START);
        expect(longOpponent('torcida', 2, 'jogo', []).crowd).toBe(CROWD_ROUTE_START);
        expect(longOpponent('torcida', 3, 'jogo', []).crowd).toBe(CROWD);
        expect(longOpponent('torcida', 6, 'ginasio', []).crowd).toBe(CROWD);
        expect(longOpponent('torcida', 7, 'final', []).crowd).toBeUndefined();
    });

    it('carta = campo: o modificador sai com o rótulo e o fator', () => {
        const o = buildCupOpponents('torcida')[0];
        const m = attributeModifiers(o.lineup[0], { crowd: o.crowd }).find((x) => x.source === 'torcida');
        expect(m).toMatchObject({ factor: CROWD, attrs: 'all', label: 'Torcida a favor: −4%' });
    });

    it('não vaza pro x1: a receita do Duelo e da Liga não leva a torcida', () => {
        expect(teamFromRecipe(teamRecipe(buildCupOpponents('torcida')[0]), 'a').crowd).toBeUndefined();
    });

    it('o rival evolui com a mesma barra do jogador', () => {
        expect(evoNeeded(1)).toBe(EVO_THRESHOLD);
    });
});
