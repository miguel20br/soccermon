import { describe, expect, it, vi } from 'vitest';
import { buildCupMap } from '../engine/cup-map';
import type { MatchEvent } from '../engine/state';
import type { useGame } from '../store/game-store';
import { matchMusic, moveOf, penaltyMusic, trackOf } from './music-sync';

const music = vi.hoisted(() => ({ played: [] as [string | null, string | undefined][] }));
vi.mock('../game/music', async (orig) => ({
    ...(await orig<typeof import('../game/music')>()),
    playMusic: (id: string | null, section?: string) => music.played.push([id, section]),
}));

type S = ReturnType<typeof useGame.getState>;
const map = buildCupMap('musica');
const at = (row: number) => map.nodes.find((n) => n.row === row)?.id ?? null;
const st = (screen: string, run: object) => ({ screen, run }) as unknown as S;

describe('música por tela', () => {
    it('regra da troca: avançar na copa, entrar na partida, voltar (Home, sair de uma parada, menus)', () => {
        for (const [a, b] of [
            ['home', 'draft'],
            ['draft', 'lineup'],
            ['match', 'result'],
            ['result', 'reward'],
            ['reward', 'map'],
            ['map', 'shop'],
            ['map', 'event'],
            ['shop', 'lineup'],
        ] as const)
            expect(moveOf(a, b)).toBe('avanca');
        expect(moveOf('lineup', 'match')).toBe('partida');
        for (const [a, b] of [
            ['draft', 'home'],
            ['result', 'home'],
            ['shop', 'map'],
            ['treino', 'map'],
            ['home', 'settings'],
            ['profile', 'trophies'],
        ] as const)
            expect(moveOf(a, b)).toBe('volta');
        expect(moveOf('result', 'result')).toBeUndefined();
    });

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
        expect(trackOf(st('credits', {}))).toBe('ultima-partida');
    });

    it('Pressão final: começou, fica até o apito mesmo com o placar empatado', () => {
        music.played.length = 0;
        const brock = { opponent: 'Pewter Rochedo', half: 2 }; // o clube do Brock
        matchMusic({ ...brock, minute: 15, pressure: false });
        matchMusic({ ...brock, minute: 18, pressure: true });
        matchMusic({ ...brock, minute: 19, pressure: false }); // empatou: o motor encerra a pressão
        matchMusic({ ...brock, minute: 20, pressure: false });
        matchMusic({ ...brock, minute: 20, pressure: false, ended: true });
        expect(music.played.map(([, sec]) => sec)).toEqual(['nivel1', 'pressao', 'pressao', 'pressao', 'fim']);
        expect(music.played[0][0]).toBe('partida-brock-2t');
        // partida nova: o 1º tempo zera, e o 2º tempo começa sem pressão
        matchMusic({ ...brock, half: 1, minute: 1, pressure: false });
        matchMusic({ ...brock, minute: 11, pressure: false });
        expect(music.played.at(-1)).toEqual(['partida-brock-2t', 'nivel1']);
    });

    it('Lt. Surge: o tema dele no VERSUS, a partida padrão', () => {
        music.played.length = 0;
        const surge = { opponent: 'Vermilion Voltagem', half: 1, minute: 0, pressure: false };
        matchMusic({ ...surge, intro: true });
        matchMusic(surge);
        expect(music.played).toEqual([
            ['tema-ltsurge', undefined],
            ['partida-1t', 'nivel1'],
        ]);
    });

    it('Erika, Koga, Sabrina, Blaine e Giovanni: tema no VERSUS, partida padrão', () => {
        for (const [club, id] of [
            ['Celadon Arco-Íris', 'erika'],
            ['Fuchsia Ninjas', 'koga'],
            ['Saffron Mentes', 'sabrina'],
            ['Cinnabar Vulcão', 'blaine'],
            ['Viridian Terra', 'giovanni'],
        ]) {
            music.played.length = 0;
            matchMusic({ opponent: club, half: 1, minute: 0, pressure: false, intro: true });
            expect(music.played, club).toEqual([[`tema-${id}`, undefined]]);
        }
    });

    it('pênaltis: espera entre as cobranças, e o fim na decisiva (ganhou ou perdeu pelo placar dela)', () => {
        const pen = (tick: number, shootout: [number, number]) =>
            ({ type: 'penalty', tick, shootout, by: 0, gk: 0, scored: true, round: 1 }) as unknown as MatchEvent;
        const ganhou = [pen(100, [1, 0]), pen(140, [1, 1]), pen(180, [2, 1])];
        expect(penaltyMusic([], 50)).toBeNull();
        expect(penaltyMusic(ganhou, 90)).toBe('espera');
        expect(penaltyMusic(ganhou, 179)).toBe('espera');
        expect(penaltyMusic(ganhou, 180)).toBe('ganhou');
        expect(penaltyMusic([pen(100, [0, 1])], 120)).toBe('perdeu');
        music.played.length = 0;
        matchMusic({ half: 2, minute: 20, pressure: true, ended: true, penaltis: 'espera' });
        matchMusic({ half: 2, minute: 20, pressure: true, ended: true, penaltis: 'perdeu' });
        expect(music.played).toEqual([
            ['penaltis-espera', undefined],
            ['penaltis-perdeu', undefined],
        ]);
    });
});
