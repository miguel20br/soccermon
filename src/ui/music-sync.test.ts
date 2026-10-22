import { describe, expect, it } from 'vitest';
import { buildCupMap } from '../engine/cup-map';
import type { useGame } from '../store/game-store';
import { trackOf } from './music-sync';

type S = ReturnType<typeof useGame.getState>;
const map = buildCupMap('musica');
const at = (row: number) => map.nodes.find((n) => n.row === row)?.id ?? null;
const st = (screen: string, run: object) => ({ screen, run }) as unknown as S;

describe('música por tela', () => {
    it('resultado: vitória, derrota, eliminado e campeão', () => {
        const res = (won: boolean, status = 'reward') => ({ status, stage: 2, results: [{ stage: 2, won }] });
        expect(trackOf(st('result', res(true)))).toBe('vitoria-gancho');
        expect(trackOf(st('result', res(false, 'map')))).toBe('derrota');
        expect(trackOf(st('result', res(false, 'eliminated')))).toBe('eliminado');
        expect(trackOf(st('result', res(true, 'champion')))).toBe('campeao');
    });

    it('mapa da Rota: a região da próxima linha; Evento e Treino, a da casa atual', () => {
        const run = (row: number | null) => ({ status: 'map', map, at: row === null ? null : at(row) });
        expect(trackOf(st('map', run(null)))).toBe('rota-1');
        expect(trackOf(st('map', run(1)))).toBe('estrada-da-vitoria'); // Floresta: sem faixa própria
        expect(trackOf(st('map', run(3)))).toBe('mt-moon');
        expect(trackOf(st('event', run(5)))).toBe('mt-moon');
        expect(trackOf(st('map', run(5)))).toBe('cerulean');
        expect(trackOf(st('treino', run(8)))).toBe('estrada-da-vitoria');
    });

    it('telas novas', () => {
        expect(trackOf(st('draft', {}))).toBe('draft');
        expect(trackOf(st('lineup', {}))).toBe('escalacao');
        expect(trackOf(st('reward', {}))).toBe('recompensa');
        expect(trackOf(st('trophies', {}))).toBe('sala');
    });
});
