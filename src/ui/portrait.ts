import portraits from '../data/portraits.json';

const HAS = portraits as Record<string, string[]>;

/**
 * Retrato PMD (40×40, scripts/fetch-portraits.ts) com a 1ª emoção da lista que a espécie tiver; sem nenhuma, o rosto
 * normal. Emoções: happy, determined, joyous, surprised, sigh, inspired, shouting, crying, angry, pain, dizzy, sad,
 * teary.
 */
export function portraitSrc(speciesId: number, faces: readonly string[] = []): string {
    const face = faces.find((f) => HAS[speciesId]?.includes(f));
    return `assets/portraits/${speciesId}${face ? `-${face}` : ''}.png`;
}
