import type { SceneScript } from '../director';

/**
 * Cena 1 do Modo história: abertura em Pallet (docs/planos/historia.md, seção 5). Duas partes, porque no meio a cena
 * entrega pro draft 1 de 3 dos iniciais. Tempo em batidas de 0,5 s (120 por minuto).
 */
export const STARTERS = [1, 4, 7] as const;
export type Starter = (typeof STARTERS)[number];

/** O Blue pega o inicial com vantagem de tipo sobre o seu (como no Red/Blue). */
export const rivalOf = (s: Starter): Starter => (s === 1 ? 4 : s === 4 ? 7 : 1);

const BALL_X: Record<Starter, number> = { 1: 0.42, 4: 0.5, 7: 0.58 };

/** Parte 1: do ginásio antigo ao laboratório (termina no draft). */
export const palletOpening: SceneScript = {
    id: 'pallet',
    bpm: 120,
    steps: [
        // 1. Ginásio de antigamente: a batalha acabava em desmaio
        { at: 0, do: 'cut', stage: 'ginasio' },
        { at: 0, do: 'actor', id: 'geodude', mon: 74, x: 0.3, y: 0.6, dir: 'right' },
        { at: 0, do: 'actor', id: 'machop', mon: 66, x: 0.68, y: 0.6, dir: 'left' },
        { at: 0, do: 'spot', on: ['geodude', 'machop'] },
        { at: 0, do: 'title', text: 'pallet.title.kanto', beats: 5 },
        { at: 1.5, do: 'anim', id: 'geodude', anim: 'Attack' },
        { at: 2, do: 'sound', sfx: 'thud' },
        { at: 2, do: 'anim', id: 'machop', anim: 'Hurt' },
        { at: 2, do: 'camera', shake: true },
        { at: 3, do: 'anim', id: 'machop', anim: 'Faint' },
        { at: 3, do: 'sound', crowd: 'uuh', gain: 0.5 },
        { at: 3.5, do: 'portrait', mon: 66, face: 'pain', side: 'right', beats: 2 },

        // 2. O mesmo ginásio hoje: quadra, trave e torcida
        { at: 6, do: 'cut', stage: 'quadra' },
        { at: 6, do: 'actor', id: 'geodude', mon: 74, x: 0.5, y: 0.43, dir: 'down' },
        { at: 6, do: 'actor', id: 'machop', mon: 66, x: 0.4, y: 0.7, dir: 'upRight' },
        { at: 6, do: 'actor', id: 'ball', prop: 'ball', x: 0.45, y: 0.66 },
        { at: 6, do: 'sound', sample: 'apito' },
        { at: 6, do: 'title', text: 'pallet.title.liga', beats: 5 },
        { at: 7.5, do: 'anim', id: 'machop', anim: 'Shoot' },
        { at: 8, do: 'sound', sfx: 'shot' },
        { at: 8, do: 'walk', id: 'ball', x: 0.57, y: 0.37, beats: 1, hops: 1 },
        { at: 8.2, do: 'anim', id: 'geodude', anim: 'Attack', dir: 'downLeft' },
        { at: 9, do: 'sound', crowd: 'gol', gain: 0.6 },
        { at: 9, do: 'anim', id: 'machop', anim: 'Hop' },

        // 3. Pallet de manhã: o campinho de terra e a trave torta
        { at: 11, do: 'cut', stage: 'pallet' },
        { at: 11, do: 'actor', id: 'eu', trainer: 'red', x: 0.3, y: 0.72 },
        { at: 11, do: 'actor', id: 'ball', prop: 'ball', x: 0.42, y: 0.67 },
        { at: 11, do: 'title', text: 'pallet.title.pallet', beats: 4 },
        { at: 12, do: 'sound', sfx: 'kick' },
        { at: 12, do: 'walk', id: 'ball', x: 0.63, y: 0.39, beats: 1, hops: 1 },
        { at: 13, do: 'sound', sfx: 'post' },
        { at: 13, do: 'walk', id: 'ball', x: 0.4, y: 0.69, beats: 1.5, hops: 2 },

        // 4. Passa o time do Blue, de uniforme; corte pro Blue
        { at: 15, do: 'actor', id: 'pidgey', mon: 16, x: -0.15, y: 0.5, dir: 'right' },
        { at: 15, do: 'walk', id: 'pidgey', x: 1.15, y: 0.5, beats: 3 },
        { at: 15.5, do: 'actor', id: 'rattata', mon: 19, x: -0.15, y: 0.55, dir: 'right' },
        { at: 15.5, do: 'walk', id: 'rattata', x: 1.15, y: 0.55, beats: 3 },
        { at: 18, do: 'actor', id: 'blue', trainer: 'blue', x: 0.72, y: 0.7 },
        { at: 18, do: 'cut', zoom: 1.25, focus: 'blue' },
        { at: 18.5, do: 'say', who: 'who.blue', text: 'pallet.blue.dirt' },

        // 5. O Carvalho na porta do laboratório
        { at: 23, do: 'actor', id: 'oak', trainer: 'oak', x: 0.78, y: 0.33 },
        { at: 23, do: 'cut', zoom: 1.25, focus: 'oak' },
        { at: 23.5, do: 'say', who: 'who.oak', text: 'pallet.oak.call' },

        // 6. Laboratório: três Poké Balls na mesa; entrega pro draft
        { at: 28, do: 'cut', stage: 'lab' },
        { at: 28, do: 'actor', id: 'oak', trainer: 'oak', x: 0.5, y: 0.4 },
        { at: 28, do: 'actor', id: 'ball-1', prop: 'pokeball', x: BALL_X[1], y: 0.48 },
        { at: 28, do: 'actor', id: 'ball-4', prop: 'pokeball', x: BALL_X[4], y: 0.48 },
        { at: 28, do: 'actor', id: 'ball-7', prop: 'pokeball', x: BALL_X[7], y: 0.48 },
        { at: 28.5, do: 'actor', id: 'eu', trainer: 'red', x: 0.2, y: 0.74 },
        { at: 29, do: 'actor', id: 'blue', trainer: 'blue', x: 0.8, y: 0.74 },
        { at: 31, do: 'handoff', to: 'draft' },
    ],
};

