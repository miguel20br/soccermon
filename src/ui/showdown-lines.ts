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
 * Tempos do duelo na quadra (ms no relógio da quadra, desde o lance; MatchScene.ts e ShowdownOverlay.tsx): o letreiro
 * COUNTER! da defesa fica `counter`, a 1ª fala entra em `talk`, o grito fica `shout` e a caixa sai `exit` antes da
 * bicuda (o goleiro carrega e o 2º COUNTER! passa). Uma letra a cada `char` (a fala inteira em até `type`); `fade` é a
 * saída da caixa.
 */
export const SHOWDOWN_MS = { counter: 1300, talk: 1400, shout: 1300, exit: 900, char: 26, type: 900, fade: 250 };

/** Rosto PMD de cada fala: quem chutou se espanta, o goleiro encara, quem chutou de novo bufa e a bicuda. */
export const FACE = {
    s: ['surprised', 'pain', 'sad'],
    s2: ['sigh', 'angry', 'sad'],
    g: ['determined', 'happy'],
    shout: ['shouting', 'determined', 'angry'],
};

/** A fala da vez `t` ms depois do lance (-1 antes da 1ª): as falas dividem o tempo até o grito, que fica com o fim. */
export function lineAt(t: number, ms: number, count: number): number {
    const { talk, shout, exit } = SHOWDOWN_MS;
    const shoutAt = ms - exit - shout;
    if (t >= shoutAt) return count - 1;
    if (t < talk) return -1;
    return Math.min(count - 2, Math.floor((t - talk) / ((shoutAt - talk) / (count - 1))));
}
