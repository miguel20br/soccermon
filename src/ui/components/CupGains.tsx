import { rich, useT } from '../../i18n/react';
import { type RunState, useGame } from '../../store/game-store';
import { movesFound, seenCount } from '../../store/profile';
import { CountUp } from './CountUp';

/**
 * "Nesta copa: +9 vistos na Pokédex, +14 golpes descobertos": compara a Pokédex e a Movedex de agora com o
 * retrato do começo da copa (`run.startCounts`). Copa de save antigo (sem o retrato) ou sem nada novo: nada.
 */
export function CupGains({ run }: { run: RunState }) {
    const { t, tn } = useT();
    const seen = useGame((s) => seenCount(s.dex));
    const moves = useGame((s) => movesFound(s.moves, s.dex));
    const start = run.startCounts;
    if (!start) return null;
    const items = [
        { key: 'result.gains.seen', n: seen - start.seen },
        { key: 'result.gains.moves', n: moves - start.moves },
    ] as const;
    if (items.every((i) => i.n <= 0)) return null;
    return (
        <div className="cup-gains">
            <span className="cup-gains-h">{t('result.gains.title')}</span>
            {items.map(
                (i) =>
                    i.n > 0 && (
                        <span key={i.key}>
                            {rich(tn(i.key, i.n, { n: '{n}' }), {
                                n: (
                                    <b>
                                        +<CountUp from={0} to={i.n} ms={600} />
                                    </b>
                                ),
                            })}
                        </span>
                    ),
            )}
        </div>
    );
}
