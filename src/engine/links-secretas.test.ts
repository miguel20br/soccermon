import { describe, expect, it } from 'vitest';
import { FUTSAL_5 } from './config';
import { createInstance } from './instance';
import { computeLinks, LINKS, linkFactor, linksOf } from './links';
import { attributeModifiers } from './modifiers';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import type { TeamSetup } from './state';

// sinergias secretas fase 2 (docs/planos/sinergias-secretas-fase2.md): os gatilhos e o combo só nas de membros certos
const rng = new Rng('secretas', 'test');
const lineupOf = (ids: number[]) => ids.map((id) => createInstance(id, rng));
const secretsOf = (ids: number[]) =>
    computeLinks(lineupOf(ids))
        .filter((l) => l.def.secret)
        .map((l) => [l.def.secret, l.bonus]);

describe('sinergias secretas com bônus (fase 2)', () => {
    it('são 21, com a régua escalonada', () => {
        const ids = new Set(LINKS.flatMap((l) => l.secret ?? []));
        expect(ids.size).toBe(21);
        const bonus = (id: string) => LINKS.find((l) => l.secret === id)?.bonus;
        expect(bonus('mestreAprendiz')).toBe(1.03);
        expect(bonus('rivalAzul')).toBe(1.04);
        expect(bonus('joyJenny')).toBe(1.05);
        expect(bonus('turma')).toBe(1.06);
        expect(bonus('montePrateado')).toBe(1.08);
    });

    it('Mestre e Aprendiz: base + forma final da mesma família (53 famílias, sem o Eevee)', () => {
        expect(LINKS.filter((l) => l.secret === 'mestreAprendiz')).toHaveLength(53);
        expect(LINKS.filter((l) => l.secret === 'familiaCompleta')).toHaveLength(16);
        expect(secretsOf([4, 6, 19, 21, 129])).toEqual([['mestreAprendiz', 1.03]]);
        expect(secretsOf([129, 130, 19, 21, 98])).toEqual([['mestreAprendiz', 1.03]]);
        // estágio do meio não é a forma final; famílias diferentes não ligam; Eevee fica de fora
        expect(secretsOf([4, 5, 19, 21, 98])).toEqual([]);
        expect(secretsOf([4, 9, 19, 21, 98])).toEqual([]);
        expect(secretsOf([133, 134, 19, 21, 98])).toEqual([]);
        // os 3 estágios: Família Completa (+4%) vale por cima do Mestre e Aprendiz
        const trio = lineupOf([1, 2, 3, 19, 98]);
        const links = computeLinks(trio);
        expect(links.filter((l) => l.def.secret).map((l) => l.def.secret)).toEqual([
            'mestreAprendiz',
            'familiaCompleta',
        ]);
        expect(linkFactor(links, trio[0].uid)).toBe(1.04);
        expect(linkFactor(links, trio[3].uid)).toBe(1);
    });

    it('Rival Azul pede 3 das 6 famílias', () => {
        expect(secretsOf([18, 65, 19, 21, 98])).toEqual([]);
        expect(secretsOf([16, 64, 111, 21, 98])).toEqual([['rivalAzul', 1.04]]);
    });

    it('combo só nas de membros certos; as de "2 de N" só têm o bônus', () => {
        const noCombo = [...new Set(LINKS.filter((l) => l.noCombo).map((l) => l.secret))].sort();
        expect(noCombo).toEqual(
            [
                'caboLink',
                'familiaCompleta',
                'jardimCeladon',
                'lorelei',
                'menteSaffron',
                'mestreAprendiz',
                'ninjasFuchsia',
                'quizCinnabar',
                'rivalAzul',
                'torre',
            ].sort(),
        );
        // na partida: Charmander + Charizard (Mestre e Aprendiz) nunca fazem combo; tirando o `noCombo`, fariam
        const setup = (ids: number[], name: string): TeamSetup => ({
            name,
            lineup: lineupOf(ids),
            bench: [],
            formation: '1-2-1',
            tactic: 'balanced',
            color: 0,
        });
        const home = setup([4, 4, 6, 6, 6], 'Mestres');
        const away = setup([19, 20, 21, 22, 16], 'Fora');
        const mestre = LINKS.find((l) => l.id === 'mestre4')!;
        const combos = () => {
            let n = 0;
            for (let seed = 1; seed <= 4; seed++)
                n += runMatch(FUTSAL_5, home, away, seed, { snapshots: false }).events.filter(
                    (e) => e.type === 'combo' && e.link === 'mestre4',
                ).length;
            return n;
        };
        expect(combos()).toBe(0);
        delete mestre.noCombo;
        try {
            expect(combos()).toBeGreaterThan(0);
        } finally {
            mestre.noCombo = true;
        }
    }, 120_000);

    it('carta = campo: o bônus aparece no painel como secreta, sem o nome; a carta não lista a secreta', () => {
        const team = lineupOf([113, 59, 19, 21, 98]);
        const mod = attributeModifiers(team[0], { lineup: team }).find((m) => m.source === 'historia');
        expect(mod).toMatchObject({ factor: 1.05, ref: 'secret', label: 'Sinergia secreta: +5%' });
        expect(linksOf(113).some((l) => l.secret)).toBe(false);
        expect(linksOf(59).some((l) => l.secret)).toBe(false);
    });
});
