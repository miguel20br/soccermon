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

/** Volume geral e de cada canal (0..1). Gritos e efeitos tocam com `geral × canal`. */
const vol = { master: 0.6, cries: 1, sfx: 1, crowd: 1 };
/** Grito de gol do capitão ligado (Configurações). */
let goalCryOn = true;

const applyZzfx = () => {
    ZZFX.volume = 0.35 * vol.master * vol.sfx;
};

/** Volume geral (compatível com as chamadas antigas). */
export function setVolume(v: number) {
    vol.master = v;
    applyZzfx();
}

/** Volume geral e dos canais (gritos, efeitos) de uma vez. */
export function setVolumes(v: { master?: number; cries?: number; sfx?: number; crowd?: number }) {
    Object.assign(vol, Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'number')));
    applyZzfx();
}

export function setGoalCry(on: boolean) {
    goalCryOn = on;
}

/** `pitch` multiplica a frequência (1 = normal; 2^(1/12) ≈ 1,06 = um semitom acima). */
export function playSfx(name: SfxName, pitch = 1) {
    if (vol.master * vol.sfx <= 0) return;
    try {
        const p = [...SFX[name]] as number[];
        p[2] *= pitch;
        zzfx(...p);
    } catch {
        // contexto de áudio ainda bloqueado pelo navegador (antes da primeira interação)
    }
}

/** Sons gravados (apito do trailer, torcida): `public/assets/sfx/{nome}.mp3`. */
type SampleName = 'apito' | 'apito-curto' | `torcida-${CrowdCall}-${number}`;
/** O que a torcida (que torce por você) faz: gol seu, gol do rival, quase. */
export type CrowdCall = 'gol' | 'vaia' | 'uuh';
const CROWD_VARIANTS: Record<CrowdCall, number> = { gol: 3, vaia: 2, uuh: 2 };
const buffers = new Map<SampleName, Promise<AudioBuffer | null>>();

function sample(name: SampleName) {
    let b = buffers.get(name);
    if (!b) {
        b = fetch(`assets/sfx/${name}.mp3`)
            .then((r) => r.arrayBuffer())
            .then((data) => ZZFX.audioContext.decodeAudioData(data))
            .catch(() => null);
        buffers.set(name, b);
    }
    return b;
}

function play(name: SampleName, level: number) {
    if (level <= 0) return;
    void sample(name).then((buf) => {
        const ctx = ZZFX.audioContext;
        if (!buf || ctx.state !== 'running') return;
        const g = ctx.createGain();
        g.gain.value = 0.7 * level;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(g).connect(ctx.destination);
        src.start();
    });
}

/** Apito (canal de efeitos). */
export function playSample(name: 'apito' | 'apito-curto', gain = 1) {
    play(name, vol.master * vol.sfx * gain);
}

const lastCrowd: Partial<Record<CrowdCall, number>> = {};

/** Torcida (canal próprio): sorteia uma das gravações, nunca a mesma duas vezes seguidas. */
export function playCrowd(call: CrowdCall, gain = 1) {
    const n = CROWD_VARIANTS[call];
    let i = 1 + Math.floor(Math.random() * n);
    if (n > 1 && i === lastCrowd[call]) i = (i % n) + 1;
    lastCrowd[call] = i;
    play(`torcida-${call}-${i}`, vol.master * vol.crowd * gain);
}

const cryCache = new Map<string, HTMLAudioElement>();

export function cryUrl(speciesId: number, style: CryStyle) {
    return `assets/cries/${style}/${speciesId}.ogg`;
}

export function playCry(speciesId: number, style: CryStyle, gain = 1) {
    cry(speciesId, style, vol.master * vol.cries * gain);
}

/** Grito de gol: o cry do capitão junto com a torcida, no volume de efeitos (desliga em Configurações). */
export function playGoalCry(speciesId: number, style: CryStyle) {
    if (goalCryOn) cry(speciesId, style, vol.master * vol.sfx);
}

function cry(speciesId: number, style: CryStyle, volume: number) {
    if (volume <= 0) return;
    const url = cryUrl(speciesId, style);
    let audio = cryCache.get(url);
    if (!audio) {
        audio = new Audio(url);
        cryCache.set(url, audio);
    }
    const node = audio.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.min(1, 0.55 * volume);
    node.play().catch(() => {});
}
