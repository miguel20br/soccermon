import type Phaser from 'phaser';
import pmdAnims from '../data/pmd-anims.json';
import shinyMissing from '../data/pmd-shiny-missing.json';
import spriteFeet from '../data/sprite-feet.json';
import { species } from '../engine/data';
import { Action } from '../engine/state';

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

const LOOPING = new Set(['Idle', 'Walk', 'Hop', 'Charge']);

/**
 * "Skin" do sprite em campo: o número da espécie, ou espécie + SHINY_SKIN para a folha shiny de verdade
 * (scripts/build-pmd-shiny.ts; mesma disposição da normal, então reusa o JSON). Espécie sem shiny no PMDCollab
 * fica com a normal (e a tinta amarelada de antes).
 */
export const SHINY_SKIN = 10000;
const NO_SHINY = new Set(shinyMissing as number[]);
export const skinOf = (speciesId: number, shiny: boolean) =>
    shiny && !NO_SHINY.has(speciesId) ? speciesId + SHINY_SKIN : speciesId;
export const baseOf = (skin: number) => skin % SHINY_SKIN;
export const isShinySkin = (skin: number) => skin >= SHINY_SKIN;

export const atlasKey = (skin: number) => `pmd-${skin}`;

export function preloadSpecies(scene: Phaser.Scene, skin: number) {
    const key = atlasKey(skin);
    const id = baseOf(skin);
    if (!scene.textures.exists(key)) {
        scene.load.atlas(key, `assets/field/${isShinySkin(skin) ? 'shiny/' : ''}${id}.png`, `assets/field/${id}.json`);
    }
}

export function resolveAnim(skin: number, anim: string): string {
    const info = PMD[baseOf(skin)]?.anims;
    if (!info) return 'Idle';
    if (info[anim]) return anim;
    for (const alt of FALLBACK[anim] ?? []) if (info[alt]) return alt;
    return 'Idle';
}

/** Cria (uma vez) as 8 direções de cada animação da espécie. */
export function createSpeciesAnims(scene: Phaser.Scene, skin: number) {
    const info = PMD[baseOf(skin)]?.anims ?? {};
    const key = atlasKey(skin);
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
    const ratio = feet?.[anim] ?? feet?.Idle ?? 0.78;
    const hover = HOVER_SHAPES.has(species(baseOf(skin)).shape) ? HOVER : 0;
    return Math.min(0.97, ratio + 0.015 - hover);
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
