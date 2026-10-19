import portraits from '../../data/portraits.json';
import type { EmoteKind } from '../../net/duel-state';

const HAS = portraits as Record<string, string[]>;

/**
 * Cada emote é o capitão com uma cara do PMDCollab (a 1ª que a espécie tiver; sem nenhuma, o rosto normal), o
 * jeito de mexer e o tom do grito (o cry tocado mais agudo ou mais grave). Estilo Clash Royale: o Rei rindo,
 * chorando, bravo; aqui é o seu capitão. O tom fica entre 0,9x e 1,15x (era 0,75x a 1,3x: soava disco arranhado).
 */
export const FACE: Record<EmoteKind, { faces: string[]; move: 'hop' | 'shake' | 'droop' | 'wobble'; rate: number }> = {
    boa: { faces: ['happy', 'joyous'], move: 'hop', rate: 1.08 },
    golaco: { faces: ['joyous', 'happy'], move: 'hop', rate: 1.12 },
    gg: { faces: ['inspired', 'happy'], move: 'wobble', rate: 1.03 },
    grito: { faces: ['shouting', 'angry', 'determined'], move: 'shake', rate: 1 },
    ops: { faces: ['surprised'], move: 'wobble', rate: 1.15 },
    zzz: { faces: ['sigh'], move: 'droop', rate: 0.9 },
    choro: { faces: ['crying'], move: 'droop', rate: 0.92 },
    bravo: { faces: ['angry', 'shouting', 'determined'], move: 'shake', rate: 0.96 },
};

export function emoteFace(speciesId: number, kind: EmoteKind): string {
    const face = FACE[kind].faces.find((f) => HAS[speciesId]?.includes(f));
    return `assets/portraits/${speciesId}${face ? `-${face}` : ''}.png`;
}
