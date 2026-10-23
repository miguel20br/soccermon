import { FUTSAL_5 } from '../engine/config';
import { Action, type MatchEvent, type MatchSnapshot, SNAP_STRIDE, STATUS_CODE } from '../engine/state';

/**
 * Reação de quem é atingido por um golpe de efeito (só tela; o motor não muda): a palavra em cima dele, a cor (tipo),
 * se tomba de verdade e o ícone de status que fica preso enquanto o efeito dura. Sem Phaser aqui: o painel do jogador
 * (React) usa `statusNow` e o teste cobre o mapa efeito → palavra/ícone.
 */
export type ReactWord =
    | 'par'
    | 'slp'
    | 'psn'
    | 'brn'
    | 'frz'
    | 'confusion'
    | 'infatuation'
    | 'flinch'
    | 'seed'
    | 'down'
    | 'push'
    | 'soak';

export interface Reaction {
    target: number;
    /** Quem causou (null ou o próprio alvo: sem empurrão pra trás). */
    by: number | null;
    word: ReactWord;
    /** Tipo pra cor da palavra. */
    type: string;
    /** Tomba (derrubado) ou fica tonto (estrelinhas sem tombar). */
    fall: 'tumble' | 'dizzy' | null;
    /** Código do status do snapshot (ícone preso enquanto dura); 0 = sem ícone. */
    icon: number;
}

/** Tipo de cada efeito quando a fonte não é um golpe (habilidade, golpe máximo, anel de fogo). */
export const WORD_TYPE: Record<ReactWord, string> = {
    par: 'Electric',
    slp: 'Psychic',
    psn: 'Poison',
    brn: 'Fire',
    frz: 'Ice',
    confusion: 'Psychic',
    infatuation: 'Fairy',
    flinch: 'Normal',
    seed: 'Grass',
    down: 'Fighting',
    push: 'Normal',
    soak: 'Water',
};

/** Prioridade da palavra quando duas chegam juntas no mesmo alvo (o status vence o empurrão). */
export const WORD_RANK: Record<ReactWord, number> = {
    par: 3,
    slp: 3,
    psn: 3,
    brn: 3,
    frz: 3,
    confusion: 3,
    infatuation: 3,
    flinch: 2,
    seed: 3,
    down: 2.5,
    push: 1,
    soak: 1,
};

/**
 * Segundos no chão a partir dos quais o empurrão vira tombo. Todo empurrão do motor deixa 0,45 s em Hurt; carrinho com
 * golpe, arremesso, rasteira e OHKO deixam mais.
 */
export const DOWN_SECONDS = 0.6;

/** N3 Normal e Terrestre derrubam quem pegam (Mega Impacto no goleiro, Terremoto na defesa). */
const MAX_FX_DOWN = new Set(['Normal', 'Ground']);

export interface ReactContext {
    /** Tipo do golpe (undefined se `id` não é golpe: habilidade, 'maxfx', 'kingsrock'). */
    moveType: (id: string) => string | undefined;
    /** Quanto tempo (s de jogo) `target` fica em Hurt a partir de `tick`. */
    hurtSeconds: (target: number, tick: number) => number;
}

