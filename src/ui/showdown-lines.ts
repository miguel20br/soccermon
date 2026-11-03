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
 * As falas do duelo da bicuda, em ordem (a última é o grito do goleiro). Escolha determinística pelo lance (`seed`: o
 * tick do evento), na prioridade: par notável, mesma linha evolutiva, fala própria de um dos dois (`solo`) e as genéricas.
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
    const s = d.solo[shooter.speciesId];
    const g = d.solo[gk.speciesId];
    const out: ShowdownLine[] = [
        { who: 's', text: pick(s?.shot ?? d.shot, 'shot') },
        { who: 'g', text: pick(g?.gk ?? d.gk, 'gk') },
    ];
    // a 2ª fala de quem chutou, às vezes (só nas genéricas: a de um Pokémon notável fecha com a dele)
    if (!s && hash(`${seed}:more`) % 2 === 0) out.push({ who: 's', text: pick(d.more, 'more') });
    out.push({ who: 'g', text: pick(g?.shout ?? d.shout, 'shout') });
    return out.map((l) => ({ ...l, text: fmt(l.text, names) }));
}
