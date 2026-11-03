import { ZZFX, zzfx } from 'zzfx';
import type { CryStyle } from '../store/game-store';
import { playCrowd, playCry, playMax, playSfx, SFX, type SfxName } from './audio';
import type { MaxSound } from './max-sfx';

/**
 * Sons do walkout (ut-walkout.md). Quem toca é a cena e a carta por cima; na gravação quadro a quadro
 * (`scripts/walkout-capture.mjs` liga `window.__wkSounds`), cada som vira uma linha com a hora do relógio do walkout e
 * o script monta o áudio do vídeo.
 */
export type WkSound =
    | { k: 'sfx'; name: SfxName; pitch?: number }
    | { k: 'max'; name: MaxSound }
    | { k: 'crowd'; call: 'gol' | 'uuh'; gain: number }
    | { k: 'cry'; gain: number }
    | { k: 'zz'; name: keyof typeof ZZ };

/** Sons novos no ZzFX (sem arquivo): o BOING de assinatura, o brilho de shiny, o estouro dos fogos, o tique da nota, o vidro. */
const ZZ = {
    boing: [1, 0, 130, 0.01, 0.09, 0.28, 0, 1.2, 16, -0.9, 0, 0, 0, 0, 11, 0, 0, 0.8, 0.05],
    sparkle: [0.7, 0, 1568, 0, 0.03, 0.32, 0, 1.8, 0, 0, 523, 0.05, 0.07, 0, 0, 0, 0, 0.55, 0.05],
    pop: [1.1, 0.2, 380, 0, 0.02, 0.28, 4, 1.4, -2, 0, 0, 0, 0, 0.9, 0, 0.1, 0, 0.5, 0.06],
    tick: [0.5, 0, 1200, 0, 0.005, 0.03, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0],
    glass: [1.2, 0.4, 1900, 0, 0.01, 0.35, 4, 0.6, 0, 0, 0, 0, 0, 1.6, 0, 0.35, 0, 0.6, 0.1],
} as const;

interface WkWindow {
    __wkSounds?: { t: number; s: WkSound }[];
    __wkRender?: (s: WkSound) => number[] | null;
}

/** Toca (ou anota, na gravação) um som na hora `t` do walkout. */
export function wkSound(s: WkSound, t: number, speciesId: number, cries: CryStyle) {
    const w = window as unknown as WkWindow;
    if (w.__wkSounds) {
        w.__wkRender ??= renderSound;
        w.__wkSounds.push({ t, s });
        return;
    }
    if (s.k === 'sfx') playSfx(s.name, s.pitch ?? 1);
    else if (s.k === 'max') playMax(s.name);
    else if (s.k === 'crowd') playCrowd(s.call, s.gain);
    else if (s.k === 'cry') playCry(speciesId, cries, s.gain);
    else {
        try {
            zzfx(...(ZZ[s.name] as unknown as number[]));
        } catch {
            // contexto de áudio ainda bloqueado
        }
    }
}

/** Amostras (44,1 kHz) de um som do ZzFX, pro script juntar o áudio do vídeo. */
function renderSound(s: WkSound): number[] | null {
    if (s.k !== 'sfx' && s.k !== 'zz') return null;
    const p = [...(s.k === 'sfx' ? SFX[s.name] : ZZ[s.name])] as number[];
    if (s.k === 'sfx') p[2] *= s.pitch ?? 1;
    return Array.from(ZZFX.buildSamples(...p));
}
