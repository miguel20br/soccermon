import { useState } from 'react';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { useT } from '../../i18n/react';
import { type GoalTrack, goalCueAt } from '../goal-cue';
import { HudIcon } from './MatchHud';

const PERIOD_ICON = { day: 'stopwatch', week: 'medal', event: 'sparkle' } as const;

/**
 * "Objetivo do dia: 3/4 gols" no canto de cima da quadra, depois de um gol seu no Time Ultimate (entra e sai em
 * 240 ms, como a Charanga; não cobre o jogo nem pega toque). Os ícones são os da aba Objetivos.
 */
export function GoalCue({
    match,
    tick,
    tracks,
    uidAt,
}: {
    match: Pick<MatchResult, 'events'>;
    tick: number;
    tracks: readonly GoalTrack[];
    uidAt: (idx: number, tick: number) => string | undefined;
}) {
    const { t } = useT();
    const [done, setDone] = useState<number | null>(null);
    const on = goalCueAt(match, tick, tracks, uidAt);
    if (!on || on.tick === done) return null;
    return (
        <div key={on.tick} className="goal-cue" role="status" onAnimationEnd={() => setDone(on.tick)}>
            {on.lines.map((l) => (
                <p key={l.kind === 'evo' ? l.uid : l.period} className={l.n >= l.of ? 'is-full' : undefined}>
                    <HudIcon kind={l.n >= l.of ? 'check' : l.kind === 'evo' ? 'sprout' : PERIOD_ICON[l.period]} />
                    {l.kind === 'evo'
                        ? t('ultimate.cue.evo', { name: l.name, n: l.n, of: l.of })
                        : t(`ultimate.cue.${l.period}`, { n: l.n, of: l.of })}
                </p>
            ))}
        </div>
    );
}
