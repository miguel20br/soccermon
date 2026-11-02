import { type CSSProperties, useEffect, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { species } from '../../engine/data';
import type { MatchResult } from '../../engine/runners/batch-runner';
import type { MatchEvent, TeamSetup } from '../../engine/state';
import { moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { captainAt, roleAt } from '../match-view';
import {
    type MaxPlan,
    maxFillText,
    maxLevelGain,
    maxLevelText,
    maxLevelUnlocked,
    maxLevelUpAt,
    maxPlan,
} from '../max-levels';
import { TYPE_COLOR } from '../type-colors';
import { HudIcon } from './MatchHud';
import { TypeBadge } from './PokeCard';
import './max-special.css';

const LEVELS = [1, 2, 3] as const;

/** Golpe máximo do capitão do time `side` no tick (o que ele solta, o tipo e o N3), ou null sem capitão em quadra. */
export function captainPlan(m: MatchResult, setups: [TeamSetup, TeamSetup], side: 0 | 1, tick: number) {
    const cap = captainAt(m, setups, side, tick);
    const inst = [...setups[side].lineup, ...setups[side].bench].find((p) => p.uid === cap.uid);
    if (!inst || cap.idx === null || !cap.speciesId) return null;
    return maxPlan(inst.moves, cap.speciesId, roleAt(m, setups, cap.idx, tick) === 'GK');
}

/** Seção "Golpe especial" da carta completa: o golpe, o tipo, o que N1/N2/N3 dão pra ele e como liberar. */
export function MaxSpecialSection({
    moves,
    speciesId,
    gk,
}: {
    moves: readonly string[];
    speciesId: number;
    gk: boolean;
}) {
    const { d, lang } = useT();
    const a = d.match.agency;
    const plan = maxPlan(moves, speciesId, gk);
    return (
        <>
            <h3>{a.levels.title}</h3>
            <div className="move-detail mx-special" style={{ borderColor: TYPE_COLOR[plan.type] }}>
                <div className="row" style={{ gap: 6, justifyContent: 'space-between' }}>
                    <b>{plan.move ? moveName(plan.move) : species(speciesId).name}</b>
                    <span className="row" style={{ gap: 4 }}>
                        <TypeBadge type={plan.type} />
                        <span className="pos-chip">
                            <HudIcon kind={gk ? 'bicuda' : 'max'} />
                            {gk ? a.bicuda : a.max}
                        </span>
                    </span>
                </div>
                <LevelRows plan={plan} />
                <p className="tactic-desc">{a.levels.stack}</p>
                <p className="tactic-desc">
                    {a.levels.who} {maxFillText(lang)}
                </p>
            </div>
        </>
    );
}

function LevelRows({ plan, level, short }: { plan: MaxPlan; level?: number; short?: boolean }) {
    const { d, lang } = useT();
    return (
        <ol className="mx-levels">
            {LEVELS.map((lv) => (
                <li key={lv} className={level !== undefined && level >= lv ? 'on' : undefined}>
                    <b className="mx-lv" data-lv={lv}>
                        {d.match.agency.maxLevelShort.replace('{n}', String(lv))}
                    </b>
                    <span>{short ? maxLevelGain(plan, lv, lang) : maxLevelText(plan, lv, lang)}</span>
                </li>
            ))}
        </ol>
    );
}

/** Legenda do golpe máximo na aba da partida: os 3 níveis do capitão, com os já liberados acesos. */
export function MaxLegend({ plan, level }: { plan: MaxPlan | null; level: number }) {
    const { d, lang } = useT();
    if (!plan) return null;
    return (
        <details className="mx-legend">
            <summary>
                <HudIcon kind={plan.gk ? 'bicuda' : 'max'} />
                {d.match.agency.levels.title}
            </summary>
            <LevelRows plan={plan} level={level} short />
            <p className="tactic-desc">{maxFillText(lang)}</p>
        </details>
    );
}

/** "N2 liberado: derruba quem estiver no caminho": aviso curto na quadra quando a barra do seu time sobe de nível. */
export function MaxLevelCue({
    events,
    tick,
    side,
    plan,
    color,
}: {
    events: readonly MatchEvent[];
    tick: number;
    side: 0 | 1;
    plan: MaxPlan | null;
    color: string;
}) {
    const { lang } = useT();
    const up = maxLevelUpAt(events, side, tick, 2 * FUTSAL_5.tickRate);
    const [shown, setShown] = useState<{ level: 1 | 2 | 3; tick: number } | null>(null);
    const [done, setDone] = useState(-1);
    // fica até a animação acabar, mesmo com a partida no 8x (o tick passa da janela antes)
    useEffect(() => {
        if (up && up.tick !== done && up.tick !== shown?.tick) setShown(up);
    }, [up, done, shown]);
    if (!shown || !plan) return null;
    return (
        <div
            key={shown.tick}
            className="mx-cue"
            style={{ '--tc': color } as CSSProperties}
            role="status"
            onAnimationEnd={() => {
                setDone(shown.tick);
                setShown(null);
            }}
        >
            <HudIcon kind={plan.gk ? 'bicuda' : 'max'} />
            <span>{maxLevelUnlocked(plan, shown.level, lang)}</span>
        </div>
    );
}