/** A reação que o evento causa (null: o evento não atinge ninguém com efeito). */
export function reactionFor(e: MatchEvent, ctx: ReactContext): Reaction | null {
    switch (e.type) {
        case 'status': {
            const word = e.status as ReactWord;
            if (!(word in WORD_TYPE)) return null;
            const dizzy = word === 'flinch';
            return {
                target: e.target,
                by: e.by,
                word,
                type: ctx.moveType(e.source) ?? WORD_TYPE[word],
                fall: dizzy ? 'dizzy' : null,
                icon: STATUS_CODE[word] ?? 0,
            };
        }
        case 'knockback': {
            const type = ctx.moveType(e.moveId) ?? 'Normal';
            const down = ctx.hurtSeconds(e.target, e.tick) >= DOWN_SECONDS;
            const word: ReactWord = down ? 'down' : type === 'Water' ? 'soak' : 'push';
            return { target: e.target, by: e.by, word, type, fall: down ? 'tumble' : null, icon: 0 };
        }
        case 'trait': {
            if ((e.fx !== 'trip' && e.fx !== 'throw') || e.target === null) return null;
            const type = ctx.moveType(e.moveId) ?? 'Fighting';
            return { target: e.target, by: e.by, word: 'down', type, fall: 'tumble', icon: 0 };
        }
        case 'maxFx': {
            if (e.step !== 'hit' || e.target === null || e.target === e.by || !MAX_FX_DOWN.has(e.fx)) return null;
            return { target: e.target, by: e.by, word: 'down', type: e.fx, fall: 'tumble', icon: 0 };
        }
        default:
            return null;
    }
}

/** Índice do último snapshot com `tick` <= `tick` (0 se nenhum). */
export function snapIndex(snaps: readonly MatchSnapshot[], tick: number): number {
    let lo = 0;
    let hi = snaps.length - 1;
    if (hi < 0 || tick < snaps[0].tick) return 0;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (snaps[mid].tick <= tick) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

/**
 * Trecho contínuo (ticks) em que o campo `field` do jogador `idx` vale `value`, em volta do snapshot `i`. null se no
 * snapshot `i` o valor já é outro.
 */
export function spanAt(
    snaps: readonly MatchSnapshot[],
    i: number,
    idx: number,
    field: number,
    value: number,
): { from: number; to: number } | null {
    const o = idx * SNAP_STRIDE + field;
    if (snaps[i]?.p[o] !== value) return null;
    let a = i;
    let b = i;
    while (a > 0 && snaps[a - 1].p[o] === value) a--;
    while (b < snaps.length - 1 && snaps[b + 1].p[o] === value) b++;
    // o efeito acaba quando chega o snapshot seguinte (com outro valor)
    const end = snaps[Math.min(b + 1, snaps.length - 1)].tick;
    return { from: snaps[a].tick, to: Math.max(end, snaps[b].tick) };
}

/** Segundos em Hurt de `idx` a partir de `tick` (o snapshot do próprio tick ou o seguinte). */
export function hurtSecondsAt(snaps: readonly MatchSnapshot[], idx: number, tick: number): number {
    let i = snapIndex(snaps, tick);
    if (snaps[i] && snaps[i].tick < tick && i < snaps.length - 1) i++;
    for (const k of [i, i + 1]) {
        const span = spanAt(snaps, k, idx, 3, Action.Hurt);
        if (span) return (span.to - Math.max(tick, span.from)) / FUTSAL_5.tickRate;
    }
    return 0;
}

const CODE_KIND = Object.fromEntries(Object.entries(STATUS_CODE).map(([k, v]) => [v, k])) as Record<number, string>;

/**
 * Status de `idx` agora, com a causa (o último evento 'status' dele) e quantos segundos faltam. null sem status.
 * Painel do jogador: "Zubat foi confundido por Psychic (2 s)".
 */
export function statusNow(
    match: { snapshots: readonly MatchSnapshot[]; events: readonly MatchEvent[] },
    idx: number,
    tick: number,
): { kind: string; source: string | null; left: number } | null {
    const snaps = match.snapshots;
    if (!snaps.length) return null;
    const i = snapIndex(snaps, tick);
    const code = snaps[i].p[idx * SNAP_STRIDE + 4];
    const kind = CODE_KIND[code];
    const span = kind ? spanAt(snaps, i, idx, 4, code) : null;
    if (!kind || !span) return null;
    let source: string | null = null;
    for (const e of match.events) {
        if (e.tick > tick) break;
        if (e.type === 'status' && e.target === idx && e.status === kind) source = e.source;
    }
    return { kind, source, left: Math.max(1, Math.ceil((span.to - tick) / FUTSAL_5.tickRate)) };
}
