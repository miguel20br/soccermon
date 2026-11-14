import type { StoryKey } from '../i18n/story';

/**
 * Diretor de cena (docs/planos/historia.md, seção 6): uma cena é uma lista de passos marcados em batidas. Este arquivo
 * é a parte pura (ordem, tempo, adiantar, pular, elenco); quem desenha é o `StoryScene` do Phaser.
 */

/** Direções na ordem das linhas das folhas PMD (0 = baixo, 2 = direita, 4 = cima, 6 = esquerda). */
export const DIRS = ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft'] as const;
export type Dir = (typeof DIRS)[number];

export type StageId = 'ginasio' | 'quadra' | 'pallet' | 'lab' | 'rota1';
export type TrainerId = 'red' | 'leaf' | 'blue' | 'oak';
export type Emotion =
    | 'happy'
    | 'determined'
    | 'joyous'
    | 'surprised'
    | 'sigh'
    | 'inspired'
    | 'shouting'
    | 'crying'
    | 'angry'
    | 'pain'
    | 'dizzy'
    | 'sad'
    | 'teary';
export type Sound =
    | { sfx: 'kick' | 'shot' | 'post' | 'select' | 'thud' | 'goal' | 'whistle' }
    | { sample: 'apito' | 'apito-curto' }
    | { crowd: 'gol' | 'vaia' | 'uuh' }
    | { cry: number };

/** x e y em fração do palco (0..1). */
export type Step =
    /** Corte seco. Com `stage`, troca o cenário e tira todo mundo; sem, só reenquadra a câmera. */
    | { do: 'cut'; stage?: StageId; zoom?: number; focus?: string }
    /** Põe um ator: Pokémon (`mon`), treinador (entra com pulinho) ou objeto. */
    | {
          do: 'actor';
          id: string;
          mon?: number;
          trainer?: TrainerId;
          prop?: 'ball' | 'pokeball';
          x: number;
          y: number;
          dir?: Dir;
          anim?: string;
      }
    /** Anda até (x, y) em `beats` batidas, com a animação Walk (bola quica `hops` vezes). */
    | { do: 'walk'; id: string; x: number; y: number; beats: number; hops?: number }
    /** Animação PMD uma vez (volta ao Idle no fim; Faint e as de laço ficam). */
    | { do: 'anim'; id: string; anim: string; dir?: Dir }
    | { do: 'exit'; id: string }
    /** Retrato PMD com emoção, no canto, por `beats` batidas (sem fala: o Pokémon "responde" com a cara). */
    | { do: 'portrait'; mon: number; face: Emotion; side?: 'left' | 'right'; beats?: number }
    /** Caixa de diálogo digitando com bipe; `face` mostra o retrato de quem reage. */
    | { do: 'say'; who: StoryKey; text: StoryKey; face?: { mon: number; face: Emotion } }
    /** Letreiro grande, palavra por palavra. */
    | { do: 'title'; text: StoryKey; beats?: number }
    | { do: 'camera'; zoom?: number; focus?: string; beats?: number; shake?: boolean }
    /** Holofote: escurece o palco e acende embaixo de quem está na lista (`null` apaga). */
    | { do: 'spot'; on: string[] | null }
    | { do: 'flash' }
    | ({ do: 'sound'; gain?: number } & Sound)
    /** Entrega pro jogo (o draft 1 de 3) e espera. Fim da cena. */
    | { do: 'handoff'; to: 'draft' }
    | { do: 'end' };

export type Timed = Step & { at: number };

export interface SceneScript {
    id: string;
    /** Batidas por minuto (120: batida de 0,5 s, compasso de 2 s). */
    bpm: number;
    steps: Timed[];
}

export interface CompiledStep {
    t: number;
    step: Step;
}

export interface Compiled {
    steps: CompiledStep[];
    /** Duração em ms (o passo final). */
    total: number;
}

export const beatMs = (bpm: number) => 60_000 / bpm;

const isFinal = (s: Step) => s.do === 'end' || s.do === 'handoff';

/** Passos em ordem de tempo (empate fica na ordem escrita) e a duração. Exige um único passo final, o último. */
export function compile(script: SceneScript): Compiled {
    const b = beatMs(script.bpm);
    const steps = script.steps
        .map(({ at, ...step }, i) => ({ t: Math.round(at * b), step: step as Step, i }))
        .sort((x, y) => x.t - y.t || x.i - y.i)
        .map(({ t, step }) => ({ t, step }));
    const finals = steps.filter((s) => isFinal(s.step));
    if (finals.length !== 1 || steps[steps.length - 1] !== finals[0])
        throw new Error(`Cena ${script.id}: precisa de um único passo final (end ou handoff), no fim`);
    return { steps, total: finals[0].t };
}

/** Índice do primeiro passo que ainda não rodou em `ms` (roda tudo com t <= ms). */
export function cursorAt(c: Compiled, ms: number, from = 0): number {
    let i = from;
    while (i < c.steps.length && c.steps[i].t <= ms) i++;
    return i;
}

/** Onde o toque leva: o próximo corte ou fala depois de `ms` (ou o fim). */
export function nextStop(c: Compiled, ms: number): number {
    for (const { t, step } of c.steps)
        if (t > ms && (step.do === 'cut' || step.do === 'say' || isFinal(step))) return t;
    return c.total;
}

/** Duração de cada fala na tela: até o próximo corte, fala ou o fim. */
export function sayEnd(c: Compiled, index: number): number {
    for (let i = index + 1; i < c.steps.length; i++) {
        const s = c.steps[i].step;
        if (s.do === 'say' || (s.do === 'cut' && s.stage) || isFinal(s)) return c.steps[i].t;
    }
    return c.total;
}

/** Passos que deixam marca no palco (cenário, ator, posição): os que valem ao adiantar e ao pular. */
export const isLasting = (s: Step) =>
    s.do === 'cut' || s.do === 'actor' || s.do === 'walk' || s.do === 'anim' || s.do === 'exit' || s.do === 'spot';

/** Elenco pra carregar antes: espécies (atores, retratos, cries) e treinadores. */
export function castOf(script: SceneScript) {
    const mons = new Set<number>();
    const trainers = new Set<TrainerId>();
    const faces = new Set<string>();
    for (const s of script.steps) {
        if (s.do === 'actor' && s.mon) mons.add(s.mon);
        if (s.do === 'actor' && s.trainer) trainers.add(s.trainer);
        if (s.do === 'portrait') faces.add(`${s.mon}:${s.face}`);
        if (s.do === 'say' && s.face) faces.add(`${s.face.mon}:${s.face.face}`);
    }
    return { mons: [...mons], trainers: [...trainers], faces: [...faces] };
}

/** Chaves de texto da cena: letreiros e falas (com quem fala). */
export function textsOf(script: SceneScript) {
    const titles: StoryKey[] = [];
    const lines: StoryKey[] = [];
    const who: StoryKey[] = [];
    for (const s of script.steps) {
        if (s.do === 'title') titles.push(s.text);
        if (s.do === 'say') {
            lines.push(s.text);
            who.push(s.who);
        }
    }
    return { titles, lines, who };
}

export const wordCount = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
