import { STARTERS } from '../../store/ultimate/rules';
import type { UltimateSave } from '../../store/ultimate/ultimate';

export type ClubStatus = 'starter' | 'bench' | 'evo' | 'locked' | 'free';
export const STATUSES: ClubStatus[] = ['starter', 'bench', 'evo', 'locked', 'free'];

type U = Pick<UltimateSave, 'team' | 'evos' | 'locked'>;

/** As situações da carta (pode ter mais de uma: titular e em evolução). "Livre" = fora do time, sem evolução nem trava. */
export function statusesOf(u: U, uid: string): ClubStatus[] {
    const i = u.team.order.indexOf(uid);
    const out: ClubStatus[] = [];
    if (i >= 0) out.push(i < STARTERS ? 'starter' : 'bench');
    if (u.evos.some((e) => e.uid === uid)) out.push('evo');
    if (u.locked.includes(uid)) out.push('locked');
    if (i < 0 && !out.includes('evo') && !out.includes('locked')) out.push('free');
    return out;
}
