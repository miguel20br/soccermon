import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { metalOf } from '../../ui/rarity';
import { dailyDay } from '../daily';
import {
    type GymRule,
    type Outcome,
    PASS_DAY_MAX,
    PASS_GYM_MULT,
    PASS_MARKS,
    PASS_POINTS,
    PASS_STEP,
    SEASONS,
    type Season,
} from './rules';

/**
 * Temporada, passe e líderes do Time Ultimate (0.9.33; os números ficam em rules.ts). Tudo puro: o relógio (`now`, ms)
 * é sempre de quem chama, pra dar pra testar a virada da temporada e o evento de Natal sem esperar a data.
 */

/** A temporada no relógio `now` (a última que já começou); null = a prévia, antes da T1. */
export const seasonAt = (now: number): Season | null =>
    SEASONS.reduce<Season | null>((b, s) => (now >= s.start ? s : b), null);
export const seasonN = (now: number) => seasonAt(now)?.n ?? 0;
/** A próxima temporada a começar (a contagem da prévia). */
export const nextSeason = (now: number): Season | null => SEASONS.find((s) => s.start > now) ?? null;

/** Passe da temporada: pontos do dia (`day`, Brasília), total da temporada e marcos já pagos. */
export interface PassState {
    day: string;
    today: number;
    pts: number;
    marks: number;
}
export const newPass = (): PassState => ({ day: '', today: 0, pts: 0, marks: 0 });

/** Marcos alcançados com `pts` pontos (até PASS_MARKS). */
export const passMarksOf = (pts: number) => Math.min(PASS_MARKS, Math.floor(pts / PASS_STEP));

/** Soma os pontos da partida respeitando o teto do dia (o dia vira à meia-noite de Brasília). */
export function passGain(
    p: PassState,
    outcome: Outcome,
    gym: boolean,
    now: number,
): { pass: PassState; gained: number } {
    const day = dailyDay(new Date(now));
    const today = p.day === day ? p.today : 0;
    const want = PASS_POINTS[outcome] * (gym ? PASS_GYM_MULT : 1);
    const gained = Math.max(0, Math.min(want, PASS_DAY_MAX - today));
    return { pass: { ...p, day, today: today + gained, pts: p.pts + gained }, gained };
}

/** Quantos titulares cumprem a regra do líder (tipo da espécie ou metal pela nota). */
export function gymCount(rule: GymRule, lineup: readonly PokemonInstance[]): number {
    return lineup.filter((p) => {
        const v = viewInstance(p);
        return rule.kind === 'type' ? v.species.types.includes(rule.type) : metalOf(v.overall) === rule.metal;
    }).length;
}
export const gymOk = (rule: GymRule, lineup: readonly PokemonInstance[]) => gymCount(rule, lineup) >= rule.min;
