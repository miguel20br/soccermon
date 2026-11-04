import { species } from '../engine/data';
import { type Dict, dict, fmt } from '../i18n';
import type { ShowdownScript, ShowdownWho } from '../i18n/pt/showdown';

export interface ShowdownLine {
    who: ShowdownWho;
    text: string;
}

/** `to` é evolução (direta ou não) de `from`. */
function evolvesInto(from: number, to: number): boolean {
    const next = species(from).evolvesTo.map((e) => e.id);
    return next.includes(to) || next.some((id) => id !== from && evolvesInto(id, to));
}

/** Hash pequeno e estável (FNV-1a): a mesma fala nas duas telas do Duelo e no replay. */
function hash(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
    return h;
}

/**
 * As falas do duelo da bicuda, em ordem (a última é a do goleiro na bicuda). Escolha determinística pelo lance (`seed`: o
 * tick do evento), na prioridade: par notável, mesma linha evolutiva, a conversa de quem está no gol (`solo[id].keeper`),
 * a de quem chutou (`solo[id].shooter`) e as genéricas.
 */
export function showdownScript(
    shooter: { speciesId: number; name: string },
    gk: { speciesId: number; name: string },
    seed: number,
    d: Dict['showdown'] = dict().showdown,
): ShowdownLine[] {
    const pick = <T>(list: readonly T[], salt: string): T => list[hash(`${seed}:${salt}`) % list.length];
    const names = { s: shooter.name, g: gk.name };
    const lines = (script: ShowdownScript) => script.map(([who, text]) => ({ who, text: fmt(text, names) }));
    const pair = d.pairs[`${shooter.speciesId}-${gk.speciesId}`];
    if (pair) return lines(pair);
    if (evolvesInto(gk.speciesId, shooter.speciesId)) return lines(pick(d.up, 'up'));
    if (evolvesInto(shooter.speciesId, gk.speciesId)) return lines(pick(d.down, 'down'));
    const solo = d.solo[gk.speciesId]?.keeper ?? d.solo[shooter.speciesId]?.shooter;
    if (solo) return lines(pick(solo, 'solo'));
    const out: ShowdownLine[] = [
        { who: 's', text: pick(d.shot, 'shot') },
        { who: 'g', text: pick(d.gk, 'gk') },
    ];
    // a 2ª fala de quem chutou, às vezes
    if (hash(`${seed}:more`) % 2 === 0) out.push({ who: 's', text: pick(d.more, 'more') });
    out.push({ who: 'g', text: pick(d.shout, 'shout') });
    return out.map((l) => ({ ...l, text: fmt(l.text, names) }));
}

/**
 * Tempos do duelo na quadra (ms no relógio da quadra, desde o lance; MatchScene.ts e ShowdownOverlay.tsx). A 1ª fala
 * entra em `talk` (depois do COUNTER! do contato e dos painéis de mangá), a fala final do goleiro fica `shout` e a caixa
 * sai `exit` antes da bicuda (o 2º COUNTER!, o cut-in e a bicuda armada). A fala digita uma letra a cada `char` (a fala inteira em até `type`, com
 * as pausas), para `soft` depois de vírgula e `hard` depois de ponto, e fica inteira pelo menos `read` antes da próxima
 * (Miguel, 03/11/2026: "não dá pra ler"). `fade` é a saída da caixa.
 */
export const SHOWDOWN_MS = {
    talk: 3350,
    shout: 2200,
    exit: 2800,
    char: 22,
    type: 770,
    soft: 60,
    hard: 110,
    read: 1275,
    fade: 250,
};

/**
 * Quando cada letra da fala aparece (ms desde a fala entrar): uma a cada `SHOWDOWN_MS.char`, apertando pra caber em
 * `type`, com a pausa curta depois da pontuação (as reticências pausam uma vez, no fim delas). Vazio no "Reduzir
 * movimento" (a fala vem inteira).
 */
export function typeDelays(text: string): number[] {
    const { char, type, soft, hard } = SHOWDOWN_MS;
    const chars = [...text];
    const pause = chars.map((c, i) => {
        const next = chars[i + 1];
        if (next === undefined || next === c) return 0;
        if ('.!?…'.includes(c)) return hard;
        return ',;:'.includes(c) ? soft : 0;
    });
    const total = pause.reduce((a, b) => a + b, 0);
    const step = Math.max(6, Math.min(char, (type - total) / Math.max(1, chars.length)));
    let at = 0;
    return chars.map((_, i) => {
        const t = at;
        at += step + pause[i];
        return t;
    });
}

/** Quanto a fala leva pra ficar inteira na caixa. */
export const typeMs = (text: string) => (typeDelays(text).at(-1) ?? 0) + SHOWDOWN_MS.char;

/** Rosto PMD de cada fala: quem chutou se espanta, o goleiro encara, quem chutou de novo bufa e a bicuda. */
export const FACE = {
    s: ['surprised', 'pain', 'sad'],
    s2: ['sigh', 'angry', 'sad'],
    g: ['determined', 'happy'],
    shout: ['shouting', 'determined', 'angry'],
};

/** De quando a quando (ms desde o lance) a fala `i` fica na caixa: as falas dividem o tempo até a última, que fica com o fim. */
export function lineSpan(i: number, ms: number, count: number): [number, number] {
    const { talk, shout, exit } = SHOWDOWN_MS;
    const shoutAt = ms - exit - shout;
    if (i === count - 1) return [shoutAt, ms - exit];
    const each = (shoutAt - talk) / (count - 1);
    return [talk + i * each, talk + (i + 1) * each];
}

/** A fala da vez `t` ms depois do lance (-1 antes da 1ª): as falas dividem o tempo até o grito, que fica com o fim. */
export function lineAt(t: number, ms: number, count: number): number {
    const { talk, shout, exit } = SHOWDOWN_MS;
    const shoutAt = ms - exit - shout;
    if (t >= shoutAt) return count - 1;
    if (t < talk) return -1;
    return Math.min(count - 2, Math.floor((t - talk) / ((shoutAt - talk) / (count - 1))));
}
