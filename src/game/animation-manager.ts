import type Phaser from 'phaser';
import pmdAnims from '../data/pmd-anims.json';
import spriteFeet from '../data/sprite-feet.json';
import { species } from '../engine/data';
import { Action } from '../engine/state';
import { baseOf, isShinySkin } from './skin';

/**
 * Animações dos sprites PMD (inspirado no animation-manager do Pokémon Auto Chess).
 * Chave: `{speciesId}/{Anim}/{direção 0..7}`. Durações vêm do AnimData.xml (frames de 1/60 s).
 */
interface PmdAnimInfo {
    frameWidth: number;
    frameHeight: number;
    frames: number;
    rows: number;
    durations: number[];
    hitFrame: number | null;
    /** Atlas extra: o pé em fração da altura do quadro (o sprite-feet.json só tem as de quadra). */
    foot?: number;
}

const PMD = pmdAnims as unknown as Record<string, { shadowSize: number; anims: Record<string, PmdAnimInfo> }>;

/** Animações alternativas quando a espécie não tem a pedida. */
const FALLBACK: Record<string, string[]> = {
    Shoot: ['Attack'],
    Pose: ['Hop', 'Idle'],
    Trip: ['Hurt'],
    Charge: ['Idle'],
    Swing: ['Attack'],
    Hop: ['Idle'],
    Hurt: ['Idle'],
};

const LOOPING = new Set(['Idle', 'Walk', 'Hop', 'Charge', 'Sleep', 'Sit', 'Eat']);

export { baseOf, isShinySkin, SHINY_SKIN, skinOf } from './skin';

export const atlasKey = (skin: number) => `pmd-${skin}`;

export function preloadSpecies(scene: Phaser.Scene, skin: number) {
    const key = atlasKey(skin);
    const id = baseOf(skin);
    if (!scene.textures.exists(key)) {
        scene.load.atlas(key, `assets/field/${isShinySkin(skin) ? 'shiny/' : ''}${id}.png`, `assets/field/${id}.json`);
    }
}

export function resolveAnim(skin: number, anim: string): string {
    if (EXTRA.get(skin)?.[anim]) return anim;
    const info = PMD[baseOf(skin)]?.anims;
    if (!info) return 'Idle';
    if (info[anim]) return anim;
    for (const alt of FALLBACK[anim] ?? []) if (info[alt]) return alt;
    return 'Idle';
}

/** Quantos quadros a animação tem e o do impacto (o PMD marca; sem marca, o do meio): a pose congelada do chute. */
export function animHit(skin: number, anim: string): { frames: number; hit: number } {
    const a = PMD[baseOf(skin)]?.anims[anim];
    const frames = a?.frames ?? 1;
    return { frames, hit: Math.min(frames - 1, a?.hitFrame ?? Math.floor(frames / 2)) };
}

/** Durações (quadros de 1/60 s) e o quadro de impacto da animação: o toque na bola cai nele (`strikeFrame`). */
export function animTiming(skin: number, anim: string): { durations: number[]; hit: number } {
    const a = EXTRA.get(skin)?.[anim] ?? PMD[baseOf(skin)]?.anims[anim];
    const durations = a?.durations ?? [1];
    return { durations, hit: Math.min(durations.length - 1, a?.hitFrame ?? Math.floor(durations.length / 2)) };
}

/**
 * Cria (uma vez) as 8 direções de cada animação da espécie. Sem a folha carregada não cria nada: a animação sairia
 * sem quadros, ficaria guardada assim (o `exists` não refaz) e o `play` dela quebra o Phaser (getFirstTick).
 */
export function createSpeciesAnims(scene: Phaser.Scene, skin: number) {
    const key = atlasKey(skin);
    if (!scene.textures.exists(key)) return;
    addAnims(scene, skin, key, PMD[baseOf(skin)]?.anims ?? {});
}

