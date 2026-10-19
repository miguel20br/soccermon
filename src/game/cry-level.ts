import cryLevels from '../data/cry-levels.json';
import type { CryStyle } from '../store/game-store';

/** [ganho em dB, duração em ms] de cada grito (scripts/cry-levels.ts mede os arquivos). Sem Phaser/áudio: dá teste. */
const LEVELS = cryLevels as Record<CryStyle, [number, number][]>;
/** Grito mais longo que isso vai sumindo (fade) até CRY_MAX_MS: não atropela o som do gol nem o grito seguinte. */
export const CRY_FADE_AT = 1000;
export const CRY_MAX_MS = 1300;

/** Ganho (multiplicador) que deixa o grito no volume da mediana do estilo: ninguém grita baixo nem estoura. */
export function cryGain(speciesId: number, style: CryStyle): number {
    const db = LEVELS[style]?.[speciesId - 1]?.[0] ?? 0;
    return 10 ** (db / 20);
}

/** Quanto tempo (ms) o grito fica soando, com a velocidade `rate` e o corte dos longos. */
export function cryPlayMs(speciesId: number, style: CryStyle, rate = 1): number {
    const dur = LEVELS[style]?.[speciesId - 1]?.[1] ?? 800;
    return Math.min(dur / rate, CRY_MAX_MS);
}
