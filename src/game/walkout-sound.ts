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

/** Sons novos no ZzFX (sem arquivo): o BOING de assinatura, o brilho de shiny, o estouro dos fogos, o tique da nota, o vidro, o fogo e
 * os da revelação pelo tipo. */
const ZZ = {
    boing: [1, 0, 130, 0.01, 0.09, 0.28, 0, 1.2, 16, -0.9, 0, 0, 0, 0, 11, 0, 0, 0.8, 0.05],
    sparkle: [0.7, 0, 1568, 0, 0.03, 0.32, 0, 1.8, 0, 0, 523, 0.05, 0.07, 0, 0, 0, 0, 0.55, 0.05],
    pop: [1.1, 0.2, 380, 0, 0.02, 0.28, 4, 1.4, -2, 0, 0, 0, 0, 0.9, 0, 0.1, 0, 0.5, 0.06],
    tick: [0.5, 0, 1200, 0, 0.005, 0.03, 1, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0],
    glass: [1.2, 0.4, 1900, 0, 0.01, 0.35, 4, 0.6, 0, 0, 0, 0, 0, 1.6, 0, 0.35, 0, 0.6, 0.1],
    fogo: [0.9, 0.3, 200, 0.03, 0.15, 0.35, 4, 0.5, -1, 0, 0, 0, 0, 2.5, 0, 0.2, 0, 0.6, 0.1],
    // a revelação pelo tipo (walkout-type-fx.ts)
    gelo: [0.8, 0.1, 2200, 0, 0.04, 0.4, 0, 1.5, 0, 0, 880, 0.04, 0.06, 0.3, 0, 0, 0, 0.5, 0.05],
    agua: [1, 0.3, 300, 0.02, 0.12, 0.4, 4, 0.6, -2, 0, 0, 0, 0, 3, 0, 0, 0, 0.5, 0.1],
    zap: [0.9, 0.2, 700, 0, 0.05, 0.2, 2, 2.5, 0, 0, 0, 0, 0.03, 1.5, 40, 0.3, 0, 0.6, 0],
    folha: [0.6, 0.4, 900, 0.03, 0.1, 0.25, 4, 0.5, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0.5, 0.05],
    rocha: [1.2, 0.3, 70, 0.01, 0.2, 0.5, 4, 1.5, -1, 0, 0, 0, 0, 2, 0, 0.2, 0, 0.6, 0.1],
    magia: [0.7, 0, 600, 0.05, 0.2, 0.4, 0, 1.5, 6, 0, 300, 0.08, 0.1, 0, 5, 0, 0, 0.6, 0.05],
    sombra: [0.8, 0.1, 140, 0.1, 0.25, 0.5, 0, 1, -0.5, 0, 0, 0, 0, 0.5, 8, 0, 0, 0.6, 0.2],
    gosma: [0.9, 0.2, 180, 0.02, 0.1, 0.3, 0, 1.5, -4, 0, 0, 0, 0.08, 0.4, 0, 0, 0, 0.6, 0.05],
    zumbido: [0.6, 0.1, 220, 0.05, 0.3, 0.2, 2, 1, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0.5, 0.3],
    vento: [0.8, 0.5, 500, 0.1, 0.2, 0.4, 4, 0.5, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0.4, 0.1],
    soco: [1.3, 0.1, 90, 0, 0.03, 0.25, 4, 2, -8, 0, 0, 0, 0, 1.2, 0, 0.1, 0, 0.6, 0.05],
    rugido: [1.2, 0.3, 85, 0.05, 0.35, 0.5, 2, 2, -0.5, 0, 0, 0, 0, 1.8, 12, 0.1, 0, 0.7, 0.2],
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