/**
 * Animações de fora da quadra (Sleep, Sit, Eat, Faint), num atlas à parte (scripts/build-pmd-atlas.ts --extra): só
 * quem usa (a Sala de troféus) carrega. As durações vêm no próprio JSON (o Phaser guarda em texture.customData).
 */
const EXTRA = new Map<number, Record<string, PmdAnimInfo>>();
export const extraKey = (skin: number) => `pmd-x-${skin}`;

export function preloadExtra(scene: Phaser.Scene, skin: number) {
    const key = extraKey(skin);
    const id = baseOf(skin);
    if (!scene.textures.exists(key))
        scene.load.atlas(
            key,
            `assets/field/extra/${isShinySkin(skin) ? 'shiny/' : ''}${id}.png`,
            `assets/field/extra/${id}.json`,
        );
}

/** Cria as animações do atlas extra (sem a folha carregada, nada: a tela cai no Idle pelo `resolveAnim`). */
export function createExtraAnims(scene: Phaser.Scene, skin: number) {
    const key = extraKey(skin);
    if (!scene.textures.exists(key)) return;
    const info = (scene.textures.get(key).customData as { anims?: Record<string, PmdAnimInfo> }).anims ?? {};
    EXTRA.set(skin, info);
    addAnims(scene, skin, key, info);
}

function addAnims(scene: Phaser.Scene, skin: number, key: string, info: Record<string, PmdAnimInfo>) {
    for (const [name, a] of Object.entries(info)) {
        for (let dir = 0; dir < 8; dir++) {
            const animKey = `${skin}/${name}/${dir}`;
            if (scene.anims.exists(animKey)) continue;
            const row = a.rows === 8 ? dir : 0;
            scene.anims.create({
                key: animKey,
                frames: a.durations.map((d, i) => ({
                    key,
                    frame: `${name}/${row}/${i}`,
                    duration: (d * 1000) / 60,
                })),
                repeat: LOOPING.has(name) ? -1 : 0,
            });
        }
    }
}

const bodyShifts = new Map<string, { x: number; y: number }>();
let probe: CanvasRenderingContext2D | null = null;

/** Centro dos pixels visíveis do quadro (px do quadro). */
function bodyCenter(frame: Phaser.Textures.Frame): { x: number; y: number } {
    const w = frame.cutWidth;
    const h = frame.cutHeight;
    probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!probe) return { x: w / 2, y: h / 2 };
    probe.canvas.width = w;
    probe.canvas.height = h;
    probe.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
    const px = probe.getImageData(0, 0, w, h).data;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let i = 3; i < px.length; i += 4) {
        if (px[i] <= 20) continue;
        const k = (i - 3) / 4;
        sx += k % w;
        sy += Math.floor(k / w);
        n++;
    }
    return n ? { x: sx / n, y: sy / n } : { x: w / 2, y: h / 2 };
}

const frameBoxes = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();

/**
 * Onde o corpo está de fato no sprite (o desenho, sem a sobra transparente do quadro do PMD), em px do mundo: pra
 * enquadrar alguém sem cortar asa nem rabo. Medido uma vez por quadro.
 */
export function spriteBox(sprite: Phaser.GameObjects.Sprite): { x: number; y: number; w: number; h: number } {
    const f = sprite.frame;
    const key = `${f.texture.key}|${f.name}`;
    let b = frameBoxes.get(key);
    if (!b) {
        const w = f.cutWidth;
        const h = f.cutHeight;
        b = { x0: 0, y0: 0, x1: w, y1: h };
        probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        if (probe) {
            probe.canvas.width = w;
            probe.canvas.height = h;
            probe.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, w, h, 0, 0, w, h);
            const px = probe.getImageData(0, 0, w, h).data;
            let x0 = w;
            let y0 = h;
            let x1 = 0;
            let y1 = 0;
            for (let i = 3; i < px.length; i += 4) {
                if (px[i] <= 20) continue;
                const k = (i - 3) / 4;
                const x = k % w;
                const y = Math.floor(k / w);
                x0 = Math.min(x0, x);
                x1 = Math.max(x1, x + 1);
                y0 = Math.min(y0, y);
                y1 = Math.max(y1, y + 1);
            }
            if (x1 > x0) b = { x0, y0, x1, y1 };
        }
        frameBoxes.set(key, b);
    }
    const sx = Math.abs(sprite.scaleX);
    const sy = Math.abs(sprite.scaleY);
    const left = sprite.x - sprite.originX * f.cutWidth * sx;
    const top = sprite.y - sprite.originY * f.cutHeight * sy;
    const x0 = sprite.flipX ? f.cutWidth - b.x1 : b.x0;
    return { x: left + x0 * sx, y: top + b.y0 * sy, w: (b.x1 - b.x0) * sx, h: (b.y1 - b.y0) * sy };
}

