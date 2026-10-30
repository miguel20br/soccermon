/**
 * Sons do golpe máximo (30/10/2026, pacote D "mistura"): o toque por nota e o golpe por nível, arquivos prontos em
 * `public/sfx/max-<som>.mp3` (bumbo, 808 e clap no corpo, sinos no meio, moedas em cima). Quem gera e compara com os
 * outros pacotes: `scripts/golpe-sons-v2.ts --jogo`. Módulo puro: a tela e a cena pegam o nome, o `audio.ts` toca.
 */
import type { MaxGrade } from '../engine/state';

export type MaxSound =
    | 'tap-perfeito'
    | 'tap-bom'
    | 'tap-fora'
    | 'golpe-n1'
    | 'golpe-n2'
    | 'golpe-n3'
    | 'bicuda'
    | 'especial';

/** Toque por nota: perfeito (na batida), bom, fora. */
export const MAX_TAP: Record<MaxGrade, MaxSound> = { 2: 'tap-perfeito', 1: 'tap-bom', 0: 'tap-fora' };
/** O golpe por nível. */
export const MAX_MOVE: Record<1 | 2 | 3, MaxSound> = { 1: 'golpe-n1', 2: 'golpe-n2', 3: 'golpe-n3' };
/** Golpe universal (motor 17): a bicuda do goleiro capitão (N1 e N2) e a entrada da cena do especial N3. */
export const MAX_EXTRA: readonly MaxSound[] = ['bicuda', 'especial'];
