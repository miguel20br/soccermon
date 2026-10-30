import { ZZFX, zzfx } from 'zzfx';
import type { CryStyle } from '../store/game-store';
import { CRY_FADE_AT, CRY_MAX_MS, cryGain, cryPlayMs } from './cry-level';
import { type BuildSamples, type Layer, mixMax } from './max-sfx';
import { wavMono } from './virada';

/**
 * Áudio da partida: gritos dos Pokémon (arquivos .ogg do PokeAPI/cries) + efeitos procedurais (ZzFX).
 * Os efeitos não precisam de arquivo — são gerados na hora.
 */
export const SFX = {
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
    // retorno de toque (src/ui/feedback.ts): voltar desce, sair/perder é um "uó-uó" triste, destrutivo é seco
    back: [0.45, 0, 660, 0, 0.02, 0.07, 1, 1.5, -24, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0],
    sad: [0.7, 0, 392, 0.02, 0.16, 0.32, 2, 1.4, -5, 0, -70, 0.14, 0, 0, 0, 0, 0, 0.6, 0.08],
    thud: [0.9, 0, 110, 0, 0.04, 0.22, 3, 1.8, -4, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.6, 0.05],
} as const;

export type SfxName = keyof typeof SFX;

/**
 * Ganho base de cada canal (antes de `geral × canal` das Configurações). Medidos com `npx tsx scripts/niveis-audio.ts`;
 * alvos na skill soccermon-musica (§6): o grito é tempero, fica atrás da música (era 0,55: ~12 dB acima dela).
 */
export const GAIN = { cry: 0.13, sfx: 0.35, sample: 0.7 };

/** Volume geral e de cada canal (0..1). Gritos e efeitos tocam com `geral × canal`. */
const vol = { master: 0.6, cries: 1, sfx: 1, crowd: 1 };
/** Grito de gol do capitão ligado (Configurações). */
let goalCryOn = true;

const applyZzfx = () => {
    ZZFX.volume = GAIN.sfx * vol.master * vol.sfx;
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

/**
 * `pitch` multiplica a frequência (1 = normal; 2^(1/12) ≈ 1,06 = um semitom acima). `at` = hora do AudioContext em
 * que o som sai (no tempo da música: `heardAt` em `music.ts`); sem ela, já. Devolve a fonte (pra calar antes).
 */
export function playSfx(name: SfxName, pitch = 1, at?: number): AudioBufferSourceNode | undefined {
    if (vol.master * vol.sfx <= 0) return;
    try {
        const p = [...SFX[name]] as number[];
        p[2] *= pitch;
        if (at === undefined) return zzfx(...p);
        const c = ZZFX.audioContext;
        const s = ZZFX.buildSamples(...p);
        const b = c.createBuffer(1, s.length, ZZFX.sampleRate);
        b.getChannelData(0).set(s);
        const src = c.createBufferSource();
        src.buffer = b;
        const g = c.createGain();
        g.gain.value = ZZFX.volume;
        src.connect(g).connect(c.destination);
        src.start(Math.max(at, c.currentTime));
        return src;
    } catch {
        // contexto de áudio ainda bloqueado pelo navegador (antes da primeira interação)
    }
}

/** O clap 808 (`public/music/clap-808.wav`) dos sons do golpe máximo. Sem ele, a camada fica muda. */
let clapP: Promise<Float32Array | null> | null = null;
export const loadMaxSfx = () =>
    (clapP ??= fetch('music/clap-808.wav')
        .then((r) => r.arrayBuffer())
        .then(wavMono)
        .catch(() => {
            clapP = null;
            return null;
        }));
const maxMixes = new Map<readonly Layer[], Float32Array<ArrayBuffer>>();

/** Som do golpe máximo (`MAX_TAP`/`MAX_MOVE` em `max-sfx.ts`) no canal de efeitos; `at` como no `playSfx`. */
export function playMax(layers: readonly Layer[], peak: number, at?: number) {
    if (vol.master * vol.sfx <= 0) return;
    void loadMaxSfx().then((clap) => {
        try {
            let s = maxMixes.get(layers);
            if (!s) {
                s = mixMax(
                    layers,
                    ZZFX.buildSamples.bind(ZZFX) as unknown as BuildSamples,
                    clap,
                    peak,
                    ZZFX.sampleRate,
                );
                if (clap) maxMixes.set(layers, s);
            }
            const c = ZZFX.audioContext;
            const b = c.createBuffer(1, s.length, ZZFX.sampleRate);
            b.copyToChannel(s, 0);
            const src = c.createBufferSource();
            src.buffer = b;
            const g = c.createGain();
            g.gain.value = ZZFX.volume;
            src.connect(g).connect(c.destination);
            src.start(Math.max(at ?? 0, c.currentTime));
        } catch {
            // sem áudio
        }
    });
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
        g.gain.value = GAIN.sample * level;
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

/** Até quando (performance.now) o último grito ainda soa: o grito de gol do capitão espera ele acabar. */
let cryBusyUntil = 0;

export function cryUrl(speciesId: number, style: CryStyle) {
    return `assets/cries/${style}/${speciesId}.ogg`;
}

/** `rate` muda o tom (e a duração): emote feliz sai mais agudo, triste mais grave. */
export function playCry(speciesId: number, style: CryStyle, gain = 1, rate = 1) {
    cry(speciesId, style, vol.master * vol.cries * gain, rate);
}

/**
 * Grito de gol: o cry do capitão junto com a torcida, no volume de efeitos (desliga em Configurações). Não toca por
 * cima de um grito que ainda está soando (o de quem marcou): espera ele acabar.
 */
export function playGoalCry(speciesId: number, style: CryStyle) {
    if (!goalCryOn) return;
    const wait = Math.max(0, cryBusyUntil - performance.now());
    window.setTimeout(() => cry(speciesId, style, vol.master * vol.sfx), wait);
}

function cry(speciesId: number, style: CryStyle, volume: number, rate = 1) {
    if (volume <= 0) return;
    const url = cryUrl(speciesId, style);
    let audio = cryCache.get(url);
    if (!audio) {
        audio = new Audio(url);
        cryCache.set(url, audio);
    }
    const node = audio.cloneNode(true) as HTMLAudioElement;
    const level = Math.min(1, GAIN.cry * volume * cryGain(speciesId, style));
    node.volume = level;
    if (rate !== 1) {
        node.preservesPitch = false;
        node.playbackRate = rate;
    }
    const ms = cryPlayMs(speciesId, style, rate);
    cryBusyUntil = Math.max(cryBusyUntil, performance.now() + ms);
    node.play().catch(() => {});
    // longo: some aos poucos de CRY_FADE_AT até CRY_MAX_MS e para
    if (ms >= CRY_MAX_MS) {
        const start = performance.now() + CRY_FADE_AT;
        const id = window.setInterval(() => {
            const k = (performance.now() - start) / (CRY_MAX_MS - CRY_FADE_AT);
            if (k < 0) return;
            if (k >= 1) {
                node.pause();
                clearInterval(id);
            } else node.volume = level * (1 - k);
        }, 50);
    }
}