/**
 * Quanto o corpo andou dentro do quadro atual em relação ao 1º quadro da mesma animação e direção (px do quadro,
 * sem escala). O Attack do PMD dá um bote de 1 a 3 m dentro do próprio quadro; quem já posiciona o sprite (o
 * mergulho do goleiro) desconta isso pra o corpo ficar onde a cena mandou. Calculado uma vez por quadro.
 */
export function bodyShift(sprite: Phaser.GameObjects.Sprite): { x: number; y: number } {
    const f = sprite.frame;
    const key = `${f.texture.key}|${f.name}`;
    let s = bodyShifts.get(key);
    if (!s) {
        const [anim, dir] = String(f.name).split('/');
        const first = f.texture.has(`${anim}/${dir}/0`) ? f.texture.get(`${anim}/${dir}/0`) : f;
        const a = bodyCenter(f);
        const b = first === f ? a : bodyCenter(first);
        s = { x: a.x - b.x, y: a.y - b.y };
        bodyShifts.set(key, s);
    }
    return s;
}

export function shadowSize(skin: number): number {
    return PMD[baseOf(skin)]?.shadowSize ?? 1;
}

const FEET = spriteFeet as Record<string, Record<string, number>>;
/** Quem tem asas paira só um pouquinho acima do chão (fração do quadro). */
const HOVER_SHAPES = new Set(['wings', 'bug-wings']);
const HOVER = 0.05;

/**
 * Origem vertical do sprite pra que o pé (última linha visível do quadro, scripts/build-sprite-feet.ts)
 * fique no chão. Sem isso os voadores, desenhados no alto do quadro, flutuavam muito acima da bola.
 */
export function footOrigin(skin: number, anim: string): number {
    const feet = FEET[baseOf(skin)];
    const ratio = EXTRA.get(skin)?.[anim]?.foot ?? feet?.[anim] ?? feet?.Idle ?? 0.78;
    const hover = HOVER_SHAPES.has(species(baseOf(skin)).shape) ? HOVER : 0;
    return Math.min(0.97, ratio + 0.015 - hover);
}

/** Altura do corpo no Idle (px do quadro, sem escala): dos pés ao topo da cabeça. */
export function bodyHeight(skin: number): number {
    const frameH = PMD[baseOf(skin)]?.anims.Idle?.frameHeight ?? 32;
    const feet = FEET[baseOf(skin)];
    return Math.round(((feet?.Idle ?? 0.78) - (feet?.top ?? 0.2)) * frameH);
}

/** Topo da cabeça no Idle (fração do quadro), pra posicionar a setinha do seu time. */
export function headTop(skin: number): number {
    return FEET[baseOf(skin)]?.top ?? 0.2;
}

/** Mapeia a ação do motor para a animação PMD. */
export function animForAction(action: number): string {
    switch (action) {
        case Action.Run:
            return 'Walk';
        case Action.Kick:
        case Action.Tackle:
        case Action.Dive:
            return 'Attack';
        case Action.Shoot:
            return 'Shoot';
        case Action.Hurt:
            return 'Hurt';
        case Action.Celebrate:
            return 'Hop';
        case Action.Charge:
            return 'Charge';
        default:
            return 'Idle';
    }
}
