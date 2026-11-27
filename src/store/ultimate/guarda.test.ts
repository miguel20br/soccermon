import { describe, expect, it } from 'vitest';
import { createInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { evoPaths, evoPreview, newEvo } from './evolutions';
import { FICHAS, STARTERS } from './rules';
import { cappedFichas, cardPrice, newUltimate, pickable } from './ultimate';

/**
 * Guarda da economia do Time Ultimate (auditoria de 27/11/2026, `scripts/balance/quebrador-ut.ts`). Conta pura, sem
 * motor: se um número mudar e reabrir o furo, isto avisa.
 *
 * O do Pular passa desde 27/11/2026 (acima do teto a partida paga 0 Fichas, era 10). O da Evolução ainda falha (por isso
 * `it.fails`): a Bronze de 240 Fichas evolui pra 90+. Com o conserto, troque `it.fails` por `it`.
 */

/** Farmador: 8 h por dia de Pular no Difícil, 15 s por partida (JOGAR, Pular, Continuar). */
const FARM_MATCHES = (8 * 3600) / 15;
/**
 * Teto de Fichas de partida por dia do farmador: 1.000. O jogador ativo (6 partidas por dia no Difícil) ganha ~600 por dia
 * somando tudo (partida, objetivos, passe, pacote aberto, venda; robô: 576 por dia, 3 saves x 30 dias); 8 h de Pular podem render no
 * máximo umas 1,5 vezes isso, não 30.
 */
const FARM_DAY_MAX = 1000;
/** O que o jogador ativo ganha na 1ª semana (robô: 465 por dia). Um time 85+ não pode custar menos que isso. */
const ATIVO_SEMANA = 7 * 465;

describe('guarda da economia do Time Ultimate', () => {
    it('8 h de Pular no Difícil não passam do teto de Fichas por dia', () => {
        let paid = 0;
        for (let i = 0; i < FARM_MATCHES; i++) paid += cappedFichas(paid, FICHAS.dificil.win);
        expect(paid).toBeLessThanOrEqual(FARM_DAY_MAX);
    });

    it.fails('um time titular 85+ custa mais que a 1ª semana do jogador ativo (comprando ou evoluindo)', () => {
        const u = newUltimate('guarda');
        // cada espécie que dá pra escolher com Fichas: o preço dela, se ela chega a 85+ comprada ou com Evolução/Treino
        const cost: number[] = [];
        for (const metal of ['bronze', 'prata', 'ouro'] as const)
            for (const id of pickable(u, metal)) {
                const card = { ...createInstance(id, new Rng('guarda', `${id}`)), shiny: false };
                const best = Math.max(
                    viewInstance(card).overall,
                    ...evoPaths(card).map((path) => viewInstance(evoPreview(card, newEvo(card, path))).overall),
                );
                if (best >= 85) cost.push(cardPrice(id));
            }
        const five = cost.sort((a, b) => a - b).slice(0, STARTERS);
        expect(five).toHaveLength(STARTERS);
        expect(five.reduce((a, b) => a + b, 0)).toBeGreaterThan(ATIVO_SEMANA);
    });
});
