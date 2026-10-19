import type { Translator } from '../../i18n/react';
import type { CareerSeal, DexEntry } from '../../store/profile';

/** Dica do selo de carreira: o que ele pede e, com a carreira em mãos, quanto você tem ("Você tem 6."). */
export function sealTip(t: Translator['t'], seal: CareerSeal, name: string, entry?: DexEntry, played?: number): string {
    const base = t(`profile.sheet.sealTip.${seal}`, { name });
    if (!entry) return base;
    const n =
        seal === 'folha'
            ? entry.matches
            : seal === 'holo'
              ? entry.goals
              : seal === 'prisma'
                ? entry.titles
                : `${played ?? 0}/151`;
    return `${base} ${t('profile.sheet.sealHave', { n })}`;
}
