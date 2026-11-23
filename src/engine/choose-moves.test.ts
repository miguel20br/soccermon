import { describe, expect, it } from 'vitest';
import { chooseMoves, pickableMoves } from './choose-moves';
import { species } from './data';
import { evolveInstance } from './evolution';
import { createInstance } from './instance';
import { Rng } from './rng';
import { SIGNATURE } from './signature-moves';

const mon = (id: number) => createInstance(id, new Rng('choose', String(id)));

describe('escolher golpes', () => {
    it('troca um golpe por outro do learnset, mantém a assinatura e o número de vagas', () => {
        const p = mon(6);
        const sig = SIGNATURE[6];
        const other = pickableMoves(p).find((m) => !p.moves.includes(m))!;
        const slot = p.moves.findIndex((m) => m !== sig);
        const next = chooseMoves(
            p,
            p.moves.map((m, i) => (i === slot ? other : m)),
        )!;
        expect(next.moves).toHaveLength(p.moves.length);
        expect(next.moves).toContain(other);
        expect(next.moves).toContain(sig);
        expect(next.picked).toEqual([other]);
    });

    it('recusa golpe fora do learnset, repetido, tamanho errado e sem a assinatura', () => {
        const p = mon(6);
        const sig = SIGNATURE[6];
        const notLearnable = 'splash';
        expect(species(6).learnset).not.toContain(notLearnable);
        expect(chooseMoves(p, [...p.moves.slice(0, 3), notLearnable])).toBeNull();
        expect(chooseMoves(p, [p.moves[0], p.moves[0], p.moves[1], p.moves[2]])).toBeNull();
        expect(chooseMoves(p, p.moves.slice(0, 3))).toBeNull();
        const without = pickableMoves(p).filter((m) => m !== sig && !p.moves.includes(m));
        expect(chooseMoves(p, [...without.slice(0, p.moves.length)])).toBeNull();
    });

    it('voltar ao padrão limpa o picked, e a escolha sobrevive à evolução quando a forma nova aprende', () => {
        const p = mon(4); // Charmander
        const sig = SIGNATURE[4];
        const other = pickableMoves(p).find((m) => !p.moves.includes(m) && species(5).learnset.includes(m))!;
        const slot = p.moves.findIndex((m) => m !== sig);
        const chosen = chooseMoves(
            p,
            p.moves.map((m, i) => (i === slot ? other : m)),
        )!;
        const evolved = evolveInstance(chosen, 5);
        expect(evolved.moves).toContain(other);
        expect(evolved.picked).toEqual([other]);
        const back = chooseMoves(
            chosen,
            chosen.moves.map((m, i) => (i === slot ? p.moves[slot] : m)),
        )!;
        expect(back.picked).toBeUndefined();
    });

    it('save antigo (sem picked) segue válido', () => {
        const p = mon(25);
        expect(p.picked).toBeUndefined();
        expect(chooseMoves(p, p.moves)?.moves).toEqual(p.moves);
    });
});