/** Parte 2: depois do draft. O seu inicial sai da bola, o Blue pega o de vantagem, o Carvalho dá a Pokédex. */
export function palletChoice(starter: Starter): SceneScript {
    const rival = rivalOf(starter);
    return {
        id: 'pallet-escolha',
        bpm: 120,
        steps: [
            { at: 0, do: 'cut', stage: 'lab' },
            { at: 0, do: 'actor', id: 'oak', trainer: 'oak', x: 0.5, y: 0.4 },
            ...STARTERS.map(
                (s) => ({ at: 0, do: 'actor', id: `ball-${s}`, prop: 'pokeball', x: BALL_X[s], y: 0.48 }) as const,
            ),
            { at: 0, do: 'actor', id: 'eu', trainer: 'red', x: 0.2, y: 0.74 },
            { at: 0, do: 'actor', id: 'blue', trainer: 'blue', x: 0.8, y: 0.74 },
            // o seu sai da bola
            { at: 1, do: 'exit', id: `ball-${starter}` },
            { at: 1, do: 'flash' },
            { at: 1, do: 'actor', id: 'meu', mon: starter, x: 0.4, y: 0.67, dir: 'down', anim: 'Pose' },
            { at: 1, do: 'sound', cry: starter },
            { at: 1.5, do: 'portrait', mon: starter, face: 'joyous', side: 'left', beats: 2.5 },
            // o Blue pega o de vantagem
            { at: 4, do: 'exit', id: `ball-${rival}` },
            { at: 4, do: 'flash' },
            { at: 4, do: 'actor', id: 'dele', mon: rival, x: 0.6, y: 0.67, dir: 'down', anim: 'Pose' },
            { at: 4, do: 'sound', cry: rival },
            { at: 4.5, do: 'say', who: 'who.blue', text: 'pallet.blue.pick', face: { mon: rival, face: 'determined' } },
            { at: 7, do: 'anim', id: 'meu', anim: 'Hop', dir: 'right' },
            { at: 7, do: 'portrait', mon: starter, face: 'angry', side: 'right', beats: 1.5 },
            // o Carvalho: a pesquisa e a Pokédex
            { at: 9, do: 'cut', zoom: 1.2, focus: 'oak' },
            { at: 9, do: 'sound', sfx: 'select' },
            { at: 9.5, do: 'say', who: 'who.oak', text: 'pallet.oak.dex', face: { mon: starter, face: 'inspired' } },
            // o Blue sai na frente
            { at: 16, do: 'cut' },
            {
                at: 16,
                do: 'say',
                who: 'who.blue',
                text: 'pallet.blue.route',
                face: { mon: starter, face: 'determined' },
            },
            { at: 21, do: 'exit', id: 'blue' },
            { at: 21, do: 'walk', id: 'dele', x: 1.15, y: 0.8, beats: 2 },
            // Rota 1: a peneira
            { at: 23, do: 'cut', stage: 'rota1' },
            { at: 23, do: 'actor', id: 'meu', mon: starter, x: 0.56, y: 1.08, dir: 'up' },
            { at: 23, do: 'walk', id: 'meu', x: 0.56, y: 0.64, beats: 3 },
            { at: 23, do: 'title', text: 'pallet.title.route', beats: 5 },
            { at: 24, do: 'actor', id: 'eu', trainer: 'red', x: 0.42, y: 0.68 },
            { at: 26, do: 'anim', id: 'meu', anim: 'Hop', dir: 'down' },
            { at: 26, do: 'sound', cry: starter },
            { at: 28, do: 'end' },
        ],
    };
}
