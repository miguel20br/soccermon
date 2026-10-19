import portraits from '../../data/portraits.json';
import type { MatchEvent } from '../../engine/state';
import type { EmoteKind } from '../../net/duel-state';

const HAS = portraits as Record<string, string[]>;

/**
 * Cada emote é o capitão com uma cara do PMDCollab (a 1ª que a espécie tiver; sem nenhuma, o rosto normal), o
 * jeito de mexer e o tom do grito (o cry tocado mais agudo ou mais grave). Estilo Clash Royale: o Rei rindo,
 * chorando, bravo; aqui é o seu capitão.
 */
export const FACE: Record<EmoteKind, { faces: string[]; move: 'hop' | 'shake' | 'droop' | 'wobble'; rate: number }> = {
    boa: { faces: ['happy', 'joyous'], move: 'hop', rate: 1.15 },
    golaco: { faces: ['joyous', 'happy'], move: 'hop', rate: 1.25 },
    gg: { faces: ['inspired', 'happy'], move: 'wobble', rate: 1.05 },
    grito: { faces: ['shouting', 'angry', 'determined'], move: 'shake', rate: 1 },
    ops: { faces: ['surprised'], move: 'wobble', rate: 1.3 },
    zzz: { faces: ['sigh'], move: 'droop', rate: 0.75 },
    choro: { faces: ['crying'], move: 'droop', rate: 0.8 },
    bravo: { faces: ['angry', 'shouting', 'determined'], move: 'shake', rate: 0.9 },
};

export function emoteFace(speciesId: number, kind: EmoteKind): string {
    const face = FACE[kind].faces.find((f) => HAS[speciesId]?.includes(f));
    return `assets/portraits/${speciesId}${face ? `-${face}` : ''}.png`;
}

/** Emote do líder rival na Copa: em que tick aparece e qual. */
export interface RivalEmote {
    tick: number;
    kind: EmoteKind;
}

/** No máximo 4 por partida, 30 s de jogo entre um e outro (a virada fura a espera), 1 s depois do gol. */
export const RIVAL_EMOTE_MAX = 4;
export const RIVAL_EMOTE_GAP = 600;
const RIVAL_EMOTE_DELAY = 20;

/**
 * Copa: o capitão do líder rival reage aos gols (só na tela; a mesma partida dá sempre os mesmos). Gol dele:
 * "Golaço!", e na virada "Vamooo!" (o capitão faz pose). Gol seu: "Ops" quando você sai na frente, "Grrr!" no
 * empate, "Zzz" com você 2+ na frente e "Nãão!" quando você vira. Gol contra: "Ops".
 */
export function rivalEmotes(events: readonly MatchEvent[], rival: 0 | 1): RivalEmote[] {
    const out: RivalEmote[] = [];
    const trailed = [false, false];
    let last = Number.NEGATIVE_INFINITY;
    for (const e of events) {
        if (e.type !== 'goal') continue;
        const [s0, s1] = e.score;
        const lead = e.team === 0 ? s0 - s1 : s1 - s0;
        // virada: quem marcou já esteve atrás e agora passou na frente
        const virada = lead === 1 && trailed[e.team];
        if (s0 > s1) trailed[1] = true;
        if (s1 > s0) trailed[0] = true;
        let kind: EmoteKind;
        if (e.ownGoal) kind = 'ops';
        else if (e.team === rival) kind = virada ? 'grito' : 'golaco';
        else kind = virada ? 'choro' : lead === 0 ? 'bravo' : lead >= 2 ? 'zzz' : 'ops';
        if (out.length >= RIVAL_EMOTE_MAX || (!virada && e.tick - last < RIVAL_EMOTE_GAP)) continue;
        last = e.tick;
        out.push({ tick: e.tick + RIVAL_EMOTE_DELAY, kind });
    }
    return out;
}
