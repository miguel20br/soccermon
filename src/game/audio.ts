import { ZZFX, zzfx } from 'zzfx';
import type { CryStyle } from '../store/game-store';

/**
 * Áudio da partida: gritos dos Pokémon (arquivos .ogg do PokeAPI/cries) + efeitos procedurais (ZzFX).
 * Os efeitos não precisam de arquivo — são gerados na hora.
 */
const SFX = {
    // parâmetros gerados no editor do ZzFX (killedbyapixel.github.io/ZzFX)
    kick: [0.9, 0.05, 140, 0, 0.01, 0.06, 4, 2.2, -8, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6, 0.02],
    shot: [1.2, 0.05, 90, 0, 0.02, 0.12, 4, 2.6, -6, 0, 0, 0, 0, 0.6, 0, 0.1, 0, 0.5, 0.04],
    whistle: [0.6, 0, 2400, 0.02, 0.25, 0.2, 0, 1.3, 0, 0, 0, 0, 0.05, 0, 9, 0, 0, 0.9, 0.05],
    post: [1.1, 0, 520, 0, 0.02, 0.35, 1, 0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.03],
    save: [0.9, 0.05, 220, 0, 0.02, 0.1, 4, 1.6, 0, 0, 0, 0, 0, 0.8, 0, 0.2, 0, 0.5, 0.02],
    goal: [1.4, 0, 523, 0.03, 0.35, 0.5, 1, 1.8, 0, 0, 262, 0.08, 0.12, 0, 0, 0, 0.05, 0.8, 0.1],
    move: [0.7, 0.05, 330, 0.02, 0.06, 0.18, 0, 1.5, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.05],
    status: [0.6, 0.1, 160, 0.03, 0.1, 0.3, 3, 1.2, 0, 0, 0, 0, 0, 0.5, 0, 0.3, 0.1, 0.6, 0.1],
    select: [0.5, 0, 880, 0, 0.02, 0.05, 1, 1.5, 0, 0, 440, 0.03, 0, 0, 0, 0, 0, 0.6, 0],
} as const;

export type SfxName = keyof typeof SFX;

let volume = 0.6;

export function setVolume(v: number) {
    volume = v;
    ZZFX.volume = 0.35 * v;
}

export function playSfx(name: SfxName) {
    if (volume <= 0) return;
    try {
        zzfx(...SFX[name]);
    } catch {
        // contexto de áudio ainda bloqueado pelo navegador (antes da primeira interação)
    }
}

const cryCache = new Map<string, HTMLAudioElement>();

export function cryUrl(speciesId: number, style: CryStyle) {
    return `assets/cries/${style}/${speciesId}.ogg`;
}

export function playCry(speciesId: number, style: CryStyle, gain = 1) {
    if (volume <= 0) return;
    const url = cryUrl(speciesId, style);
    let audio = cryCache.get(url);
    if (!audio) {
        audio = new Audio(url);
        cryCache.set(url, audio);
    }
    const node = audio.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, 0.55 * volume * gain);
    node.play().catch(() => {});
}
