import type Phaser from 'phaser';
import pmdAnims from '../data/pmd-anims.json';
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

export const atlasKey = (speciesId: number) => `pmd-${speciesId}`;

export function preloadSpecies(scene: Phaser.Scene, speciesId: number) {
    const key = atlasKey(speciesId);
    if (!scene.textures.exists(key)) {
        scene.load.atlas(key, `assets/field/${speciesId}.png`, `assets/field/${speciesId}.json`);
    }
}

export function resolveAnim(speciesId: number, anim: string): string {
    const info = PMD[speciesId]?.anims;
    if (!info) return 'Idle';
    if (info[anim]) return anim;
    for (const alt of FALLBACK[anim] ?? []) if (info[alt]) return alt;
    return 'Idle';
}

/** Cria (uma vez) as 8 direções de cada animação da espécie. */
export function createSpeciesAnims(scene: Phaser.Scene, speciesId: number) {
    const info = PMD[speciesId]?.anims ?? {};
    const key = atlasKey(speciesId);
    for (const [name, a] of Object.entries(info)) {
        for (let dir = 0; dir < 8; dir++) {
            const animKey = `${speciesId}/${name}/${dir}`;
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

export function shadowSize(speciesId: number): number {
    return PMD[speciesId]?.shadowSize ?? 1;
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
