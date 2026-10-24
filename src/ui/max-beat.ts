import type { MaxGrade } from '../engine/state';
import { beatNow } from '../game/music';

/**
 * Golpe máximo por Pokémon (fase 2 de docs/planos/golpe-maximo-por-tipo.md, assinaturas), atrás de `?assinatura=1` até
 * o Miguel jogar (ADR 0005). A tela manda a bandeira pro simulador (`MatchConfig.maxSig`); com ela o motor é o 13.
 */
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
export const MAX_ASSINATURA = q?.get('assinatura') === '1';

/**
 * Janelas da nota (ms até a batida mais perto): perfeito e bom. `offsetMs` acerta o fone/celular (positivo = o toque
 * chega depois do que se ouve). Sem música, o anel segue um pulso fixo de `pulseBpm`.
 */
export const MAX_BEAT = { perfectMs: 70, goodMs: 150, offsetMs: 0, pulseBpm: 100 };

/** Fase na batida (0 logo depois de uma, 1 na próxima) e andamento: a música que se ouve, ou o pulso fixo sem som. */
export function beatPhase(now = performance.now()): { phase: number; bpm: number } {
    const b = beatNow();
    if (b) return b;
    const ms = 60000 / MAX_BEAT.pulseBpm;
    return { phase: (now % ms) / ms, bpm: MAX_BEAT.pulseBpm };
}

/** Nota do toque na fase `phase` da batida: perfeito até ±70 ms, bom até ±150 ms, senão fora. */
export function gradeAt(phase: number, bpm: number, offsetMs = MAX_BEAT.offsetMs): MaxGrade {
    const beat = 60000 / bpm;
    const p = (((phase - offsetMs / beat) % 1) + 1) % 1;
    const ms = Math.min(p, 1 - p) * beat;
    return ms <= MAX_BEAT.perfectMs ? 2 : ms <= MAX_BEAT.goodMs ? 1 : 0;
}

export const maxGradeNow = (): MaxGrade => {
    const { phase, bpm } = beatPhase();
    return gradeAt(phase, bpm);
};
